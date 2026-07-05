import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { progressService } from '../../services/firebase/progress.service';
import { queryKeys } from '../../lib/queryKeys';
import { Progress } from '../../types/progress.types';

export const useUserProgress = (userId: string, bookId?: string) => {
  return useQuery({
    queryKey: [...queryKeys.progress.user(userId), bookId],
    queryFn: () => progressService.getUserProgress(userId, bookId),
    staleTime: 0, // 0 staleTime as requested
    enabled: !!userId,
  });
};

export const useDueForReview = (userId: string, limit?: number) => {
  return useQuery({
    queryKey: queryKeys.progress.due(userId),
    queryFn: () => progressService.getDueForReview(userId, limit),
    staleTime: 0,
    enabled: !!userId,
  });
};

export const useUpdateProgress = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (progress: Progress) => progressService.createOrUpdate(progress),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.progress.user(variables.userId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.progress.due(variables.userId) });
    },
  });
};
