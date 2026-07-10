/**
 * Arabic text normalization utility
 * Handles hamza variants, tashkeel, ta-marbuta, alef-maqsura,
 * and enables fuzzy/partial matching for Arabic text search.
 */

/**
 * Normalize Arabic text for search comparison:
 * - Removes tashkeel (diacritics)
 * - Normalizes hamza variants (أ إ آ ٱ) → ا
 * - Normalizes ta-marbuta (ة) → ه
 * - Normalizes alef-maqsura (ى) → ي
 * - Normalizes waw-hamza (ؤ) → و
 * - Normalizes ya-hamza (ئ) → ي
 * - Trims and collapses whitespace
 */
export function normalizeArabic(text: string): string {
  if (!text) return '';
  
  return text
    // Remove tashkeel (Arabic diacritics)
    .replace(/[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06DC\u06DF-\u06E4\u06E7\u06E8\u06EA-\u06ED]/g, '')
    // Normalize alef variants → ا
    .replace(/[أإآٱ]/g, 'ا')
    // Normalize waw-hamza → و
    .replace(/ؤ/g, 'و')
    // Normalize ya-hamza → ي
    .replace(/ئ/g, 'ي')
    // Normalize ta-marbuta → ه
    .replace(/ة/g, 'ه')
    // Normalize alef-maqsura → ي
    .replace(/ى/g, 'ي')
    // Remove tatweel (kashida)
    .replace(/ـ/g, '')
    // Collapse whitespace
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Check if a text matches a search query using fuzzy Arabic matching.
 * Supports partial matching — any word from the query appearing in the text counts.
 * 
 * Example: query "الاطفال" matches title "تحفة الأطفال"
 */
export function arabicSearchMatch(text: string, query: string): boolean {
  if (!query || !text) return !query; // empty query matches everything
  
  const normalizedText = normalizeArabic(text).toLowerCase();
  const normalizedQuery = normalizeArabic(query).toLowerCase();
  
  // Direct inclusion check
  if (normalizedText.includes(normalizedQuery)) return true;
  
  // Word-level partial match: check if any query word exists in the text
  const queryWords = normalizedQuery.split(' ').filter(w => w.length > 0);
  
  // If all words from the query are found somewhere in the text
  return queryWords.every(word => normalizedText.includes(word));
}
