'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { Book as BookType } from '@/types/book.types';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Mic, Hash, Award, Info, Heart } from 'lucide-react';
import { useFavorites } from '@/hooks/useFavorites';
import { useAuth } from '@/hooks/useAuth';
import { MatnCover } from '@/components/common/MatnCover';
import { getCategoryLabel, getSubcategoryLabel } from '@/lib/constants/categories';

export interface BookCardProps {
  book: BookType & { versesCount?: number };
  showProgress?: boolean;
  progressValue?: number;
  masteryScore?: number;
  viewMode?: 'grid' | 'list';
}

export function BookCard({ book, showProgress, progressValue = 0, masteryScore, viewMode = 'grid' }: BookCardProps) {
  const versesCount = book.versesCount ?? 0;

  const categoryText = book.category
    ? (book.subcategory
        ? `${getCategoryLabel(book.category)} > ${getSubcategoryLabel(book.category, book.subcategory)}`
        : getCategoryLabel(book.category))
    : 'متن علمي';
  const canGetCertificate = masteryScore !== undefined && masteryScore >= 95;
  const { user } = useAuth();
  const { isFavorite, toggleFavorite } = useFavorites();
  const bookIsFav = isFavorite(book.id);

  if (viewMode === 'list') {
    return (
      <div className="group flex overflow-hidden rounded-2xl border border-border/60 bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-lg hover:border-primary/30">
        {/* Cover */}
        <Link
          href={`/books/${book.slug}`}
          className="relative w-28 md:w-36 shrink-0 overflow-hidden bg-muted block"
        >
          {book.coverImageUrl ? (
            <Image
              src={book.coverImageUrl}
              alt={`غلاف ${book.title}`}
              fill
              className="object-cover"
              sizes="144px"
            />
          ) : (
            <MatnCover
              title={book.title}
              author={book.author}
              category={categoryText}
            />
          )}
        </Link>

        {/* Content */}
        <div className="flex flex-1 flex-col justify-center p-4 min-w-0">
          <Link href={`/books/${book.slug}`} className="hover:text-primary transition-colors">
            <h3 className="line-clamp-1 text-base font-bold mb-1 leading-snug">{book.title}</h3>
          </Link>
          <p className="line-clamp-1 text-xs text-muted-foreground mb-2 font-medium">{book.author}</p>
          
          {versesCount > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3">
              <Hash className="h-3 w-3 text-primary" />
              {versesCount} بيت
            </div>
          )}

          <div className="flex items-center gap-2 mt-auto">
            <Button asChild variant="default" className="gap-1.5 rounded-xl font-bold text-xs h-8 px-3" size="sm">
              <Link href={`/books/${book.slug}/recite`}>
                <Mic className="h-3.5 w-3.5" />
                تسميع
              </Link>
            </Button>
            <Button asChild variant="outline" className="gap-1.5 rounded-xl font-bold text-xs h-8 px-3" size="sm">
              <Link href={`/books/${book.slug}`}>
                <Info className="h-3.5 w-3.5" />
                التفاصيل
              </Link>
            </Button>
            {user && (
              <button
                onClick={() => toggleFavorite(book.id)}
                className={`h-8 w-8 rounded-xl flex items-center justify-center transition-all mr-auto ${
                  bookIsFav ? 'text-red-500 bg-red-500/10' : 'text-muted-foreground hover:text-red-500 hover:bg-red-500/10'
                }`}
                title={bookIsFav ? 'إزالة من المفضلة' : 'إضافة للمفضلة'}
              >
                <Heart className={`h-4 w-4 ${bookIsFav ? 'fill-current' : ''}`} />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Grid mode
  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-xl hover:shadow-primary/8 hover:-translate-y-1 hover:border-primary/30">
      {/* Cover Area */}
      <Link
        href={`/books/${book.slug}`}
        className="relative aspect-[3/4] w-full overflow-hidden bg-muted block"
      >
        {book.coverImageUrl ? (
          <Image
            src={book.coverImageUrl}
            alt={`غلاف ${book.title}`}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-105"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        ) : (
          <MatnCover
            title={book.title}
            author={book.author}
            category={categoryText}
          />
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

        {/* Certificate badge */}
        {canGetCertificate && (
          <div className="absolute top-2 left-2 bg-amber-500 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1 shadow-lg">
            <Award className="h-3 w-3" />
            شهادة
          </div>
        )}

        {/* Favorite button */}
        {user && (
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleFavorite(book.id); }}
            className={`absolute top-2 right-2 h-8 w-8 rounded-full flex items-center justify-center transition-all shadow-md ${
              bookIsFav
                ? 'bg-red-500 text-white'
                : 'bg-black/40 backdrop-blur-sm text-white/80 hover:bg-red-500 hover:text-white opacity-0 group-hover:opacity-100'
            }`}
          >
            <Heart className={`h-3.5 w-3.5 ${bookIsFav ? 'fill-current' : ''}`} />
          </button>
        )}

        {/* Verses count badge */}
        {versesCount > 0 && (
          <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-sm text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Hash className="h-3 w-3" />
            {versesCount} بيت
          </div>
        )}
      </Link>

      {/* Card Body */}
      <div className="flex flex-1 flex-col p-4">
        <Link href={`/books/${book.slug}`} className="hover:text-primary transition-colors">
          <h3 className="line-clamp-2 text-base font-bold mb-1 leading-snug" title={book.title}>
            {book.title}
          </h3>
        </Link>
        <p className="line-clamp-1 text-xs text-muted-foreground mb-3 font-medium" title={book.author}>
          {book.author}
        </p>

        {/* Progress bar */}
        {showProgress && (
          <div className="mb-3 space-y-1">
            <div className="flex justify-between text-xs font-semibold text-muted-foreground">
              <span>نسبة الإنجاز</span>
              <span className="text-primary">{progressValue}%</span>
            </div>
            <Progress value={progressValue} className="h-1.5 bg-muted" />
          </div>
        )}

        {/* Actions — Only 2 buttons: تسميع + التفاصيل */}
        <div className="mt-auto pt-3 flex items-center gap-1.5 border-t border-border/40">
          <Button
            asChild
            variant="default"
            className="flex-1 gap-1 rounded-xl font-bold text-[11px] h-9 px-2"
            size="sm"
          >
            <Link href={`/books/${book.slug}/recite`}>
              <Mic className="h-3.5 w-3.5 shrink-0" />
              تسميع
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="flex-1 gap-1 rounded-xl font-bold text-[11px] h-9 px-2 bg-transparent hover:bg-muted"
            size="sm"
          >
            <Link href={`/books/${book.slug}`}>
              <Info className="h-3.5 w-3.5 shrink-0" />
              التفاصيل
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
