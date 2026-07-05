'use client';

import React, { useState, useEffect } from 'react';
import { Download, X, Share, PlusSquare } from 'lucide-react';
import { usePWA } from '@/contexts/PWAContext';

export function PWAInstallPrompt() {
  const { isInstallable, installPwa, isStandalone, isIOS } = usePWA();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const visitsStr = localStorage.getItem('motoon_pwa_visits') || '0';
    const visits = parseInt(visitsStr, 10);
    const nextVisits = visits + 1;
    localStorage.setItem('motoon_pwa_visits', String(nextVisits));

    const isDismissed = localStorage.getItem('motoon_pwa_dismissed') === 'true';
    if (isDismissed || isStandalone) return;

    if (nextVisits >= 2 && (isInstallable || isIOS)) {
      setIsVisible(true);
    }
  }, [isInstallable, isStandalone, isIOS]);

  const handleInstallClick = async () => {
    await installPwa();
    setIsVisible(false);
  };

  const handleDismiss = () => {
    localStorage.setItem('motoon_pwa_dismissed', 'true');
    setIsVisible(false);
  };

  if (!isVisible || isStandalone) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 md:bottom-6 md:left-6 md:right-auto md:w-96 bg-card border text-card-foreground p-4 rounded-2xl shadow-xl z-50 animate-in slide-in-from-bottom-5 duration-300 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
            <Download className="h-5 w-5" />
          </div>
          <div>
            <h4 className="font-bold text-xs">تثبيت تطبيق متون</h4>
            <p className="text-[10px] text-muted-foreground">احفظ المتون وراجع بدون اتصال بالإنترنت في أي وقت.</p>
          </div>
        </div>
        <button 
          onClick={handleDismiss} 
          className="p-1 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Render Dynamic Banner content based on OS */}
      {isIOS ? (
        <div className="text-xs bg-muted/50 p-3 rounded-xl space-y-2 border leading-relaxed text-muted-foreground font-medium">
          <p className="font-semibold text-foreground text-[11px] flex items-center gap-1">
            <Share className="h-3.5 w-3.5 text-primary" />
            <span>طريقة التثبيت على نظام iOS (Safari):</span>
          </p>
          <ol className="list-decimal list-inside space-y-1 text-[10px]">
            <li>اضغط على زر <span className="font-bold text-foreground">"مشاركة" (Share)</span> في شريط سفاري.</li>
            <li>اسحب القائمة لأسفل ثم اضغط على <span className="font-bold text-foreground flex-inline items-center gap-0.5"><PlusSquare className="h-3 w-3 inline text-primary" /> "إضافة إلى الشاشة الرئيسية"</span>.</li>
            <li>اضغط على <span className="font-bold text-primary">"إضافة" (Add)</span> في الزاوية العلوية لتثبيت التطبيق.</li>
          </ol>
        </div>
      ) : (
        <div className="flex flex-col gap-2 pt-1">
          <button
            onClick={handleInstallClick}
            className="flex items-center justify-center gap-2 w-full py-2 bg-primary text-primary-foreground hover:bg-primary/95 rounded-xl font-bold text-xs shadow-sm transition-all duration-150"
          >
            <Download className="h-4 w-4" />
            <span>تثبيت التطبيق الآن</span>
          </button>
          <button
            onClick={handleDismiss}
            className="w-full text-center py-2 text-[10px] text-muted-foreground hover:underline"
          >
            ربما لاحقاً
          </button>
        </div>
      )}
    </div>
  );
}
