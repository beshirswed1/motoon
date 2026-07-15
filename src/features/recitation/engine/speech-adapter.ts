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

  // Track emitted words count and session state in the current session
  private emittedWordCount = 0;
  private currentSessionWords: string[] = [];

  // Debounce state for interim words (safety net)
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;

  // Monotonically increasing token identifying the "live" recognition instance.
  // Every initRecognition() call mints a new token and captures it in that
  // instance's callback closures. If a callback fires after a newer instance
  // has taken over (e.g. a late/duplicate event from an instance that is
  // restarting — common on Android, which rarely honors continuous=true and
  // ends/restarts recognition far more often than desktop browsers), the
  // captured token will no longer match this.sessionToken and the event is
  // dropped instead of being processed against shared emittedWordCount /
  // currentSessionWords state. This is what previously caused the same
  // trailing word(s) to be emitted 2-3x on mobile after each silent restart.
  private sessionToken = 0;

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
    // Invalidate any callbacks still in flight from the current instance
    this.sessionToken++;
    // Flush any pending debounced words before stopping
    this.flushPendingWords();
    this.detachRecognition();
  }

  /** Reset the word tracking state (for session restart). */
  reset(): void {
    this.emittedWordCount = 0;
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
    this.emitNewWords();
  }

  /**
   * Compute and emit any words that are new in the current session.
   */
  private emitNewWords(): void {
    if (!this.opts?.onNewWord) return;

    // NEVER clamp emittedWordCount downwards! If the browser shrinks the transcript
    // (e.g. deleting a false positive), we ignore the shrink. Shrinking it would
    // cause us to re-emit the next words, leading to massive repetition loops.
    if (this.emittedWordCount >= this.currentSessionWords.length) {
      return;
    }

    const newWords = this.currentSessionWords.slice(this.emittedWordCount);
    for (const word of newWords) {
      this.opts.onNewWord(word);
      this.emittedWordCount++;
    }
  }

  /**
   * Detach event handlers from the current recognition instance and stop it,
   * so it cannot deliver any further events to this adapter. Called before
   * creating a replacement instance (restart) and on explicit stop().
   */
  private detachRecognition(): void {
    if (!this.recognition) return;
    this.recognition.onresult = null;
    this.recognition.onerror = null;
    this.recognition.onend = null;
    try {
      // abort() is more immediate than stop() and discards in-flight audio,
      // which also helps avoid the tail-audio-overlap re-hearing effect
      // some Android devices exhibit when a new session starts right after.
      if (typeof this.recognition.abort === 'function') {
        this.recognition.abort();
      } else {
        this.recognition.stop();
      }
    } catch (_e) {
      // Ignore — may already be stopped
    }
  }

  private initRecognition(): void {
    // Discard any previous instance first so it can't deliver stale events
    // into the new instance's shared emittedWordCount/currentSessionWords state.
    this.detachRecognition();

    // Guarantee fresh state for the new instance
    this.emittedWordCount = 0;
    this.currentSessionWords = [];
    this.clearDebounce();

    const SR =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    this.recognition = new SR();
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = 'ar-SA';
    this.recognition.maxAlternatives = 1;

    // Mint a token for THIS instance. Captured by value in the closures below,
    // so any event that fires after a *newer* instance has replaced this one
    // (this.sessionToken will have moved on) is recognized as stale and ignored.
    const myToken = ++this.sessionToken;

    this.recognition.onresult = (event: any) => {
      if (myToken !== this.sessionToken) return; // stale instance — ignore
      this.handleResult(event);
    };

    this.recognition.onerror = (event: any) => {
      if (myToken !== this.sessionToken) return; // stale instance — ignore
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
      if (myToken !== this.sessionToken) return; // stale instance — ignore

      // Flush any pending interim words before session ends
      this.flushPendingWords();

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
   * Handle a speech recognition result event.
   *
   * Strategy — "finals-first":
   * 1. Re-build the full session word list from event.results.
   * 2. If a final result segment is present, emit new words immediately.
   * 3. If only interim segments are updated, schedule a debounce to emit them later.
   */
  private handleResult(event: any): void {
    const sessionWords: string[] = [];
    let hasFinal = false;

    for (let i = 0; i < event.results.length; i++) {
      const result = event.results[i];
      const text: string = result[0].transcript.trim();
      if (!text) continue;

      const words = text.split(/\s+/).filter(Boolean);
      sessionWords.push(...words);

      if (result.isFinal) {
        hasFinal = true;
      }
    }

    this.currentSessionWords = sessionWords;

    if (hasFinal) {
      // Cancel any pending debounce — finals supersede interim guesses
      this.clearDebounce();
      this.emitNewWords();
    } else {
      // Schedule a debounce for interim words
      this.scheduleInterimDebounce();
    }
  }

  /**
   * Schedule a debounce for interim words.
   * When the timer fires, it re-computes what's genuinely new
   * and emits only truly new words.
   */
  private scheduleInterimDebounce(): void {
    // Reset the timer on each new interim event
    if (this.debounceTimer !== null) {
      clearTimeout(this.debounceTimer);
    }
    this.debounceTimer = setTimeout(() => {
      this.debounceTimer = null;
      this.emitNewWords();
    }, DEBOUNCE_MS);
  }
}