import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { booksService } from '../../services/firebase/books.service';
import { versesService } from '../../services/firebase/verses.service';
import { queryKeys } from '../../lib/queryKeys';
import { Book } from '../../types/book.types';
import { DocumentSnapshot } from 'firebase/firestore';

export const useBooks = (filters?: { status?: string, difficulty?: string, lastDoc?: DocumentSnapshot, pageSize?: number }) => {
  return useQuery({
    queryKey: queryKeys.books.list(filters),
    queryFn: () => booksService.getAll(filters),
    staleTime: 1000 * 60 * 5, // 5 minutes stale time
  });
};

export const useBook = (slug: string) => {
  return useQuery({
    queryKey: queryKeys.books.detail(slug),
    queryFn: () => booksService.getBySlug(slug),
    staleTime: 1000 * 60 * 5,
    enabled: !!slug,
  });
};

export const useBookVerses = (bookId: string) => {
  return useQuery({
    queryKey: queryKeys.verses.list(bookId),
    queryFn: () => versesService.getByBookId(bookId),
    staleTime: 1000 * 60 * 5,
    enabled: !!bookId,
  });
};

export const useCreateBook = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (book: Omit<Book, 'createdAt' | 'updatedAt' | 'isDeleted' | 'deletedAt' | 'deletedBy'>) => booksService.create(book),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.books.all });
    },
  });
};

export const useUpdateBook = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string, data: Partial<Omit<Book, 'id' | 'createdAt'>> }) => booksService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.books.all });
    },
  });
};
