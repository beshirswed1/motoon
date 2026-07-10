'use client';

import { useState, useEffect } from 'react';
import { useFavorites } from '@/hooks/useFavorites';
import { BookCard } from '@/components/common/BookCard';
import { booksService } from '@/services/firebase/books.service';
import { getAllLocalBooks } from '@/lib/data';
import { Heart, Loader2, BookOpen } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function FavoritesPage() {
  const { favoriteIds, loading: favsLoading } = useFavorites();
  const [allBooks, setAllBooks] = useState<any[]>([]);
  const [loadingBooks, setLoadingBooks] = useState(true);

  // Load all books to cross-reference with favorites
  useEffect(() => {
    async function loadBooks() {
      try {
        const localBooks = getAllLocalBooks();
        let firebaseBooks: any[] = [];
        try {
          const res = await booksService.getAll({ onlyPublished: true });
          firebaseBooks = res.books;
        } catch {
          // fallback to local only
        }

        const slugSet = new Set<string>();
        const merged: any[] = [];
        for (const b of firebaseBooks) {
          if (!slugSet.has(b.slug)) { slugSet.add(b.slug); merged.push(b); }
        }
        for (const b of localBooks) {
          if (!slugSet.has(b.slug)) { slugSet.add(b.slug); merged.push(b); }
        }
        setAllBooks(JSON.parse(JSON.stringify(merged)));
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingBooks(false);
      }
    }
    loadBooks();
  }, []);

  const loading = favsLoading || loadingBooks;
  const favoriteBooks = allBooks.filter(b => favoriteIds.has(b.id));

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="text-sm font-semibold text-muted-foreground">جاري تحميل المفضلة...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-black flex items-center gap-3">
          <Heart className="h-8 w-8 text-red-500 fill-current" />
          المفضلة
        </h1>
        <p className="text-muted-foreground text-sm mt-1">المتون التي حفظتها في قائمة المفضلة.</p>
      </div>

      {favoriteBooks.length === 0 ? (
        <div className="flex min-h-[300px] flex-col items-center justify-center rounded-2xl border border-dashed text-center p-8 bg-card">
          <Heart className="h-16 w-16 text-muted-foreground/20 mb-4" />
          <p className="mb-2 text-lg font-bold text-foreground">قائمة المفضلة فارغة</p>
          <p className="text-muted-foreground text-sm mb-6">
            تصفح المتون وأضف ما يعجبك إلى المفضلة بالنقر على أيقونة القلب
          </p>
          <Button asChild className="rounded-xl font-bold">
            <Link href="/books">
              <BookOpen className="h-4 w-4 ml-2" />
              تصفح المتون
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {favoriteBooks.map((book) => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>
      )}
    </div>
  );
}
