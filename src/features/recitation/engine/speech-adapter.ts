/**
 * speech-adapter.ts — Module 6: Speech Recognition Adapter
 *
 * Wraps Web Speech API and emits ONE callback per genuinely-new word.
 *
 * Android Chrome Deduplication Architecture (5 layers):
 * ═════════════════════════════════════════════════════
 *
 * Layer 1 — event.resultIndex gate
 *   Only process results from event.resultIndex onwards, avoiding
 *   re-processing of unchanged results (Google's own recommendation).
 *
 * Layer 2 — Content-based committed word tracking
 *   Instead of caching by result index (which Android may re-arrange),
 *   we maintain a running `committedWords` list. Each new final result's
 *   words are checked for suffix→prefix overlap with committedWords,
 *   and only genuinely new words are appended.
 *
 * Layer 3 — Interim cumulative stripping
 *   ALL interim results are collected (not just the last one, since
 *   Samsung devices may have interims at multiple indices). Their words
 *   are stripped of overlap with committedWords and with each other.
 *
 * Layer 4 — Normalized fingerprint hash
 *   A hash of the NORMALIZED word list prevents processing identical
 *   events, including events that differ only by diacritics.
 *
 * Layer 5 — Cross-instance overlap (computeInstanceSkip)
 *   When recognition restarts (Android kills sessions after pauses),
 *   the new instance may re-deliver words from the previous one.
 *   Suffix→prefix matching detects and skips the overlap.
 *
 * Additionally, a sessionToken ensures late/ghost events from dying
 * recognition instances are silently dropped.
 */

import { normalizeWord } from './normalizer';

// ─── Constants ───────────────────────────────────────────────────────────────

/**
 * How long (ms) to wait for interim words to stabilize before emitting them.
 * Reduced from 500ms for faster mobile response.
 */
const DEBOUNCE_MS = 350;

/**
 * How long (ms) to wait before restarting recognition after it ends.
 * Kept short so the user doesn't notice gaps.
 */
const RESTART_DELAY_MS = 150;

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

  // ─── Cross-instance state (survives recognition restarts) ──────────

  /**
   * Words we have emitted to the state machine across ALL recognition
   * instances in this listening session. Append-only; NEVER shrinks
   * until an explicit start() or reset().
   */
  private globalEmittedWords: string[] = [];

  /**
   * Snapshot of globalEmittedWords at the start of the current instance.
   * Used by computeInstanceSkip() to detect cross-instance overlap.
   */
  private initialGlobalWords: string[] = [];

  /**
   * How many words from this instance have been emitted. Used to
   * avoid re-emitting words we've already sent to the callback.
   */
  private instanceEmittedCount = 0;

  // ─── Per-instance state (reset on each recognition restart) ────────

  /**
   * The complete word list for the CURRENT instance = committedWords + cleanInterim.
   * This is what flushNewWords() reads from.
   */
  private instanceWords: string[] = [];

  /**
   * Accumulated words from isFinal results in THIS instance.
   * Built incrementally with overlap stripping.
   * NOT indexed by result number — content-based only.
   */
  private committedWords: string[] = [];

  /**
   * Normalized fingerprint of the last processed word list.
   * Prevents processing duplicate events (same words, possibly
   * with different diacritics).
   */
  private lastNormalizedHash = '';

  // ─── Timers & tokens ──────────────────────────────────────────────

  /** Debounce timer for interim words */
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;

  /** Timeout timer for restarting recognition */
  private restartTimeout: ReturnType<typeof setTimeout> | null = null;

  /**
   * Monotonically increasing token identifying the "live" instance.
   * Callbacks capture this by value and bail if it no longer matches.
   */
  private sessionToken = 0;

  // ─── Public API ────────────────────────────────────────────────────

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
    this.committedWords = [];
    this.lastNormalizedHash = '';
    if (this.restartTimeout) {
      clearTimeout(this.restartTimeout);
      this.restartTimeout = null;
    }
    this.clearDebounce();
    this.isActive = true;

    this.initRecognition();

    try {
      this.recognition.start();
      console.log('[SpeechAdapter] ✅ Recognition started');
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
    this.flushNewWords(); // emit any pending debounced words
    this.detachRecognition();
    console.log('[SpeechAdapter] 🛑 Recognition stopped');
  }

  /** Reset the word tracking state (for full session restart). */
  reset(): void {
    this.globalEmittedWords = [];
    this.initialGlobalWords = [];
    this.instanceEmittedCount = 0;
    this.instanceWords = [];
    this.committedWords = [];
    this.lastNormalizedHash = '';
    if (this.restartTimeout) {
      clearTimeout(this.restartTimeout);
      this.restartTimeout = null;
    }
    this.clearDebounce();
  }

  // ─── Private ──────────────────────────────────────────────────────

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

    // Cross-instance dedup: skip words that overlap with the previous instance
    const skip = this.computeInstanceSkip(this.instanceWords);

    // How many new words does this instance have beyond the skip zone?
    const instanceNewWords = this.instanceWords.slice(skip);

    // How many of those have we already emitted from this instance?
    const toEmit = instanceNewWords.slice(this.instanceEmittedCount);

    for (const word of toEmit) {
      this.globalEmittedWords.push(word);
      this.instanceEmittedCount++;
      console.log(`[SpeechAdapter] 📤 EMIT: "${word}" (global #${this.globalEmittedWords.length})`);
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
    this.committedWords = [];
    this.lastNormalizedHash = '';
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
      if (errorType === 'network' || errorType === 'no-speech' || errorType === 'aborted') {
        console.warn(`[SpeechAdapter] ⚠️ Transient error: ${errorType}. Will restart in onend.`);
        return;
      }

      // Fatal errors: stop session and propagate.
      console.error(`[SpeechAdapter] ❌ Fatal error: ${errorType}`);
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
        console.log('[SpeechAdapter] 🔄 Recognition ended, restarting...');
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
            console.log('[SpeechAdapter] ✅ Recognition restarted');
          } catch (_e) {
            console.error('[SpeechAdapter] ❌ Restart failed:', _e);
            this.isActive = false;
            if (this.opts?.onEnd) this.opts.onEnd();
          }
        }
      }, RESTART_DELAY_MS);
    } catch (_e) {
      this.isActive = false;
    }
  }

  // ─── Cross-instance overlap (Layer 5) ──────────────────────────────

  /**
   * Detect overlap between the previous instance's emitted words and
   * the new instance's words. Returns how many words to skip from the
   * beginning of `words`.
   *
   * Uses suffix→prefix matching: finds the longest SUFFIX of
   * initialGlobalWords that matches a PREFIX of words.
   *
   * This is strictly suffix→prefix (not arbitrary alignment) because
   * Chrome re-delivery always re-sends from the END of the previous
   * session — never from the middle.
   */
  private computeInstanceSkip(words: string[]): number {
    if (this.initialGlobalWords.length === 0 || words.length === 0) {
      return 0;
    }

    const maxSuffix = Math.min(this.initialGlobalWords.length, words.length);

    // Try decreasing suffix lengths to find the longest match
    for (let suffixLen = maxSuffix; suffixLen >= 1; suffixLen--) {
      const suffixStart = this.initialGlobalWords.length - suffixLen;
      let mismatches = 0;
      let isMatch = true;

      for (let i = 0; i < suffixLen; i++) {
        const globalWord = this.initialGlobalWords[suffixStart + i];
        const instanceWord = words[i];

        if (normalizeWord(globalWord) !== normalizeWord(instanceWord)) {
          mismatches++;
          // Allow 1 mismatch for sequences of 3+ words (STT variation)
          const maxAllowed = suffixLen >= 3 ? 1 : 0;
          if (mismatches > maxAllowed) {
            isMatch = false;
            break;
          }
        }
      }

      if (isMatch) {
        console.log(`[SpeechAdapter] 🔗 Cross-instance overlap: skipping ${suffixLen} words`);
        return suffixLen;
      }
    }

    return 0;
  }

  // ─── Core result handler (Layers 1–4) ──────────────────────────────

  /**
   * Handle a speech recognition result event.
   *
   * Addresses ALL 6 known Android Chrome issues:
   *
   * 1. Uses event.resultIndex — only processes changed results
   * 2. Content-based committedWords — no index-based caching
   * 3. Collects ALL interims — handles Samsung multi-interim
   * 4. Suffix→prefix overlap — handles sliding window patterns
   * 5. Normalized hash — catches diacritic-only variations
   * 6. Cross-instance skip uses suffix matching only
   */
  private handleResult(event: any): void {
    // ══════════════════════════════════════════════════════════════════
    // Layer 1: Use event.resultIndex — skip unchanged results
    // ══════════════════════════════════════════════════════════════════
    const startIdx: number =
      typeof event.resultIndex === 'number' ? event.resultIndex : 0;

    let hasFinal = false;

    // ══════════════════════════════════════════════════════════════════
    // Layer 2: Process FINAL results with content-based dedup
    //
    // For each new final result, extract its words and strip any
    // suffix→prefix overlap with our existing committedWords.
    // This handles:
    //  - Android re-arranging results (we don't rely on indices)
    //  - Cumulative finals (one result containing all previous text)
    //  - Duplicate finals (same text sent twice)
    // ══════════════════════════════════════════════════════════════════
    for (let i = startIdx; i < event.results.length; i++) {
      const result = event.results[i];
      if (!result.isFinal) continue;

      hasFinal = true;
      const text: string = (result[0]?.transcript || '').trim();
      if (!text) continue;

      const words = text.split(/\s+/).filter(Boolean);

      // Strip overlap: if this final's words start with a suffix
      // of our existing committed words, only keep the new tail.
      const newOnly = this.stripSuffixPrefixOverlap(words, this.committedWords);
      if (newOnly.length > 0) {
        this.committedWords.push(...newOnly);
        console.log(`[SpeechAdapter] 📝 Committed: +${newOnly.length} words → [${this.committedWords.map(w => `"${w}"`).join(', ')}]`);
      }
    }

    // ══════════════════════════════════════════════════════════════════
    // Layer 3: Collect ALL interim results with dedup
    //
    // We read ALL results (not just from startIdx) for interims,
    // because they represent the CURRENT partial state.
    //
    // Samsung devices may have interims at multiple non-contiguous
    // indices (e.g. result[2] and result[4]). We collect them all,
    // stripping overlap against committed words AND against each
    // other to handle cumulative interims.
    // ══════════════════════════════════════════════════════════════════
    let accumulatedInterim: string[] = [];

    for (let i = 0; i < event.results.length; i++) {
      if (event.results[i].isFinal) continue;

      const text: string = (event.results[i][0]?.transcript || '').trim();
      if (!text) continue;

      const words = text.split(/\s+/).filter(Boolean);

      // Strip overlap against committed words + previously seen interims.
      // This handles cumulative interims where result[4] contains
      // everything from result[2] plus new words.
      const reference = [...this.committedWords, ...accumulatedInterim];
      const newOnly = this.stripSuffixPrefixOverlap(words, reference);
      accumulatedInterim.push(...newOnly);
    }

    // ══════════════════════════════════════════════════════════════════
    // Build the complete instance word list
    // ══════════════════════════════════════════════════════════════════
    const newInstanceWords = [...this.committedWords, ...accumulatedInterim];

    // ══════════════════════════════════════════════════════════════════
    // Layer 4: Normalized fingerprint check
    //
    // Hash uses normalizeWord() so that events differing only by
    // diacritics (e.g. "الحمد" vs "الحمدِ") are treated as identical.
    // ══════════════════════════════════════════════════════════════════
    const hash = newInstanceWords.map(w => normalizeWord(w)).join('\x1F');
    if (hash === this.lastNormalizedHash) {
      return; // Exact same normalized content — nothing new
    }
    this.lastNormalizedHash = hash;

    // ══════════════════════════════════════════════════════════════════
    // Update instance state and emit
    // ══════════════════════════════════════════════════════════════════
    this.instanceWords = newInstanceWords;

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

  // ─── Overlap detection (used by Layers 2, 3, and 5) ────────────────

  /**
   * Find and strip the longest SUFFIX of `existing` that matches
   * a PREFIX of `incoming`. Returns only the genuinely new words.
   *
   * This handles ALL overlap patterns, including sliding windows:
   *
   *   existing=["الحمد","لله"]  incoming=["الحمد","لله","رب"]  → ["رب"]        (full prefix)
   *   existing=["الحمد","لله"]  incoming=["لله","رب"]          → ["رب"]        (suffix→prefix)
   *   existing=["الحمد"]        incoming=["رب"]                → ["رب"]        (no overlap)
   *   existing=["الحمد","لله"]  incoming=["الحمد","لله"]       → []            (full duplicate)
   *   existing=["الحمد","لله"]  incoming=["لله","رب","العالمين"] → ["رب","العالمين"] (sliding window)
   *
   * Uses normalized comparison. Allows 1 mismatch for sequences ≥ 3
   * to tolerate STT spelling variations between events.
   */
  private stripSuffixPrefixOverlap(
    incoming: string[],
    existing: string[]
  ): string[] {
    if (incoming.length === 0 || existing.length === 0) return incoming;

    const maxSuffix = Math.min(existing.length, incoming.length);

    // Try decreasing suffix lengths of `existing` to find the longest
    // one that matches a prefix of `incoming`
    for (let suffixLen = maxSuffix; suffixLen >= 1; suffixLen--) {
      const suffixStart = existing.length - suffixLen;
      let mismatches = 0;
      let isMatch = true;

      for (let j = 0; j < suffixLen; j++) {
        if (
          normalizeWord(existing[suffixStart + j]) !==
          normalizeWord(incoming[j])
        ) {
          mismatches++;
          // Allow 1 mismatch for sequences of 3+ words
          const maxAllowed = suffixLen >= 3 ? 1 : 0;
          if (mismatches > maxAllowed) {
            isMatch = false;
            break;
          }
        }
      }

      if (isMatch) {
        return incoming.slice(suffixLen);
      }
    }

    return incoming;
  }
}