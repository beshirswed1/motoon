import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * cn — merge class names with Tailwind conflict resolution.
 * Used by all Shadcn UI components.
 * @example cn('px-4 py-2', isActive && 'bg-primary', className)
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * formatArabicNumber — convert Western numerals to Eastern Arabic numerals
 */
export function formatArabicNumber(num: number): string {
  return num.toString().replace(/[0-9]/g, (d) => '٠١٢٣٤٥٦٧٨٩'[parseInt(d)]);
}

/**
 * formatDate — format a date string for Arabic locale
 */
export function formatDate(dateStr: string, locale = 'ar-SA'): string {
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(dateStr));
}

/**
 * formatRelativeTime — human-readable relative time in Arabic
 */
export function formatRelativeTime(dateStr: string): string {
  const rtf = new Intl.RelativeTimeFormat('ar', { numeric: 'auto' });
  const diff = (new Date(dateStr).getTime() - Date.now()) / 1000;

  if (Math.abs(diff) < 60) return rtf.format(Math.round(diff), 'seconds');
  if (Math.abs(diff) < 3600) return rtf.format(Math.round(diff / 60), 'minutes');
  if (Math.abs(diff) < 86400) return rtf.format(Math.round(diff / 3600), 'hours');
  return rtf.format(Math.round(diff / 86400), 'days');
}

/**
 * truncate — truncate text with ellipsis, RTL-safe
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}…`;
}

/**
 * slugify — create URL-safe slug from Arabic text
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[\u0600-\u06FF]/g, (char) => char.charCodeAt(0).toString(16))
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * clamp — clamp a number between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * sleep — promise-based delay utility
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * isFirebaseError — type guard for Firebase errors
 */
export function isFirebaseError(error: unknown): error is { code: string; message: string } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof (error as { code: unknown }).code === 'string'
  );
}

/**
 * getFirebaseErrorMessage — returns Arabic-friendly error messages
 */
export function getFirebaseErrorMessage(code: string): string {
  const messages: Record<string, string> = {
    'auth/user-not-found': 'البريد الإلكتروني غير مسجل',
    'auth/wrong-password': 'كلمة المرور غير صحيحة',
    'auth/email-already-in-use': 'البريد الإلكتروني مستخدم بالفعل',
    'auth/weak-password': 'كلمة المرور ضعيفة، يجب أن تكون 8 أحرف على الأقل',
    'auth/invalid-email': 'صيغة البريد الإلكتروني غير صحيحة',
    'auth/too-many-requests': 'محاولات كثيرة، حاول مجدداً بعد قليل',
    'auth/network-request-failed': 'خطأ في الاتصال بالإنترنت',
    'auth/user-disabled': 'هذا الحساب معطّل',
    'permission-denied': 'ليس لديك صلاحية للوصول إلى هذا المحتوى',
    'not-found': 'المحتوى المطلوب غير موجود',
    unavailable: 'الخدمة غير متاحة حالياً، حاول مجدداً',
  };
  return messages[code] ?? 'حدث خطأ غير متوقع، حاول مجدداً';
}

export * from './normalizeArabic';
export * from './parseVerses';
export * from './verseParser.advanced';

