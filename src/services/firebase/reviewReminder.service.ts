import { progressService } from './progress.service';
import { notificationsService } from './notifications.service';
import { collection, query, where, getDocs, limit, orderBy } from 'firebase/firestore';
import { db } from '../../firebase/config';

export const reviewReminderService = {
  alreadyNotifiedToday: async (userId: string): Promise<boolean> => {
    try {
      const q = query(
        collection(db, 'notifications'),
        where('userId', '==', userId),
        where('type', '==', 'review_due'),
        where('isDeleted', '==', false),
        orderBy('createdAt', 'desc'),
        limit(1)
      );
      const snap = await getDocs(q);
      if (snap.empty) return false;
      const lastNotif = snap.docs[0].data();
      const createdDate = lastNotif.createdAt.toDate();
      const today = new Date();
      return createdDate.toDateString() === today.toDateString();
    } catch (error) {
      console.warn("Index or query error in alreadyNotifiedToday, falling back client-side:", error);
      const q = query(
        collection(db, 'notifications'),
        where('userId', '==', userId),
        where('isDeleted', '==', false)
      );
      const snap = await getDocs(q);
      const reviewDueNotifications = snap.docs
        .map(d => d.data())
        .filter(n => n.type === 'review_due');
      if (reviewDueNotifications.length === 0) return false;
      
      const latest = reviewDueNotifications.reduce((latest, current) => {
        return current.createdAt.toMillis() > latest.createdAt.toMillis() ? current : latest;
      }, reviewDueNotifications[0]);
      
      const createdDate = latest.createdAt.toDate();
      const today = new Date();
      return createdDate.toDateString() === today.toDateString();
    }
  },

  checkAndCreateReviewReminders: async (userId: string): Promise<void> => {
    const due = await progressService.getDueForReview(userId);
    if (due.length > 0) {
      const notified = await reviewReminderService.alreadyNotifiedToday(userId);
      if (!notified) {
        await notificationsService.createNotification({
          userId,
          type: 'review_due',
          title: 'لديك مراجعات اليوم',
          message: `لديك ${due.length} أبيات تنتظر مراجعتك`,
          actionUrl: '/progress'
        });
      }
    }
  }
};
