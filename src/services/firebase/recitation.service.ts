import { collection, doc, getDocs, setDoc, query, where, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { RecitationSession } from '../../types/recitation.types';
import { runFirebaseOp } from './errorHandler';

const COLLECTION = 'recitation_sessions';

export const recitationService = {
  getUserSessions: async (userId: string, bookId?: string): Promise<RecitationSession[]> => {
    return runFirebaseOp(async () => {
      let q = query(
        collection(db, COLLECTION),
        where('userId', '==', userId),
        where('isDeleted', '==', false),
        orderBy('createdAt', 'desc')
      );
      
      if (bookId) {
        q = query(q, where('bookId', '==', bookId));
      }
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => doc.data() as RecitationSession);
    });
  },

  saveSession: async (session: Omit<RecitationSession, 'createdAt' | 'updatedAt' | 'isDeleted' | 'deletedAt' | 'deletedBy'>): Promise<void> => {
    return runFirebaseOp(async () => {
      const sessionRef = doc(db, COLLECTION, session.id);
      const newSession: RecitationSession = {
        ...session,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        isDeleted: false,
        deletedAt: null,
        deletedBy: null,
      };
      await setDoc(sessionRef, newSession);
    });
  },

  getAnalytics: async (userId: string): Promise<{ totalSessions: number, totalDuration: number, averageScore: number }> => {
    return runFirebaseOp(async () => {
      const q = query(
        collection(db, COLLECTION),
        where('userId', '==', userId),
        where('isDeleted', '==', false)
      );
      const snapshot = await getDocs(q);
      const sessions = snapshot.docs.map(doc => doc.data() as RecitationSession);
      
      const totalSessions = sessions.length;
      const totalDuration = sessions.reduce((acc, curr) => acc + curr.durationSeconds, 0);
      const averageScore = totalSessions > 0 
        ? sessions.reduce((acc, curr) => acc + curr.score, 0) / totalSessions 
        : 0;

      return { totalSessions, totalDuration, averageScore };
    });
  }
};
