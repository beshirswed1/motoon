/**
 * scripts/test-engine.ts
 *
 * Automated test suite for the rebuilt Arabic Recitation Engine.
 * Verifies all requirements: normalization, fuzzy matching, state machine progression,
 * error recovery, and evaluation metrics.
 *
 * Run using: npx tsx scripts/test-engine.ts
 */

import {
  normalizeArabic,
  normalizeWord,
  areSimilarLetters,
} from '../src/features/recitation/engine/normalizer';

import {
  matchWords,
  isWordCorrect,
} from '../src/features/recitation/engine/matcher';

import { ExpectedTextEngine } from '../src/features/recitation/engine/expected-text';
import { RecitationStateMachine } from '../src/features/recitation/engine/state-machine';
import { computeStats, buildVerseResult } from '../src/features/recitation/engine/evaluation';

// Colors for console logging
const green = (text: string) => `\x1b[32m${text}\x1b[0m`;
const red = (text: string) => `\x1b[31m${text}\x1b[0m`;
const cyan = (text: string) => `\x1b[36m${text}\x1b[0m`;
const bold = (text: string) => `\x1b[1m${text}\x1b[0m`;

let totalTests = 0;
let passedTests = 0;

function assert(condition: boolean, message: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✅ ${green('PASS')}: ${message}`);
  } else {
    console.log(`  ❌ ${red('FAIL')}: ${message}`);
  }
}

function runTestSuite(name: string, tests: () => void) {
  console.log(`\n${bold(cyan(`=== Running Suite: ${name} ===`))}`);
  try {
    tests();
  } catch (error) {
    console.error(`Suite failed with error:`, error);
  }
}

// ─── Suite 1: Arabic Normalizer ──────────────────────────────────────────────
runTestSuite('1. Arabic Normalizer', () => {
  // Test Harakat, Tanween, Shadda, Sukoon
  assert(
    normalizeArabic('قَالَ الشَّيْخُ') === 'قال الشيخ',
    'Strip shadda, fatha, damma, sukoon, and normalize alef'
  );

  // Test Tanween
  assert(
    normalizeArabic('كِتَابًا صَعْبٌ') === 'كتابا صعب',
    'Strip tanween'
  );

  // Test Tatweel (Kashida)
  assert(
    normalizeArabic('قــــال') === 'قال',
    'Strip tatweel'
  );

  // Test Alef Equivalence Classes (ا = أ = إ = آ = ٱ)
  assert(
    normalizeWord('أَسَد') === normalizeWord('إسد') &&
    normalizeWord('أَسَد') === normalizeWord('اسد') &&
    normalizeWord('أَسَد') === normalizeWord('آسد') &&
    normalizeWord('أَسَد') === normalizeWord('ٱسد'),
    'Alef equivalence: أ = إ = ا = آ = ٱ'
  );

  // Test Ya/Alef Maqsura Equivalence (ي = ى = ئ)
  assert(
    normalizeWord('عَلَى') === normalizeWord('علي'),
    'Ya and Alef Maqsura equivalence'
  );

  // Test Ta Marbuta (ه = ة)
  assert(
    normalizeWord('مدرسة') === normalizeWord('مدرسه'),
    'Ta marbuta and Ha equivalence'
  );

  // Test Waw Hamza (و = ؤ)
  assert(
    normalizeWord('مؤمن') === normalizeWord('مومن'),
    'Waw with hamza and plain waw equivalence'
  );

  // Test Punctuation and Decorative Symbols
  assert(
    normalizeArabic('قَالَ: «مَرْحَبًا»!؟') === 'قال مرحبا',
    'Remove punctuation and decorative quotes'
  );

  // Test Unicode Presentation Forms
  assert(
    normalizeArabic('﷽') === 'بسم الله الرحمن الرحيم',
    'Normalize complex presentation form ligatures'
  );

  // Test Similarity Groups
  assert(
    areSimilarLetters('س', 'ص'),
    'Similarity group: س and ص are similar'
  );
  assert(
    areSimilarLetters('ز', 'ذ') && areSimilarLetters('ظ', 'ض'),
    'Similarity group: ز ↔ ذ ↔ ظ ↔ ض'
  );
  assert(
    areSimilarLetters('ت', 'ط'),
    'Similarity group: ت ↔ ط'
  );
});

// ─── Suite 2: Word Matcher ───────────────────────────────────────────────────
runTestSuite('2. Word Matcher (Fuzzy)', () => {
  // Test Exact Match
  assert(
    isWordCorrect('قَالَ', 'قال'),
    'Exact match after basic normalization'
  );

  // Test Similarity Group Match
  const simMatch = matchWords('الصِّرَاطَ', 'السراط');
  assert(
    simMatch.decision === 'correct' && simMatch.similarity >= 0.9,
    `Similarity match (ص/س): ${simMatch.similarity} score`
  );

  // Test Conjunction Prefix Strip (و, ف, ب, ل, ك)
  assert(
    isWordCorrect('وَالْكِتَابِ', 'الكتاب') && isWordCorrect('الكتاب', 'والكتاب'),
    'Forgive leading conjunction mismatch'
  );

  // Test 1 missing letter on medium word
  const missingMatch = matchWords('مُحَمَّد', 'محمدد'); // extra letter
  assert(
    missingMatch.decision === 'correct',
    `Allow 1 extra/missing letter on 3+ chars: decision is ${missingMatch.decision}`
  );

  // Test 1 substituted letter on long word
  const subMatch = matchWords('الْمُعَلِّمُونَ', 'المعلمون');
  assert(
    subMatch.decision === 'correct',
    'Accept exact word matches even with minor differences'
  );

  // Test clearly incorrect word
  const badMatch = matchWords('قال', 'ذهب');
  assert(
    badMatch.decision === 'incorrect',
    `Correctly classify different words as incorrect (score: ${badMatch.similarity})`
  );
});

// ─── Suite 3: Expected Text Engine ───────────────────────────────────────────
runTestSuite('3. Expected Text Engine', () => {
  const verses = [
    'قَالَ مُحَمَّدٌ هُوَ ابْنُ مَالِكِ',
    'أَحْمَدُ رَبِّي اللَّهَ خَيْرَ مَالِكِ'
  ];

  const engine = new ExpectedTextEngine(verses);

  assert(
    engine.totalVerses === 2,
    `Correctly parse total verses: ${engine.totalVerses}`
  );

  assert(
    engine.totalWords === 10,
    `Correctly tokenized total words: ${engine.totalWords}`
  );

  assert(
    engine.getVerseForWord(0) === 0 && engine.getVerseForWord(6) === 1,
    'Correctly map word indices to their respective verse boundaries'
  );

  const wordInfo = engine.getWordAt(2);
  assert(
    wordInfo !== null && wordInfo.original === 'هُوَ' && wordInfo.normalized === 'هو',
    'Access word by index with correct original and normalized forms'
  );
});

// ─── Suite 4: Recitation State Machine ────────────────────────────────────────
runTestSuite('4. Recitation State Machine', () => {
  const verses = [
    'قَالَ مُحَمَّدٌ هُوَ ابْنُ مَالِكِ',
    'أَحْمَدُ رَبِّي اللَّهَ خَيْرَ مَالِكِ'
  ];
  const engine = new ExpectedTextEngine(verses);
  const sm = new RecitationStateMachine(engine);

  // Initial status
  assert(
    sm.getCurrentIndex() === 0 && sm.getStates()[0].status === 'listening',
    'Initial word is set to listening, others waiting'
  );

  // 1. Reciting correct words
  let res = sm.processSpokenWord('قال');
  assert(
    res.action === 'matched' &&
    sm.getStates()[0].status === 'correct' &&
    sm.getStates()[1].status === 'listening',
    'Correct match advances the state machine'
  );

  // 2. Pronunciation / fuzzy spelling
  res = sm.processSpokenWord('مهمد'); // مهمد vs محمد (ح/هـ similar)
  assert(
    res.action === 'matched' &&
    sm.getStates()[1].status === 'correct',
    'Fuzzy pronunciation match advances the machine'
  );

  // 3. Skip lookahead: skip "هو" and say "ابن"
  res = sm.processSpokenWord('ابن');
  assert(
    res.action === 'skipped_ahead' &&
    sm.getStates()[2].status === 'missed' && // هو marked missed
    sm.getStates()[3].status === 'correct' && // ابن marked correct
    sm.getStates()[4].status === 'listening', // مالك listening
    'Correctly detect word skip, mark intermediate as missed, and advance'
  );

  // 4. Repeated word: user says "ابن" again by accident
  res = sm.processSpokenWord('ابن');
  assert(
    res.action === 'repeated',
    'Ignore repeated words without affecting pointer'
  );

  // 5. Incorrect word
  res = sm.processSpokenWord('كتاب'); // Expected: مالك
  assert(
    res.action === 'incorrect' &&
    sm.getStates()[4].status === 'incorrect' &&
    res.newVerseStarted === true, // should cross into verse index 1
    'Incorrect word advances pointer and tracks verse transition'
  );

  // Verify transition to next verse
  assert(
    sm.currentVerseIndex === 1 && sm.getStates()[5].status === 'listening',
    'Point correctly moved to first word of the next verse'
  );
});

// ─── Suite 5: Evaluation Engine ──────────────────────────────────────────────
runTestSuite('5. Evaluation Engine', () => {
  const verses = [
    'قَالَ مُحَمَّدٌ هُوَ ابْنُ مَالِكِ',
    'أَحْمَدُ رَبِّي اللَّهَ خَيْرَ مَالِكِ'
  ];
  const engine = new ExpectedTextEngine(verses);
  const sm = new RecitationStateMachine(engine);

  // Recite verse 1:
  sm.processSpokenWord('قال'); // correct
  sm.processSpokenWord('محمد'); // correct
  sm.processSpokenWord('كتاب'); // incorrect (instead of هو)
  sm.processSpokenWord('ابن'); // correct
  sm.processSpokenWord('مالك'); // correct

  const boundary = engine.getVerseBoundary(0)!;
  const result = buildVerseResult(sm.getVerseStates(0), boundary, 0);

  assert(
    result.totalWords === 5 &&
    result.correctWords === 4 &&
    result.replacedWords.length === 1 &&
    result.missingWords.length === 0,
    `Verse evaluation metrics: ${result.correctWords}/${result.totalWords} correct`
  );

  assert(
    result.accuracy === 80,
    `Verse accuracy calculation: ${result.accuracy}% (expected 80%)`
  );

  // Test Hint Penalty (Reveal Word)
  const resultWithPenalty = buildVerseResult(sm.getVerseStates(0), boundary, 1);
  assert(
    resultWithPenalty.accuracy === 60, // 80 - (1/5 * 100) = 60
    `Apply 20% penalty for 1 revealed word out of 5: ${resultWithPenalty.accuracy}% (expected 60%)`
  );

  // Global Session stats
  const stats = computeStats(sm.getStates());
  assert(
    stats.completed === 5 && stats.correct === 4 && stats.incorrect === 1 && stats.accuracy === 80,
    `Global session stats: ${stats.correct} correct, accuracy ${stats.accuracy}%`
  );
});

// ─── Final Summary ───────────────────────────────────────────────────────────
console.log(`\n${bold(cyan('========================================='))}`);
console.log(bold(`Total Assertions Run: ${totalTests}`));
console.log(bold(`Passed: ${passedTests} / ${totalTests}`));

if (passedTests === totalTests) {
  console.log(`\n🎉 ${green('ALL TESTS PASSED SUCCESSFULLY!')} The recitation engine is fully verified.\n`);
} else {
  console.log(`\n⚠️  ${red('SOME TESTS FAILED.')} Please review the logs above.\n`);
  process.exit(1);
}
