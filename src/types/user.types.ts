import { Timestamp } from 'firebase/firestore';

export type UserRole = 'user' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  provider?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastLogin?: Timestamp;
  emailVerified?: boolean;
  disabled?: boolean;
  isDeleted: boolean;
  deletedAt: Timestamp | null;
  deletedBy: string | null;
}

