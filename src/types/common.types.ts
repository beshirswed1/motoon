/* ── Common / Shared Types ──────────────────────────────── */
import type { Timestamp } from 'firebase/firestore';

export interface BaseDocument {
  id: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  isDeleted: boolean;
  deletedAt: Timestamp | null;
  deletedBy: string | null;
}

export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type Maybe<T> = T | null | undefined;

export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export interface SelectOption<T = string> {
  label: string;
  value: T;
  disabled?: boolean;
  description?: string;
}

export interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

export interface Coordinates {
  lat: number;
  lng: number;
}

export type ArabicDirection = 'rtl';

export interface ArabicText {
  arabic: string;
  transliteration?: string;
  translation?: string;
}

export interface FileUpload {
  file: File;
  preview?: string;
  progress?: number;
  error?: string;
  uploadedUrl?: string;
}

export interface Badge {
  id: string;
  nameAr: string;
  descriptionAr: string;
  iconUrl: string;
  color: string;
  earnedAt?: string;
}

// Component size variants
export type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

// Color variants
export type ColorVariant =
  | 'primary'
  | 'secondary'
  | 'success'
  | 'warning'
  | 'error'
  | 'info'
  | 'neutral';
