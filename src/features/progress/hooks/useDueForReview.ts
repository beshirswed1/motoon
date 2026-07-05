import { useQuery } from '@tanstack/react-query';
import { progressService } from '../../../services/firebase/progress.service';
import { isDueForReview, toDate } from '../../../lib/algorithms/spacedRepetition';

export const useDueForReview = (userId: string) => {
  return useQuery({
    queryKey: ['progress', 'due-for-review', userId],
    queryFn: async () => {
      if (!userId) return [];
      const allProgress = await progressService.getUserProgress(userId);

      // Filter for due items using timezone-aware comparison
      const dueItems = allProgress.filter((item) => isDueForReview(item.nextReviewDate));

      // Sort by urgency:
      // 1. Overdue amount (nextReviewDate ascending - older date is more overdue)
      // 2. Mastery level ascending (lower mastery is more urgent)
      // 3. Interval ascending (shorter intervals are more urgent)
      return dueItems.sort((a, b) => {
        const dateA = toDate(a.nextReviewDate);
        const dateB = toDate(b.nextReviewDate);
        const timeA = dateA.getTime();
        const timeB = dateB.getTime();

        if (timeA !== timeB) {
          return timeA - timeB; // Most overdue first
        }

        const masteryA = a.mastery ?? 0;
        const masteryB = b.mastery ?? 0;
        if (masteryA !== masteryB) {
          return masteryA - masteryB; // Lower mastery first
        }

        return a.interval - b.interval; // Shorter intervals first
      });
    },
    staleTime: 0,
    enabled: !!userId,
  });
};
