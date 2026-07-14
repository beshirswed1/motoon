/**
 * speech-adapter.ts — Module 6: Speech Recognition Adapter
 *
 * Thin wrapper around the Web Speech API that emits individual
 * NEW words as they are recognized. Uses a "finals-first" strategy:
 *
 * - Words from FINAL results (isFinal=true) are emitted immediately.
 *   These are confirmed by the browser and won't change.
 * - Words from INTERIM results are NEVER emitted directly. Instead,
 *   they are debounced: if interim words stabilize for DEBOUNCE_MS
 *   without a final result arriving, they are emitted as a fallback.
 *   This prevents partial Arabic words (ع, ن, مص) from being
 *   evaluated by the state machine.
 */
import { normalizeWord } from './normalizer';

// ─── Constants ───────────────────────────────────────────────────────────────

/**
 * How long (ms) to wait for interim words to stabilize before emitting them.
 * 600ms is long enough that the browser will almost always finalize the result
 * before this timer fires (making it a pure safety net), yet short enough
 * that if the browser IS slow, the user doesn't feel a huge lag.
 */
const DEBOUNCE_MS = 600;

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

  // Track emitted words and session state in the current session
  private emittedWords: string[] = [];
  private currentSessionWords: string[] = [];

  // Debounce state for interim words (safety net)
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;

  /** Check if Web Speech API is available */
  isSupported(): boolean {
    if (typeof window === 'undefined') return false;
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    return !!SR;
  }

  /** Start listening. Words will be emitted via opts.onNewWord. */
  async start(opts: SpeechAdapterOptions): Promise<void> {
    if (!this.isSupported()) {
      throw new Error('Web Speech API is not supported in this browser.');
    }

    if (this.isActive) return;

    this.opts = opts;
    this.emittedWords = [];
    this.currentSessionWords = [];
    this.clearDebounce();
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
    // Flush any pending debounced words before stopping
    this.flushPendingWords();
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
    this.emittedWords = [];
    this.currentSessionWords = [];
    this.clearDebounce();
  }

  // ─── Private ─────────────────────────────────────────────────────────

  /** Cancel the debounce timer without emitting */
  private clearDebounce(): void {
    if (this.debounceTimer !== null) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
  }

  /**
   * Flush any pending interim words immediately.
   */
  private flushPendingWords(): void {
    this.clearDebounce();
    this.emitInterimWords();
  }

  /**
   * Align currentSessionWords with emittedWords and emit any new interim words.
   */
  private emitInterimWords(): void {
    if (!this.opts?.onNewWord || this.currentSessionWords.length === 0) return;

    const divIdx = this.findDivergentIndex(this.emittedWords, this.currentSessionWords);
    const newInterimWords = this.currentSessionWords.slice(divIdx);

    if (newInterimWords.length > 0) {
      for (const word of newInterimWords) {
        this.opts.onNewWord(word);
      }
      this.emittedWords = [...this.emittedWords.slice(0, divIdx), ...newInterimWords];
    }
  }

  private initRecognition(): void {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

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
      // Flush any pending interim words before session ends
      this.flushPendingWords();

      // Reset tracking state for the next session (only if not auto-restarting)
      if (!this.isActive) {
        this.emittedWords = [];
      }
      this.currentSessionWords = [];

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
        if (this.isActive) {
          try {
            // Recreate SpeechRecognition to guarantee a fresh state
            this.initRecognition();
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
   * Find the first index where arr1 and arr2 diverge (differ after normalization).
   */
  private findDivergentIndex(arr1: string[], arr2: string[]): number {
    let i = 0;
    while (
      i < arr1.length &&
      i < arr2.length &&
      normalizeWord(arr1[i]) === normalizeWord(arr2[i])
    ) {
      i++;
    }
    return i;
  }

  /**
   * Find the length of the longest suffix of arr1 that matches a prefix of arr2.
   */
  private findOverlap(arr1: string[], arr2: string[]): number {
    const maxLen = Math.min(arr1.length, arr2.length);
    for (let len = maxLen; len > 0; len--) {
      let match = true;
      for (let i = 0; i < len; i++) {
        const w1 = normalizeWord(arr1[arr1.length - len + i]);
        const w2 = normalizeWord(arr2[i]);
        if (w1 !== w2) {
          match = false;
          break;
        }
      }
      if (match) return len;
    }
    return 0;
  }

  /**
   * Handle a speech recognition result event.
   *
   * Strategy — Index-by-index divergence alignment with sequential overlap merge:
   * 1. Rebuild the clean transcript sequence by merging overlapping result segments.
   * 2. Separate merged words into finalized and interim categories.
   * 3. Process and emit new finalized words immediately.
   * 4. Schedule/update the debounce for interim words.
   */
  private handleResult(event: any): void {
    // Diagnostic logging to inspect actual speech recognition output on mobile devices
    console.log(
      '[SpeechAdapter] resultIndex:',
      event.resultIndex,
      'results:',
      [...event.results].map((r: any) => ({
        final: r.isFinal,
        text: r[0].transcript,
      }))
    );

    interface MergedWord {
      text: string;
      isFinal: boolean;
    }

    const mergedWords: MergedWord[] = [];

    // Reconstruct the deduplicated session words list from the beginning of results
    for (let i = 0; i < event.results.length; i++) {
      const result = event.results[i];
      const text: string = result[0].transcript.trim();
      if (!text) continue;

      const words = text.split(/\s+/).filter(Boolean);
      const mergedText = mergedWords.map((w) => w.text);
      const overlap = this.findOverlap(mergedText, words);

      const newWords = words.slice(overlap);
      for (const word of newWords) {
        mergedWords.push({
          text: word,
          isFinal: result.isFinal,
        });
      }
    }

    // Extract finalized words list
    const finalWords = mergedWords.filter((w) => w.isFinal).map((w) => w.text);

    // 1. Process and emit any new finalized words immediately
    if (finalWords.length > 0) {
      const divIdx = this.findDivergentIndex(this.emittedWords, finalWords);
      const newFinalWords = finalWords.slice(divIdx);

      if (newFinalWords.length > 0) {
        for (const word of newFinalWords) {
          this.opts?.onNewWord(word);
        }
        // Update emittedWords to represent the finalized state up to this point
        this.emittedWords = [...this.emittedWords.slice(0, divIdx), ...newFinalWords];
      }
    }

    // 2. Schedule or update the debounce for interim words
    const candidateWords = mergedWords.map((w) => w.text);
    const hasInterim = mergedWords.some((w) => !w.isFinal);

    if (hasInterim) {
      this.currentSessionWords = candidateWords;
      this.scheduleInterimDebounce();
    } else {
      this.clearDebounce();
    }
  }

  /**
   * Schedule a debounce for interim words.
   * When the timer fires, it calls emitInterimWords to output stabilized interim text.
   */
  private scheduleInterimDebounce(): void {
    if (this.debounceTimer !== null) {
      clearTimeout(this.debounceTimer);
    }
    this.debounceTimer = setTimeout(() => {
      this.debounceTimer = null;
      this.emitInterimWords();
    }, DEBOUNCE_MS);
  }
}
