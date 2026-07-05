'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useBook, useBookVerses } from '@/hooks/features/books.hooks';
import { useUserProgress } from '@/hooks/features/progress.hooks';
import { useAuth } from '@/hooks/useAuth';
import { MemorizeView } from '@/features/books/components/MemorizeView';
import { Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getLocalBookBySlug } from '@/lib/data';

export default function MemorizePage() {
  const router = useRouter();
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();

  // Fetch book and verses using custom hooks
  const decodedSlug = decodeURIComponent(slug || '');
  const { data: book, isLoading: isLoadingBook, error: bookError } = useBook(decodedSlug);
  const { data: verses, isLoading: isLoadingVerses, error: versesError } = useBookVerses(book?.id || '');

  const userId = user?.id || '';
  const { data: userProgress, isLoading: isLoadingProgress } = useUserProgress(userId, book?.id);

  const isLoading = isLoadingBook || isLoadingVerses || (!!userId && isLoadingProgress);

  // Fallback to mock/local data if not loaded from database
  let displayBook = book;
  let displayVerses = verses;

  if (!isLoading && !displayBook) {
    const localData = getLocalBookBySlug(decodedSlug);
    if (localData) {
      displayBook = localData.book;
      displayVerses = localData.verses;
    }
  }

  // We are in mock mode if we successfully fell back to a local book
  const isMockMode = !book && !!displayBook;

  const isError = isMockMode 
    ? false 
    : (!!bookError || !!versesError || (!isLoading && !displayBook));

  const handleExit = () => {
    router.push(`/books/${slug}`);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-3 select-none">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <span className="text-sm font-semibold text-muted-foreground">جاري تحميل المتن للأستذكار...</span>
      </div>
    );
  }

  if (isError || !displayBook || !displayVerses || displayVerses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-4 p-6 text-center select-none max-w-sm mx-auto dir-rtl">
        <AlertCircle className="w-12 h-12 text-destructive" />
        <h2 className="text-xl font-bold">عذراً، لم نتمكن من تحميل هذا المتن للحفظ</h2>
        <p className="text-sm text-muted-foreground">تأكد من اختيار متن متاح ويحتوي على أبيات مسجلة.</p>
        <Button onClick={handleExit} className="w-full mt-2 font-bold py-5">
          العودة للمتون
        </Button>
      </div>
    );
  }

  return (
    <div className="container-motoon py-8 section-padding min-h-[85vh] flex flex-col justify-center">
      <MemorizeView
        book={displayBook}
        verses={displayVerses}
        initialProgress={userProgress || []}
        userId={userId}
        onExit={handleExit}
      />
    </div>
  );
}
