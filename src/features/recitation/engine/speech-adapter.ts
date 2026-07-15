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
const DEBOUNCE_MS = 700;

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

  /** Debounce timer for interim words */
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;

  /**
   * The latest full word list from the CURRENT recognition instance.
   * Rebuilt on every onresult from that instance's event.results.
   */
  private instanceWords: string[] = [];

  /**
   * How many words from `instanceWords` belong to the PREVIOUS session
   * (i.e. were re-delivered by the browser). We skip these.
   */
  private instanceSkip = 0;

  /**
   * Whether we've computed instanceSkip for this instance yet.
   * Set to false each time initRecognition() creates a new instance.
   */
  private instanceInitialized = false;

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
    this.instanceWords = [];
    this.instanceSkip = 0;
    this.instanceInitialized = false;
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
    this.flushNewWords();    // emit any pending debounced words
    this.detachRecognition();
  }

  /** Reset the word tracking state (for full session restart). */
  reset(): void {
    this.globalEmittedWords = [];
    this.instanceWords = [];
    this.instanceSkip = 0;
    this.instanceInitialized = false;
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
   *
   * "New" = words at positions >= instanceSkip that haven't been
   * accounted for in globalEmittedWords yet.
   */
  private flushNewWords(): void {
    this.clearDebounce();
    if (!this.opts?.onNewWord) return;

    // How many new words does this instance have beyond the skip zone?
    const instanceNewWords = this.instanceWords.slice(this.instanceSkip);

    // How many of those have we already emitted?
    // globalEmittedWords.length tells us the total ever emitted.
    // instanceSkip tells us how many were "old" in this instance.
    // So truly-new = instanceNewWords that are beyond what we've globally emitted.
    //
    // Across all instances:
    //   globalEmittedWords.length = total ever emitted
    //   For this instance, the first `instanceSkip` words are old.
    //   So instance word at position (instanceSkip + k) is the (globalEmittedWords.length-at-start + k)-th new word.
    //
    // Simpler: just compare counts.
    const alreadyEmittedFromThisInstance = Math.max(
      0,
      this.globalEmittedWords.length - this.instanceSkip
    );

    // guard: if the browser shrank the transcript, don't re-emit
    if (alreadyEmittedFromThisInstance < 0) return;

    const toEmit = instanceNewWords.slice(alreadyEmittedFromThisInstance);

    for (const word of toEmit) {
      this.globalEmittedWords.push(word);
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
    this.instanceWords = [];
    this.instanceSkip = 0;
    this.instanceInitialized = false;
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
    try {
      setTimeout(() => {
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
   * Determine how many leading words in a new instance's transcript
   * are just a repetition of words we already emitted.
   *
   * Android Chrome often re-delivers the entire session transcript
   * as the first result of a restarted instance. We detect this by
   * checking if the first N words of the instance match the last N
   * words we globally emitted (normalized comparison).
   */
  private computeInitialSkip(words: string[]): number {
    if (this.globalEmittedWords.length === 0 || words.length === 0) {
      return 0;
    }

    // Check if the instance starts with a prefix of our globally emitted words.
    // We compare against the FULL globalEmittedWords from the beginning,
    // because Android may re-send everything from the very start.
    const maxCheck = Math.min(words.length, this.globalEmittedWords.length);
    let matchCount = 0;

    for (let i = 0; i < maxCheck; i++) {
      const instanceNorm = normalizeWord(words[i]);
      const globalNorm = normalizeWord(this.globalEmittedWords[i]);

      if (instanceNorm === globalNorm) {
        matchCount++;
      } else {
        // Allow 1 mismatch in the first 5 words (STT sometimes changes spelling)
        if (i < 5 && matchCount > 0) {
          matchCount++; // count it as a match (tolerance)
          continue;
        }
        break;
      }
    }

    // If we matched at least 1 word from the start, skip those
    if (matchCount >= 1) {
      return matchCount;
    }

    // No overlap detected — fresh instance (desktop behavior)
    return 0;
  }

  /**
   * Handle a speech recognition result event.
   *
   * Rebuilds the full word list from event.results, then:
   * - On first result of a new instance, computes the skip count
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

    // On the first result of this instance, compute how many words to skip
    if (!this.instanceInitialized && allWords.length > 0) {
      this.instanceSkip = this.computeInitialSkip(allWords);
      this.instanceInitialized = true;
    }

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