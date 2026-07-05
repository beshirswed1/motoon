'use client';

import { ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '@/types/user.types';
import { ShieldAlert, Loader2 } from 'lucide-react';
import Link from 'next/link';

interface RoleGuardProps {
  children: ReactNode;
  allowedRoles: UserRole[];
  fallback?: ReactNode;
}

export function RoleGuard({ children, allowedRoles, fallback }: RoleGuardProps) {
  const { user, loading, initialized } = useAuth();

  if (loading || !initialized) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="text-sm font-semibold text-muted-foreground select-none">جاري التحقق من الصلاحيات...</span>
      </div>
    );
  }

  const hasAccess = user && allowedRoles.includes(user.role);

  if (!hasAccess) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center space-y-6 dir-rtl text-right">
        <div className="p-4 bg-destructive/10 rounded-full text-destructive animate-pulse inline-block">
          <ShieldAlert className="w-16 h-16" />
        </div>
        <div className="space-y-2 text-center">
          <h2 className="text-2xl font-black text-foreground">غير مصرح بالدخول</h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
            عذراً، ليس لديك الصلاحيات الكافية للوصول إلى هذه الصفحة. يرجى تسجيل الدخول بحساب مسؤول أو العودة للرئيسية.
          </p>
        </div>
        <div className="flex gap-4 justify-center">
          <Link
            href="/"
            className="px-5 py-2.5 rounded-xl border border-muted hover:bg-muted/40 text-xs font-bold transition-all"
          >
            العودة للرئيسية
          </Link>
          <Link
            href="/login"
            className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-md hover:opacity-90 transition-all"
          >
            تسجيل دخول آخر
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
