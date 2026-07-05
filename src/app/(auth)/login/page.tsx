'use client';

import { useState, Suspense } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { loginSchema, LoginFormValues } from '@/lib/validators/auth.validators';
import Link from 'next/link';
import { LogIn, Chrome, AlertCircle, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { getFriendlyAuthErrorMessage } from '@/lib/utils/authErrors';

function LoginFormContent() {
  const { signIn, signInWithGoogle } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Extract redirect URL (defaults to /profile)
  const redirectUrl = searchParams.get('redirect') || '/profile';
  
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [googleLoading, setGoogleLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    }
  });

  const onSubmit = async (data: LoginFormValues) => {
    try {
      setErrorMsg(null);
      const user = await signIn(data.email, data.password);
      toast.success(`مرحباً بك، ${user.name}`);
      
      // Dynamic Redirect based on role unless explicit redirect exists
      if (searchParams.get('redirect')) {
        router.push(redirectUrl);
      } else {
        router.push(user.role === 'admin' ? '/admin' : '/profile');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      const friendlyMsg = getFriendlyAuthErrorMessage(error);
      setErrorMsg(friendlyMsg);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setErrorMsg(null);
      setGoogleLoading(true);
      const user = await signInWithGoogle();
      toast.success(`تم تسجيل الدخول بنجاح. أهلاً بك ${user.name}`);
      
      // Dynamic Redirect based on role unless explicit redirect exists
      if (searchParams.get('redirect')) {
        router.push(redirectUrl);
      } else {
        router.push(user.role === 'admin' ? '/admin' : '/profile');
      }
    } catch (error: any) {
      console.error('Google login error:', error);
      const friendlyMsg = getFriendlyAuthErrorMessage(error);
      setErrorMsg(friendlyMsg);
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md rounded-3xl border bg-card/65 backdrop-blur-md p-8 shadow-xl space-y-6">
      {/* Title */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-black text-foreground tracking-tight flex items-center justify-center gap-2">
          <LogIn className="h-7 w-7 text-primary" />
          تسجيل الدخول
        </h1>
        <p className="text-xs text-muted-foreground">أدخل بياناتك للوصول إلى منصة متون الخاصة بك.</p>
      </div>

      {/* Security Recommendation Callout */}
      <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 text-xs text-muted-foreground flex gap-3 items-start leading-relaxed">
        <Chrome className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-primary block mb-1">توصية أمان للمستخدمين:</span>
          نوصي بشدة بـ **تسجيل الدخول باستخدام جوجل** لتأمين حسابك بأقصى درجة وحمايته عبر المصادقة الثنائية التلقائية.
        </div>
      </div>

      {/* Error Alert */}
      {errorMsg && (
        <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-3.5 text-xs text-destructive flex gap-2.5 items-start leading-normal">
          <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Standard Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-muted-foreground">البريد الإلكتروني</label>
          <input
            type="email"
            {...register('email')}
            placeholder="name@example.com"
            dir="ltr"
            className="w-full rounded-xl border bg-background/50 p-3 text-sm text-left focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-55"
          />
          {errors.email && <p className="text-[10px] text-destructive font-semibold mt-1">{errors.email.message}</p>}
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <label className="text-xs font-bold text-muted-foreground">كلمة المرور</label>
          </div>
          <input
            type="password"
            {...register('password')}
            placeholder="••••••••"
            dir="ltr"
            className="w-full rounded-xl border bg-background/50 p-3 text-sm text-left focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-55"
          />
          {errors.password && <p className="text-[10px] text-destructive font-semibold mt-1">{errors.password.message}</p>}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground font-bold p-3 text-sm shadow-md hover:opacity-90 active:scale-[0.99] transition-all disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>جاري تسجيل الدخول...</span>
            </>
          ) : (
            <span>تسجيل الدخول بالبريد</span>
          )}
        </button>
      </form>

      <div className="relative flex py-2 items-center">
        <div className="flex-grow border-t border-muted/70"></div>
        <span className="flex-shrink mx-4 text-muted-foreground text-[10px] font-bold">أو أكمل بواسطة</span>
        <div className="flex-grow border-t border-muted/70"></div>
      </div>

      {/* Google sign-in button */}
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
        <span>تسجيل الدخول بحساب Google</span>
      </button>

      <p className="text-center text-xs text-muted-foreground pt-2">
        ليس لديك حساب؟{' '}
        <Link href={`/register${searchParams.get('redirect') ? `?redirect=${encodeURIComponent(redirectUrl)}` : ''}`} className="text-primary hover:underline font-bold">
          أنشئ حساباً جديداً الآن
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-[85vh] items-center justify-center bg-gradient-to-br from-slate-50 via-slate-100 to-primary/5 p-4 dir-rtl text-right">
      <Suspense fallback={
        <div className="flex flex-col items-center justify-center p-8 bg-card border rounded-3xl w-full max-w-md shadow-lg min-h-[300px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
          <span className="text-xs text-muted-foreground">جاري تحميل صفحة الدخول...</span>
        </div>
      }>
        <LoginFormContent />
      </Suspense>
    </div>
  );
}
