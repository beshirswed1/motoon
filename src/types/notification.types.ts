import { Timestamp } from 'firebase/firestore';

export type NotificationType = 'review_due' | 'milestone' | 'system' | 'achievement';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  actionUrl?: string;
  
  createdAt: Timestamp;
  updatedAt: Timestamp;
  isDeleted: boolean;
  deletedAt: Timestamp | null;
  deletedBy: string | null;
}
