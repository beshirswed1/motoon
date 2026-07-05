import { collection, doc, getDocs, setDoc, updateDoc, query, where, orderBy, limit, Timestamp } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { Progress } from '../../types/progress.types';
import { runFirebaseOp } from './errorHandler';

const COLLECTION = 'progress';

export const progressService = {
  getUserProgress: async (userId: string, bookId?: string): Promise<Progress[]> => {
    return runFirebaseOp(async () => {
      let q = query(
        collection(db, COLLECTION),
        where('userId', '==', userId),
        where('isDeleted', '==', false)
      );
      if (bookId) {
        q = query(q, where('bookId', '==', bookId));
      }
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => doc.data() as Progress);
    });
  },

  getDueForReview: async (userId: string, limitCount: number = 50): Promise<Progress[]> => {
    return runFirebaseOp(async () => {
      const now = Timestamp.now();
      const q = query(
        collection(db, COLLECTION),
        where('userId', '==', userId),
        where('isDeleted', '==', false),
        where('nextReviewDate', '<=', now),
        orderBy('nextReviewDate', 'asc'),
        limit(limitCount)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => doc.data() as Progress);
    });
  },

  createOrUpdate: async (progress: Progress): Promise<void> => {
    return runFirebaseOp(async () => {
      const progressRef = doc(db, COLLECTION, progress.id);
      await setDoc(progressRef, {
        ...progress,
        updatedAt: Timestamp.now()
      }, { merge: true }); // Using merge true handles create vs update gracefully
    });
  },

  softDelete: async (id: string, deletedBy: string): Promise<void> => {
    return runFirebaseOp(async () => {
      const progressRef = doc(db, COLLECTION, id);
      await updateDoc(progressRef, {
        isDeleted: true,
        deletedAt: Timestamp.now(),
        deletedBy,
        updatedAt: Timestamp.now()
      });
    });
  }
};
