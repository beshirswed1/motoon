import { Timestamp } from 'firebase/firestore';

export interface RecitationError {
  type: 'word' | 'grammar' | 'haraka' | 'memorization';
  position: number; // Index or word position
  expected: string;
  actual: string;
}

export interface RecitationSession {
  id: string;
  userId: string;
  bookId: string;
  verseId: string;
  audioUrl?: string;
  durationSeconds: number;
  score: number;
  errors: RecitationError[];
  
  createdAt: Timestamp;
  updatedAt: Timestamp;
  isDeleted: boolean;
  deletedAt: Timestamp | null;
  deletedBy: string | null;
}

export interface MatchedWord {
  word: string;
  expectedIndex: number;
  spokenIndex: number;
}

export interface ReplacedWord {
  expected: string;
  actual: string;
  expectedIndex: number;
  spokenIndex: number;
}

export interface ComparisonResult {
  accuracy: number;
  matchedWords: MatchedWord[];
  missingWords: string[];
  extraWords: string[];
  replacedWords: ReplacedWord[];
  reorderedWords: string[];
  totalWords: number;
  correctWords: number;
  isNotRead?: boolean;
}

export interface RecitationResult {
  verseIndex: number;
  verseId?: string;
  result: ComparisonResult;
}

export interface AIEvaluation {
  overallScore: number;
  tajweedScore: number;
  pronunciationScore: number;
  fluencyScore: number;
  feedback: string;
  suggestedPractice: string[];
  masteryDelta: number;
}

export interface WordTimestamp {
  word: string;
  startTime: number;
  endTime: number;
}

export interface SpeechAnalysisResult {
  transcript: string;
  confidence: number;
  wordTimestamps?: WordTimestamp[];
}

export interface RecitationSettings {
  playbackSpeed: number;
  enableTajweedHighlight: boolean;
  enableAutoRepeat: boolean;
  repeatCount: number;
  showTranslation: boolean;
  showTransliteration: boolean;
  recitationMode: 'memorization' | 'reading' | 'evaluation' | string;
}



