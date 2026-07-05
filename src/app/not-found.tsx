'use client';

import Link from 'next/link';
import { Home, BookOpen, Compass } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="flex min-h-[85vh] flex-col items-center justify-center bg-background px-4 text-center dir-rtl select-none">
      <div className="relative flex flex-col items-center max-w-md w-full bg-card border border-muted p-8 rounded-3xl shadow-xl animate-in fade-in duration-300">
        
        {/* Glow Number Indicator */}
        <div className="relative mb-6">
          <div className="text-8xl font-black text-primary/10 tracking-widest font-sans">404</div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Compass className="h-12 w-12 text-primary animate-spin-slow" />
          </div>
        </div>

        <h1 className="text-2xl font-extrabold text-foreground mb-3 font-arabic">الصفحة غير موجودة</h1>
        <p className="text-sm text-muted-foreground mb-8 font-arabic leading-relaxed">
          عذراً، العنوان الذي أدخلته غير موجود أو تم نقله إلى موقع آخر. تأكد من صحة الرابط أو استخدم خيارات التنقل أدناه.
        </p>

        {/* Navigation Options */}
        <div className="flex flex-col gap-3 w-full">
          <Button
            asChild
            className="w-full gap-2 font-bold py-5 rounded-xl text-xs"
          >
            <Link href="/">
              <Home className="h-4 w-4" />
              الصفحة الرئيسية
            </Link>
          </Button>
          
          <Button
            asChild
            variant="outline"
            className="w-full gap-2 font-bold py-5 rounded-xl text-xs"
          >
            <Link href="/books">
              <BookOpen className="h-4 w-4 text-muted-foreground" />
              تصفح المتون العلمية
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
