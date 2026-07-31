'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Search, X, History, TrendingUp, BookOpen, User, Layers, ArrowRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { Book } from '@/types/book.types';
import type { Author } from '@/lib/data/authors.data';
import type { Science } from '@/lib/data/sciences.data';

interface SearchClientPageProps {
  initialQuery: string;
  allBooks: Book[];
  allAuthors: Author[];
  allSciences: Science[];
}

const POPULAR_SEARCHES = [
  'الأجرومية',
  'ألفية ابن مالك',
  'البيقونية',
  'مصطلح الحديث',
  'العقيدة الطحاوية',
  'النووي',
  'ابن تيمية',
  'الشاطبية',
];

const LOCAL_STORAGE_KEY = 'motoon_recent_searches';

export function SearchClientPage({
  initialQuery,
  allBooks,
  allAuthors,
  allSciences,
}: SearchClientPageProps) {
  const [query, setQuery] = useState(initialQuery);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  // Load recent searches from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        setRecentSearches(JSON.parse(stored));
      }
    } catch {
      // ignore storage errors
    }
  }, []);

  const handleSearchSubmit = (searchTerm: string) => {
    const trimmed = searchTerm.trim();
    if (!trimmed) return;

    setQuery(trimmed);

    // Save to recent
    try {
      const updated = [trimmed, ...recentSearches.filter((s) => s !== trimmed)].slice(0, 5);
      setRecentSearches(updated);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignore storage errors
    }

    // Update URL query parameter cleanly
    const url = new URL(window.location.href);
    url.searchParams.set('q', trimmed);
    window.history.pushState({}, '', url.toString());
  };

  const clearRecent = () => {
    setRecentSearches([]);
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  };

  // Filter books, authors, sciences
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return { books: [], authors: [], sciences: [] };

    const books = allBooks.filter(
      (b) =>
        b.title.toLowerCase().includes(q) ||
        b.author.toLowerCase().includes(q) ||
        b.description.toLowerCase().includes(q) ||
        b.tags?.some((t) => t.toLowerCase().includes(q))
    );

    const authors = allAuthors.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        a.shortName.toLowerCase().includes(q) ||
        a.bio.toLowerCase().includes(q)
    );

    const sciences = allSciences.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.shortDescription.toLowerCase().includes(q) ||
        s.keyTopics.some((t) => t.toLowerCase().includes(q))
    );

    return { books, authors, sciences };
  }, [query, allBooks, allAuthors, allSciences]);

  const totalResults = results.books.length + results.authors.length + results.sciences.length;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Search Input Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSearchSubmit(query);
        }}
        className="relative"
      >
        <div className="relative flex items-center">
          <Search className="absolute right-4 h-6 w-6 text-muted-foreground" />
          <Input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ابحث عن متن، مؤلف، أو علم شرعي..."
            className="w-full h-14 pr-13 pl-12 text-lg rounded-2xl border-2 border-primary/30 focus-visible:border-primary shadow-sm"
            autoFocus
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="absolute left-4 p-1.5 rounded-full hover:bg-muted text-muted-foreground"
              aria-label="مسح البحث"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
      </form>

      {/* Popular & Recent Chips (When query is empty) */}
      {!query.trim() && (
        <div className="space-y-6">
          {/* Recent Searches */}
          {recentSearches.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                  <History className="h-4 w-4 text-primary" />
                  عمليات البحث الأخيرة
                </span>
                <button
                  type="button"
                  onClick={clearRecent}
                  className="text-xs text-muted-foreground hover:text-destructive transition-colors font-medium"
                >
                  مسح السجل
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                {recentSearches.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => handleSearchSubmit(item)}
                    className="text-xs font-bold px-3 py-1.5 rounded-xl border bg-card hover:bg-muted hover:border-primary/40 transition-colors flex items-center gap-1"
                  >
                    <History className="h-3 w-3 text-muted-foreground" />
                    {item}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Popular Searches */}
          <div className="space-y-3">
            <span className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
              <TrendingUp className="h-4 w-4 text-primary" />
              الأكثر بحثاً في متون
            </span>

            <div className="flex flex-wrap gap-2">
              {POPULAR_SEARCHES.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => handleSearchSubmit(item)}
                  className="text-xs font-bold px-3.5 py-2 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-colors flex items-center gap-1.5"
                >
                  <Search className="h-3 w-3" />
                  {item}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Search Results Display */}
      {query.trim() && (
        <div className="space-y-8">
          <div className="flex items-center justify-between border-b pb-4">
            <h2 className="text-xl font-bold text-foreground">
              نتائج البحث عن: <span className="text-primary">"{query}"</span>
            </h2>
            <span className="text-sm font-semibold text-muted-foreground">
              عُثر على {totalResults} نتيجة
            </span>
          </div>

          {totalResults === 0 ? (
            <div className="text-center py-12 space-y-4">
              <p className="text-lg font-bold text-muted-foreground">
                لم نجد نتائج مطابقة لـ "{query}"
              </p>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                جرّب البحث بكلمات أعم مثل "نحو"، "فقه"، "النووي"، أو اختر من الكلمات الأكثر بحثاً أعلاه.
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Books Results */}
              {results.books.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-primary" />
                    المتون والكتب ({results.books.length})
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {results.books.map((book) => (
                      <Link
                        key={book.id}
                        href={`/books/${book.slug}`}
                        className="group flex gap-4 p-4 rounded-2xl border bg-card hover:border-primary/40 hover:shadow-md transition-all"
                      >
                        <div className="relative w-16 h-20 rounded-lg overflow-hidden bg-muted shrink-0">
                          {book.coverImageUrl ? (
                            <Image
                              src={book.coverImageUrl}
                              alt={book.title}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center bg-primary/10 text-primary font-bold text-xs">
                              {book.title}
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-base text-foreground group-hover:text-primary transition-colors truncate">
                            {book.title}
                          </h4>
                          <p className="text-xs text-muted-foreground truncate mt-0.5">
                            المؤلف: {book.author}
                          </p>
                          <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                            {book.description}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Authors Results */}
              {results.authors.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                    <User className="h-5 w-5 text-primary" />
                    العلماء والمؤلفون ({results.authors.length})
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {results.authors.map((author) => (
                      <Link
                        key={author.id}
                        href={`/authors/${author.slug}`}
                        className="group flex gap-3 p-4 rounded-2xl border bg-card hover:border-primary/40 hover:shadow-md transition-all items-center"
                      >
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                          <User className="h-6 w-6" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-base text-foreground group-hover:text-primary transition-colors truncate">
                            {author.name}
                          </h4>
                          <span className="text-xs text-muted-foreground block">
                            توفي: {author.era}
                          </span>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary rtl:rotate-180" />
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Sciences Results */}
              {results.sciences.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                    <Layers className="h-5 w-5 text-primary" />
                    العلوم الشرعية ({results.sciences.length})
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {results.sciences.map((science) => (
                      <Link
                        key={science.id}
                        href={`/sciences/${science.slug}`}
                        className="group flex gap-3 p-4 rounded-2xl border bg-card hover:border-primary/40 hover:shadow-md transition-all items-center"
                      >
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${science.color} shrink-0`}>
                          <Layers className="h-6 w-6" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-base text-foreground group-hover:text-primary transition-colors truncate">
                            {science.name}
                          </h4>
                          <span className="text-xs text-muted-foreground line-clamp-1">
                            {science.shortDescription}
                          </span>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary rtl:rotate-180" />
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
