import { collection, doc, setDoc, getDocs, query, where, orderBy, limit, Timestamp } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { ActivityLog } from '../../types/admin.types';
import { nanoid } from 'nanoid';

export const activityLogService = {
  log: async (userId: string, type: string, details: Record<string, any>): Promise<void> => {
    const logId = nanoid();
    const logRef = doc(db, 'activity_logs', logId);
    
    const newLog: ActivityLog = {
      id: logId,
      userId,
      type: type as any, // Cast to type specified in type definition
      details,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      isDeleted: false,
      deletedAt: null,
      deletedBy: null
    };

    await setDoc(logRef, newLog);
  },

  getAll: async (limitCount: number = 20): Promise<ActivityLog[]> => {
    const q = query(
      collection(db, 'activity_logs'),
      where('isDeleted', '==', false),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    try {
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => doc.data() as ActivityLog);
    } catch (e) {
      // Fallback query in case firestore index is not ready yet for composite where+orderBy
      const simpleQuery = query(
        collection(db, 'activity_logs'),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
      const snapshot = await getDocs(simpleQuery);
      return snapshot.docs.map(doc => doc.data() as ActivityLog);
    }
  }
};
