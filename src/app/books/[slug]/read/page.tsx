
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { booksService } from '@/services/firebase/books.service';
import { versesService } from '@/services/firebase/verses.service';
import { getLocalBookBySlug } from '@/lib/data';
import { BookReaderClient } from './BookReaderClient';

type Params = { slug: string };

export async function generateMetadata(
  props: { params: Promise<Params> }
): Promise<Metadata> {
  const params = await props.params;
  const decodedSlug = decodeURIComponent(params.slug);
  
  let book = null;
  const localData = getLocalBookBySlug(decodedSlug);
  if (localData) {
    book = localData.book;
  } else {
    book = await booksService.getBySlug(decodedSlug);
  }

  if (!book) {
    return {
      title: 'متن غير موجود | متون',
    };
  }

  return {
    title: `عرض وقراءة ${book.title} | متون`,
    description: `اقرأ وحمّل متن ${book.title} بأبياته الكاملة ومنسقة للتحميل والطباعة كـ PDF أو ملف نصي TXT.`,
    openGraph: {
      title: `عرض وقراءة ${book.title} | متون`,
      description: `اقرأ وحمّل متن ${book.title} بأبياته الكاملة ومنسقة للتحميل والطباعة كـ PDF أو ملف نصي TXT.`,
      locale: 'ar_SA',
      type: 'website',
      images: book.coverImageUrl ? [{ url: book.coverImageUrl }] : [],
    },
  };
}

export default async function BookReadPage(
  props: { params: Promise<Params> }
) {
  const params = await props.params;
  const decodedSlug = decodeURIComponent(params.slug);
  
  let book = null;
  let verses: any[] = [];
  
  const localData = getLocalBookBySlug(decodedSlug);
  if (localData) {
    book = localData.book;
    verses = localData.verses;
  } else {
    book = await booksService.getBySlug(decodedSlug);
    if (book) {
      verses = await versesService.getByBookId(book.id);
    }
  }

  if (!book) {
    notFound();
  }

  // Sanitize data to remove any non-plain object methods/timestamps before sending to client component
  const sanitizedBook = JSON.parse(JSON.stringify(book));
  const sanitizedVerses = JSON.parse(JSON.stringify(verses));

  return (
    <BookReaderClient 
      book={sanitizedBook} 
      verses={sanitizedVerses} 
    />
  );
}
