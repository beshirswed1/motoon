import { Timestamp } from 'firebase/firestore';

export type BookDifficulty = 'beginner' | 'intermediate' | 'advanced';

export interface Book {
  id: string;
  title: string;
  slug: string;
  description: string;
  author: string;
  status: 'draft' | 'published' | 'archived';
  difficulty: BookDifficulty;
  tags: string[];
  isPublished: boolean;
  coverImageUrl?: string;
  versesCount?: number;
  category?: string;
  subcategory?: string;
  
  createdAt: Timestamp;
  updatedAt: Timestamp;
  isDeleted: boolean;
  deletedAt: Timestamp | null;
  deletedBy: string | null;
}

export interface BookFilters {
  category: string | null;
  difficulty: BookDifficulty | null;
  search: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

