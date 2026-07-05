/**
 * algorithms/spacedRepetition.ts
 * Adapted SM-2 Spaced Repetition algorithm for Islamic text memorization.
 */


export interface SRSCard {
  interval: number;       // Days until next review (1, 3, 7, 14, 30)
  easeFactor: number;     // Ease factor (EF), min 1.3
  mastery: number;        // Mastery score (0-100)
  nextReviewDate: Date;
  lastReviewDate: Date | null;
}

// Alias for backward compatibility if needed
export type SM2Card = SRSCard;
export type QualityRating = 0 | 1 | 2 | 3 | 4 | 5;

const ALLOWED_INTERVALS = [1, 3, 7, 14, 30];

/**
 * Maps a calculated interval to the nearest allowed interval in [1, 3, 7, 14, 30]
 */
export function mapToAllowedInterval(interval: number): number {
  if (interval <= 1) return 1;
  if (interval >= 30) return 30;

  return ALLOWED_INTERVALS.reduce((prev, curr) =>
    Math.abs(curr - interval) < Math.abs(prev - interval) ? curr : prev
  );
}

/**
 * calculateNextReview — SM-2 algorithm adaptation.
 * Bounded easeFactor at minimum 1.3.
 * Mastery bounded between 0 and 100.
 * @param card - current card state
 * @param accuracy - user's accuracy rating (0-100)
 */
export function calculateNextReview(card: SRSCard, accuracy: number): SRSCard {
  let { interval, easeFactor, mastery } = card;

  if (accuracy >= 90) {
    if (interval === 0) {
      interval = 1;
    } else {
      interval = interval * easeFactor;
    }
    easeFactor += 0.1;
    mastery = Math.min(100, mastery + 10);
  } else if (accuracy >= 70) {
    if (interval === 0) {
      interval = 1;
    }
    // interval same, easeFactor same
    mastery = Math.min(100, mastery + 5);
  } else {
    interval = 1;
    easeFactor -= 0.2;
    mastery = Math.max(0, mastery - 5);
  }

  // Bound easeFactor to minimum 1.3
  easeFactor = Math.max(1.3, easeFactor);

  // Map to predefined intervals
  const mappedInterval = mapToAllowedInterval(interval);

  const now = new Date();
  const nextReviewDate = new Date(now);
  nextReviewDate.setDate(nextReviewDate.getDate() + mappedInterval);

  return {
    interval: mappedInterval,
    easeFactor: parseFloat(easeFactor.toFixed(2)),
    mastery,
    nextReviewDate,
    lastReviewDate: now,
  };
}

/**
 * createNewCard — initializes a new SRSCard
 */
export function createNewCard(): SRSCard {
  return {
    interval: 0,
    easeFactor: 2.5,
    mastery: 0,
    nextReviewDate: new Date(),
    lastReviewDate: null,
  };
}

/**
 * scoreToQuality — converts a 0-100 evaluation score to SM-2 quality (0-5)
 * Retained for backward compatibility
 */
export function scoreToQuality(score: number): QualityRating {
  if (score >= 95) return 5;
  if (score >= 85) return 4;
  if (score >= 70) return 3;
  if (score >= 55) return 2;
  if (score >= 40) return 1;
  return 0;
}

/**
 * Converts a Timestamp or Date or string to Date object
 */
export function toDate(dateVal: unknown): Date {
  if (dateVal instanceof Date) {
    return dateVal;
  }
  if (dateVal && typeof dateVal === 'object' && 'seconds' in dateVal) {
    const firestoreTimestamp = dateVal as { seconds: number };
    return new Date(firestoreTimestamp.seconds * 1000);
  }
  if (typeof dateVal === 'string' || typeof dateVal === 'number') {
    return new Date(dateVal);
  }
  return new Date();
}

/**
 * isDueForReview — timezone-aware check if a card is due for review today or earlier.
 * Compares year, month, and day in the user's local timezone.
 */
export function isDueForReview(nextReviewDate: unknown, localTime: Date = new Date()): boolean {
  const reviewDate = toDate(nextReviewDate);

  const currentLocalDay = new Date(localTime.getFullYear(), localTime.getMonth(), localTime.getDate());
  const reviewLocalDay = new Date(reviewDate.getFullYear(), reviewDate.getMonth(), reviewDate.getDate());

  return reviewLocalDay <= currentLocalDay;
}

/**
 * getDueForReview — Filters cards that are due for review.
 */
export function getDueForReview<T extends { nextReviewDate: unknown }>(
  items: T[],
  localTime: Date = new Date()
): T[] {
  return items.filter(item => isDueForReview(item.nextReviewDate, localTime));
}

/**
 * calculateStreakBonus — Calculates XP/points bonus based on study streak.
 * 5% bonus per day of streak, capped at 50%.
 */
export function calculateStreakBonus(baseValue: number, streakDays: number): number {
  if (streakDays <= 0) return 0;
  const bonusMultiplier = Math.min(0.5, streakDays * 0.05);
  return Math.round(baseValue * bonusMultiplier);
}
