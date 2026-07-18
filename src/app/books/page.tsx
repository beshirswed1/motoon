import type { Metadata } from 'next';
import { booksService } from '@/services/firebase/books.service';
import { getAllLocalBooks } from '@/lib/data';
import { BooksClientPage } from '@/features/books/components/BooksClientPage';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'المتون | متون',
    description: 'تصفح قائمة المتون الشرعية المتاحة للحفظ والدراسة في منصة متون.',
    openGraph: {
      title: 'المتون | متون',
      description: 'تصفح قائمة المتون الشرعية المتاحة للحفظ والدراسة في منصة متون.',
      locale: 'ar_SA',
      type: 'website',
      url: 'https://www.motoon.com.tr/books',
      images: [
        {
          url: 'https://www.motoon.com.tr/logo.png',
          width: 1200,
          height: 630,
          alt: 'شعار منصة متون',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: 'المتون | متون',
      description: 'تصفح قائمة المتون الشرعية المتاحة للحفظ والدراسة في منصة متون.',
      images: ['https://www.motoon.com.tr/logo.png'],
    },
  };
}

export default async function BooksPage(props: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await props.searchParams;
  const initialCategory = typeof searchParams?.category === 'string' ? searchParams.category : '';

  // Load local books (always available, offline-ready)
  const localBooks = getAllLocalBooks();

  // Try to fetch Firebase books (admin-added)
  let firebaseBooks: any[] = [];
  try {
    const res = await booksService.getAll({ onlyPublished: true });
    firebaseBooks = res.books;
  } catch (err) {
    console.error('Error fetching books from Firebase:', err);
  }

  // Merge: Firebase books take priority over local (by slug)
  const slugSet = new Set<string>();
  let allBooks: any[] = [];

  for (const book of firebaseBooks) {
    if (!slugSet.has(book.slug)) {
      slugSet.add(book.slug);
      allBooks.push(book);
    }
  }

  for (const book of localBooks) {
    if (!slugSet.has(book.slug)) {
      slugSet.add(book.slug);
      allBooks.push(book);
    }
  }

  // Sanitize books to remove Firebase Timestamp prototype methods
  const sanitizedBooks = JSON.parse(JSON.stringify(allBooks));

  return <BooksClientPage allBooks={sanitizedBooks} initialCategory={initialCategory} />;
}
