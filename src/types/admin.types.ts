import { Timestamp } from 'firebase/firestore';

export interface SiteSettings {
  id: string;
  siteName: string;
  contactEmail: string;
  maintenanceMode: boolean;
  allowRegistration: boolean;
  
  createdAt: Timestamp;
  updatedAt: Timestamp;
  isDeleted: boolean;
  deletedAt: Timestamp | null;
  deletedBy: string | null;
}

export interface Page {
  id: string;
  title: string;
  slug: string;
  content: string;
  isPublished: boolean;
  
  createdAt: Timestamp;
  updatedAt: Timestamp;
  isDeleted: boolean;
  deletedAt: Timestamp | null;
  deletedBy: string | null;
}

export interface Media {
  id: string;
  fileName: string;
  fileUrl: string;
  mimeType: string;
  sizeBytes: number;
  uploadedBy: string;
  
  createdAt: Timestamp;
  updatedAt: Timestamp;
  isDeleted: boolean;
  deletedAt: Timestamp | null;
  deletedBy: string | null;
}

export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  resource: string;
  resourceId: string;
  details: Record<string, unknown>;
  before?: unknown;
  after?: unknown;
  
  createdAt: Timestamp;
  updatedAt: Timestamp;
  isDeleted: boolean;
  deletedAt: Timestamp | null;
  deletedBy: string | null;
}

export interface ActivityLog {
  id: string;
  userId: string;
  type: 'login' | 'reading' | 'recitation' | 'review' | 'create_book' | 'update_book' | 'delete_book' | 'batch_create_verses' | 'update_user_role' | 'delete_user' | 'update_site_settings' | 'create_verse' | 'update_verse' | 'delete_verse';
  durationSeconds?: number;
  details: Record<string, unknown>;
  
  createdAt: Timestamp;
  updatedAt: Timestamp;
  isDeleted: boolean;
  deletedAt: Timestamp | null;
  deletedBy: string | null;
}

export interface AdminStats {
  totalUsers: number;
  totalBooks: number;
  totalRecitations: number;
  activeUsersToday: number;
}

import { UserRole } from './user.types';

export interface AdminUserListItem {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: Timestamp;
}
