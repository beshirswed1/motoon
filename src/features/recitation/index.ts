/**
 * Feature: Recitation (التلاوة)
 * Barrel export — expanded in Task 9
 */

export { 
  analyzeRecitation, 
  convertBlobToBase64, 
  uploadAudioRecording, 
  speechService 
} from '@/services/ai/speech.service';

export { 
  compareRecitation, 
  calculateSimilarityScore, 
  normalizeArabicText, 
  RecitationComparisonEngine 
} from '@/services/ai/comparison.service';

export { evaluateRecitation } from '@/services/ai/evaluation.service';

// Hooks
export { useRecitationSession } from './hooks/useRecitationSession';
export type { RecitationState } from './hooks/useRecitationSession';

// Components
export { RecitationInterface } from './components/RecitationInterface';
export { MicrophoneButton } from './components/MicrophoneButton';
export { ResultDisplay } from './components/ResultDisplay';
export { ResultMetrics } from './components/ResultMetrics';
export { SessionSummary } from './components/SessionSummary';
