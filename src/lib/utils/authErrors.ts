/**
 * Translates Firebase Auth error codes into localized, user-friendly Arabic messages.
 * @param error The error object thrown by Firebase Auth
 * @returns A friendly Arabic error message string
 */
export function getFriendlyAuthErrorMessage(error: any): string {
  if (!error) return 'حدث خطأ غير متوقع أثناء عملية المصادقة.';

  const code = error.code || error.message || '';

  // Standard Firebase Auth Error Codes mapping
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
      return 'البريد الإلكتروني أو كلمة المرور غير صحيحة. يرجى التأكد والمحاولة مجدداً.';
    
    case 'auth/user-not-found':
      return 'لا يوجد حساب مسجل بهذا البريد الإلكتروني. يرجى إنشاء حساب جديد إذا كنت مستخدماً جديداً.';
    
    case 'auth/email-already-in-use':
      return 'هذا البريد الإلكتروني مسجل بالفعل. إذا كان هذا حسابك، يرجى الانتقال لصفحة تسجيل الدخول.';
    
    case 'auth/invalid-email':
      return 'صيغة البريد الإلكتروني غير صحيحة. يرجى كتابة بريد إلكتروني صالح (مثال: name@example.com).';
    
    case 'auth/weak-password':
      return 'كلمة المرور ضعيفة جداً. يجب أن تتكون من 6 رموز أو أحرف على الأقل.';
    
    case 'auth/user-disabled':
      return 'لقد تم تعطيل هذا الحساب من قبل الإدارة. يرجى التواصل مع الدعم الفني.';
    
    case 'auth/too-many-requests':
      return 'تم تجميد المحاولات مؤقتاً لكثرة الطلبات الخاطئة حمايةً لحسابك. يرجى المحاولة بعد بضع دقائق.';
    
    case 'auth/popup-closed-by-user':
      return 'تم إلغاء عملية تسجيل الدخول بجوجل قبل إتمامها. يرجى المحاولة مجدداً.';
    
    case 'auth/account-exists-with-different-credential':
      return 'هذا البريد الإلكتروني مسجل مسبقاً بكلمة مرور. يرجى تسجيل الدخول باستخدام البريد وكلمة المرور بدلاً من جوجل.';
    
    case 'auth/operation-not-allowed':
      return 'تسجيل الدخول بهذه الطريقة غير مفعّل حالياً. يرجى التواصل مع الإدارة.';
    
    case 'auth/network-request-failed':
      return 'فشل الاتصال بالشبكة. يرجى التحقق من اتصال الإنترنت لديك وحالة الاتصال.';

    case 'auth/unauthorized-domain':
      return 'هذا الدومين غير مسجل في إعدادات المصادقة. إذا كنت تستخدم المنصة من رابط غير رسمي، يرجى استخدام الرابط الرسمي للمنصة.';
    
    default:
      // Fallback translations for generic messages
      if (typeof code === 'string') {
        if (code.includes('invalid-credential') || code.includes('wrong-password')) {
          return 'البريد الإلكتروني أو كلمة المرور غير صحيحة.';
        }
        if (code.includes('email-already-in-use')) {
          return 'هذا البريد الإلكتروني مسجل بالفعل.';
        }
        if (code.includes('insufficient permissions') || code.includes('permission-denied')) {
          return 'خطأ في الصلاحيات. يرجى التحقق من تسجيل الدخول بحساب صحيح.';
        }
      }
      return error.message || 'حدث خطأ أثناء الاتصال بالخادم. يرجى المحاولة لاحقاً.';
  }
}
