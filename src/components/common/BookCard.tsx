import Image from 'next/image';
import Link from 'next/link';
import type { Book as BookType } from '@/types/book.types';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { BookOpen, Mic, Hash, Award, Info, Eye } from 'lucide-react';

export interface BookCardProps {
  book: BookType & { versesCount?: number };
  showProgress?: boolean;
  progressValue?: number;
  masteryScore?: number; // 0-100
}

// Beautiful gradient patterns for books without covers
const coverGradients = [
  'from-primary/30 via-primary/15 to-emerald-600/20',
  'from-amber-500/30 via-amber-400/15 to-yellow-300/20',
  'from-indigo-600/30 via-indigo-500/15 to-blue-400/20',
  'from-rose-500/30 via-rose-400/15 to-pink-300/20',
  'from-teal-600/30 via-teal-500/15 to-cyan-400/20',
  'from-violet-600/30 via-violet-500/15 to-purple-400/20',
];

const islamicPatternSvg = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60' viewBox='0 0 60 60'%3E%3Cg fill='none' stroke='%23000' stroke-width='0.4' stroke-opacity='0.12'%3E%3Cpath d='M30 0 L60 30 L30 60 L0 30 Z'/%3E%3Cpath d='M15 15 L45 15 L45 45 L15 45 Z'/%3E%3Ccircle cx='30' cy='30' r='10'/%3E%3C/g%3E%3C/svg%3E")`;

function getGradientIndex(title: string): number {
  let hash = 0;
  for (let i = 0; i < title.length; i++) {
    hash = (hash << 5) - hash + title.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) % coverGradients.length;
}

export function BookCard({ book, showProgress, progressValue = 0, masteryScore }: BookCardProps) {
  const gradientClass = coverGradients[getGradientIndex(book.title)];
  const versesCount = book.versesCount ?? 0;

  const canGetCertificate = masteryScore !== undefined && masteryScore >= 95;


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
          // Beautiful fallback design for books without covers
          <div
            className={`flex h-full items-center justify-center bg-gradient-to-br ${gradientClass} relative overflow-hidden`}
            style={{ backgroundImage: islamicPatternSvg }}
          >
            {/* Decorative circles */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-32 h-32 rounded-full border-2 border-current opacity-10" />
              <div className="absolute w-20 h-20 rounded-full border border-current opacity-15" />
            </div>
            {/* Title display */}
            <div className="relative z-10 flex flex-col items-center gap-3 p-6 text-center">
              <div className="text-4xl opacity-20">﴾﴿</div>
              <p className="text-base font-black text-foreground leading-snug line-clamp-4 px-2">
                {book.title}
              </p>
              <div className="text-xs opacity-40">◆</div>
              <p className="text-xs font-semibold text-muted-foreground line-clamp-1">
                {book.author}
              </p>
            </div>
          </div>
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

        {/* Actions */}
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
            <Link href={`/books/${book.slug}/read`}>
              <Eye className="h-3.5 w-3.5 shrink-0" />
              عرض وتحميل
            </Link>
          </Button>
          <Button
            asChild
            variant="ghost"
            className="h-9 w-9 rounded-xl p-0 hover:bg-muted text-muted-foreground hover:text-foreground shrink-0"
            size="sm"
            title="التفاصيل"
          >
            <Link href={`/books/${book.slug}`}>
              <Info className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
