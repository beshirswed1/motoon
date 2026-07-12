/**
 * matcher.ts — Module 2: Fuzzy Word Matching
 *
 * Weighted similarity algorithm tuned for Arabic speech recognition.
 * Uses a modified Levenshtein distance where substituting similar
 * Arabic letters costs less than substituting unrelated letters.
 */

import {
  normalizeWord,
  areWordsSimilar,
  areSimilarLetters,
} from './normalizer';

// ─── Configuration ───────────────────────────────────────────────────────────

/** Similarity ≥ this → word is correct */
export const CORRECT_THRESHOLD = 0.82;

/** Similarity ≥ this but < CORRECT_THRESHOLD → uncertain (needs context) */
export const UNCERTAIN_THRESHOLD = 0.55;

// ─── Types ───────────────────────────────────────────────────────────────────

export type MatchDecision = 'correct' | 'incorrect' | 'uncertain';

export interface MatchResult {
  /** 0.0 – 1.0 similarity score */
  similarity: number;
  /** 0.0 – 1.0 confidence in the decision */
  confidence: number;
  /** Final classification */
  decision: MatchDecision;
}

// ─── Weighted Edit Distance ──────────────────────────────────────────────────

/**
 * Cost of substituting character `a` with character `b`.
 * Similar Arabic letters get a reduced cost (0.3 instead of 1.0).
 */
function substitutionCost(a: string, b: string): number {
  if (a === b) return 0;
  if (areSimilarLetters(a, b)) return 0.3;
  return 1.0;
}

/**
 * Compute weighted edit distance between two normalized Arabic strings.
 *
 * Operations and their costs:
 * - Match: 0
 * - Substitution (unrelated letters): 1.0
 * - Substitution (similar letters): 0.3
 * - Insertion: 1.0
 * - Deletion: 1.0
 */
function weightedEditDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;

  // Use a single-row DP for memory efficiency
  const prev = new Float32Array(n + 1);
  const curr = new Float32Array(n + 1);

  for (let j = 0; j <= n; j++) {
    prev[j] = j; // deletion cost
  }

  for (let i = 1; i <= m; i++) {
    curr[0] = i; // insertion cost
    for (let j = 1; j <= n; j++) {
      const sub = prev[j - 1] + substitutionCost(a[i - 1], b[j - 1]);
      const del = prev[j] + 1.0;
      const ins = curr[j - 1] + 1.0;
      curr[j] = Math.min(sub, del, ins);
    }
    // Swap rows
    for (let j = 0; j <= n; j++) {
      prev[j] = curr[j];
    }
  }

  return prev[n];
}

// ─── Prefix / Conjunction Handling ───────────────────────────────────────────

const LEADING_PARTICLES_RE = /^[وفبلك]/;

/**
 * Strip a leading single-letter Arabic conjunction/preposition.
 * STT sometimes adds or drops these.
 */
function stripLeadingParticle(word: string): string {
  return word.replace(LEADING_PARTICLES_RE, '');
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Compare two Arabic words and return a structured match result.
 *
 * The algorithm:
 * 1. Exact match after normalization → 1.0
 * 2. Exact match after similarity-group normalization → 0.97
 * 3. Differ only by a leading conjunction → 0.95
 * 4. Weighted edit distance → scaled similarity
 *
 * The decision is based on configurable thresholds.
 */
export function matchWords(expected: string, spoken: string): MatchResult {
  const normExpected = normalizeWord(expected);
  const normSpoken = normalizeWord(spoken);

  // Edge: both empty
  if (normExpected.length === 0 && normSpoken.length === 0) {
    return { similarity: 1, confidence: 1, decision: 'correct' };
  }

  // Edge: one is empty
  if (normExpected.length === 0 || normSpoken.length === 0) {
    return { similarity: 0, confidence: 1, decision: 'incorrect' };
  }

  // 1. Exact match after basic normalization
  if (normExpected === normSpoken) {
    return { similarity: 1, confidence: 1, decision: 'correct' };
  }

  // 2. Exact match after similarity-group normalization
  if (areWordsSimilar(expected, spoken)) {
    return { similarity: 0.97, confidence: 0.95, decision: 'correct' };
  }

  // 3. Differ only by leading conjunction (و, ف, ب, ل, ك)
  const strippedExp = stripLeadingParticle(normExpected);
  const strippedSpk = stripLeadingParticle(normSpoken);
  if (strippedExp.length > 0 && strippedExp === strippedSpk) {
    return { similarity: 0.95, confidence: 0.9, decision: 'correct' };
  }

  // 4. Weighted edit distance
  const distance = weightedEditDistance(normExpected, normSpoken);
  const maxLen = Math.max(normExpected.length, normSpoken.length);
  const similarity = Math.max(0, 1 - distance / maxLen);

  // Boost: if distance ≤ 1 on words of 3+ chars, it's almost certainly correct
  if (maxLen >= 3 && distance <= 1) {
    return {
      similarity: Math.max(similarity, 0.93),
      confidence: 0.9,
      decision: 'correct',
    };
  }

  // Boost: if distance ≤ 2 on words of 5+ chars
  if (maxLen >= 5 && distance <= 2) {
    return {
      similarity: Math.max(similarity, 0.88),
      confidence: 0.85,
      decision: 'correct',
    };
  }

  // Classify based on thresholds
  let decision: MatchDecision;
  let confidence: number;

  if (similarity >= CORRECT_THRESHOLD) {
    decision = 'correct';
    confidence = 0.8 + (similarity - CORRECT_THRESHOLD) * 0.5;
  } else if (similarity >= UNCERTAIN_THRESHOLD) {
    decision = 'uncertain';
    confidence = 0.5;
  } else {
    decision = 'incorrect';
    confidence = 0.8 + (UNCERTAIN_THRESHOLD - similarity) * 0.3;
  }

  return {
    similarity: Math.round(similarity * 1000) / 1000,
    confidence: Math.min(1, Math.round(confidence * 100) / 100),
    decision,
  };
}

/**
 * Quick check: does this spoken word match the expected word?
 * Convenience wrapper that returns a boolean.
 */
export function isWordCorrect(expected: string, spoken: string): boolean {
  return matchWords(expected, spoken).decision === 'correct';
}
