'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { Book as BookType } from '@/types/book.types';
import { BookOpen, Mic, ChevronLeft, ChevronRight, Hash } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FeaturedBooksCarouselProps {
  books: (BookType & { versesCount?: number })[];
}

const coverGradients = [
  'from-primary/25 to-emerald-600/15',
  'from-amber-500/25 to-yellow-300/15',
  'from-indigo-600/25 to-blue-400/15',
  'from-rose-500/25 to-pink-300/15',
  'from-teal-600/25 to-cyan-400/15',
  'from-violet-600/25 to-purple-400/15',
];

function getGradientIndex(title: string): number {
  let hash = 0;
  for (let i = 0; i < title.length; i++) {
    hash = (hash << 5) - hash + title.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) % coverGradients.length;
}

export function FeaturedBooksCarousel({ books }: FeaturedBooksCarouselProps) {
  const [current, setCurrent] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const autoPlayRef = useRef<NodeJS.Timeout | null>(null);
  const totalBooks = books.length;

  const go = useCallback((index: number) => {
    if (isTransitioning || totalBooks === 0) return;
    setIsTransitioning(true);
    setCurrent((index + totalBooks) % totalBooks);
    setTimeout(() => setIsTransitioning(false), 400);
  }, [isTransitioning, totalBooks]);

  const next = useCallback(() => go(current + 1), [current, go]);
  const prev = useCallback(() => go(current - 1), [current, go]);

  useEffect(() => {
    if (totalBooks < 2) return;
    autoPlayRef.current = setInterval(next, 5000);
    return () => { if (autoPlayRef.current) clearInterval(autoPlayRef.current); };
  }, [next, totalBooks]);

  const resetAutoPlay = useCallback(() => {
    if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    autoPlayRef.current = setInterval(next, 5000);
  }, [next]);

  if (totalBooks === 0) return null;

  const book = books[current];
  const gradientClass = coverGradients[getGradientIndex(book.title)];

  return (
    <div className="relative w-full overflow-hidden rounded-3xl border border-border/50 bg-card shadow-xl">
      {/* Main slide */}
      <div
        className={`relative flex flex-col md:flex-row min-h-[360px] md:min-h-[420px] transition-opacity duration-400 ${
          isTransitioning ? 'opacity-0' : 'opacity-100'
        }`}
      >
        {/* Cover */}
        <div className={`relative w-full md:w-2/5 bg-gradient-to-br ${gradientClass} min-h-[200px] md:min-h-full overflow-hidden`}>
          {book.coverImageUrl ? (
            <Image
              src={book.coverImageUrl}
              alt={`غلاف ${book.title}`}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 40vw"
              priority
            />
          ) : (
            <div className="flex h-full items-center justify-center p-8 text-center relative">
              <div className="absolute inset-0 opacity-5">
                {[...Array(9)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute w-16 h-16 border border-foreground rounded-full"
                    style={{
                      left: `${(i % 3) * 33 + 10}%`,
                      top: `${Math.floor(i / 3) * 33 + 5}%`,
                    }}
                  />
                ))}
              </div>
              <div className="relative z-10">
                <div className="text-6xl mb-4 opacity-30">﴾﴿</div>
                <h3 className="text-2xl font-black text-foreground leading-tight">{book.title}</h3>
              </div>
            </div>
          )}
          {/* Gradient overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-l md:bg-gradient-to-r from-transparent to-black/20" />
        </div>

        {/* Content */}
        <div className="flex flex-col justify-center gap-5 p-8 md:p-10 md:w-3/5">
          <div>
            <p className="text-xs font-bold text-primary uppercase tracking-widest mb-2">متن مميز</p>
            <h2 className="text-2xl md:text-3xl font-black text-foreground mb-2 leading-tight">
              {book.title}
            </h2>
            <p className="text-sm font-semibold text-muted-foreground mb-4">
              {book.author}
            </p>
            {book.description && (
              <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
                {book.description}
              </p>
            )}
          </div>

          {book.versesCount && book.versesCount > 0 ? (
            <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
              <Hash className="h-3.5 w-3.5 text-primary" />
              {book.versesCount} بيت
            </div>
          ) : null}

          <div className="flex flex-col sm:flex-row gap-3 mt-2">
            <Button asChild className="gap-2 rounded-xl font-bold shadow-sm">
              <Link href={`/books/${book.slug}/memorize`}>
                <BookOpen className="h-4 w-4" />
                ابدأ الحفظ
              </Link>
            </Button>
            <Button asChild variant="outline" className="gap-2 rounded-xl font-bold">
              <Link href={`/books/${book.slug}/recite`}>
                <Mic className="h-4 w-4" />
                تسميع ذاتي
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Navigation controls */}
      {totalBooks > 1 && (
        <>
          <button
            onClick={() => { prev(); resetAutoPlay(); }}
            className="absolute top-1/2 right-3 -translate-y-1/2 bg-background/80 backdrop-blur-sm border border-border/50 rounded-full p-2 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-200 shadow-lg z-10"
            aria-label="السابق"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <button
            onClick={() => { next(); resetAutoPlay(); }}
            className="absolute top-1/2 left-3 -translate-y-1/2 bg-background/80 backdrop-blur-sm border border-border/50 rounded-full p-2 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-200 shadow-lg z-10"
            aria-label="التالي"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          {/* Dots */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 z-10">
            {books.map((_, idx) => (
              <button
                key={idx}
                onClick={() => { go(idx); resetAutoPlay(); }}
                className={`transition-all duration-300 rounded-full ${
                  idx === current
                    ? 'w-6 h-2 bg-primary'
                    : 'w-2 h-2 bg-muted-foreground/40 hover:bg-muted-foreground/70'
                }`}
                aria-label={`الشريحة ${idx + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
