import type { Metadata } from 'next';
import { Suspense } from 'react';
import { BookCard } from '@/components/common/BookCard';
import { booksService } from '@/services/firebase/books.service';
import { getAllLocalBooks } from '@/lib/data';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';


export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'المتون | متون',
    description: 'تصفح قائمة المتون الشرعية المتاحة للحفظ والدراسة في منصة متون.',
    openGraph: {
      title: 'المتون | متون',
      description: 'تصفح قائمة المتون الشرعية المتاحة للحفظ والدراسة في منصة متون.',
      locale: 'ar_SA',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
    },
  };
}

export default async function BooksPage(props: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await props.searchParams;
  const query = typeof searchParams?.q === 'string' ? searchParams.q : '';
  const difficulty = typeof searchParams?.difficulty === 'string' ? searchParams.difficulty : '';

  return (
    <div className="container-motoon py-12 section-padding min-h-screen">
      <div className="mb-10">
        <h1 className="mb-4 text-3xl font-bold md:text-4xl">تصفح المتون</h1>
        <p className="text-muted-foreground">اختر المتن المناسب وابدأ رحلة الحفظ والإتقان.</p>
      </div>

      {/* Filters & Search - This would ideally be a client component for interactive updates, 
          but as per requirements, using server-rendered forms or simple UI for now.
          To keep it server component focused, we can use a standard form with GET method. */}
      <div className="mb-8 rounded-xl border bg-card p-4 shadow-sm">
        <form method="GET" action="/books" className="flex flex-col gap-4 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input 
              name="q" 
              defaultValue={query} 
              placeholder="ابحث عن متن..." 
              className="pl-4 pr-10" 
            />
          </div>
          <div className="w-full sm:w-48 flex gap-2">
            <select 
              name="difficulty" 
              defaultValue={difficulty}
              className="flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">جميع المستويات</option>
              <option value="beginner">مبتدئ</option>
              <option value="intermediate">متوسط</option>
              <option value="advanced">متقدم</option>
            </select>
            <button type="submit" className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
              تصفية
            </button>
          </div>
        </form>
      </div>

      <Suspense fallback={<BooksLoadingGrid />}>
        <BooksGrid query={query} difficulty={difficulty} />
      </Suspense>
    </div>
  );
}

async function BooksGrid({ query, difficulty }: { query: string; difficulty: string }) {
  // 1. Load local books (always available, offline-ready)
  const localBooks = getAllLocalBooks();

  // 2. Try to fetch Firebase books (admin-added)
  let firebaseBooks: any[] = [];
  try {
    const res = await booksService.getAll({ onlyPublished: true });
    firebaseBooks = res.books;
  } catch (err) {
    console.error('Error fetching books from Firebase:', err);
    // Continue with local books only
  }

  // 3. Merge: Firebase books take priority over local (by slug)
  const slugSet = new Set<string>();
  let allBooks: any[] = [];

  // Add Firebase books first (they take priority)
  for (const book of firebaseBooks) {
    if (!slugSet.has(book.slug)) {
      slugSet.add(book.slug);
      allBooks.push(book);
    }
  }

  // Add local books that don't conflict with Firebase
  for (const book of localBooks) {
    if (!slugSet.has(book.slug)) {
      slugSet.add(book.slug);
      allBooks.push(book);
    }
  }

  // 4. Apply filters
  if (query) {
    allBooks = allBooks.filter(b => b.title.includes(query) || b.author.includes(query));
  }

  if (difficulty) {
    allBooks = allBooks.filter(b => b.difficulty === difficulty);
  }

  if (allBooks.length === 0) {
    return (
      <div className="flex min-h-[300px] flex-col items-center justify-center rounded-xl border border-dashed text-center p-8">
        <p className="mb-2 text-lg font-medium">لم نتمكن من العثور على متون مطابقة للبحث</p>
        <p className="text-muted-foreground">جرب كلمات مفتاحية أخرى أو قم بتغيير التصنيف</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {allBooks.map((book) => (
        <BookCard key={book.id} book={book} />
      ))}
    </div>
  );
}

function BooksLoadingGrid() {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
        <div key={i} className="flex flex-col rounded-xl border bg-card shadow-sm h-[360px] animate-pulse">
          <div className="aspect-[3/4] w-full bg-muted rounded-t-xl"></div>
          <div className="p-4 flex flex-col gap-2">
            <div className="h-6 w-3/4 bg-muted rounded"></div>
            <div className="h-4 w-1/2 bg-muted rounded"></div>
            <div className="mt-4 h-4 w-1/3 bg-muted rounded"></div>
          </div>
        </div>
      ))}
    </div>
  );
}
