/**
 * speech-adapter.ts — Module 6: Speech Recognition Adapter
 *
 * Wraps Web Speech API and emits ONE callback per genuinely-new word.
 *
 * Key design for Android Chrome:
 * ─────────────────────────────────────────────────────────────────
 * Android Chrome does NOT honor `continuous: true`. It silently ends
 * recognition after every pause, then we restart it. On restart the
 * browser often re-delivers the SAME words it already delivered in
 * the previous instance (cumulative transcript behavior).
 *
 * To prevent any word from being emitted twice we keep a single
 * `globalEmittedCount` that survives across recognition restarts.
 * Each restart we detect how many of the "old" words the browser
 * re-sent, skip them, and only emit truly new ones.
 *
 * Additionally, we use a `sessionToken` so that late/ghost events
 * from a dying recognition instance are silently dropped.
 */

import { normalizeWord } from './normalizer';

// ─── Constants ───────────────────────────────────────────────────────────────

/**
 * How long (ms) to wait for interim words to stabilize before emitting them.
 * This is a safety net — finals almost always arrive before this fires.
 */
const DEBOUNCE_MS = 500;

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

  /**
   * Words we have emitted to the state machine across ALL recognition
   * instances in this listening session. This list is append-only and
   * NEVER shrinks until an explicit start() or reset().
   */
  private globalEmittedWords: string[] = [];

  /**
   * A snapshot of globalEmittedWords at the start of the current instance.
   * Used as the reference point for matching overlaps.
   */
  private initialGlobalWords: string[] = [];

  /**
   * How many words from this instance have been emitted to the state machine.
   * Used to slice new words from instanceWords.
   */
  private instanceEmittedCount = 0;

  /** Debounce timer for interim words */
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;

  /** Timeout timer for restarting recognition */
  private restartTimeout: ReturnType<typeof setTimeout> | null = null;

  /**
   * The latest full word list from the CURRENT recognition instance.
   * Rebuilt on every onresult from that instance's event.results.
   */
  private instanceWords: string[] = [];

  /**
   * Monotonically increasing token identifying the "live" instance.
   * Each initRecognition() mints a new one; callbacks capture it by
   * value and bail out if it no longer matches this.sessionToken.
   */
  private sessionToken = 0;

  // ─── Public API ─────────────────────────────────────────────────────

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
    this.globalEmittedWords = [];
    this.initialGlobalWords = [];
    this.instanceEmittedCount = 0;
    this.instanceWords = [];
    if (this.restartTimeout) {
      clearTimeout(this.restartTimeout);
      this.restartTimeout = null;
    }
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
    this.sessionToken++; // invalidate any in-flight callbacks
    if (this.restartTimeout) {
      clearTimeout(this.restartTimeout);
      this.restartTimeout = null;
    }
    this.flushNewWords();    // emit any pending debounced words
    this.detachRecognition();
  }

  /** Reset the word tracking state (for full session restart). */
  reset(): void {
    this.globalEmittedWords = [];
    this.initialGlobalWords = [];
    this.instanceEmittedCount = 0;
    this.instanceWords = [];
    if (this.restartTimeout) {
      clearTimeout(this.restartTimeout);
      this.restartTimeout = null;
    }
    this.clearDebounce();
  }

  // ─── Private ─────────────────────────────────────────────────────────

  private clearDebounce(): void {
    if (this.debounceTimer !== null) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
  }

  /**
   * Emit any genuinely new words from instanceWords that we haven't
   * already sent to the state machine.
   */
  private flushNewWords(): void {
    this.clearDebounce();
    if (!this.opts?.onNewWord) return;

    // Dynamically compute the skip count against the snapshot of global words before this instance
    const skip = this.computeInstanceSkip(this.instanceWords);

    // How many new words does this instance have beyond the skip zone?
    const instanceNewWords = this.instanceWords.slice(skip);

    // How many of those have we already emitted from this instance?
    const toEmit = instanceNewWords.slice(this.instanceEmittedCount);

    for (const word of toEmit) {
      this.globalEmittedWords.push(word);
      this.instanceEmittedCount++;
      this.opts.onNewWord(word);
    }
  }

  /**
   * Detach event handlers and stop/abort the current recognition instance.
   */
  private detachRecognition(): void {
    if (!this.recognition) return;
    this.recognition.onresult = null;
    this.recognition.onerror = null;
    this.recognition.onend = null;
    try {
      if (typeof this.recognition.abort === 'function') {
        this.recognition.abort();
      } else {
        this.recognition.stop();
      }
    } catch (_e) {
      // Ignore — may already be stopped
    }
  }

  /**
   * Create a fresh SpeechRecognition instance with event handlers
   * bound to a new sessionToken.
   */
  private initRecognition(): void {
    this.detachRecognition();

    // Reset per-instance state (but NOT globalEmittedWords!)
    this.initialGlobalWords = [...this.globalEmittedWords];
    this.instanceWords = [];
    this.instanceEmittedCount = 0;
    this.clearDebounce();

    const SR =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    this.recognition = new SR();
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = 'ar-SA';
    this.recognition.maxAlternatives = 1;

    const myToken = ++this.sessionToken;

    this.recognition.onresult = (event: any) => {
      if (myToken !== this.sessionToken) return;
      this.handleResult(event);
    };

    this.recognition.onerror = (event: any) => {
      if (myToken !== this.sessionToken) return;
      const errorType = event.error;

      // Transient errors: let onend handle the restart.
      if (errorType === 'network' || errorType === 'no-speech') {
        console.warn(`[SpeechAdapter] Transient error: ${errorType}. Will restart in onend.`);
        return;
      }

      // Fatal errors: stop session and propagate.
      this.isActive = false;
      if (this.opts?.onError) {
        this.opts.onError(errorType);
      }
    };

    this.recognition.onend = () => {
      if (myToken !== this.sessionToken) return;

      // Flush any pending debounced words before we lose this instance
      this.flushNewWords();

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
    if (this.restartTimeout) {
      clearTimeout(this.restartTimeout);
    }
    try {
      this.restartTimeout = setTimeout(() => {
        this.restartTimeout = null;
        if (this.isActive) {
          try {
            this.initRecognition();
            this.recognition.start();
          } catch (_e) {
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
   * Determine the alignment/overlap of the current instance's transcript
   * within initialGlobalWords. Returns the number of words to skip from the
   * beginning of the new transcript.
   *
   * Checks both suffix-to-prefix (partial re-delivery) and prefix-to-prefix
   * (full re-delivery) alignments, allowing at most 1 spelling mismatch
   * for match lengths >= 2 to tolerate speech-to-text spelling variations.
   */
  private computeInstanceSkip(words: string[]): number {
    if (this.initialGlobalWords.length === 0 || words.length === 0) {
      return 0;
    }

    let bestGStart = -1;
    let maxMatchLen = 0;

    // Check all possible alignment starting points in initialGlobalWords
    for (let gStart = 0; gStart < this.initialGlobalWords.length; gStart++) {
      const compareLength = Math.min(
        this.initialGlobalWords.length - gStart,
        words.length
      );

      let mismatches = 0;
      let isMatch = true;

      for (let i = 0; i < compareLength; i++) {
        const globalWord = this.initialGlobalWords[gStart + i];
        const instanceWord = words[i];

        if (normalizeWord(globalWord) !== normalizeWord(instanceWord)) {
          mismatches++;
          const maxAllowed = compareLength === 1 ? 0 : 1;
          if (mismatches > maxAllowed) {
            isMatch = false;
            break;
          }
        }
      }

      if (isMatch && compareLength > 0) {
        // Prefer longer matches. For equal match lengths, prefer matches closer to the end of initialGlobalWords
        if (compareLength > maxMatchLen || (compareLength === maxMatchLen && gStart > bestGStart)) {
          bestGStart = gStart;
          maxMatchLen = compareLength;
        }
      }
    }

    if (bestGStart !== -1) {
      return this.initialGlobalWords.length - bestGStart;
    }

    return 0;
  }

  /**
   * Handle a speech recognition result event.
   *
   * Rebuilds the full word list from event.results, then:
   * - On final results, emits new words immediately
   * - On interim-only results, schedules a debounce
   */
  private handleResult(event: any): void {
    const allWords: string[] = [];
    let hasFinal = false;

    for (let i = 0; i < event.results.length; i++) {
      const result = event.results[i];
      const text: string = result[0].transcript.trim();
      if (!text) continue;

      const words = text.split(/\s+/).filter(Boolean);
      allWords.push(...words);

      if (result.isFinal) {
        hasFinal = true;
      }
    }

    this.instanceWords = allWords;

    if (hasFinal) {
      this.flushNewWords();
    } else {
      // Schedule debounce for interim words
      this.clearDebounce();
      this.debounceTimer = setTimeout(() => {
        this.debounceTimer = null;
        this.flushNewWords();
      }, DEBOUNCE_MS);
    }
  }
}