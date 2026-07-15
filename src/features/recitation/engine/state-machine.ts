/**
 * state-machine.ts — Module 4: Recitation State Machine
 *
 * Forward-only word-by-word state machine. Each call to processSpokenWord()
 * immediately evaluates one word and advances the pointer.
 *
 * Word states: waiting → listening → correct | incorrect | missed
 */

import { matchWords, type MatchResult } from './matcher';
import { normalizeWord } from './normalizer';
import { ExpectedTextEngine } from './expected-text';

// ─── Types ───────────────────────────────────────────────────────────────────

export type WordStatus = 'waiting' | 'listening' | 'correct' | 'incorrect' | 'missed';

export interface WordState {
  /** Global index across all verses */
  index: number;
  /** Original text (with tashkeel) */
  text: string;
  /** Pre-normalized text */
  normalized: string;
  /** Which verse this word belongs to */
  verseIndex: number;
  /** Position within its verse */
  positionInVerse: number;
  /** Current evaluation status */
  status: WordStatus;
  /** What the user actually said (if evaluated) */
  spokenWord?: string;
  /** Match similarity score (0–1) */
  similarity?: number;
  /** Is this a punctuation token? */
  isPunctuation: boolean;
}

export interface ProcessResult {
  /** Which word(s) were affected */
  affectedIndices: number[];
  /** What happened */
  action: 'matched' | 'incorrect' | 'skipped_ahead' | 'repeated' | 'ignored';
  /** Did we cross into a new verse? */
  newVerseStarted: boolean;
  /** The previous verse index (before processing) */
  previousVerseIndex: number;
}

// Maximum forward lookahead when a spoken word doesn't match the current expected word
const MAX_LOOKAHEAD = 2;

// Maximum backward lookback (through a contiguous run of already-correct words)
// when checking whether a spoken word is just a repeat of something already
// confirmed. Must be >= the longest repeated phrase the STT engine tends to
// re-emit (e.g. on Android, restarting recognition after a pause commonly
// re-emits the last 1-2 words of the previous utterance).
const MAX_LOOKBACK = 2;

// ─── State Machine ───────────────────────────────────────────────────────────

export class RecitationStateMachine {
  private readonly engine: ExpectedTextEngine;
  private states: WordState[];
  private pointer: number; // Index of the current "listening" word

  constructor(engine: ExpectedTextEngine) {
    this.engine = engine;
    this.states = [];
    this.pointer = 0;

    // Initialize all word states
    for (const word of engine.words) {
      this.states.push({
        index: word.index,
        text: word.original,
        normalized: word.normalized,
        verseIndex: word.verseIndex,
        positionInVerse: word.positionInVerse,
        status: 'waiting',
        isPunctuation: word.isPunctuation,
      });
    }

    // Auto-skip leading punctuation and set first real word to "listening"
    this.advanceToNextMeaningfulWord();
  }

  // ─── Public API ──────────────────────────────────────────────────────

  /**
   * Process a single spoken word. This is the main entry point.
   *
   * Flow:
   * 1. If the current word is already past the end → ignore
   * 2. Compare spoken word against current expected word
   * 3. If match → mark correct, advance
   * 4. If no match → check whether it's a REPEAT of a recently-confirmed
   *    word (scanning back up to MAX_LOOKBACK through a contiguous run of
   *    already-correct words) → ignore if so. This is checked before
   *    lookahead so that a repeated word can never be misread as a
   *    coincidental match with upcoming content.
   * 5. If not a repeat → lookahead up to MAX_LOOKAHEAD words:
   *    - If match found → mark intermediate words as missed, matched word as correct
   *    - If no match → mark current as incorrect, advance
   */
  processSpokenWord(spoken: string): ProcessResult {
    const spokenNorm = normalizeWord(spoken);

    // Ignore empty or whitespace-only
    if (!spokenNorm) {
      return {
        affectedIndices: [],
        action: 'ignored',
        newVerseStarted: false,
        previousVerseIndex: this.currentVerseIndex,
      };
    }

    // All words processed
    if (this.pointer >= this.states.length) {
      return {
        affectedIndices: [],
        action: 'ignored',
        newVerseStarted: false,
        previousVerseIndex: this.currentVerseIndex,
      };
    }

    const previousVerseIndex = this.currentVerseIndex;

    // --- Check if spoken word matches the CURRENT expected word ---
    const currentState = this.states[this.pointer];
    const currentMatch = matchWords(currentState.text, spoken);

    if (currentMatch.decision === 'correct') {
      return this.markCorrect(this.pointer, spoken, currentMatch, previousVerseIndex);
    }

    // --- Check for a repeat of a recently-confirmed word FIRST ---
    // STT engines — especially on mobile, where recognition sessions restart
    // far more often than on desktop — frequently re-emit the last word(s)
    // of an utterance right after a restart. Scanning only one word back
    // (the old behavior) misses repeats longer than a single word: once the
    // first repeated word slips past, the "previous word" reference point
    // shifts along with it and the check never catches up, which is what let
    // a repeated 2-word phrase corrupt every word after it. Checking a small
    // window here — before lookahead — means a repeat can never be
    // misinterpreted as a coincidental match with upcoming content either.
    if (this.matchesRecentWord(spoken)) {
      return {
        affectedIndices: [],
        action: 'repeated',
        newVerseStarted: false,
        previousVerseIndex,
      };
    }

    // --- Lookahead: check if spoken word matches a FUTURE expected word ---
    for (let offset = 1; offset <= MAX_LOOKAHEAD; offset++) {
      const futureIdx = this.pointer + offset;
      if (futureIdx >= this.states.length) break;

      const futureState = this.states[futureIdx];
      // Skip punctuation in lookahead
      if (futureState.isPunctuation) continue;

      const futureMatch = matchWords(futureState.text, spoken);
      if (futureMatch.decision === 'correct') {
        // Mark all words between pointer and futureIdx as missed
        const affected: number[] = [];
        for (let i = this.pointer; i < futureIdx; i++) {
          this.states[i].status = 'missed';
          affected.push(i);
        }
        // Mark the future word as correct
        this.states[futureIdx].status = 'correct';
        this.states[futureIdx].spokenWord = spoken;
        this.states[futureIdx].similarity = futureMatch.similarity;
        affected.push(futureIdx);

        this.pointer = futureIdx + 1;
        this.advanceToNextMeaningfulWord();

        return {
          affectedIndices: affected,
          action: 'skipped_ahead',
          newVerseStarted: this.currentVerseIndex !== previousVerseIndex,
          previousVerseIndex,
        };
      }
    }

    // --- No match found: mark current word as incorrect ---
    // But only if the match was clearly wrong (not uncertain)
    if (currentMatch.decision === 'incorrect') {
      this.states[this.pointer].status = 'incorrect';
      this.states[this.pointer].spokenWord = spoken;
      this.states[this.pointer].similarity = currentMatch.similarity;
      const affected = [this.pointer];

      this.pointer++;
      this.advanceToNextMeaningfulWord();

      return {
        affectedIndices: affected,
        action: 'incorrect',
        newVerseStarted: this.currentVerseIndex !== previousVerseIndex,
        previousVerseIndex,
      };
    }

    // Uncertain match — treat as incorrect but with the uncertain similarity
    this.states[this.pointer].status = 'incorrect';
    this.states[this.pointer].spokenWord = spoken;
    this.states[this.pointer].similarity = currentMatch.similarity;
    const affected = [this.pointer];

    this.pointer++;
    this.advanceToNextMeaningfulWord();

    return {
      affectedIndices: affected,
      action: 'incorrect',
      newVerseStarted: this.currentVerseIndex !== previousVerseIndex,
      previousVerseIndex,
    };
  }

  /** Manually skip the current word (mark as missed). */
  skipCurrentWord(): ProcessResult {
    if (this.pointer >= this.states.length) {
      return {
        affectedIndices: [],
        action: 'ignored',
        newVerseStarted: false,
        previousVerseIndex: this.currentVerseIndex,
      };
    }

    const previousVerseIndex = this.currentVerseIndex;
    this.states[this.pointer].status = 'missed';
    const affected = [this.pointer];

    this.pointer++;
    this.advanceToNextMeaningfulWord();

    return {
      affectedIndices: affected,
      action: 'skipped_ahead',
      newVerseStarted: this.currentVerseIndex !== previousVerseIndex,
      previousVerseIndex,
    };
  }

  /** Skip all remaining words in the current verse (mark as missed). */
  skipCurrentVerse(): ProcessResult {
    if (this.pointer >= this.states.length) {
      return {
        affectedIndices: [],
        action: 'ignored',
        newVerseStarted: false,
        previousVerseIndex: this.currentVerseIndex,
      };
    }

    const previousVerseIndex = this.currentVerseIndex;
    const affected: number[] = [];

    // Mark all remaining words in this verse as missed
    while (
      this.pointer < this.states.length &&
      this.states[this.pointer].verseIndex === previousVerseIndex
    ) {
      this.states[this.pointer].status = 'missed';
      affected.push(this.pointer);
      this.pointer++;
    }

    this.advanceToNextMeaningfulWord();

    return {
      affectedIndices: affected,
      action: 'skipped_ahead',
      newVerseStarted: this.pointer < this.states.length,
      previousVerseIndex,
    };
  }

  /** Get the full state array (read-only snapshot). */
  getStates(): readonly WordState[] {
    return this.states;
  }

  /** Get the current pointer index. */
  getCurrentIndex(): number {
    return this.pointer;
  }

  /** Get the verse index of the current word being listened to. */
  get currentVerseIndex(): number {
    if (this.pointer >= this.states.length) {
      return this.engine.totalVerses - 1;
    }
    return this.states[this.pointer].verseIndex;
  }

  /** Is the entire recitation complete? */
  get isComplete(): boolean {
    return this.pointer >= this.states.length;
  }

  /** Get word states for a specific verse. */
  getVerseStates(verseIndex: number): WordState[] {
    const boundary = this.engine.getVerseBoundary(verseIndex);
    if (!boundary) return [];
    return this.states.slice(boundary.startWordIndex, boundary.endWordIndex);
  }

  /** Reset to initial state. */
  reset(): void {
    this.pointer = 0;
    for (const state of this.states) {
      state.status = 'waiting';
      delete state.spokenWord;
      delete state.similarity;
    }
    this.advanceToNextMeaningfulWord();
  }

  // ─── Private Helpers ─────────────────────────────────────────────────

  /** Mark a word as correct and advance the pointer. */
  private markCorrect(
    index: number,
    spoken: string,
    match: MatchResult,
    previousVerseIndex: number
  ): ProcessResult {
    this.states[index].status = 'correct';
    this.states[index].spokenWord = spoken;
    this.states[index].similarity = match.similarity;

    this.pointer = index + 1;
    this.advanceToNextMeaningfulWord();

    return {
      affectedIndices: [index],
      action: 'matched',
      newVerseStarted: this.currentVerseIndex !== previousVerseIndex,
      previousVerseIndex,
    };
  }

  /**
   * Check whether `spoken` matches one of the last MAX_LOOKBACK
   * already-confirmed-correct words, scanning backward from the pointer
   * through a *contiguous* run of 'correct' words (punctuation is skipped
   * over, not counted as a break). Stops as soon as it hits a word that
   * isn't 'correct', since only a run of just-confirmed words represents
   * "things the user might still be finishing saying" — an arbitrary word
   * from much earlier in the recitation should never be treated as a repeat.
   */
  private matchesRecentWord(spoken: string): boolean {
    let checked = 0;
    let idx = this.pointer - 1;

    while (idx >= 0 && checked < MAX_LOOKBACK) {
      const pastState = this.states[idx];

      if (pastState.isPunctuation) {
        idx--;
        continue;
      }

      if (pastState.status !== 'correct') break;

      if (matchWords(pastState.text, spoken).decision === 'correct') {
        return true;
      }

      checked++;
      idx--;
    }

    return false;
  }

  /**
   * Advance the pointer past any punctuation-only tokens,
   * auto-marking them as correct (they require no speech).
   * Set the new pointer's word to "listening".
   */
  private advanceToNextMeaningfulWord(): void {
    // Auto-skip punctuation tokens
    while (
      this.pointer < this.states.length &&
      this.states[this.pointer].isPunctuation
    ) {
      this.states[this.pointer].status = 'correct';
      this.pointer++;
    }

    // Mark current word as "listening"
    if (this.pointer < this.states.length) {
      this.states[this.pointer].status = 'listening';
    }
  }
}