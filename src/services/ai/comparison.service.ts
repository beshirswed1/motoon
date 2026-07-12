/**
 * comparison.service.ts
 * Text comparison service for Quranic/Matn recitation evaluation.
 * Implements Longest Common Subsequence (LCS) algorithm for word-level Arabic comparison.
 */

import type { RecitationError, MatchedWord, ReplacedWord, ComparisonResult } from '@/types';
import stringSimilarity from 'string-similarity';

/**
 * Normalizes Arabic text by removing diacritics (tashkeel),
 * tatweel, Quranic special characters/waqf symbols, punctuation,
 * and normalizing letters (alef, ya, ta marbuta).
 */
export function normalizeArabicText(text: string): string {
  if (!text) return '';
  return text
    // Remove Quranic waqf marks and other special Quranic symbols
    .replace(/[\u0615-\u061A\u06D6-\u06ED]/g, '')
    // Remove tashkeel (diacritics)
    .replace(/[\u064B-\u065F\u0670]/g, '')
    // Remove tatweel
    .replace(/\u0640/g, '')
    // Normalize alef variants to plain alef
    .replace(/[\u0622\u0623\u0625\u0671\u0672\u0673]/g, '\u0627')
    // Remove standalone hamza completely to avoid mis-recognition
    .replace(/\u0621/g, '')
    // Normalize ya variants (alif maqsurah and yaa)
    .replace(/[\u0649\u064A]/g, '\u064A')
    // Normalize ta marbuta and ha
    .replace(/[\u0629\u0647]/g, '\u0647')
    // Normalize waw with hamza to plain waw
    .replace(/\u0624/g, '\u0648')
    // Normalize ya with hamza to plain ya
    .replace(/\u0626/g, '\u064A')
    // Phonetic mapping for common voice recognition errors (Levantine/Egyptian)
    .replace(/\u0630/g, '\u062F') // thal -> dal
    .replace(/\u062B/g, '\u062A') // tha -> ta
    .replace(/\u0638/g, '\u0632') // dha -> za
    // Remove English and Arabic punctuation
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()؟?،؛"'«»]/g, '')
    // Remove Zero-Width and invisible formatting characters
    .replace(/[\u200B-\u200F\u202A-\u202E\uFEFF]/g, '')
    // Replace multiple spaces with a single space
    .replace(/\s+/g, ' ')
    // Trim whitespace
    .trim();
}

function getEditDistance(a: string, b: string): number {
  const matrix: number[][] = [];
  for (let i = 0; i <= a.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= b.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      if (a[i - 1] === b[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }
  return matrix[a.length][b.length];
}

/**
 * compareWords — compares two Arabic words with normalization.
 * Returns similarity score 0-1 using a robust hybrid approach (exact, prefix-strip, edit-distance, and bigram fallback).
 */
export function compareWords(expected: string, actual: string): number {
  // تنظيف الكلمتين قبل المقارنة (إزالة التشكيل، توحيد الألف والتاء المربوطة)
  const normExpected = normalizeArabicText(expected);
  const normActual = normalizeArabicText(actual);

  if (normExpected === normActual) return 1;

  if (normExpected.length === 0 || normActual.length === 0) return 0;

  // 1. Check if they differ only by a leading conjunction/preposition (و, ف, ب, ل, ك)
  const stripLeading = (s: string) => s.replace(/^[وفبلك]/, '');
  if (stripLeading(normExpected) === stripLeading(normActual)) {
    return 0.97;
  }

  const maxLen = Math.max(normExpected.length, normActual.length);
  const distance = getEditDistance(normExpected, normActual);

  // 2. Edit distance heuristics — very forgiving for Arabic STT errors
  // 1-char difference on words >= 3 chars → treat as correct
  if (maxLen >= 3 && distance === 1) {
    return 0.95;
  }

  // 2-char difference on words >= 5 chars → treat as correct
  if (maxLen >= 5 && distance <= 2) {
    return 0.90;
  }

  // 3-char difference on long words >= 8 chars → still acceptable
  if (maxLen >= 8 && distance <= 3) {
    return 0.85;
  }

  // Use string-similarity as fallback
  return stringSimilarity.compareTwoStrings(normExpected, normActual);
}


/**
 * RecitationComparisonEngine
 * Implements pure LCS-based Arabic word comparison.
 */
export class RecitationComparisonEngine {
  static compare(expectedText: string, spokenText: string): ComparisonResult {
    const expectedWords = expectedText.trim().split(/\s+/).filter(Boolean);
    const spokenWords = spokenText.trim().split(/\s+/).filter(Boolean);

    const m = expectedWords.length;
    const n = spokenWords.length;

    // Handle edge cases
    if (m === 0) {
      return {
        accuracy: 0,
        matchedWords: [],
        missingWords: [],
        extraWords: spokenWords,
        replacedWords: [],
        reorderedWords: [],
        totalWords: 0,
        correctWords: 0,
      };
    }

    if (n === 0) {
      return {
        accuracy: 0,
        matchedWords: [],
        missingWords: expectedWords,
        extraWords: [],
        replacedWords: [],
        reorderedWords: [],
        totalWords: m,
        correctWords: 0,
      };
    }

    // DP table for LCS
    const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

    for (let i = 1; i <= m; i++) {
      const expNorm = normalizeArabicText(expectedWords[i - 1]);
      for (let j = 1; j <= n; j++) {
        const spkNorm = normalizeArabicText(spokenWords[j - 1]);
        if (expNorm === spkNorm) {
          dp[i][j] = dp[i - 1][j - 1] + 1;
        } else {
          dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
        }
      }
    }

    // Backtrack to find LCS matched indices
    let i = m;
    let j = n;
    const matches: { expectedIndex: number; spokenIndex: number }[] = [];

    while (i > 0 && j > 0) {
      const expNorm = normalizeArabicText(expectedWords[i - 1]);
      const spkNorm = normalizeArabicText(spokenWords[j - 1]);
      if (expNorm === spkNorm) {
        matches.push({ expectedIndex: i - 1, spokenIndex: j - 1 });
        i--;
        j--;
      } else if (dp[i - 1][j] >= dp[i][j - 1]) {
        i--;
      } else {
        j--;
      }
    }
    matches.reverse();

    const matchedExpected = new Set(matches.map((match) => match.expectedIndex));
    const matchedSpoken = new Set(matches.map((match) => match.spokenIndex));

    const reorderedExpected = new Set<number>();
    const reorderedSpoken = new Set<number>();
    const reorderedWords: string[] = [];

    // Identify reordered words (matched but out of sequence, i.e. not in LCS)
    for (let x = 0; x < m; x++) {
      if (matchedExpected.has(x)) continue;
      const expNorm = normalizeArabicText(expectedWords[x]);
      for (let y = 0; y < n; y++) {
        if (matchedSpoken.has(y) || reorderedSpoken.has(y)) continue;
        const spkNorm = normalizeArabicText(spokenWords[y]);
        if (expNorm === spkNorm) {
          reorderedExpected.add(x);
          reorderedSpoken.add(y);
          reorderedWords.push(expectedWords[x]);
          break;
        }
      }
    }

    // Remaining unmatched indices after filtering reordered ones
    const remainingExpected = Array.from({ length: m }, (_, index) => index).filter(
      (index) => !matchedExpected.has(index) && !reorderedExpected.has(index)
    );
    const remainingSpoken = Array.from({ length: n }, (_, index) => index).filter(
      (index) => !matchedSpoken.has(index) && !reorderedSpoken.has(index)
    );

    const missingWords: string[] = [];
    const extraWords: string[] = [];
    const replacedWords: ReplacedWord[] = [];

    // Group unmatched elements into intervals defined by LCS matches
    const numMatches = matches.length;
    for (let k = 0; k <= numMatches; k++) {
      const startE = k === 0 ? 0 : matches[k - 1].expectedIndex + 1;
      const endE = k === numMatches ? m : matches[k].expectedIndex;

      const startS = k === 0 ? 0 : matches[k - 1].spokenIndex + 1;
      const endS = k === numMatches ? n : matches[k].spokenIndex;

      const segmentExp = remainingExpected.filter((x) => x >= startE && x < endE);
      const segmentSpk = remainingSpoken.filter((y) => y >= startS && y < endS);

      const minLen = Math.min(segmentExp.length, segmentSpk.length);
      for (let r = 0; r < minLen; r++) {
        replacedWords.push({
          expected: expectedWords[segmentExp[r]],
          actual: spokenWords[segmentSpk[r]],
          expectedIndex: segmentExp[r],
          spokenIndex: segmentSpk[r],
        });
      }

      for (let r = minLen; r < segmentExp.length; r++) {
        missingWords.push(expectedWords[segmentExp[r]]);
      }

      for (let r = minLen; r < segmentSpk.length; r++) {
        extraWords.push(spokenWords[segmentSpk[r]]);
      }
    }

    const matchedWords: MatchedWord[] = matches.map((match) => ({
      word: expectedWords[match.expectedIndex],
      expectedIndex: match.expectedIndex,
      spokenIndex: match.spokenIndex,
    }));

    const totalWords = m;
    const correctWords = matchedWords.length;

    // Calculate accuracy percentage (0-100)
    const rawAccuracy = (correctWords / totalWords) * 100;
    // Deduct for extra words (0.5 each) and reordered words (0.2 each)
    const penalty = ((extraWords.length * 0.5 + reorderedWords.length * 0.2) / totalWords) * 100;
    const accuracy = Math.max(0, Math.min(100, Math.round(rawAccuracy - penalty)));

    return {
      accuracy,
      matchedWords,
      missingWords,
      extraWords,
      replacedWords,
      reorderedWords,
      totalWords,
      correctWords,
    };
  }
}

/**
 * compareRecitation — full word-level diff between expected and spoken text.
 * Legacy wrapper to keep other parts of code working.
 */
export function compareRecitation(
  _verseId: string,
  expectedText: string,
  spokenText: string
): RecitationError[] {
  const result = RecitationComparisonEngine.compare(expectedText, spokenText);
  const errors: RecitationError[] = [];

  // Map missing words to RecitationError
  result.missingWords.forEach((word) => {
    errors.push({
      type: 'memorization',
      position: expectedText.split(/\s+/).indexOf(word),
      expected: word,
      actual: '',
    });
  });

  // Map replaced words to RecitationError
  result.replacedWords.forEach((rep) => {
    errors.push({
      type: 'word',
      position: rep.expectedIndex,
      expected: rep.expected,
      actual: rep.actual,
    });
  });

  return errors;
}

/**
 * calculateSimilarityScore — legacy wrapper returning 0-100 score.
 */
export function calculateSimilarityScore(
  expectedText: string,
  spokenText: string
): number {
  const result = RecitationComparisonEngine.compare(expectedText, spokenText);
  return result.accuracy;
}

/**
 * filterSpokenDuplicates — removes consecutive duplicate/near-duplicate words
 * that STT engines (especially on mobile) tend to produce.
 * e.g. "هذه هذه هذه الأولى" → "هذه الأولى"
 */
export function filterSpokenDuplicates(text: string): string {
  if (!text) return '';
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length <= 1) return text.trim();

  const filtered: string[] = [words[0]];
  for (let i = 1; i < words.length; i++) {
    const prev = normalizeArabicText(filtered[filtered.length - 1]);
    const curr = normalizeArabicText(words[i]);
    // Skip if identical or very similar to the previous kept word
    if (prev === curr) continue;
    if (prev.length > 0 && curr.length > 0) {
      const dist = getEditDistance(prev, curr);
      const maxLen = Math.max(prev.length, curr.length);
      // If only 1 char different on a word of 3+ chars, it's a duplicate
      if (maxLen >= 3 && dist <= 1) continue;
    }
    filtered.push(words[i]);
  }
  return filtered.join(' ');
}
