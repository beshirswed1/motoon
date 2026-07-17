'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import toast from 'react-hot-toast';
import { pushNotificationsService } from '@/services/pushNotifications.service';

interface PWAContextType {
  /** True when the browser fires `beforeinstallprompt` and the app can be installed */
  isInstallable: boolean;
  /** Trigger the native install prompt (or show iOS instructions) */
  installPwa: () => Promise<void>;
  /** True when the app is already running in standalone/installed mode */
  isStandalone: boolean;
  /** True on iOS devices (where install works via Safari share menu) */
  isIOS: boolean;
  /** True when the service worker is registered and active */
  isOfflineReady: boolean;
  /** Current notification permission */
  notificationPermission: NotificationPermission | 'unsupported';
  /** Request notification permission */
  requestNotificationPermission: () => Promise<NotificationPermission | 'unsupported'>;
}

const PWAContext = createContext<PWAContextType>({
  isInstallable: false,
  installPwa: async () => {},
  isStandalone: false,
  isIOS: false,
  isOfflineReady: false,
  notificationPermission: 'default',
  requestNotificationPermission: async () => 'default',
});

export const usePWA = () => useContext(PWAContext);

export const PWAProvider = ({ children }: { children: ReactNode }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isOfflineReady, setIsOfflineReady] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | 'unsupported'>('default');

  useEffect(() => {
    // Check if running in standalone/installed mode already
    const isRunningStandalone = 
      window.matchMedia('(display-mode: standalone)').matches || 
      (window.navigator as any).standalone === true;
    
    setIsStandalone(isRunningStandalone);

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIOSDevice);

    // Check notification permission
    const perm = pushNotificationsService.getPermissionStatus();
    setNotificationPermission(perm);

    // Start reminder scheduler if enabled
    const cleanup = pushNotificationsService.startReminderScheduler();

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    // Listen for successful installation
    const handleAppInstalled = () => {
      setIsInstallable(false);
      setDeferredPrompt(null);
      setIsStandalone(true);
      toast.success('تم تثبيت التطبيق بنجاح! 🎉', { duration: 5000 });
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Check service worker status
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        if (registration.active) {
          setIsOfflineReady(true);
        }
      });

      // Listen for SW state changes
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        setIsOfflineReady(true);
      });
    }

    // Listen for display-mode changes (e.g. user installs from address bar)
    const displayModeQuery = window.matchMedia('(display-mode: standalone)');
    const handleDisplayModeChange = (e: MediaQueryListEvent) => {
      setIsStandalone(e.matches);
      if (e.matches) {
        setIsInstallable(false);
        setDeferredPrompt(null);
      }
    };
    displayModeQuery.addEventListener('change', handleDisplayModeChange);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      displayModeQuery.removeEventListener('change', handleDisplayModeChange);
      if (cleanup) cleanup();
    };
  }, []);

  const installPwa = useCallback(async () => {
    if (!deferredPrompt) {
      if (isIOS && !isStandalone) {
        toast('لتثبيت التطبيق على iOS، اضغط على زر المشاركة ثم "إضافة إلى الشاشة الرئيسية"', {
          icon: '📱',
          duration: 5000,
        });
      }
      return;
    }

    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        // The 'appinstalled' event will fire and handle the success toast
        setIsInstallable(false);
        setDeferredPrompt(null);
      }
    } catch (err) {
      console.error('PWA install error:', err);
      toast.error('حدث خطأ أثناء التثبيت. حاول مرة أخرى.');
    }
  }, [deferredPrompt, isIOS, isStandalone]);

  const requestNotificationPermission = useCallback(async () => {
    const result = await pushNotificationsService.requestPermission();
    setNotificationPermission(result);
    return result;
  }, []);

  return (
    <PWAContext.Provider value={{ isInstallable, installPwa, isStandalone, isIOS, isOfflineReady, notificationPermission, requestNotificationPermission }}>
      {children}
    </PWAContext.Provider>
  );
};
