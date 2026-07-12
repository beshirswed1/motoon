/**
 * speech-adapter.ts — Module 6: Speech Recognition Adapter
 *
 * Thin wrapper around the Web Speech API that emits individual
 * NEW words as they are recognized. The adapter diffs each
 * incoming transcript against what was previously emitted,
 * firing the onNewWord callback only for genuinely new words.
 */

import { normalizeWord } from './normalizer';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface SpeechAdapterOptions {
  /** Called each time a new spoken word is detected */
  onNewWord: (word: string) => void;
  /** Called when a recognition error occurs */
  onError?: (error: string) => void;
  /** Called when recognition ends (browser stopped) */
  onEnd?: () => void;
}

// ─── Speech Adapter ──────────────────────────────────────────────────────────

export class SpeechAdapter {
  private recognition: any = null;
  private isActive = false;
  private opts: SpeechAdapterOptions | null = null;

  // Track emitted words to detect new ones
  private emittedWordCount = 0;
  private accumulatedFinalText = '';
  private finalParts: string[] = [];
  private currentInterim = '';

  /** Check if Web Speech API is available */
  isSupported(): boolean {
    if (typeof window === 'undefined') return false;
    const SR =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    return !!SR;
  }

  /** Start listening. Words will be emitted via opts.onNewWord. */
  async start(opts: SpeechAdapterOptions): Promise<void> {
    if (!this.isSupported()) {
      throw new Error('Web Speech API is not supported in this browser.');
    }

    if (this.isActive) return;

    this.opts = opts;
    this.emittedWordCount = 0;
    this.accumulatedFinalText = '';
    this.finalParts = [];
    this.currentInterim = '';
    this.isActive = true;

    this.initRecognition();

    try {
      this.recognition.start();
    } catch (err) {
      this.isActive = false;
      throw err;
    }
  }

  /** Stop listening and clean up. */
  stop(): void {
    this.isActive = false;
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (_e) {
        // Ignore — may already be stopped
      }
    }
  }

  /** Reset the word tracking state (for session restart). */
  reset(): void {
    this.emittedWordCount = 0;
    this.accumulatedFinalText = '';
    this.finalParts = [];
    this.currentInterim = '';
  }

  // ─── Private ─────────────────────────────────────────────────────────

  private initRecognition(): void {
    const SR =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    this.recognition = new SR();
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = 'ar-SA';
    this.recognition.maxAlternatives = 1;

    this.recognition.onresult = (event: any) => {
      this.handleResult(event);
    };

    this.recognition.onerror = (event: any) => {
      const errorType = event.error;

      // Auto-restart on transient errors
      if (errorType === 'network' || errorType === 'no-speech') {
        if (this.isActive) {
          this.restartRecognition();
        }
        return;
      }

      if (this.opts?.onError) {
        this.opts.onError(errorType);
      }
    };

    this.recognition.onend = () => {
      // Accumulate final text before restart
      const currentFinal = this.finalParts.join(' ').trim();
      if (currentFinal) {
        this.accumulatedFinalText +=
          (this.accumulatedFinalText ? ' ' : '') + currentFinal;
      }
      this.finalParts = [];
      this.currentInterim = '';

      // Auto-restart if still active
      if (this.isActive) {
        this.restartRecognition();
        return;
      }

      if (this.opts?.onEnd) {
        this.opts.onEnd();
      }
    };
  }

  private restartRecognition(): void {
    try {
      // Small delay to avoid rapid restart loops
      setTimeout(() => {
        if (this.isActive && this.recognition) {
          try {
            this.recognition.start();
          } catch (_e) {
            // Failed to restart — stop gracefully
            this.isActive = false;
            if (this.opts?.onEnd) this.opts.onEnd();
          }
        }
      }, 200);
    } catch (_e) {
      this.isActive = false;
    }
  }

  /**
   * Handle a speech recognition result event.
   * Build the full transcript, then emit any NEW words.
   */
  private handleResult(event: any): void {
    const newFinalParts: string[] = [];
    let latestInterim = '';

    for (let i = 0; i < event.results.length; i++) {
      const result = event.results[i];
      const text = result[0].transcript.trim();
      if (!text) continue;

      if (result.isFinal) {
        newFinalParts.push(text);
      } else {
        latestInterim = text;
      }
    }

    this.finalParts = newFinalParts;
    this.currentInterim = latestInterim;

    // Build full transcript
    const parts: string[] = [];
    if (this.accumulatedFinalText) parts.push(this.accumulatedFinalText);
    const sessionFinal = this.finalParts.join(' ').trim();
    if (sessionFinal) parts.push(sessionFinal);
    if (this.currentInterim) parts.push(this.currentInterim);

    const fullTranscript = parts.join(' ');
    const allWords = fullTranscript
      .split(/\s+/)
      .filter((w) => w.length > 0);

    // Emit only NEW words (words we haven't emitted before)
    this.emitNewWords(allWords);
  }

  /**
   * Compare current word list against previously emitted count.
   * Only fire onNewWord for words beyond what we've already sent.
   *
   * We also do basic deduplication: if a new word is identical
   * (after normalization) to the previous word, skip it.
   */
  private emitNewWords(allWords: string[]): void {
    if (!this.opts?.onNewWord) return;

    // Process words from the last emitted position onward
    while (this.emittedWordCount < allWords.length) {
      const word = allWords[this.emittedWordCount];
      const norm = normalizeWord(word);

      // Skip empty words after normalization
      if (!norm) {
        this.emittedWordCount++;
        continue;
      }

      // Basic consecutive deduplication
      if (this.emittedWordCount > 0) {
        const prevWord = allWords[this.emittedWordCount - 1];
        const prevNorm = normalizeWord(prevWord);
        if (norm === prevNorm) {
          this.emittedWordCount++;
          continue;
        }
      }

      this.opts.onNewWord(word);
      this.emittedWordCount++;
    }
  }
}
