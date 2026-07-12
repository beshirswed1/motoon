/**
 * evaluation.ts — Module 5: Evaluation Engine
 *
 * Computes aggregate scores from the state machine output.
 * Produces ComparisonResult objects compatible with the existing
 * SessionSummary component.
 */

import type { ComparisonResult, MatchedWord, ReplacedWord } from '@/types';
import type { WordState } from './state-machine';
import type { VerseBoundary } from './expected-text';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface SessionStats {
  totalWords: number;
  completed: number;
  correct: number;
  incorrect: number;
  missed: number;
  waiting: number;
  /** 0–100 overall accuracy */
  accuracy: number;
}

// ─── Evaluation Functions ────────────────────────────────────────────────────

/**
 * Count word states by status category.
 */
export function computeStats(states: readonly WordState[]): SessionStats {
  let correct = 0;
  let incorrect = 0;
  let missed = 0;
  let waiting = 0;
  let listening = 0;
  let totalMeaningful = 0;

  for (const state of states) {
    if (state.isPunctuation) continue;
    totalMeaningful++;

    switch (state.status) {
      case 'correct':
        correct++;
        break;
      case 'incorrect':
        incorrect++;
        break;
      case 'missed':
        missed++;
        break;
      case 'waiting':
        waiting++;
        break;
      case 'listening':
        listening++;
        break;
    }
  }

  const completed = correct + incorrect + missed;
  const accuracy =
    completed > 0 ? Math.round((correct / completed) * 100) : 0;

  return {
    totalWords: totalMeaningful,
    completed,
    correct,
    incorrect,
    missed,
    waiting: waiting + listening,
    accuracy,
  };
}

/**
 * Build a ComparisonResult for a specific verse from its word states.
 * Compatible with the existing SessionSummary component.
 *
 * @param verseStates - Word states belonging to this verse
 * @param verseBoundary - Verse boundary info
 * @param revealedCount - Number of words that were revealed (hint penalty)
 * @param isNotRead - Whether this verse was never reached
 */
export function buildVerseResult(
  verseStates: readonly WordState[],
  verseBoundary: VerseBoundary,
  revealedCount: number = 0,
  isNotRead: boolean = false
): ComparisonResult {
  if (isNotRead) {
    const expectedWords = verseBoundary.originalText
      .trim()
      .split(/\s+/)
      .filter(Boolean);
    return {
      accuracy: 0,
      matchedWords: [],
      missingWords: [],
      extraWords: [],
      replacedWords: [],
      reorderedWords: [],
      totalWords: expectedWords.length,
      correctWords: 0,
      isNotRead: true,
    };
  }

  const matchedWords: MatchedWord[] = [];
  const missingWords: string[] = [];
  const replacedWords: ReplacedWord[] = [];
  let totalMeaningful = 0;

  for (const state of verseStates) {
    if (state.isPunctuation) continue;
    totalMeaningful++;

    switch (state.status) {
      case 'correct':
        matchedWords.push({
          word: state.text,
          expectedIndex: state.positionInVerse,
          spokenIndex: state.positionInVerse, // 1:1 in word-by-word mode
        });
        break;

      case 'incorrect':
        replacedWords.push({
          expected: state.text,
          actual: state.spokenWord || '',
          expectedIndex: state.positionInVerse,
          spokenIndex: state.positionInVerse,
        });
        break;

      case 'missed':
        missingWords.push(state.text);
        break;

      // waiting/listening words are not yet evaluated
      default:
        break;
    }
  }

  const correctWords = matchedWords.length;

  // Raw accuracy from evaluated words
  const evaluated = correctWords + replacedWords.length + missingWords.length;
  let rawAccuracy = evaluated > 0 ? (correctWords / evaluated) * 100 : 0;

  // Apply penalty for revealed words
  if (revealedCount > 0 && totalMeaningful > 0) {
    const penalty = (revealedCount / totalMeaningful) * 100;
    rawAccuracy = Math.max(0, rawAccuracy - penalty);
  }

  const accuracy = Math.round(rawAccuracy);

  return {
    accuracy,
    matchedWords,
    missingWords,
    extraWords: [], // Word-by-word mode doesn't produce "extra" words
    replacedWords,
    reorderedWords: [], // No reordering in forward-only mode
    totalWords: totalMeaningful,
    correctWords,
  };
}

/**
 * Build ComparisonResults for ALL verses. Used when finishing a session.
 *
 * @param allStates - Complete state array
 * @param verseBoundaries - Verse boundaries from ExpectedTextEngine
 * @param currentPointerVerseIndex - The verse the user was on when stopping
 * @param revealedWords - Map of verseIndex → number of revealed words
 */
export function buildAllResults(
  allStates: readonly WordState[],
  verseBoundaries: readonly VerseBoundary[],
  currentPointerVerseIndex: number,
  revealedWords: Record<number, number> = {}
): Record<number, ComparisonResult> {
  const results: Record<number, ComparisonResult> = {};

  for (const boundary of verseBoundaries) {
    const v = boundary.verseIndex;
    const verseStates = allStates.slice(
      boundary.startWordIndex,
      boundary.endWordIndex
    );

    // Verses that were never reached are "not read"
    const isNotRead = v > currentPointerVerseIndex;

    // Verse currently being listened to: check if any words were evaluated
    const hasEvaluatedWords =
      !isNotRead &&
      verseStates.some(
        (s) =>
          !s.isPunctuation &&
          (s.status === 'correct' || s.status === 'incorrect' || s.status === 'missed')
      );

    // If current verse but nothing was evaluated, mark as not read
    const effectiveNotRead =
      isNotRead || (v === currentPointerVerseIndex && !hasEvaluatedWords);

    results[v] = buildVerseResult(
      verseStates,
      boundary,
      revealedWords[v] || 0,
      effectiveNotRead
    );
  }

  return results;
}
