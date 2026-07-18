import type { MetadataRoute } from 'next';
import { booksService } from '@/services/firebase/books.service';
import { getAllLocalBooks } from '@/lib/data';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.motoon.com.tr';

  // Base static routes
  const routes = [
    '',
    '/about',
    '/contact',
    '/privacy',
    '/terms',
    '/books',
  ];

  const staticEntries = routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: route === '' ? 1.0 : 0.8,
  }));

  // Fetch dynamic books (Firebase + Local)
  let firebaseBooks: any[] = [];
  try {
    const res = await booksService.getAll({ pageSize: 100, onlyPublished: true });
    firebaseBooks = res.books || [];
  } catch (err) {
    console.error('Error fetching firebase books for sitemap:', err);
  }

  let localBooks: any[] = [];
  try {
    localBooks = getAllLocalBooks();
  } catch (err) {
    console.error('Error fetching local books for sitemap:', err);
  }

  // Merge books (Firebase takes priority, similar to the main books page logic)
  const slugSet = new Set<string>();
  const allBooks: any[] = [];

  for (const book of firebaseBooks) {
    if (book?.slug && !slugSet.has(book.slug)) {
      slugSet.add(book.slug);
      allBooks.push(book);
    }
  }

  for (const book of localBooks) {
    if (book?.slug && !slugSet.has(book.slug)) {
      slugSet.add(book.slug);
      allBooks.push(book);
    }
  }

  // Create dynamic sitemap entries for each book:
  // 1. Details page: /books/[slug]
  // 2. Read page: /books/[slug]/read
  const bookEntries = allBooks.flatMap((book) => {
    let lastMod = new Date();
    if (book.updatedAt) {
      if (typeof book.updatedAt.toDate === 'function') {
        lastMod = book.updatedAt.toDate();
      } else if (typeof book.updatedAt.seconds === 'number') {
        lastMod = new Date(book.updatedAt.seconds * 1000);
      } else {
        lastMod = new Date(book.updatedAt);
      }
    }

    return [
      {
        url: `${baseUrl}/books/${encodeURIComponent(book.slug)}`,
        lastModified: lastMod,
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      },
      {
        url: `${baseUrl}/books/${encodeURIComponent(book.slug)}/read`,
        lastModified: lastMod,
        changeFrequency: 'weekly' as const,
        priority: 0.6,
      },
    ];
  });

  return [...staticEntries, ...bookEntries];
}
