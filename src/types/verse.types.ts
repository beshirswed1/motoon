import { Timestamp } from 'firebase/firestore';

export interface Verse {
  id: string;
  bookId: string;
  text: string;
  normalizedText: string;
  order: number;
  notes?: string;
  audioUrl?: string;
  
  createdAt: Timestamp;
  updatedAt: Timestamp;
  isDeleted: boolean;
  deletedAt: Timestamp | null;
  deletedBy: string | null;
}

export interface ParsedVerse {
  text: string;
  normalizedText: string;
  order: number;
}

export interface AdvancedParsedVerse {
  text: string;
  normalizedText: string;
  order: number;
  sadr?: string;
  ajez?: string;
  sadrNormalized?: string;
  ajezNormalized?: string;
}

