'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function RootError({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Next.js Root Error:', error);
  }, [error]);

  const handleGoHome = () => {
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center dir-rtl select-none">
      <div className="relative flex flex-col items-center max-w-md w-full bg-card border border-muted p-8 rounded-3xl shadow-xl animate-in fade-in duration-300">
        {/* Warning Icon Glow */}
        <div className="h-16 w-16 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center mb-6">
          <AlertTriangle className="h-8 w-8" />
        </div>

        <h1 className="text-2xl font-extrabold text-foreground mb-3 font-arabic">عذراً، حدث خطأ في النظام</h1>
        <p className="text-sm text-muted-foreground mb-6 font-arabic leading-relaxed">
          حصلت مشكلة غير متوقعة أثناء معالجة طلبك. يرجى إعادة المحاولة أو العودة إلى الصفحة الرئيسية.
        </p>

        {/* General Guidance instead of detailed technical error details */}
        <div className="w-full bg-muted/65 border rounded-2xl p-4 mb-6 text-center text-xs text-muted-foreground font-arabic leading-relaxed">
          نعتذر عن هذا الخلل. قد يكون هناك انقطاع مؤقت في الاتصال أو مشكلة في إعدادات الميكروفون والصلاحيات. يرجى التأكد من اتصال الإنترنت وإذن الميكروفون ثم إعادة المحاولة.
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <Button
            onClick={() => reset()}
            className="flex-1 gap-2 font-bold py-5 rounded-xl text-xs"
          >
            <RefreshCw className="h-4 w-4" />
            إعادة المحاولة
          </Button>
          <Button
            variant="outline"
            onClick={handleGoHome}
            className="flex-1 gap-2 font-bold py-5 rounded-xl text-xs"
          >
            <Home className="h-4 w-4 text-muted-foreground" />
            الصفحة الرئيسية
          </Button>
        </div>
      </div>
    </div>
  );
}
