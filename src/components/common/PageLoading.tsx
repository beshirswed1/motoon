'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';

interface PageLoadingProps {
  message?: string;
}

export function PageLoading({ message = 'جاري تحميل الصفحة...' }: PageLoadingProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] w-full gap-3 select-none dir-rtl text-center">
      <div className="relative flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <div className="absolute w-2 h-2 rounded-full bg-primary animate-ping"></div>
      </div>
      <span className="text-xs font-bold text-muted-foreground font-arabic animate-pulse">
        {message}
      </span>
    </div>
  );
}
