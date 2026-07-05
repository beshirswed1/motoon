'use client';

import React, { useEffect } from 'react';
import { X, CheckCircle, AlertTriangle, AlertCircle, Info } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { removeToast, selectToasts, Toast } from '@/store/slices/uiSlice';
import { cn } from '@/lib/utils';

export function ToastContainer() {
  const toasts = useAppSelector(selectToasts);

  return (
    <div 
      className="fixed bottom-4 left-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none"
      dir="rtl"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  );
}

function ToastItem({ toast }: { toast: Toast }) {
  const dispatch = useAppDispatch();

  useEffect(() => {
    const timer = setTimeout(() => {
      dispatch(removeToast(toast.id));
    }, toast.duration ?? 3000);

    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, dispatch]);

  const icons = {
    success: <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0" />,
    error: <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0" />,
    warning: <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0" />,
    info: <Info className="h-4 w-4 text-blue-500 flex-shrink-0" />,
  };

  const bgStyles = {
    success: 'bg-emerald-50 border-emerald-100 dark:bg-emerald-950/20 dark:border-emerald-900/30 text-emerald-900 dark:text-emerald-300',
    error: 'bg-destructive/5 border-destructive/10 text-destructive',
    warning: 'bg-amber-50 border-amber-100 dark:bg-amber-950/20 dark:border-amber-900/30 text-amber-900 dark:text-amber-300',
    info: 'bg-blue-50 border-blue-100 dark:bg-blue-950/20 dark:border-blue-900/30 text-blue-900 dark:text-blue-300',
  };

  return (
    <div
      className={cn(
        "pointer-events-auto flex items-center justify-between gap-3 p-3.5 border rounded-xl shadow-md transition-all duration-300 animate-in slide-in-from-left-4 fade-in duration-200",
        bgStyles[toast.type]
      )}
    >
      <div className="flex items-center gap-2">
        {icons[toast.type]}
        <span className="text-xs font-semibold select-none leading-relaxed pr-1">
          {toast.message}
        </span>
      </div>
      <button
        onClick={() => dispatch(removeToast(toast.id))}
        className="text-muted-foreground/60 hover:text-foreground p-0.5 rounded transition-colors focus:outline-none"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
