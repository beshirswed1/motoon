import React from 'react';
import Link from 'next/link';
import { User, BookOpen, ArrowRight } from 'lucide-react';
import { getAuthorByName } from '@/lib/data/authors.data';

interface AuthorCardProps {
  authorName: string;
}

export function AuthorCard({ authorName }: AuthorCardProps) {
  const author = getAuthorByName(authorName);

  return (
    <div className="p-6 rounded-3xl border border-border/60 bg-card shadow-sm my-8">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
          <User className="w-6 h-6" />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between flex-wrap gap-2 mb-1">
            <h3 className="font-bold text-lg text-foreground">{authorName}</h3>
            {author && (
              <span className="text-xs font-semibold text-muted-foreground px-2.5 py-0.5 rounded-full bg-muted">
                {author.era}
              </span>
            )}
          </div>

          <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3 mb-3">
            {author?.bio || `عالم ومؤلف إسلامي جليل، نظم متوناً علمية مباركة انتفع بها طلبة العلم في مختلف العصور.`}
          </p>

          {author && (
            <Link
              href={`/authors/${author.slug}`}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline"
            >
              <span>تعرف على ترجمة ورسائل {author.shortName}</span>
              <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
