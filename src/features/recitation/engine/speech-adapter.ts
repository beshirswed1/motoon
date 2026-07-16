/**
 * speech-adapter.ts — Module 6: Speech Recognition Adapter
 *
 * Wraps Web Speech API and emits ONE callback per genuinely-new word.
 *
 * Key design for Android Chrome:
 * ─────────────────────────────────────────────────────────────────
 * Android Chrome has TWO separate duplication problems:
 *
 * 1) CROSS-INSTANCE duplication:
 *    Android Chrome does NOT honor `continuous: true`. It silently
 *    ends recognition after every pause, then we restart it. On
 *    restart the browser often re-delivers the SAME words it already
 *    delivered in the previous instance (cumulative transcript).
 *
 *    → Solved by `computeInstanceSkip()` which compares new words
 *      against `initialGlobalWords` to find and skip overlaps.
 *
 * 2) INTRA-INSTANCE cumulative duplication:
 *    Within a SINGLE recognition instance, Android Chrome sometimes
 *    sends `event.results` where each result contains the FULL
 *    cumulative transcript instead of just its own segment. Or it
 *    sends multiple results that are cumulative expansions of each
 *    other. Naively concatenating all results produces duplicates.
 *
 *    → Solved by segment-based deduplication:
 *      - Each result index is tracked as an independent "segment"
 *      - Final segments are cached and never re-read from the event
 *      - Cumulative patterns (result text starting with previously
 *        seen words) are detected and only the new suffix is taken
 *      - A fingerprint hash prevents processing identical events
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

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Simple hash of a string array for fingerprinting. */
function hashWords(words: string[]): string {
  return words.join('\x1F'); // unit separator — won't appear in Arabic text
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

  // ─── Segment-based deduplication state (intra-instance) ─────────

  /**
   * Cached final segments from the current recognition instance.
   * Key = result index, Value = array of words from that segment.
   * Once a segment becomes isFinal, its words are frozen here and
   * never re-read from event.results (which may change or duplicate).
   */
  private finalizedSegments: Map<number, string[]> = new Map();

  /**
   * Fingerprint (hash) of the last processed word list.
   * If the browser fires onresult with exactly the same content,
   * we skip it entirely. Protects against duplicate events.
   */
  private lastTranscriptHash = '';

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
    this.finalizedSegments.clear();
    this.lastTranscriptHash = '';
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
    this.finalizedSegments.clear();
    this.lastTranscriptHash = '';
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
    this.finalizedSegments.clear();
    this.lastTranscriptHash = '';
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
   * This is the core fix for Android Chrome duplication. Instead of naively
   * concatenating all event.results, we:
   *
   * 1. Track each result index as an independent "segment"
   * 2. Cache finalized segments so they're never re-read
   * 3. Detect cumulative patterns (one result containing all previous text)
   * 4. Use fingerprint hashing to skip duplicate events
   *
   * This handles ALL known Android Chrome behaviors:
   * - Normal segmented results (Desktop + some Android)
   * - Cumulative single-result transcripts (some Android versions)
   * - Duplicate final events (some Android versions)
   * - Mixed final+interim cumulative results
   */
  private handleResult(event: any): void {
    // ── Step 1: Build word list from segments with deduplication ──

    const finalWords: string[] = [];
    let latestInterimWords: string[] = [];
    let hasFinal = false;

    for (let i = 0; i < event.results.length; i++) {
      const result = event.results[i];
      const text: string = (result[0]?.transcript || '').trim();
      if (!text) continue;

      const words = text.split(/\s+/).filter(Boolean);

      if (result.isFinal) {
        hasFinal = true;

        // Only cache this segment if we haven't seen it before.
        // This prevents re-processing when the browser re-delivers
        // the same final result.
        if (!this.finalizedSegments.has(i)) {
          this.finalizedSegments.set(i, words);
        }

        // Always use the cached version (it's the first/authoritative one)
        finalWords.push(...this.finalizedSegments.get(i)!);
      } else {
        // For interim results, always take the LAST one (they replace each other)
        latestInterimWords = words;
      }
    }

    // ── Step 2: Detect and strip cumulative overlap from interim ──
    //
    // Android Chrome sometimes sends an interim result that contains
    // the FULL text (final + interim) as a single string. Example:
    //   results[0] (final): "الحمد لله"
    //   results[1] (interim): "الحمد لله رب"  ← cumulative!
    //
    // We detect this by checking if the interim starts with the same
    // words as the finals, and if so, strip the overlap.

    if (latestInterimWords.length > 0 && finalWords.length > 0) {
      const overlapLen = this.findPrefixOverlap(finalWords, latestInterimWords);
      if (overlapLen > 0) {
        latestInterimWords = latestInterimWords.slice(overlapLen);
      }
    }

    // ── Step 3: Combine into the authoritative word list ──

    const allWords = [...finalWords, ...latestInterimWords];

    // ── Step 4: Fingerprint deduplication ──
    //
    // If the browser fires onresult with exactly the same transcript
    // content as last time (common on Android when results shift from
    // interim → final without adding new words), skip entirely.

    const currentHash = hashWords(allWords);
    if (currentHash === this.lastTranscriptHash) {
      return; // Exact same content — nothing new to process
    }
    this.lastTranscriptHash = currentHash;

    // ── Step 5: Additional cumulative detection ──
    //
    // Even after segment-level dedup, some Android versions deliver
    // ALL text in a single result (results.length === 1) that grows
    // cumulatively. Detect this: if the new allWords starts with all
    // of the current instanceWords, it's cumulative — only the tail
    // is new.
    //
    // We do this ONLY when there's a single result (no segments),
    // because with proper segments the segment-level logic already
    // handles it.

    if (event.results.length === 1 && this.instanceWords.length > 0) {
      const overlap = this.findPrefixOverlap(this.instanceWords, allWords);
      if (overlap === this.instanceWords.length && allWords.length > overlap) {
        // The new transcript is a cumulative extension of the old one.
        // Keep our existing instanceWords and just append the new tail.
        const newTail = allWords.slice(overlap);
        this.instanceWords = [...this.instanceWords, ...newTail];

        if (hasFinal) {
          this.flushNewWords();
        } else {
          this.clearDebounce();
          this.debounceTimer = setTimeout(() => {
            this.debounceTimer = null;
            this.flushNewWords();
          }, DEBOUNCE_MS);
        }
        return;
      }
    }

    // ── Step 6: Standard path — update instanceWords ──

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

  /**
   * Find the length of the longest prefix of `candidate` that matches
   * a prefix of `reference`, using normalized comparison.
   *
   * Example:
   *   reference = ["الحمد", "لله"]
   *   candidate = ["الحمد", "لله", "رب"]
   *   → returns 2 (the first 2 words of candidate match reference)
   *
   * Allows at most 1 mismatch for sequences of 3+ words to tolerate
   * minor STT spelling variations.
   */
  private findPrefixOverlap(reference: string[], candidate: string[]): number {
    const maxCheck = Math.min(reference.length, candidate.length);
    if (maxCheck === 0) return 0;

    let matched = 0;
    let mismatches = 0;

    for (let i = 0; i < maxCheck; i++) {
      if (normalizeWord(reference[i]) === normalizeWord(candidate[i])) {
        matched++;
      } else {
        mismatches++;
        // For short sequences, require exact match
        // For longer sequences (3+), allow 1 mismatch
        const maxAllowed = maxCheck >= 3 ? 1 : 0;
        if (mismatches > maxAllowed) {
          break;
        }
        matched++; // Count the mismatched position as "matched" for overlap purposes
      }
    }

    return matched;
  }
}