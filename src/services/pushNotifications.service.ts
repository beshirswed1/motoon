'use client';

/**
 * Push Notifications Service
 * Uses the browser Notification API and optionally FCM.
 * For local scheduled reminders, uses setInterval with localStorage persistence.
 */

const SETTINGS_KEY = 'motoon-notification-settings';

export interface NotificationSettings {
  enabled: boolean;
  reminderTime: string; // HH:mm format
  lastReminderDate: string | null;
}

function getSettings(): NotificationSettings {
  if (typeof window === 'undefined') return { enabled: false, reminderTime: '08:00', lastReminderDate: null };
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { enabled: false, reminderTime: '08:00', lastReminderDate: null };
}

function saveSettings(settings: NotificationSettings) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export const pushNotificationsService = {
  /** Get current notification permission status */
  getPermissionStatus(): NotificationPermission | 'unsupported' {
    if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
    return Notification.permission;
  },

  /** Request notification permission from browser */
  async requestPermission(): Promise<NotificationPermission | 'unsupported'> {
    if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
    
    try {
      const result = await Notification.requestPermission();
      return result;
    } catch {
      return 'denied';
    }
  },

  /** Show a local notification */
  showNotification(title: string, options?: NotificationOptions) {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;

    // Try service worker notification first (works when app is in background)
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(registration => {
        registration.showNotification(title, {
          icon: '/icons/icon-192x192.png',
          badge: '/icons/icon-96x96.png',
          lang: 'ar',
          dir: 'rtl',
          tag: 'motoon-reminder',
          renotify: true,
          ...options,
        } as any);
      }).catch(() => {
        // Fallback to regular notification
        new Notification(title, {
          icon: '/icons/icon-192x192.png',
          lang: 'ar',
          dir: 'rtl',
          tag: 'motoon-reminder',
          ...options,
        });
      });
    } else {
      new Notification(title, {
        icon: '/icons/icon-192x192.png',
        lang: 'ar',
        dir: 'rtl',
        tag: 'motoon-reminder',
        ...options,
      });
    }
  },

  /** Get saved notification settings */
  getSettings,

  /** Save notification settings */
  saveSettings,

  /** Start the reminder scheduler */
  startReminderScheduler() {
    if (typeof window === 'undefined') return;

    const settings = getSettings();
    if (!settings.enabled) return;

    // Check every minute if it's time to send a reminder
    const checkInterval = setInterval(() => {
      const currentSettings = getSettings();
      if (!currentSettings.enabled) {
        clearInterval(checkInterval);
        return;
      }

      const now = new Date();
      const [hours, minutes] = currentSettings.reminderTime.split(':').map(Number);
      const today = now.toDateString();

      // Check if it's the right time and we haven't sent today
      if (
        now.getHours() === hours &&
        now.getMinutes() === minutes &&
        currentSettings.lastReminderDate !== today
      ) {
        // Send the reminder
        pushNotificationsService.showNotification(
          '📖 حان وقت المراجعة!',
          {
            body: 'لا تنسَ مراجعة متونك اليوم. استمر في الحفظ والمراجعة لتثبيت العلم.',
            data: { url: '/books' },
          }
        );

        // Mark as sent today
        currentSettings.lastReminderDate = today;
        saveSettings(currentSettings);
      }
    }, 60_000); // Check every minute

    // Also do an immediate check
    const currentSettings = getSettings();
    const now = new Date();
    const [hours, minutes] = currentSettings.reminderTime.split(':').map(Number);
    const today = now.toDateString();
    
    if (
      now.getHours() === hours &&
      now.getMinutes() >= minutes &&
      now.getMinutes() <= minutes + 1 &&
      currentSettings.lastReminderDate !== today
    ) {
      pushNotificationsService.showNotification(
        '📖 حان وقت المراجعة!',
        {
          body: 'لا تنسَ مراجعة متونك اليوم. استمر في الحفظ والمراجعة لتثبيت العلم.',
          data: { url: '/books' },
        }
      );
      currentSettings.lastReminderDate = today;
      saveSettings(currentSettings);
    }

    return () => clearInterval(checkInterval);
  },

  /** Enable push notifications with a specific reminder time */
  async enableReminder(time: string): Promise<boolean> {
    const permission = await pushNotificationsService.requestPermission();
    if (permission !== 'granted') return false;

    const settings = getSettings();
    settings.enabled = true;
    settings.reminderTime = time;
    settings.lastReminderDate = null;
    saveSettings(settings);

    pushNotificationsService.startReminderScheduler();
    return true;
  },

  /** Disable push notifications */
  disableReminder() {
    const settings = getSettings();
    settings.enabled = false;
    saveSettings(settings);
  },
};
