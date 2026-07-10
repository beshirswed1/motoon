'use client';

import { useState, useEffect, Suspense } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { registerSchema, RegisterFormValues } from '@/lib/validators/auth.validators';
import Link from 'next/link';
import { UserPlus, Chrome, AlertCircle, Loader2, Check, X, ShieldAlert, LogIn, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { db } from '@/firebase/config';
import { doc, getDoc } from 'firebase/firestore';
import { getFriendlyAuthErrorMessage } from '@/lib/utils/authErrors';

function RegisterFormContent() {
  const { register: registerUser, signInWithGoogle } = useAuth();
  const searchParams = useSearchParams();
  
  // Extract redirect URL (defaults to /profile)
  const redirectUrl = searchParams.get('redirect') || '/profile';

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [allowRegistrations, setAllowRegistrations] = useState(true);
  const [loadingSettings, setLoadingSettings] = useState(true);

  useEffect(() => {
    async function checkSettings() {
      try {
        const snap = await getDoc(doc(db, 'site_settings', 'general'));
        if (snap.exists()) {
          const data = snap.data();
          if (data.allowRegistrations === false) {
            setAllowRegistrations(false);
          }
        }
      } catch (err) {
        console.error("Error fetching site settings:", err);
      } finally {
        setLoadingSettings(false);
      }
    }
    checkSettings();
  }, []);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    }
  });

  const passwordValue = watch('password') || '';

  // Password strength checks
  const hasMinLength = passwordValue.length >= 8;
  const hasUpperLower = /[a-z]/.test(passwordValue) && /[A-Z]/.test(passwordValue);
  const hasDigit = /[0-9]/.test(passwordValue);
  const hasSpecial = /[^a-zA-Z0-9]/.test(passwordValue);

  let score = 0;
  if (hasMinLength) score += 1;
  if (hasUpperLower) score += 1;
  if (hasDigit) score += 1;
  if (hasSpecial) score += 1;

  const getStrengthLabel = () => {
    if (!passwordValue) return { label: 'فارغة', color: 'text-muted-foreground bg-muted', width: 'w-0' };
    if (score <= 1) return { label: 'ضعيفة جداً', color: 'text-red-500 bg-red-500', width: 'w-1/4' };
    if (score === 2) return { label: 'ضعيفة', color: 'text-orange-500 bg-orange-500', width: 'w-2/4' };
    if (score === 3) return { label: 'متوسطة', color: 'text-blue-500 bg-blue-500', width: 'w-3/4' };
    return { label: 'قوية جداً', color: 'text-emerald-500 bg-emerald-500', width: 'w-full' };
  };

  const strength = getStrengthLabel();

  const onSubmit = async (data: RegisterFormValues) => {
    if (score < 3) {
      setErrorMsg('الرجاء استخدام كلمة مرور أقوى للمحافظة على أمان حسابك.');
      return;
    }

    try {
      setErrorMsg(null);
      await registerUser(data.email, data.password, data.name);
      toast.success('تم إنشاء الحساب بنجاح! يرجى إكمال بيانات ملفك الشخصي.');
      
      // Redirect to profile to complete info
      window.location.href = '/profile';
    } catch (error: any) {
      console.error('Registration error:', error);
      const friendlyMsg = getFriendlyAuthErrorMessage(error);
      setErrorMsg(friendlyMsg);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setErrorMsg(null);
      setGoogleLoading(true);
      const user = await signInWithGoogle();
      toast.success(`تم تسجيل الدخول بنجاح. مرحباً بك ${user.name}`);
      
      // Use window.location for reliable redirect
      if (searchParams.get('redirect')) {
        window.location.href = redirectUrl;
      } else {
        window.location.href = user.role === 'admin' ? '/admin' : '/profile';
      }
    } catch (error: any) {
      console.error('Google Sign-in error:', error);
      const friendlyMsg = getFriendlyAuthErrorMessage(error);
      setErrorMsg(friendlyMsg);
    } finally {
      setGoogleLoading(false);
    }
  };

  if (loadingSettings) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-card border rounded-3xl w-full max-w-md shadow-lg min-h-[300px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
        <span className="text-xs text-muted-foreground">جاري تحميل صفحة التسجيل...</span>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md rounded-3xl border bg-card/65 backdrop-blur-md p-8 shadow-xl space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-black text-foreground tracking-tight flex items-center justify-center gap-2">
          <UserPlus className="h-7 w-7 text-primary" />
          إنشاء حساب جديد
        </h1>
        <p className="text-xs text-muted-foreground">سجل حسابك للبدء في حفظ المتون ومتابعة تقدمك.</p>
      </div>

      {!allowRegistrations ? (
        <div className="text-center py-6 space-y-4">
          <div className="p-4 bg-red-500/10 rounded-full text-red-600 animate-bounce inline-block">
            <ShieldAlert className="w-12 h-12" />
          </div>
          <h2 className="text-xl font-bold text-foreground">التسجيل مغلق حالياً</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            عذراً، لقد تم إيقاف التسجيلات الجديدة مؤقتاً من قبل الإدارة. يرجى مراجعة إدارة المنصة أو المحاولة لاحقاً.
          </p>
          <div className="pt-4 border-t">
            <Link href="/login" className="text-primary font-bold text-sm hover:underline">
              العودة لتسجيل الدخول
            </Link>
          </div>
        </div>
      ) : (
        <>
          {/* Security recommendation */}
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 text-xs text-muted-foreground flex gap-3 items-start leading-relaxed">
            <Chrome className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-primary block mb-1">توصية أمان هامة:</span>
              نوصي بالتسجيل بحساب جوجل لتأمين حسابك بأقصى حماية، دون الحاجة لحفظ كلمات مرور معقدة.
            </div>
          </div>

          {errorMsg && (
            <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-3 text-xs text-destructive flex gap-2 items-center">
              <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground">الاسم الكامل</label>
              <input
                type="text"
                {...register('name')}
                placeholder="محمد بن عبد الله"
                className="w-full rounded-xl border bg-background/50 p-3 text-sm text-right focus:outline-none focus:ring-1 focus:ring-primary"
              />
              {errors.name && <p className="text-[10px] text-destructive font-semibold mt-1">{errors.name.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground">البريد الإلكتروني</label>
              <input
                type="email"
                {...register('email')}
                placeholder="name@example.com"
                dir="ltr"
                className="w-full rounded-xl border bg-background/50 p-3 text-sm text-left focus:outline-none focus:ring-1 focus:ring-primary"
              />
              {errors.email && <p className="text-[10px] text-destructive font-semibold mt-1">{errors.email.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground">كلمة المرور</label>
              <input
                type="password"
                {...register('password')}
                placeholder="••••••••"
                dir="ltr"
                className="w-full rounded-xl border bg-background/50 p-3 text-sm text-left focus:outline-none focus:ring-1 focus:ring-primary"
              />
              {errors.password && <p className="text-[10px] text-destructive font-semibold mt-1">{errors.password.message}</p>}

              {/* Password Strength Indicator */}
              {passwordValue && (
                <div className="mt-3 space-y-2 bg-muted/20 border p-3.5 rounded-2xl">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground">قوة كلمة المرور:</span>
                    <span className={`font-black ${strength.color.split(' ')[0]}`}>{strength.label}</span>
                  </div>
                  
                  {/* Visual Bar */}
                  <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                    <div className={`h-full ${strength.color.split(' ')[1]} ${strength.width} transition-all duration-300`} />
                  </div>

                  {/* Checklist */}
                  <ul className="grid grid-cols-2 gap-x-2 gap-y-1 pt-1.5 text-[10px] text-muted-foreground font-semibold">
                    <li className="flex items-center gap-1">
                      {hasMinLength ? <Check className="h-3 w-3 text-emerald-500" /> : <X className="h-3 w-3 text-destructive" />}
                      <span>8 أحرف على الأقل</span>
                    </li>
                    <li className="flex items-center gap-1">
                      {hasUpperLower ? <Check className="h-3 w-3 text-emerald-500" /> : <X className="h-3 w-3 text-destructive" />}
                      <span>أحرف كبيرة وصغيرة</span>
                    </li>
                    <li className="flex items-center gap-1">
                      {hasDigit ? <Check className="h-3 w-3 text-emerald-500" /> : <X className="h-3 w-3 text-destructive" />}
                      <span>رقم واحد على الأقل</span>
                    </li>
                    <li className="flex items-center gap-1">
                      {hasSpecial ? <Check className="h-3 w-3 text-emerald-500" /> : <X className="h-3 w-3 text-destructive" />}
                      <span>رمز خاص (@, $, !)</span>
                    </li>
                  </ul>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground">تأكيد كلمة المرور</label>
              <input
                type="password"
                {...register('confirmPassword')}
                placeholder="••••••••"
                dir="ltr"
                className="w-full rounded-xl border bg-background/50 p-3 text-sm text-left focus:outline-none focus:ring-1 focus:ring-primary"
              />
              {errors.confirmPassword && <p className="text-[10px] text-destructive font-semibold mt-1">{errors.confirmPassword.message}</p>}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground font-bold p-3 text-sm shadow-md hover:opacity-90 active:scale-[0.99] transition-all disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>جاري إنشاء الحساب...</span>
                </>
              ) : (
                <span>إنشاء حساب بالبريد</span>
              )}
            </button>
          </form>

          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-muted/70"></div>
            <span className="flex-shrink mx-4 text-muted-foreground text-[10px] font-bold">أو أكمل بواسطة</span>
            <div className="flex-grow border-t border-muted/70"></div>
          </div>

          {/* Google sign-in */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={googleLoading}
            className="w-full flex items-center justify-center gap-2 rounded-xl border border-muted hover:bg-muted/40 font-bold p-3 text-sm transition-all"
          >
            {googleLoading ? (
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
            ) : (
              <svg className="h-4 w-4 flex-shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#EA4335"
                  d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114-3.465 0-6.273-2.808-6.273-6.273s2.808-6.273 6.273-6.273c1.558 0 2.973.57 4.07 1.503l3.056-3.056C19.1 1.84 15.86 1 12.24 1 6.033 1 1 6.033 1 12.24s5.033 11.24 11.24 11.24c5.898 0 10.824-4.225 11.66-9.878l-11.66-3.317z"
                />
              </svg>
            )}
            <span>إنشاء حساب بواسطة Google</span>
          </button>

          {/* Switch to login — IMPROVED */}
          <div className="pt-3 border-t border-border/40">
            <Link
              href={`/login${searchParams.get('redirect') ? `?redirect=${encodeURIComponent(redirectUrl)}` : ''}`}
              className="flex items-center justify-center gap-2 w-full p-3 rounded-xl border-2 border-dashed border-primary/30 hover:border-primary/60 hover:bg-primary/5 transition-all duration-200 group"
            >
              <LogIn className="h-4 w-4 text-primary" />
              <span className="text-sm font-bold text-foreground">لديك حساب بالفعل؟</span>
              <span className="text-sm font-bold text-primary group-hover:underline">سجل دخولك</span>
              <ArrowLeft className="h-3.5 w-3.5 text-primary" />
            </Link>
          </div>
        </>
      )}
    </div>
  );
}

export default function RegisterPage() {
  return (
    <div className="flex min-h-[85vh] items-center justify-center bg-gradient-to-br from-slate-50 via-slate-100 to-primary/5 p-4 dir-rtl text-right">
      <Suspense fallback={
        <div className="flex flex-col items-center justify-center p-8 bg-card border rounded-3xl w-full max-w-md shadow-lg min-h-[300px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
          <span className="text-xs text-muted-foreground">جاري تحميل صفحة التسجيل...</span>
        </div>
      }>
        <RegisterFormContent />
      </Suspense>
    </div>
  );
}
