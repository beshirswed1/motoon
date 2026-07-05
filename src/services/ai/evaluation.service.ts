/**
 * evaluation.service.ts
 * Comprehensive AI evaluation service that combines speech analysis
 * and text comparison to produce a final recitation score.
 */

import { httpsCallable, getFunctions } from 'firebase/functions';
import { app } from '@/firebase/config';
import { compareRecitation, calculateSimilarityScore } from './comparison.service';
import type { AIEvaluation, RecitationSession, SpeechAnalysisResult, RecitationError } from '@/types';

interface EvaluationRequest {
  session: RecitationSession;
  speechResult: SpeechAnalysisResult;
  expectedText: string;
  verseId: string;
}

export interface EvaluationResult {
  evaluation: AIEvaluation;
  errors: RecitationError[];
}

/**
 * evaluateRecitation — produces a full AI evaluation combining:
 * 1. Text similarity (comparison.service)
 * 2. Tajweed score (Cloud Function with specialized model)
 * 3. Fluency score (based on word timestamps)
 */
export async function evaluateRecitation(
  request: EvaluationRequest
): Promise<EvaluationResult> {
  const { session, speechResult, expectedText, verseId } = request;

  // 1. Local text comparison
  const errors = compareRecitation(verseId, expectedText, speechResult.transcript);
  const pronunciationScore = calculateSimilarityScore(
    expectedText,
    speechResult.transcript
  );

  // 2. Fluency score — based on pauses and word timestamps
  const fluencyScore = calculateFluencyScore(speechResult);

  // 3. Tajweed score — call Firebase Function for specialized analysis
  let tajweedScore = 75; // Default fallback
  try {
    const functions = getFunctions(app);
    const evaluateTajweedFn = httpsCallable<
      { text: string; transcript: string; sessionId: string },
      { score: number }
    >(functions, 'evaluateTajweed');

    const tajweedResult = await evaluateTajweedFn({
      text: expectedText,
      transcript: speechResult.transcript,
      sessionId: session.id,
    });
    tajweedScore = tajweedResult.data.score;
  } catch {
    console.warn('Tajweed evaluation service unavailable, using default score');
  }

  // 4. Weighted overall score
  const overallScore = Math.round(
    pronunciationScore * 0.4 + tajweedScore * 0.4 + fluencyScore * 0.2
  );

  // 5. Generate Arabic feedback
  const feedback = generateArabicFeedback(overallScore, errors.length, tajweedScore);

  const masteryDelta = getMasteryDelta(pronunciationScore);

  return {
    errors,
    evaluation: {
      overallScore,
      tajweedScore,
      pronunciationScore: Math.round(pronunciationScore),
      fluencyScore: Math.round(fluencyScore),
      feedback,
      suggestedPractice: generatePracticesuggestions(errors),
      masteryDelta,
    }
  };
}

/**
 * calculateFluencyScore — analyzes word timing gaps for fluency measurement
 */
function calculateFluencyScore(result: SpeechAnalysisResult): number {
  if (!result.wordTimestamps || result.wordTimestamps.length < 2) {
    return result.confidence * 100;
  }

  const gaps: number[] = [];
  for (let i = 1; i < result.wordTimestamps.length; i++) {
    const gap =
      result.wordTimestamps[i].startTime - result.wordTimestamps[i - 1].endTime;
    gaps.push(gap);
  }

  const avgGap = gaps.reduce((a, b) => a + b, 0) / gaps.length;
  const longPauses = gaps.filter((g) => g > 1.5).length;

  // Penalize long pauses
  const pausePenalty = longPauses * 8;
  const gapPenalty = Math.min(30, avgGap * 10);

  return Math.max(0, Math.min(100, 100 - pausePenalty - gapPenalty));
}

/**
 * generateArabicFeedback — produces human-readable Arabic feedback text
 */
function generateArabicFeedback(
  score: number,
  errorsCount: number,
  tajweedScore: number
): string {
  if (score >= 90) {
    return 'ممتاز! تلاوتك رائعة وأداؤك في التجويد متميز. استمر في هذا المستوى الرفيع.';
  }
  if (score >= 75) {
    return `جيد جداً! أداؤك مميز مع ${errorsCount > 0 ? `${errorsCount} ملاحظات طفيفة` : 'بعض التحسينات الممكنة'}. تدرب على أحكام التجويد لترتقي أكثر.`;
  }
  if (score >= 60) {
    return `جيد. هناك ${errorsCount} موضع يحتاج مراجعة. ${tajweedScore < 70 ? 'ركز على أحكام التجويد وتحديداً المد والغنة.' : 'ركز على ضبط النطق والوضوح.'}`;
  }
  return 'يحتاج إلى تحسين. ننصحك بالاستماع إلى المقطع مجدداً والتدرب على النطق الصحيح مع معلمك.';
}

/**
 * generatePracticesuggestions — returns targeted practice recommendations
 */
function generatePracticesuggestions(
  errors: RecitationError[]
): string[] {
  const suggestions: string[] = [];
  const hasMemorization = errors.some((m) => m.type === 'memorization');
  const hasWordError = errors.some((m) => m.type === 'word');

  if (hasMemorization || hasWordError) suggestions.push('راجع الكلمات التي اخطأت فيها مع معلمك');
  if (errors.some((m) => m.type === 'haraka')) suggestions.push('استذكر أحكام التجويد وتحديداً قواعد المد');
  if (hasMemorization) suggestions.push('اقرأ المقطع ببطء أكثر للتأكد من عدم تخطي الكلمات');
  if (errors.length > 3) suggestions.push('استمع للتسجيل الصحيح ثلاث مرات قبل إعادة التلاوة');

  return suggestions;
}

/**
 * getMasteryDelta — Maps recitation accuracy (0-100) to delta change in mastery score.
 */
export function getMasteryDelta(accuracy: number): number {
  if (accuracy >= 95) return 10;
  if (accuracy >= 85) return 5;
  if (accuracy >= 70) return 2;
  if (accuracy >= 50) return -5;
  return -15;
}

