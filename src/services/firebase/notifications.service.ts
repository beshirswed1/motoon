import { collection, doc, getDocs, setDoc, updateDoc, query, where, orderBy, limit, Timestamp, writeBatch, getCountFromServer } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { Notification } from '../../types/notification.types';
import { nanoid } from 'nanoid';

const COLLECTION = 'notifications';

export const notificationsService = {
  getUserNotifications: async (userId: string, limitCount: number = 50): Promise<Notification[]> => {
    const q = query(
      collection(db, COLLECTION),
      where('userId', '==', userId),
      where('isDeleted', '==', false),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as Notification);
  },

  markAsRead: async (notificationId: string): Promise<void> => {
    const ref = doc(db, COLLECTION, notificationId);
    await updateDoc(ref, {
      isRead: true,
      updatedAt: Timestamp.now()
    });
  },

  markAllAsRead: async (userId: string): Promise<void> => {
    const q = query(
      collection(db, COLLECTION),
      where('userId', '==', userId),
      where('isRead', '==', false),
      where('isDeleted', '==', false)
    );
    const snapshot = await getDocs(q);
    const batch = writeBatch(db);
    snapshot.docs.forEach(docSnap => {
      batch.update(docSnap.ref, {
        isRead: true,
        updatedAt: Timestamp.now()
      });
    });
    await batch.commit();
  },

  getUnreadCount: async (userId: string): Promise<number> => {
    const q = query(
      collection(db, COLLECTION),
      where('userId', '==', userId),
      where('isRead', '==', false),
      where('isDeleted', '==', false)
    );
    const snapshot = await getCountFromServer(q);
    return snapshot.data().count;
  },

  createNotification: async (notification: Omit<Notification, 'id' | 'createdAt' | 'updatedAt' | 'isDeleted' | 'deletedAt' | 'deletedBy' | 'isRead'>): Promise<string> => {
    const id = `notif_${nanoid(12)}`;
    const ref = doc(db, COLLECTION, id);
    const newNotif: Notification = {
      id,
      ...notification,
      isRead: false,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      isDeleted: false,
      deletedAt: null,
      deletedBy: null
    };
    await setDoc(ref, newNotif);
    return id;
  }
};
