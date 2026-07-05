'use client';

import React, { useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useBook, useBookVerses } from '@/hooks/features/books.hooks';
import { RecitationInterface } from '@/features/recitation/components/RecitationInterface';
import { SessionSummary } from '@/features/recitation/components/SessionSummary';
import type { ComparisonResult } from '@/types';
import { Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getLocalBookBySlug } from '@/lib/data';

export default function RecitationPage() {
  const router = useRouter();
  const { slug } = useParams<{ slug: string }>();

  // Fetch book and verses using custom react-query hooks
  const decodedSlug = decodeURIComponent(slug || '');
  const { data: book, isLoading: isLoadingBook, error: bookError } = useBook(decodedSlug);
  const { data: verses, isLoading: isLoadingVerses, error: versesError } = useBookVerses(book?.id || '');

  // Session state tracking
  const [results, setResults] = useState<Record<number, ComparisonResult>>({});
  const [sessionFinished, setSessionFinished] = useState<boolean>(false);

  const isLoading = isLoadingBook || isLoadingVerses;

  // Fallback to mock data if Firestore is empty
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

  const handleResultSave = useCallback((index: number, result: ComparisonResult | null) => {
    setResults((prev) => {
      const updated = { ...prev };
      if (result === null) {
        delete updated[index];
      } else {
        updated[index] = result;
      }
      return updated;
    });
  }, []);

  const handleRetrySession = () => {
    setResults({});
    setSessionFinished(false);
  };

  const handleExitSession = () => {
    router.push(`/books/${slug}`);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-3 select-none">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <span className="text-sm font-semibold text-muted-foreground">جاري تحميل المتن والأبيات...</span>
      </div>
    );
  }

  if (isError || !displayBook || !displayVerses || displayVerses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-4 p-6 text-center select-none max-w-sm mx-auto dir-rtl">
        <AlertCircle className="w-12 h-12 text-destructive" />
        <h2 className="text-xl font-bold">عذراً، لم نتمكن من العثور على أبيات هذا المتن</h2>
        <p className="text-sm text-muted-foreground">تأكد من اختيار متن متاح ويحتوي على أبيات مسجلة.</p>
        <Button onClick={handleExitSession} className="w-full mt-2 font-bold py-5">
          العودة للمتون
        </Button>
      </div>
    );
  }

  if (sessionFinished) {
    return (
      <div className="container-motoon py-12 flex items-center justify-center min-h-[80vh] section-padding">
        <SessionSummary
          bookTitle={displayBook.title}
          bookSlug={slug as string}
          results={results}
          versesCount={displayVerses.length}
          versesList={displayVerses}
          onRetry={handleRetrySession}
          onExit={handleExitSession}
        />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-background pb-10">
      <div className="absolute inset-0 bg-primary/5 pattern-dots opacity-30 pointer-events-none" />
      <div className="container-motoon py-8 relative z-10 flex flex-col justify-center">
        <RecitationInterface
          book={displayBook}
          verses={displayVerses}
          results={results}
          onResultSave={handleResultSave}
          onFinishSession={(finalResults) => {
            setResults(finalResults);
            setSessionFinished(true);
          }}
          onExit={handleExitSession}
        />
      </div>
    </div>
  );
}
