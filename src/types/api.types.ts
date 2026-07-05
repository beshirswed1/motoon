/* ── API / HTTP Types ───────────────────────────────────── */

export interface ApiResponse<T = unknown> {
  data: T;
  success: boolean;
  message?: string;
  timestamp: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  statusCode: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  totalPages: number;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
  cursor?: string;
}

export type FirestoreDocument<T> = T & { id: string };

export type FirebaseError = {
  code: string;
  message: string;
  name: 'FirebaseError';
};
