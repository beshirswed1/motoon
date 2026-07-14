/**
 * speech-adapter.ts — Module 6: Speech Recognition Adapter
 *
 * Thin wrapper around the Web Speech API that emits individual
 * NEW words as they are recognized.
 *
 * Design principles:
 * - We maintain `sessionEmittedWords`, tracking all words ever emitted in the session.
 * - Within a single SpeechRecognition instance, we track `instanceTotalEmittedCount`.
 * - We only emit words at indices >= `instanceTotalEmittedCount`, making the engine
 *   completely immune to Android Chrome changing past interim words.
 * - On restart, we calculate an initial skip to handle cumulative vs fresh transcripts.
 */

import { normalizeWord } from './normalizer';

// ─── Constants ───────────────────────────────────────────────────────────────

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
  private recognitionSessionId = '';
  private emittedWordsCounter = 0;

  /**
   * All words emitted during the entire active session (survives restarts).
   */
  private sessionEmittedWords: string[] = [];

  /**
   * Words emitted so far from the CURRENT SpeechRecognition instance.
   */
  private instanceTotalEmittedCount = 0;
  private isInstanceInitialized = false;

  /**
   * Pending interim words from the latest non-final result waiting for debounce.
   */
  private pendingInterimWords: string[] = [];

  /** Debounce timer for interim words */
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;

  // ─── Public API ─────────────────────────────────────────────────────

  /** Check if Web Speech API is available */
  isSupported(): boolean {
    if (typeof window === 'undefined') return false;
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    return !!SR;
  }

  /** Start listening. Words will be emitted via opts.onNewWord. */
  async start(opts: SpeechAdapterOptions): Promise<void> {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [SpeechAdapter] start() called`);
    if (!this.isSupported()) {
      throw new Error('Web Speech API is not supported in this browser.');
    }

    if (this.isActive) {
      console.log(`[${timestamp}] [SpeechAdapter] start() aborted - already active`);
      return;
    }

    this.opts = opts;
    this.sessionEmittedWords = [];
    this.isInstanceInitialized = false;
    this.instanceTotalEmittedCount = 0;
    this.pendingInterimWords = [];
    this.emittedWordsCounter = 0;
    this.clearDebounce();
    this.isActive = true;

    this.initRecognition();

    try {
      console.log(
        `[${new Date().toISOString()}] [SpeechAdapter] [SESSION ${this.recognitionSessionId}] calling recognition.start()`
      );
      this.recognition.start();
    } catch (err) {
      console.error(
        `[${new Date().toISOString()}] [SpeechAdapter] [SESSION ${this.recognitionSessionId}] recognition.start() threw error:`,
        err
      );
      this.isActive = false;
      throw err;
    }
  }

  /** Stop listening and clean up. */
  stop(): void {
    const timestamp = new Date().toISOString();
    console.log(
      `[${timestamp}] [SpeechAdapter] [SESSION ${this.recognitionSessionId}] stop() called`
    );
    this.isActive = false;
    this.flushPendingInterim();
    if (this.recognition) {
      try {
        console.log(
          `[${new Date().toISOString()}] [SpeechAdapter] [SESSION ${this.recognitionSessionId}] calling recognition.stop()`
        );
        this.recognition.stop();
      } catch (_e) {
        // Ignore — may already be stopped
      }
    }
  }

  /** Reset the word tracking state (for full session restart). */
  reset(): void {
    const timestamp = new Date().toISOString();
    console.log(
      `[${timestamp}] [SpeechAdapter] [SESSION ${this.recognitionSessionId}] reset() called`
    );
    this.sessionEmittedWords = [];
    this.isInstanceInitialized = false;
    this.instanceTotalEmittedCount = 0;
    this.pendingInterimWords = [];
    this.emittedWordsCounter = 0;
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
   * Emit a new word and log it as requested.
   */
  private emitWord(word: string, reason: 'FINAL' | 'INTERIM'): void {
    this.emittedWordsCounter++;
    this.sessionEmittedWords.push(word);
    console.log(
      `[${new Date().toISOString()}] [SpeechAdapter] [SESSION ${this.recognitionSessionId}] EMIT -> #${this.emittedWordsCounter} ${word} (reason = ${reason})`
    );
    this.opts?.onNewWord(word);
  }

  /**
   * Flush pending interim words immediately.
   * Called ONLY on explicit stop() — never from onend.
   */
  private flushPendingInterim(): void {
    this.clearDebounce();
    if (this.pendingInterimWords.length > 0 && this.opts?.onNewWord) {
      console.log(
        `[${new Date().toISOString()}] [SpeechAdapter] [SESSION ${this.recognitionSessionId}] flushPendingInterim() flushing:`,
        this.pendingInterimWords
      );
      for (const word of this.pendingInterimWords) {
        this.emitWord(word, 'INTERIM');
      }
      this.instanceTotalEmittedCount += this.pendingInterimWords.length;
      this.pendingInterimWords = [];
    }
  }

  private initRecognition(): void {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    this.recognitionSessionId = Math.random().toString(36).substring(2, 9).toUpperCase();
    const timestamp = new Date().toISOString();
    console.log(
      `[${timestamp}] [SpeechAdapter] [SESSION ${this.recognitionSessionId}] initRecognition() created new SpeechRecognition instance`
    );

    this.recognition = new SR();
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = 'ar-SA';
    this.recognition.maxAlternatives = 1;

    this.recognition.onstart = () => {
      console.log(
        `[${new Date().toISOString()}] [SpeechAdapter] [SESSION ${this.recognitionSessionId}] recognition.onstart event fired`
      );
    };

    this.recognition.onresult = (event: any) => {
      const ts = new Date().toISOString();
      console.log(
        `[${ts}] [SpeechAdapter] [SESSION ${this.recognitionSessionId}] recognition.onresult event fired`
      );
      
      this.handleResult(event);
    };

    this.recognition.onerror = (event: any) => {
      const errorType = event.error;

      // Auto-restart on transient errors
      if (errorType === 'network' || errorType === 'no-speech') {
        console.log(
          `[${new Date().toISOString()}] [SpeechAdapter] [SESSION ${this.recognitionSessionId}] transient error "${errorType}" - restarting recognition`
        );
        if (this.isActive) {
          this.restartRecognition();
        }
        return;
      }

      console.warn(
        `[${new Date().toISOString()}] [SpeechAdapter] [SESSION ${this.recognitionSessionId}] recognition.onerror event fired. Error: ${errorType}`
      );

      if (this.opts?.onError) {
        this.opts.onError(errorType);
      }
    };

    this.recognition.onend = () => {
      console.log(
        `[${new Date().toISOString()}] [SpeechAdapter] [SESSION ${this.recognitionSessionId}] recognition.onend event fired`
      );
      this.clearDebounce();
      this.pendingInterimWords = [];

      // Auto-restart if still active
      if (this.isActive) {
        console.log(
          `[${new Date().toISOString()}] [SpeechAdapter] [SESSION ${this.recognitionSessionId}] adapter is active - initiating restartRecognition`
        );
        this.restartRecognition();
        return;
      }

      if (this.opts?.onEnd) {
        this.opts.onEnd();
      }
    };
  }

  private restartRecognition(): void {
    const timestamp = new Date().toISOString();
    console.log(
      `[${timestamp}] [SpeechAdapter] [SESSION ${this.recognitionSessionId}] restartRecognition() called`
    );
    try {
      // Small delay to avoid rapid restart loops
      setTimeout(() => {
        if (this.isActive) {
          try {
            // Detach old recognition handlers to prevent ghost events.
            const oldRecognition = this.recognition;
            if (oldRecognition) {
              console.log(
                `[${new Date().toISOString()}] [SpeechAdapter] [SESSION ${this.recognitionSessionId}] detaching event listeners from old recognition instance`
              );
              oldRecognition.onresult = null;
              oldRecognition.onerror = null;
              oldRecognition.onend = null;
            }

            // Create fresh instance
            this.initRecognition();

            // Clear instance tracking
            this.isInstanceInitialized = false;
            this.instanceTotalEmittedCount = 0;
            this.pendingInterimWords = [];

            console.log(
              `[${new Date().toISOString()}] [SpeechAdapter] [SESSION ${this.recognitionSessionId}] calling recognition.start() inside restartRecognition`
            );
            this.recognition.start();
          } catch (_e) {
            console.error(
              `[${new Date().toISOString()}] [SpeechAdapter] [SESSION ${this.recognitionSessionId}] restart failed:`,
              _e
            );
            // Failed to restart — stop gracefully
            this.isActive = false;
            if (this.opts?.onEnd) this.opts.onEnd();
          }
        } else {
          console.log(
            `[${new Date().toISOString()}] [SpeechAdapter] restartRecognition() timeout fired but adapter is no longer active`
          );
        }
      }, 200);
    } catch (_e) {
      this.isActive = false;
    }
  }

  /**
   * Determine how many words to skip at the start of a NEW SpeechRecognition instance.
   * Differentiates between:
   * - Cumulative restarts (Android Chrome): Redelivers the entire session history.
   * - Fresh restarts (Desktop/Samsung): Starts with only new words.
   */
  private calculateInitialSkip(instanceAllWords: string[]): number {
    if (this.sessionEmittedWords.length === 0 || instanceAllWords.length === 0) {
      return 0;
    }

    // Count how many of the first few words match the session history
    const checkLen = Math.min(5, this.sessionEmittedWords.length, instanceAllWords.length);
    let matchCount = 0;
    for (let i = 0; i < checkLen; i++) {
      if (normalizeWord(instanceAllWords[i]) === normalizeWord(this.sessionEmittedWords[i])) {
        matchCount++;
      }
    }

    // Heuristic for Cumulative:
    // 1. Matches at least one word from the start (allowing for minor variations/errors).
    // 2. Length is reasonably large compared to what we've seen (>= 40%).
    const isPrefixMatching = matchCount > 0 && matchCount >= checkLen - 2;
    const isLengthSimilar = instanceAllWords.length >= this.sessionEmittedWords.length * 0.4;

    if (isPrefixMatching && isLengthSimilar) {
      // It's a cumulative result! Skip the words we've already emitted.
      return Math.min(this.sessionEmittedWords.length, instanceAllWords.length);
    }

    // Otherwise, treat as fresh result
    return 0;
  }

  /**
   * Handle a speech recognition result event.
   *
   * Strategy:
   * - Maintain `instanceTotalEmittedCount` to track how many words we've emitted in this instance.
   * - Iterate through new words ONLY (index >= instanceTotalEmittedCount).
   * - This ignores any changes the engine makes to previous interim words, preventing duplicates.
   */
  private handleResult(event: any): void {
    const instanceFinalWords: string[] = [];
    const instanceInterimWords: string[] = [];

    // 1. Reconstruct all words from the current instance's results
    for (let i = 0; i < event.results.length; i++) {
      const result = event.results[i];
      const text: string = result[0].transcript.trim();
      if (!text) continue;

      const words = text.split(/\s+/).filter(Boolean);
      if (result.isFinal) {
        instanceFinalWords.push(...words);
      } else {
        instanceInterimWords.push(...words);
      }
    }

    const instanceAllWords = [...instanceFinalWords, ...instanceInterimWords];
    const F = instanceFinalWords.length;
    const L = instanceAllWords.length;

    // 2. Initialize instance skip count if this is the first result of a new instance
    if (!this.isInstanceInitialized) {
      this.instanceTotalEmittedCount = this.calculateInitialSkip(instanceAllWords);
      this.isInstanceInitialized = true;
      console.log(
        `[${new Date().toISOString()}] [SpeechAdapter] [SESSION ${this.recognitionSessionId}] initialized instance with skip count: ${this.instanceTotalEmittedCount}`
      );
    }

    console.log(
      `[${new Date().toISOString()}] [SpeechAdapter] [SESSION ${this.recognitionSessionId}] handleResult: F=${F}, L=${L}, instanceTotalEmittedCount=${this.instanceTotalEmittedCount}\n` +
      `  instanceAllWords: ${JSON.stringify(instanceAllWords)}`
    );

    const newFinalWordsToEmit: string[] = [];
    const newInterimWordsToQueue: string[] = [];

    // 3. Process ONLY words at indices we haven't emitted yet
    for (let i = this.instanceTotalEmittedCount; i < L; i++) {
      if (i < F) {
        newFinalWordsToEmit.push(instanceAllWords[i]);
      } else {
        newInterimWordsToQueue.push(instanceAllWords[i]);
      }
    }

    // 4. Emit new final words immediately
    if (newFinalWordsToEmit.length > 0) {
      for (const word of newFinalWordsToEmit) {
        this.emitWord(word, 'FINAL');
      }
      this.instanceTotalEmittedCount += newFinalWordsToEmit.length;
    }

    // 5. Handle interim words with debounce
    if (newInterimWordsToQueue.length > 0) {
      this.pendingInterimWords = newInterimWordsToQueue;
      this.scheduleInterimDebounce();
    } else {
      this.clearDebounce();
      this.pendingInterimWords = [];
    }
  }

  /**
   * Schedule a debounce for interim words.
   * When the timer fires, emit the pending interim words and update counts.
   */
  private scheduleInterimDebounce(): void {
    if (this.debounceTimer !== null) {
      clearTimeout(this.debounceTimer);
    }
    this.debounceTimer = setTimeout(() => {
      this.debounceTimer = null;
      if (this.pendingInterimWords.length > 0 && this.opts?.onNewWord) {
        for (const word of this.pendingInterimWords) {
          this.emitWord(word, 'INTERIM');
        }
        this.instanceTotalEmittedCount += this.pendingInterimWords.length;
        this.pendingInterimWords = [];
      }
    }, DEBOUNCE_MS);
  }
}
