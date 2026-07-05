import { Timestamp } from 'firebase/firestore';

export interface Progress {
  id: string;
  userId: string;
  bookId: string;
  verseId: string;
  
  // SM-2 Algorithm fields
  repetition: number;
  interval: number;
  easeFactor: number;
  mastery: number; // Mastery level (0-100)
  nextReviewDate: Timestamp;
  lastReviewDate: Timestamp | null;
  
  createdAt: Timestamp;
  updatedAt: Timestamp;
  isDeleted: boolean;
  deletedAt: Timestamp | null;
  deletedBy: string | null;
}

export type UserProgress = Progress;

export interface ProgressStats {
  overallMastery: number;
  activeBooks: number;
  completedBooks: number;
  retentionRate: number;
}

