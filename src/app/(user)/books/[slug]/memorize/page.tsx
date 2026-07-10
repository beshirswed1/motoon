'use client';

import { useParams, useRouter } from 'next/navigation';
import { useBook, useBookVerses } from '@/hooks/features/books.hooks';
import { useUserProgress } from '@/hooks/features/progress.hooks';
import { useAuth } from '@/hooks/useAuth';
import { MemorizeView } from '@/features/books/components/MemorizeView';
import { Loader2, AlertCircle, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function MemorizePage() {
  const router = useRouter();
  const { slug } = useParams<{ slug: string }>();
  const { user, loading: authLoading } = useAuth();

  // Fetch book and verses using custom hooks (Firebase)
  const decodedSlug = decodeURIComponent(slug || '');
  const { data: book, isLoading: isLoadingBook } = useBook(decodedSlug);
  const { data: verses, isLoading: isLoadingVerses } = useBookVerses(book?.id || '');

  const userId = user?.id || '';
  const { data: userProgress, isLoading: isLoadingProgress } = useUserProgress(userId, book?.id);

  // Local book fallback state
  const [localBook, setLocalBook] = useState<any>(null);
  const [localVerses, setLocalVerses] = useState<any[]>([]);
  const [loadingLocal, setLoadingLocal] = useState(false);

  // Try API endpoint for local book fallback when Firebase doesn't have it
  useEffect(() => {
    if (!isLoadingBook && !book && decodedSlug) {
      setLoadingLocal(true);
      fetch(`/api/books/${encodeURIComponent(decodedSlug)}`)
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data) {
            setLocalBook(data.book);
            setLocalVerses(data.verses || []);
          }
        })
        .catch(console.error)
        .finally(() => setLoadingLocal(false));
    }
  }, [isLoadingBook, book, decodedSlug]);

  const isLoading = isLoadingBook || isLoadingVerses || loadingLocal || (!!userId && isLoadingProgress);

  // Use Firebase data first, then local fallback
  const displayBook = book || localBook;
  const displayVerses = (verses && verses.length > 0) ? verses : localVerses;

  const isError = !isLoading && (!displayBook || !displayVerses || displayVerses.length === 0);

  const handleExit = () => {
    router.push(`/books/${slug}`);
  };

  if (isLoading || authLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-3 select-none">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <span className="text-sm font-semibold text-muted-foreground">جاري تحميل المتن للحفظ...</span>
      </div>
    );
  }

  // Show login prompt if not authenticated
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-5 p-6 text-center select-none max-w-sm mx-auto dir-rtl">
        <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center">
          <LogIn className="w-10 h-10 text-primary" />
        </div>
        <h2 className="text-xl font-bold">يجب تسجيل الدخول لحفظ المتون</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          سجّل دخولك لحفظ تقدمك ومتابعة رحلة الحفظ. بياناتك ستكون محفوظة بأمان.
        </p>
        <div className="flex flex-col gap-2 w-full">
          <Button asChild className="w-full font-bold py-5 rounded-xl">
            <Link href={`/login?redirect=/books/${slug}/memorize`}>
              <LogIn className="h-4 w-4 ml-2" />
              تسجيل الدخول
            </Link>
          </Button>
          <Button variant="outline" onClick={handleExit} className="w-full font-bold rounded-xl">
            العودة للمتن
          </Button>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-4 p-6 text-center select-none max-w-sm mx-auto dir-rtl">
        <AlertCircle className="w-12 h-12 text-destructive" />
        <h2 className="text-xl font-bold">عذراً، لم نتمكن من تحميل هذا المتن للحفظ</h2>
        <p className="text-sm text-muted-foreground">تأكد من اختيار متن متاح ويحتوي على أبيات مسجلة.</p>
        <Button onClick={handleExit} className="w-full mt-2 font-bold py-5 rounded-xl">
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
