/**
 * Core Arabic Text Processing Utilities
 * These functions are pure, fast, and have no side effects.
 * 
 * Unicode ranges reference:
 * - Tashkeel: U+0610 to U+061A, U+064B to U+065F, U+0670
 * - Tatweel: U+0640
 * - Alef variants: U+0622 (آ), U+0623 (أ), U+0625 (إ), U+0671 (ٱ) -> U+0627 (ا)
 * - Hamza variants: U+0624 (ؤ), U+0626 (ئ) -> U+0621 (ء)
 */

/**
 * Removes Tashkeel (diacritics) from Arabic text
 * Matches Unicode ranges U+0610-U+061A, U+064B-U+065F, U+0670
 */
export function removeTaskheel(text: string): string {
  if (!text) return '';
  return text.replace(/[\u0610-\u061A\u064B-\u065F\u0670]/g, '');
}

/**
 * Removes Tatweel (Kashida) from Arabic text
 * Matches U+0640 (ـ)
 */
export function removeTatweel(text: string): string {
  if (!text) return '';
  return text.replace(/\u0640/g, '');
}

/**
 * Normalizes different forms of Alef (آ, أ, إ, ٱ) to a plain Alef (ا)
 * Matches U+0622, U+0623, U+0625, U+0671 -> U+0627
 */
export function normalizeAlef(text: string): string {
  if (!text) return '';
  return text.replace(/[\u0622\u0623\u0625\u0671]/g, '\u0627');
}

/**
 * Normalizes carrier-based Hamzas (ؤ, ئ) to a standalone Hamza (ء)
 * Matches U+0624, U+0626 -> U+0621
 */
export function normalizeHamza(text: string): string {
  if (!text) return '';
  return text.replace(/[\u0624\u0626]/g, '\u0621');
}

/**
 * Performs full normalization of Arabic text:
 * 1. Trims leading/trailing whitespace
 * 2. Removes Tashkeel
 * 3. Removes Tatweel
 * 4. Normalizes Alef variants
 * 5. Normalizes Hamza variants
 * 6. Collapses multiple spaces into a single space
 * 
 * Note: Does NOT remove/normalize ة (Teh Marbuta) or ى (Alef Maqsura).
 */
export function normalizeArabicText(text: string): string {
  if (!text) return '';
  
  let normalized = text.trim();
  normalized = removeTaskheel(normalized);
  normalized = removeTatweel(normalized);
  normalized = normalizeAlef(normalized);
  normalized = normalizeHamza(normalized);
  
  // Collapse multiple spaces into a single space
  return normalized.replace(/\s+/g, ' ');
}

/**
 * Runs inline tests to verify the correctness of the normalization utility.
 */
export function runInlineTests(): void {
  console.log('Running inline tests for normalizeArabic...');

  const tests = [
    {
      input: 'الحَمْدُ لِلَّهِ',
      expected: 'الحمد لله',
      func: normalizeArabicText,
      name: 'normalizeArabicText - Alhmdulillah',
    },
    {
      input: 'أَبِي',
      expected: 'ابي',
      func: normalizeArabicText,
      name: 'normalizeArabicText - Abi',
    },
    {
      input: '  كثير   ',
      expected: 'كثير',
      func: normalizeArabicText,
      name: 'normalizeArabicText - Whitespace Trim',
    },
    {
      input: 'فتاة سعى',
      expected: 'فتاة سعى',
      func: normalizeArabicText,
      name: 'normalizeArabicText - Retains Teh Marbuta and Alef Maqsura',
    },
    {
      input: 'كـتـاب',
      expected: 'كتاب',
      func: (t: string) => removeTatweel(t),
      name: 'removeTatweel - Kitab',
    },
    {
      input: 'مؤمن شئت',
      expected: 'مءمن شءت',
      func: (t: string) => normalizeHamza(t),
      name: 'normalizeHamza - Mu\'min/Shi\'t',
    },
  ];

  let passedCount = 0;
  for (const t of tests) {
    const actual = t.func(t.input);
    if (actual === t.expected) {
      passedCount++;
      console.log(`[PASS] ${t.name}`);
    } else {
      console.error(`[FAIL] ${t.name}: Expected "${t.expected}", got "${actual}"`);
    }
  }

  console.log(`Summary: ${passedCount}/${tests.length} tests passed.`);
}

// Automatically run tests if this script is executed directly in Node
if (typeof require !== 'undefined' && require.main === module) {
  runInlineTests();
}
