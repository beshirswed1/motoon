'use client';

import { Download, Smartphone } from 'lucide-react';
import { usePWA } from '@/contexts/PWAContext';
import toast from 'react-hot-toast';

export function HeroInstallButton() {
  const { isInstallable, installPwa, isStandalone, isIOS } = usePWA();

  if (isStandalone) return null;

  const handleClick = async () => {
    if (isInstallable) {
      await installPwa();
    } else if (isIOS) {
      toast(
        'لتثبيت التطبيق على iOS:\n1. اضغط على زر "مشاركة" في Safari\n2. اضغط "إضافة إلى الشاشة الرئيسية"',
        { icon: '📱', duration: 6000 }
      );
    } else {
      toast('متصفحك لا يدعم التثبيت المباشر حالياً. جرب من متصفح Chrome.', {
        icon: 'ℹ️',
        duration: 4000,
      });
    }
  };

  return (
    <button
      onClick={handleClick}
      className="group inline-flex items-center gap-2.5 px-6 py-3 rounded-xl bg-gradient-to-l from-primary to-primary/90 text-primary-foreground font-bold text-base shadow-lg shadow-primary/25 hover:shadow-primary/35 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
    >
      <div className="relative">
        <Smartphone className="h-5 w-5 group-hover:hidden transition-all" />
        <Download className="h-5 w-5 hidden group-hover:block animate-bounce transition-all" />
      </div>
      ثبّت التطبيق على جهازك
    </button>
  );
}
