import { collection, doc, setDoc, getDocs, query, where, orderBy, limit, Timestamp, getDoc, startAfter } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { AuditLog } from '../../types/admin.types';
import { nanoid } from 'nanoid';

const COLLECTION = 'audit_logs';

export const auditLogService = {
  log: async (
    userId: string,
    action: string,
    resource: string,
    resourceId: string,
    details: Record<string, unknown>,
    before: unknown = null,
    after: unknown = null
  ): Promise<void> => {
    const logId = `audit_${nanoid(12)}`;
    const logRef = doc(db, COLLECTION, logId);

    // Clean up timestamps/functions if any from objects to make them pure JSON structures
    const sanitize = (val: unknown): unknown => {
      if (!val) return val;
      return JSON.parse(JSON.stringify(val));
    };

    const newLog: AuditLog = {
      id: logId,
      userId,
      action,
      resource,
      resourceId,
      details: sanitize(details) as Record<string, unknown>,
      before: sanitize(before),
      after: sanitize(after),
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      isDeleted: false,
      deletedAt: null,
      deletedBy: null
    };

    await setDoc(logRef, newLog);
  },

  getAll: async (limitCount: number = 50): Promise<AuditLog[]> => {
    const q = query(
      collection(db, COLLECTION),
      where('isDeleted', '==', false),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as AuditLog);
  },

  getAdminLogs: async (
    limitCount: number = 20,
    lastVisibleDocId?: string
  ): Promise<{ logs: AuditLog[]; lastDocId?: string }> => {
    let q = query(
      collection(db, COLLECTION),
      where('isDeleted', '==', false),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    if (lastVisibleDocId) {
      const docRef = doc(db, COLLECTION, lastVisibleDocId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        q = query(q, startAfter(docSnap));
      }
    }

    try {
      const snapshot = await getDocs(q);
      const logs = snapshot.docs.map(doc => doc.data() as AuditLog);
      const result: { logs: AuditLog[]; lastDocId?: string } = { logs };
      if (snapshot.docs.length > 0) {
        result.lastDocId = snapshot.docs[snapshot.docs.length - 1].id;
      }
      return result;
    } catch (error) {
      console.warn("Index or query error in getAdminLogs, falling back to all:", error);
      // Fallback in case of missing index, fetch and sort client side
      const fallbackQuery = query(
        collection(db, COLLECTION),
        where('isDeleted', '==', false)
      );
      const snapshot = await getDocs(fallbackQuery);
      let logs = snapshot.docs.map(doc => doc.data() as AuditLog);
      logs.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
      
      // Implement basic client side pagination
      let startIndex = 0;
      if (lastVisibleDocId) {
        const index = logs.findIndex(l => l.id === lastVisibleDocId);
        if (index !== -1) {
          startIndex = index + 1;
        }
      }
      const paginatedLogs = logs.slice(startIndex, startIndex + limitCount);
      const result: { logs: AuditLog[]; lastDocId?: string } = { logs: paginatedLogs };
      if (paginatedLogs.length > 0) {
        result.lastDocId = paginatedLogs[paginatedLogs.length - 1].id;
      }
      return result;
    }
  },

  getLogsForResource: async (
    resource: string,
    resourceId: string,
    limitCount: number = 50
  ): Promise<AuditLog[]> => {
    try {
      const q = query(
        collection(db, COLLECTION),
        where('resource', '==', resource),
        where('resourceId', '==', resourceId),
        where('isDeleted', '==', false),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => doc.data() as AuditLog);
    } catch (error) {
      console.warn("Index error for getLogsForResource, sorting in memory:", error);
      const q = query(
        collection(db, COLLECTION),
        where('resource', '==', resource),
        where('resourceId', '==', resourceId),
        where('isDeleted', '==', false)
      );
      const snapshot = await getDocs(q);
      const logs = snapshot.docs.map(doc => doc.data() as AuditLog);
      return logs
        .sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis())
        .slice(0, limitCount);
    }
  }
};
