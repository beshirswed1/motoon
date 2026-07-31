import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { BookOpen, User, Hash } from 'lucide-react';
import type { Book } from '@/types/book.types';

interface RelatedBooksProps {
  currentBookSlug: string;
  category?: string;
  author?: string;
  allBooks: Book[];
}

export function RelatedBooks({ currentBookSlug, category, author, allBooks }: RelatedBooksProps) {
  // Filter similar books (same category or same author, excluding current)
  const related = allBooks
    .filter((b) => b.slug !== currentBookSlug && (b.category === category || b.author === author))
    .slice(0, 3);

  // Fallback if not enough matching category: get other books
  const finalRelated = related.length >= 3 
    ? related 
    : [
        ...related,
        ...allBooks.filter((b) => b.slug !== currentBookSlug && !related.some((r) => r.slug === b.slug)).slice(0, 3 - related.length),
      ];

  if (finalRelated.length === 0) return null;

  return (
    <div className="mt-12 pt-8 border-t border-border/50">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-foreground">متون ذات صلة</h3>
          <p className="text-sm text-muted-foreground">متون أخرى قد تهمك في نفس المجال العلمي</p>
        </div>
        <Link
          href="/books"
          className="text-sm font-bold text-primary hover:underline flex items-center gap-1"
        >
          عرض جميع المتون
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {finalRelated.map((book) => (
          <Link
            key={book.id}
            href={`/books/${book.slug}`}
            className="group flex flex-col p-4 rounded-2xl border border-border/50 bg-card hover:border-primary/40 hover:shadow-lg transition-all duration-300"
          >
            <div className="relative aspect-[3/2] w-full rounded-xl overflow-hidden bg-muted mb-3">
              {book.coverImageUrl ? (
                <Image
                  src={book.coverImageUrl}
                  alt={`غلاف ${book.title}`}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
              ) : (
                <div className="flex h-full items-center justify-center bg-primary/10 text-primary font-bold">
                  {book.title}
                </div>
              )}
            </div>

            <h4 className="font-bold text-base text-foreground group-hover:text-primary transition-colors line-clamp-1">
              {book.title}
            </h4>

            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <User className="h-3 w-3 shrink-0" />
              <span className="truncate">{book.author}</span>
            </p>

            {book.versesCount && (
              <span className="text-[11px] font-semibold text-primary/80 mt-2 flex items-center gap-1">
                <Hash className="h-3 w-3" />
                {book.versesCount} بيت
              </span>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
