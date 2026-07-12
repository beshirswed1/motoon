/**
 * normalizer.ts — Module 1: Arabic Text Normalization
 *
 * Pure functions for normalizing Arabic text before comparison.
 * Handles diacritics removal, letter equivalence classes,
 * and configurable phonetic similarity groups.
 */

// ─── Configurable Similarity Groups ──────────────────────────────────────────
// Each group maps letters that sound similar in spoken Arabic.
// STT engines frequently confuse letters within the same group.
// These are ENABLED by default. Set a group to an empty array to disable it.

export const SIMILARITY_GROUPS: Record<string, string[]> = {
  emphatic_s: ['س', 'ص'],
  emphatic_z: ['ز', 'ذ', 'ظ', 'ض'],
  emphatic_t: ['ت', 'ط'],
  emphatic_d: ['د', 'ض'],
  th_s: ['ث', 'س'],
  q_k: ['ق', 'ك'],
  h_ha: ['ح', 'ه'],
  ain_hamza: ['ع', 'ا'],
};

/**
 * Check if two individual Arabic letters are considered similar
 * according to the configured similarity groups.
 * Handles overlapping groups correctly.
 */
export function areSimilarLetters(a: string, b: string): boolean {
  if (a === b) return true;
  for (const group of Object.values(SIMILARITY_GROUPS)) {
    if (group.includes(a) && group.includes(b)) {
      return true;
    }
  }
  return false;
}

/**
 * Check if two normalized words are similar based on character-by-character
 * comparison using similarity groups.
 */
export function areWordsSimilar(w1: string, w2: string): boolean {
  const norm1 = normalizeWord(w1);
  const norm2 = normalizeWord(w2);
  if (norm1.length !== norm2.length) return false;
  for (let i = 0; i < norm1.length; i++) {
    if (!areSimilarLetters(norm1[i], norm2[i])) return false;
  }
  return true;
}

// ─── Core Normalization ──────────────────────────────────────────────────────

// Unicode ranges for Arabic diacritics, marks, and decorative characters
const DIACRITICS_RE = /[\u064B-\u065F\u0670]/g; // Fathatan..Waslah + superscript alef
const QURANIC_MARKS_RE = /[\u0615-\u061A\u06D6-\u06ED]/g; // Quranic waqf/sajda marks
const TATWEEL_RE = /\u0640/g;
const PRESENTATION_FORMS_RE = /[\uFB50-\uFDFF\uFE70-\uFEFF]/g; // Arabic presentation forms
const INVISIBLE_RE = /[\u200B-\u200F\u202A-\u202E\uFEFF\u00AD]/g; // ZWJ, ZWNJ, BOM, etc.
const PUNCTUATION_RE = /[.,\/#!$%\^&\*;:{}=\-_`~()\[\]؟?،؛"'«»۝۞⁕•·⸱‧⁞…\u06DD\u06DE]/g;
const SPACES_RE = /\s+/g;

/**
 * Normalize an Arabic text string for comparison.
 *
 * 1. Remove Quranic marks (waqf, sajda, manzil, etc.)
 * 2. Remove all diacritics (harakat, tanween, shadda, sukoon)
 * 3. Remove tatweel (kashida)
 * 4. Normalize letter equivalence classes (alef, ya, ta marbuta, hamza)
 * 5. Remove punctuation and invisible characters
 * 6. Collapse whitespace
 *
 * Does NOT apply similarity groups — that happens during matching.
 */
export function normalizeArabic(text: string): string {
  if (!text) return '';

  return (
    text
      // 0. Explicitly expand Bismillah ligature (﷽)
      .replace(/\uFDFD/g, 'بسم الله الرحمن الرحيم')
      // 1. Remove Quranic marks
      .replace(QURANIC_MARKS_RE, '')
      // 2. Remove diacritics
      .replace(DIACRITICS_RE, '')
      // 3. Remove tatweel
      .replace(TATWEEL_RE, '')
      // 4a. Normalize alef variants → bare alef
      .replace(/[\u0622\u0623\u0625\u0671\u0672\u0673\u0675]/g, '\u0627')
      // 4b. Remove standalone hamza (ء)
      .replace(/\u0621/g, '')
      // 4c. Normalize alef maqsura → ya
      .replace(/\u0649/g, '\u064A')
      // 4d. Normalize ta marbuta → ha
      .replace(/\u0629/g, '\u0647')
      // 4e. Normalize waw with hamza → plain waw
      .replace(/\u0624/g, '\u0648')
      // 4f. Normalize ya with hamza → plain ya
      .replace(/\u0626/g, '\u064A')
      // 5. Replace presentation forms with their base characters
      .replace(PRESENTATION_FORMS_RE, (ch) => {
        // Map presentation forms to their base form via normalization
        return ch.normalize('NFKD').replace(DIACRITICS_RE, '');
      })
      // 6. Remove invisible characters
      .replace(INVISIBLE_RE, '')
      // 7. Remove punctuation
      .replace(PUNCTUATION_RE, '')
      // 8. Collapse whitespace
      .replace(SPACES_RE, ' ')
      .trim()
  );
}

/**
 * Normalize a single word. Same as normalizeArabic but
 * also strips any remaining whitespace (should be none).
 */
export function normalizeWord(word: string): string {
  return normalizeArabic(word).replace(/\s/g, '');
}

/**
 * Apply similarity-group normalization on top of basic normalization.
 * Kept for compatibility.
 */
export function normalizeForMatching(word: string): string {
  return normalizeWord(word);
}

/**
 * Check if a word token is pure punctuation / empty after normalization.
 */
export function isPunctuation(word: string): boolean {
  return normalizeWord(word).length === 0;
}
