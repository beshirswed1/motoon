import { collection, doc, getDocs, updateDoc, query, where, orderBy, writeBatch, Timestamp } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { Verse, ParsedVerse } from '../../types/verse.types';

const COLLECTION = 'verses';

export const versesService = {
  getByBookId: async (bookId: string): Promise<Verse[]> => {
    const q = query(
      collection(db, 'books', bookId, COLLECTION),
      where('isDeleted', '==', false),
      orderBy('order', 'asc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as Verse);
  },

  batchCreateVerses: async (bookId: string, verses: ParsedVerse[]): Promise<void> => {
    const chunks = [];
    const chunkSize = 499; 
    
    for (let i = 0; i < verses.length; i += chunkSize) {
      chunks.push(verses.slice(i, i + chunkSize));
    }

    for (const chunk of chunks) {
      const batch = writeBatch(db);
      chunk.forEach(verse => {
        const verseId = `${bookId}_v_${verse.order}_${Math.random().toString(36).substr(2, 9)}`;
        const verseRef = doc(db, 'books', bookId, COLLECTION, verseId);
        const newVerse: Verse = {
          id: verseId,
          bookId,
          text: verse.text,
          normalizedText: verse.normalizedText,
          order: verse.order,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
          isDeleted: false,
          deletedAt: null,
          deletedBy: null,
        };
        batch.set(verseRef, newVerse);
      });
      await batch.commit();
    }
  },

  update: async (bookId: string, id: string, data: Partial<Omit<Verse, 'id' | 'createdAt'>>): Promise<void> => {
    const verseRef = doc(db, 'books', bookId, COLLECTION, id);
    await updateDoc(verseRef, {
      ...data,
      updatedAt: Timestamp.now()
    });
  },

  softDelete: async (bookId: string, id: string, deletedBy: string): Promise<void> => {
    const verseRef = doc(db, 'books', bookId, COLLECTION, id);
    await updateDoc(verseRef, {
      isDeleted: true,
      deletedAt: Timestamp.now(),
      deletedBy,
      updatedAt: Timestamp.now()
    });
  }
};
