import type { Book, Verse } from '@/types';
import fs from 'fs';
import path from 'path';

export interface LocalVerseData {
  id: string;
  bookId: string;
  text: string;
  normalizedText: string;
  order: number;
  isDeleted: boolean;
  deletedAt: string | null;
  deletedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LocalBookData {
  id: string;
  title: string;
  author: string;
  description: string;
  coverImageUrl: string;
  difficulty: string;
  slug: string;
  status: string;
  tags: string[];
  verses: LocalVerseData[];
  isPublished: boolean;
  isDeleted: boolean;
  deletedAt: string | null;
  deletedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

// ── Dynamic loading: auto-discover all JSON files in ./books/ ──
// Reads the directory at build/runtime so adding a new .json file
// is all that's needed — no manual imports required.
function loadAllBooks(): Record<string, LocalBookData> {
  const registry: Record<string, LocalBookData> = {};
  const booksDir = path.join(process.cwd(), 'src', 'lib', 'data', 'books');

  try {
    const files = fs.readdirSync(booksDir).filter((f) => f.endsWith('.json'));

    for (const file of files) {
      const filePath = path.join(booksDir, file);
      const raw = fs.readFileSync(filePath, 'utf-8');
      const data: LocalBookData = JSON.parse(raw);
      if (data?.slug) {
        registry[data.slug] = data;
      }
    }
  } catch (err) {
    console.error('Failed to load local books:', err);
  }

  return registry;
}

// Cache the registry so we only read from disk once per process
let _cachedRegistry: Record<string, LocalBookData> | null = null;

function getRegistry(): Record<string, LocalBookData> {
  if (!_cachedRegistry) {
    _cachedRegistry = loadAllBooks();
  }
  return _cachedRegistry;
}

/**
 * Convert a local book's data into the Book and Verse types used by the app.
 */
function mapLocalBookToAppTypes(data: LocalBookData): { book: Book; verses: Verse[] } {
  const nowTimestamp = { seconds: Date.now() / 1000, nanoseconds: 0 } as any;

  const book: Book = {
    id: data.id,
    title: data.title,
    slug: data.slug,
    description: data.description,
    author: data.author,
    status: data.status as 'draft' | 'published' | 'archived',
    difficulty: data.difficulty as Book['difficulty'],
    tags: data.tags,
    isPublished: data.isPublished,
    versesCount: data.verses.length,
    createdAt: nowTimestamp,
    updatedAt: nowTimestamp,
    isDeleted: false,
    deletedAt: null,
    deletedBy: null,
  };

  if (data.coverImageUrl) {
    book.coverImageUrl = data.coverImageUrl;
  }

  const verses: Verse[] = data.verses.map((v) => ({
    id: v.id,
    bookId: v.bookId,
    text: v.text,
    normalizedText: v.normalizedText,
    order: v.order,
    createdAt: nowTimestamp,
    updatedAt: nowTimestamp,
    isDeleted: false,
    deletedAt: null,
    deletedBy: null,
  }));

  return { book, verses };
}

/**
 * Get a specific local book by its slug.
 */
export function getLocalBookBySlug(slug: string) {
  const data = getRegistry()[slug];
  if (!data) return null;
  return mapLocalBookToAppTypes(data);
}

/**
 * Get all local books (without verses for listing purposes).
 */
export function getAllLocalBooks(): Book[] {
  return Object.values(getRegistry()).map((data) => {
    const nowTimestamp = { seconds: Date.now() / 1000, nanoseconds: 0 } as any;
    const book: Book = {
      id: data.id,
      title: data.title,
      slug: data.slug,
      description: data.description,
      author: data.author,
      status: data.status as 'draft' | 'published' | 'archived',
      difficulty: data.difficulty as Book['difficulty'],
      tags: data.tags,
      isPublished: data.isPublished,
      versesCount: data.verses.length,
      createdAt: nowTimestamp,
      updatedAt: nowTimestamp,
      isDeleted: false,
      deletedAt: null,
      deletedBy: null,
    };
    
    if (data.coverImageUrl) {
      book.coverImageUrl = data.coverImageUrl;
    }
    
    return book;
  });
}
