/**
 * errorHandler.ts
 * Centralized Firebase and Firestore error handling utility.
 * Translates technical error codes into user-friendly Arabic messages.
 */

export interface AppError extends Error {
  code?: string;
  originalError?: any;
}

export function handleFirebaseError(error: any): string {
  console.error("Firebase Service Error:", error);

  if (!error) {
    return "حدث خطأ غير معروف. يرجى المحاولة مرة أخرى.";
  }

  // Handle Firebase Auth errors
  if (error.code) {
    switch (error.code) {
      // Auth Errors
      case 'auth/user-not-found':
      case 'auth/wrong-password':
        return "البريد الإلكتروني أو كلمة المرور غير صحيحة.";
      case 'auth/email-already-in-use':
        return "البريد الإلكتروني مستخدم بالفعل بحساب آخر.";
      case 'auth/weak-password':
        return "كلمة المرور ضعيفة جداً. يجب أن تتكون من 6 أحرف على الأقل.";
      case 'auth/invalid-email':
        return "صيغة البريد الإلكتروني غير صحيحة.";
      case 'auth/user-disabled':
        return "تم تعطيل هذا الحساب من قبل الإدارة.";
      case 'auth/operation-not-allowed':
        return "تسجيل الدخول بهذه الطريقة غير متاح حالياً.";
      case 'auth/too-many-requests':
        return "تم حظر المحاولات مؤقتاً لكثرة الطلبات. يرجى المحاولة لاحقاً.";
      
      // Firestore Errors
      case 'permission-denied':
        return "عذراً، ليس لديك الصلاحية الكافية لتنفيذ هذه العملية.";
      case 'unauthenticated':
        return "يجب تسجيل الدخول أولاً لتتمكن من المتابعة.";
      case 'unavailable':
        return "يتعذر الاتصال بخادم البيانات. يرجى التحقق من اتصالك بالإنترنت.";
      case 'not-found':
        return "المستند أو المحتوى المطلوب غير موجود.";
      case 'already-exists':
        return "هذا السجل موجود بالفعل.";
      case 'cancelled':
        return "تم إلغاء العملية بنجاح.";
      case 'resource-exhausted':
        return "انتهى الرصيد المتاح للخدمة السحابية. يرجى التواصل مع الدعم الفني.";
      case 'failed-precondition':
        return "فشلت العملية لعدم تهيئة الشروط المسبقة أو الفهارس اللازمة.";
    }
  }

  // Fallback for custom message, or Standard JS Error message
  if (error.message) {
    if (error.message.includes('permission-denied')) {
      return "عذراً، ليس لديك الصلاحية الكافية لتنفيذ هذه العملية.";
    }
    if (error.message.includes('offline') || error.message.includes('network')) {
      return "يتعذر الاتصال بالإنترنت. يرجى التحقق من الشبكة.";
    }
    return error.message;
  }

  return "حدث خطأ غير متوقع في خوادم البيانات. يرجى المحاولة لاحقاً.";
}

/**
 * Wraps any promise in try/catch and throws a unified AppError with Arabic translation
 */
export async function runFirebaseOp<T>(op: () => Promise<T>): Promise<T> {
  try {
    return await op();
  } catch (error: any) {
    const arabicMessage = handleFirebaseError(error);
    const appError: AppError = new Error(arabicMessage);
    appError.code = error.code || 'unknown';
    appError.originalError = error;
    throw appError;
  }
}
