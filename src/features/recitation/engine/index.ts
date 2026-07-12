/**
 * engine/index.ts — Re-exports for the recitation engine
 */

// Module 1: Arabic Normalizer
export {
  normalizeArabic,
  normalizeWord,
  normalizeForMatching,
  isPunctuation,
  areSimilarLetters,
  areWordsSimilar,
  SIMILARITY_GROUPS,
} from './normalizer';

// Module 2: Fuzzy Word Matcher
export {
  matchWords,
  isWordCorrect,
  CORRECT_THRESHOLD,
  UNCERTAIN_THRESHOLD,
} from './matcher';
export type { MatchResult, MatchDecision } from './matcher';

// Module 3: Expected Text Engine
export { ExpectedTextEngine } from './expected-text';
export type { ExpectedWord, VerseBoundary } from './expected-text';

// Module 4: State Machine
export { RecitationStateMachine } from './state-machine';
export type { WordState, WordStatus, ProcessResult } from './state-machine';

// Module 5: Evaluation Engine
export { computeStats, buildVerseResult, buildAllResults } from './evaluation';
export type { SessionStats } from './evaluation';

// Module 6: Speech Adapter
export { SpeechAdapter } from './speech-adapter';
export type { SpeechAdapterOptions } from './speech-adapter';

// Module 7: Orchestration Hook
export { useRecitationEngine } from './useRecitationEngine';
export type { RecitationEngine, RecitationEngineState, RecitationEngineActions } from './useRecitationEngine';
