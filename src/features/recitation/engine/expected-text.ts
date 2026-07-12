/**
 * expected-text.ts — Module 3: Expected Text Engine
 *
 * Manages the flat queue of expected words across all verses.
 * Tokenizes verse texts, tracks verse boundaries, and provides
 * word-level access by index.
 */

import { normalizeWord, isPunctuation } from './normalizer';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ExpectedWord {
  /** Global index across all verses (0-based) */
  index: number;
  /** Original text with diacritics */
  original: string;
  /** Pre-normalized text for matching */
  normalized: string;
  /** Which verse this word belongs to (0-based) */
  verseIndex: number;
  /** Position within its own verse (0-based) */
  positionInVerse: number;
  /** Is this a punctuation-only token? */
  isPunctuation: boolean;
}

export interface VerseBoundary {
  /** Verse index (0-based) */
  verseIndex: number;
  /** Global word index where this verse starts (inclusive) */
  startWordIndex: number;
  /** Global word index where this verse ends (exclusive) */
  endWordIndex: number;
  /** Total real words (excluding punctuation) in this verse */
  wordCount: number;
  /** Original full verse text */
  originalText: string;
}

// ─── Expected Text Engine ────────────────────────────────────────────────────

export class ExpectedTextEngine {
  /** Flat list of all expected words across all verses */
  readonly words: ExpectedWord[];
  /** Verse boundary metadata */
  readonly verses: VerseBoundary[];
  /** Total number of meaningful words (excluding punctuation) */
  readonly totalMeaningfulWords: number;

  constructor(verseTexts: string[]) {
    this.words = [];
    this.verses = [];
    let globalIndex = 0;

    for (let v = 0; v < verseTexts.length; v++) {
      const text = verseTexts[v];
      const tokens = text.trim().split(/\s+/).filter(Boolean);
      const startIndex = globalIndex;
      let meaningfulCount = 0;

      for (let p = 0; p < tokens.length; p++) {
        const token = tokens[p];
        const norm = normalizeWord(token);
        const isPunc = isPunctuation(token);

        this.words.push({
          index: globalIndex,
          original: token,
          normalized: norm,
          verseIndex: v,
          positionInVerse: p,
          isPunctuation: isPunc,
        });

        if (!isPunc) {
          meaningfulCount++;
        }

        globalIndex++;
      }

      this.verses.push({
        verseIndex: v,
        startWordIndex: startIndex,
        endWordIndex: globalIndex,
        wordCount: meaningfulCount,
        originalText: text,
      });
    }

    this.totalMeaningfulWords = this.words.filter((w) => !w.isPunctuation).length;
  }

  /** Get the word at a specific global index, or null if out of range. */
  getWordAt(index: number): ExpectedWord | null {
    if (index < 0 || index >= this.words.length) return null;
    return this.words[index];
  }

  /** Get verse boundary info for a given verse index. */
  getVerseBoundary(verseIndex: number): VerseBoundary | null {
    if (verseIndex < 0 || verseIndex >= this.verses.length) return null;
    return this.verses[verseIndex];
  }

  /** Get the verse index that a given global word index belongs to. */
  getVerseForWord(wordIndex: number): number {
    const word = this.getWordAt(wordIndex);
    return word ? word.verseIndex : -1;
  }

  /** Get all words belonging to a specific verse. */
  getWordsForVerse(verseIndex: number): ExpectedWord[] {
    const boundary = this.getVerseBoundary(verseIndex);
    if (!boundary) return [];
    return this.words.slice(boundary.startWordIndex, boundary.endWordIndex);
  }

  /** Total number of word tokens (including punctuation). */
  get totalWords(): number {
    return this.words.length;
  }

  /** Total number of verses. */
  get totalVerses(): number {
    return this.verses.length;
  }
}
