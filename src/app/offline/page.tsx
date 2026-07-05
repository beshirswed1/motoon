'use client';

import React from 'react';
import { WifiOff, RotateCw, BookOpen, Home } from 'lucide-react';
import Link from 'next/link';

export default function OfflinePage() {
  const handleReload = () => {
    window.location.reload();
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 text-center dir-rtl text-right select-none max-w-md mx-auto space-y-6">
      {/* Icon with subtle pulse animation */}
      <div className="h-24 w-24 rounded-full bg-destructive/10 text-destructive flex items-center justify-center animate-pulse border border-destructive/20 shadow-inner">
        <WifiOff className="h-12 w-12" />
      </div>

      {/* Main headings */}
      <div className="space-y-2">
        <h1 className="text-3xl font-black text-foreground">أنت غير متصل بالإنترنت</h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          يبدو أنك تواجه مشكلات في الشبكة. لا تقلق، يمكنك تصفح المتون المحفوظة مؤقتاً ومتابعة المراجعة دون اتصال.
        </p>
      </div>

      {/* Actions buttons */}
      <div className="w-full flex flex-col gap-3 pt-4">
        <button
          onClick={handleReload}
          className="flex items-center justify-center gap-2 w-full py-3 bg-primary text-primary-foreground hover:bg-primary/95 rounded-xl font-bold text-sm shadow-sm transition-all duration-200"
        >
          <RotateCw className="h-4 w-4" />
          <span>إعادة محاولة الاتصال</span>
        </button>

        <div className="grid grid-cols-2 gap-3">
          <Link
            href="/books"
            className="flex items-center justify-center gap-2 py-3 border border-input hover:bg-accent rounded-xl font-bold text-xs shadow-sm transition-all duration-200 text-foreground"
          >
            <BookOpen className="h-4 w-4 text-primary" />
            <span>عرض المتون</span>
          </Link>
          <Link
            href="/"
            className="flex items-center justify-center gap-2 py-3 border border-input hover:bg-accent rounded-xl font-bold text-xs shadow-sm transition-all duration-200 text-foreground"
          >
            <Home className="h-4 w-4 text-primary" />
            <span>الرئيسية</span>
          </Link>
        </div>
      </div>

      {/* Tip Alert */}
      <div className="text-[10px] text-muted-foreground border-t pt-4 w-full">
        * نصيحة: عند استعادة الاتصال بالإنترنت، سيتم مزامنة أي تقدم قمت بإنجازه تلقائياً في الخلفية.
      </div>
    </div>
  );
}
