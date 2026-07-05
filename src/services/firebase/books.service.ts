import { collection, doc, getDocs, setDoc, updateDoc, query, where, orderBy, limit, startAfter, Timestamp, DocumentSnapshot } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { Book } from '../../types/book.types';
import { runFirebaseOp } from './errorHandler';

const COLLECTION = 'books';

export const booksService = {
  getAll: async (filters?: { status?: string, difficulty?: string, lastDoc?: DocumentSnapshot, pageSize?: number, onlyPublished?: boolean }): Promise<{ books: Book[], lastDoc: DocumentSnapshot | null }> => {
    return runFirebaseOp(async () => {
      let q = query(collection(db, COLLECTION), where('isDeleted', '==', false));
      
      if (filters?.status) {
        q = query(q, where('status', '==', filters.status));
      }
      if (filters?.difficulty) {
        q = query(q, where('difficulty', '==', filters.difficulty));
      }
      if (filters?.onlyPublished) {
        q = query(q, where('isPublished', '==', true));
      }
      
      q = query(q, orderBy('createdAt', 'desc'));
      
      const pageSize = filters?.pageSize || 20;
      q = query(q, limit(pageSize));

      if (filters?.lastDoc) {
        q = query(q, startAfter(filters.lastDoc));
      }

      const snapshot = await getDocs(q);
      const books = snapshot.docs.map(doc => doc.data() as Book);
      const lastDoc = snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : null;

      return { books, lastDoc };
    });
  },

  getBySlug: async (slug: string, onlyPublished: boolean = true): Promise<Book | null> => {
    return runFirebaseOp(async () => {
      let q = query(
        collection(db, COLLECTION), 
        where('slug', '==', slug),
        where('isDeleted', '==', false)
      );
      if (onlyPublished) {
        q = query(q, where('isPublished', '==', true));
      }
      q = query(q, limit(1));
      const snapshot = await getDocs(q);
      if (snapshot.empty) return null;
      return snapshot.docs[0].data() as Book;
    });
  },

  create: async (book: Omit<Book, 'createdAt' | 'updatedAt' | 'isDeleted' | 'deletedAt' | 'deletedBy'>): Promise<Book> => {
    return runFirebaseOp(async () => {
      const newBook: Book = {
        ...book,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        isDeleted: false,
        deletedAt: null,
        deletedBy: null,
      };
      await setDoc(doc(db, COLLECTION, newBook.id), newBook);
      return newBook;
    });
  },

  update: async (id: string, data: Partial<Omit<Book, 'id' | 'createdAt'>>): Promise<void> => {
    return runFirebaseOp(async () => {
      const bookRef = doc(db, COLLECTION, id);
      await updateDoc(bookRef, {
        ...data,
        updatedAt: Timestamp.now()
      });
    });
  },

  softDelete: async (id: string, deletedBy: string): Promise<void> => {
    return runFirebaseOp(async () => {
      const bookRef = doc(db, COLLECTION, id);
      await updateDoc(bookRef, {
        isDeleted: true,
        deletedAt: Timestamp.now(),
        deletedBy,
        updatedAt: Timestamp.now()
      });
    });
  }
};
