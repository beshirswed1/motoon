'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import toast from 'react-hot-toast';

interface PWAContextType {
  isInstallable: boolean;
  installPwa: () => Promise<void>;
  isStandalone: boolean;
  isIOS: boolean;
}

const PWAContext = createContext<PWAContextType>({
  isInstallable: false,
  installPwa: async () => {},
  isStandalone: false,
  isIOS: false,
});

export const usePWA = () => useContext(PWAContext);

export const PWAProvider = ({ children }: { children: ReactNode }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if running in standalone/installed mode already
    const isRunningStandalone = 
      window.matchMedia('(display-mode: standalone)').matches || 
      (window.navigator as any).standalone === true;
    
    setIsStandalone(isRunningStandalone);

    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIOSDevice);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const installPwa = async () => {
    if (!deferredPrompt) {
      if (isIOS && !isStandalone) {
        toast('لتثبيت التطبيق على iOS، اضغط على زر المشاركة ثم "إضافة إلى الشاشة الرئيسية"', {
          icon: '📱',
          duration: 5000,
        });
      }
      return;
    }

    deferredPrompt.prompt();

    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      toast.success('شكرًا لتثبيتك منصة متون!');
      setIsInstallable(false);
      setDeferredPrompt(null);
    }
  };

  return (
    <PWAContext.Provider value={{ isInstallable, installPwa, isStandalone, isIOS }}>
      {children}
    </PWAContext.Provider>
  );
};
