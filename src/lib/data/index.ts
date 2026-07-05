import type { Book, Verse } from '@/types';

// Import all local book data
import bayquniyyahData from './books/bayquniyyah.json';
import tuhfatAlAtfalData from './books/tuhfat_al_atfal.json';
import alAjrumiyyahData from './books/al_ajrumiyyah.json';
import alJazariyyahData from './books/al_jazariyyah.json';
import alDurrahAlMudiyyahData from './books/al_durrah_al_mudiyyah.json';
import alfiyyatIbnMalikData from './books/alfiyyat_ibn_malik.json';
import mulhatAlIrabData from './books/mulhat_al_irab.json';
import alShatibiyyahData from './books/al_shatibiyyah.json';
import alZubadData from './books/al_zubad.json';

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

// Registry of all local books
const localBooksRegistry: Record<string, LocalBookData> = {
  'bayquniyyah': bayquniyyahData as unknown as LocalBookData,
  'tuhfat-al-atfal': tuhfatAlAtfalData as unknown as LocalBookData,
  'al-ajrumiyyah': alAjrumiyyahData as unknown as LocalBookData,
  'al-jazariyyah': alJazariyyahData as unknown as LocalBookData,
  'al-durrah-al-mudiyyah': alDurrahAlMudiyyahData as unknown as LocalBookData,
  'alfiyyat-ibn-malik': alfiyyatIbnMalikData as unknown as LocalBookData,
  'mulhat-al-irab': mulhatAlIrabData as unknown as LocalBookData,
  'al-shatibiyyah': alShatibiyyahData as unknown as LocalBookData,
  'al-zubad': alZubadData as unknown as LocalBookData,
};

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
  const data = localBooksRegistry[slug];
  if (!data) return null;
  return mapLocalBookToAppTypes(data);
}

/**
 * Get all local books (without verses for listing purposes).
 */
export function getAllLocalBooks(): Book[] {
  return Object.values(localBooksRegistry).map((data) => {
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
