'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Bell, BookOpen, Award, Info, Sparkles, CheckSquare } from 'lucide-react';
import { query, collection, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { useAuth } from '@/hooks/useAuth';
import { Notification, NotificationType } from '@/types/notification.types';
import { notificationsService } from '@/services/firebase/notifications.service';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

export function NotificationBell() {
  const { user, initialized } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 1. Real-time notifications listener with onSnapshot Cleanup Pattern
  useEffect(() => {
    if (!initialized || !user?.id) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', user.id),
      where('isDeleted', '==', false),
      orderBy('createdAt', 'desc'),
      limit(5)
    );

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs.map((docVal) => docVal.data() as Notification);
        setNotifications(list);
      },
      (error) => {
        console.error('Error listening to notifications snapshot:', error);
      }
    );

    // Also listen to unread count in real-time or update based on state
    const unreadQuery = query(
      collection(db, 'notifications'),
      where('userId', '==', user.id),
      where('isRead', '==', false),
      where('isDeleted', '==', false)
    );

    const unsubUnread = onSnapshot(
      unreadQuery,
      (snapshot) => {
        setUnreadCount(snapshot.size);
      },
      (error) => {
        console.error('Error listening to unread count snapshot:', error);
      }
    );

    return () => {
      unsub();
      unsubUnread(); // CRITICAL: cleanup both on unmount AND on user change
    };
  }, [user?.id]);

  // 2. Handle outside click to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAllRead = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user?.id) return;
    try {
      await notificationsService.markAllAsRead(user.id);
      toast.success('تم تحديد جميع الإشعارات كمقروءة');
    } catch (error) {
      console.error(error);
      toast.error('حدث خطأ أثناء تحديث الإشعارات');
    }
  };

  const handleNotificationClick = async (notif: Notification) => {
    setIsOpen(false);
    try {
      if (!notif.isRead) {
        await notificationsService.markAsRead(notif.id);
      }
      if (notif.actionUrl) {
        router.push(notif.actionUrl);
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const getIcon = (type: NotificationType) => {
    switch (type) {
      case 'review_due':
        return <BookOpen className="h-4 w-4 text-amber-500" />;
      case 'milestone':
        return <Award className="h-4 w-4 text-emerald-500" />;
      case 'achievement':
        return <Sparkles className="h-4 w-4 text-purple-500" />;
      case 'system':
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const formatTimeAgo = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'الآن';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `قبل ${minutes} د`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `قبل ${hours} س`;
    const days = Math.floor(hours / 24);
    if (days === 1) return 'أمس';
    if (days === 2) return 'قبل يومين';
    if (days < 7) return `قبل ${days} أيام`;
    return date.toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "relative p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20",
          isOpen && "bg-accent text-foreground"
        )}
        aria-label="الإشعارات"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-0.5 right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground ring-2 ring-background animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 md:-left-4 mt-2 w-80 sm:w-96 rounded-xl border bg-card text-card-foreground shadow-lg ring-1 ring-black/5 z-50 overflow-hidden animate-in fade-in slide-in-from-top-3 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/40">
            <span className="font-semibold text-sm">الإشعارات</span>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors font-medium"
              >
                <CheckSquare className="h-3.5 w-3.5" />
                <span>تحديد الكل كمقروء</span>
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-[360px] overflow-y-auto divide-y">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 px-4 text-center text-muted-foreground">
                <Bell className="h-8 w-8 mb-2 opacity-30 text-primary" />
                <p className="text-xs">لا توجد إشعارات حالياً</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  className={cn(
                    "flex gap-3 p-3.5 hover:bg-muted/50 cursor-pointer transition-colors duration-150 relative",
                    !notif.isRead && "bg-primary/5 hover:bg-primary/10"
                  )}
                >
                  {/* Unread indicator dot */}
                  {!notif.isRead && (
                    <span className="absolute top-4 right-2.5 h-1.5 w-1.5 rounded-full bg-primary" />
                  )}

                  {/* Icon */}
                  <div className="flex-shrink-0 h-8 w-8 rounded-full bg-background border flex items-center justify-center shadow-sm">
                    {getIcon(notif.type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 space-y-1 min-w-0 pr-1">
                    <p className={cn(
                      "text-xs leading-normal font-medium text-foreground",
                      !notif.isRead && "font-semibold"
                    )}>
                      {notif.title}
                    </p>
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {notif.message}
                    </p>
                    <p className="text-[10px] text-muted-foreground/80">
                      {formatTimeAgo(notif.createdAt)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <Link
            href="/notifications"
            onClick={() => setIsOpen(false)}
            className="block text-center py-2.5 bg-muted/40 hover:bg-muted/70 text-xs font-semibold text-primary border-t transition-colors duration-150"
          >
            عرض جميع الإشعارات
          </Link>
        </div>
      )}
    </div>
  );
}
