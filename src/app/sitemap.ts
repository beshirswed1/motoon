import type { MetadataRoute } from 'next';
import { booksService } from '@/services/firebase/books.service';
import { getAllLocalBooks } from '@/lib/data';
import { AUTHORS } from '@/lib/data/authors.data';
import { SCIENCES } from '@/lib/data/sciences.data';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const rawAppUrl = process.env.NEXT_PUBLIC_APP_URL;
  const baseUrl = rawAppUrl && !rawAppUrl.includes('localhost')
    ? rawAppUrl.replace(/\/$/, '')
    : 'https://www.motoon.com.tr';

  const now = new Date();

  // Base static routes with proper priorities
  const staticRoutes = [
    { route: '', priority: 1.0, changeFrequency: 'daily' as const },
    { route: '/books', priority: 0.9, changeFrequency: 'daily' as const },
    { route: '/sciences', priority: 0.9, changeFrequency: 'weekly' as const },
    { route: '/authors', priority: 0.9, changeFrequency: 'weekly' as const },
    { route: '/search', priority: 0.8, changeFrequency: 'daily' as const },
    { route: '/about', priority: 0.7, changeFrequency: 'monthly' as const },
    { route: '/contact', priority: 0.7, changeFrequency: 'monthly' as const },
    { route: '/privacy', priority: 0.4, changeFrequency: 'yearly' as const },
    { route: '/terms', priority: 0.4, changeFrequency: 'yearly' as const },
  ];

  const staticEntries = staticRoutes.map(({ route, priority, changeFrequency }) => ({
    url: `${baseUrl}${route}`,
    lastModified: now,
    changeFrequency,
    priority,
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

  // Book Entries (/books/[slug] & /books/[slug]/read)
  const bookEntries = allBooks.flatMap((book) => {
    let lastMod = now;
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
        priority: 0.8,
      },
      {
        url: `${baseUrl}/books/${encodeURIComponent(book.slug)}/read`,
        lastModified: lastMod,
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      },
    ];
  });

  // Author Entries (/authors/[slug])
  const authorEntries = AUTHORS.map((author) => ({
    url: `${baseUrl}/authors/${encodeURIComponent(author.slug)}`,
    lastModified: now,
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  // Science Entries (/sciences/[slug])
  const scienceEntries = SCIENCES.map((science) => ({
    url: `${baseUrl}/sciences/${encodeURIComponent(science.slug)}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  return [
    ...staticEntries,
    ...bookEntries,
    ...authorEntries,
    ...scienceEntries,
  ];
}
