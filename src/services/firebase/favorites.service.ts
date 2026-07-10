import { collection, doc, setDoc, deleteDoc, getDocs, query, where, Timestamp } from 'firebase/firestore';
import { db } from '../../firebase/config';

const COLLECTION = 'favorites';

export const favoritesService = {
  /** Add a book to favorites */
  add: async (userId: string, bookId: string): Promise<void> => {
    const favId = `${userId}_${bookId}`;
    await setDoc(doc(db, COLLECTION, favId), {
      userId,
      bookId,
      createdAt: Timestamp.now(),
    });
  },

  /** Remove a book from favorites */
  remove: async (userId: string, bookId: string): Promise<void> => {
    const favId = `${userId}_${bookId}`;
    await deleteDoc(doc(db, COLLECTION, favId));
  },

  /** Get all favorite book IDs for a user */
  getAll: async (userId: string): Promise<string[]> => {
    const q = query(collection(db, COLLECTION), where('userId', '==', userId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data().bookId);
  },
};
