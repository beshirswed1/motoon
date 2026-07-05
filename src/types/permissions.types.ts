import { Timestamp } from 'firebase/firestore';

export type PermissionAction = 'create' | 'read' | 'update' | 'delete' | 'manage';
export type ResourceType = 'users' | 'books' | 'verses' | 'settings' | 'pages' | 'media';

export interface Permission {
  id: string;
  roleId: string; // Could be mapped to a user role or directly to a user
  resource: ResourceType;
  actions: PermissionAction[];
  
  createdAt: Timestamp;
  updatedAt: Timestamp;
  isDeleted: boolean;
  deletedAt: Timestamp | null;
  deletedBy: string | null;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
  
  createdAt: Timestamp;
  updatedAt: Timestamp;
  isDeleted: boolean;
  deletedAt: Timestamp | null;
  deletedBy: string | null;
}
