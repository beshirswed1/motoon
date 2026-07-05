'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, BookOpen, Award, Info, Sparkles, CheckSquare, Loader2, Calendar } from 'lucide-react';
import { query, collection, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { useAuth } from '@/hooks/useAuth';
import { Notification, NotificationType } from '@/types/notification.types';
import { notificationsService } from '@/services/firebase/notifications.service';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

type FilterType = 'all' | 'unread' | 'read' | 'review_due';

export default function NotificationsPage() {
  const { user, initialized } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');

  // Real-time listener for the entire notification history (last 100 notifications)
  useEffect(() => {
    if (!initialized || !user?.id) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', user.id),
      where('isDeleted', '==', false),
      orderBy('createdAt', 'desc')
    );

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs.map((docVal) => docVal.data() as Notification);
        setNotifications(list);
        setLoading(false);
      },
      (error) => {
        console.error('Error listening to notifications snapshot:', error);
        setLoading(false);
      }
    );

    return () => unsub(); // CRITICAL: cleanup on unmount and user change
  }, [user?.id]);

  const handleMarkAllRead = async () => {
    if (!user?.id) return;
    const toastId = toast.loading('جاري تحديث الإشعارات...');
    try {
      await notificationsService.markAllAsRead(user.id);
      toast.success('تم تحديد جميع الإشعارات كمقروءة', { id: toastId });
    } catch (error) {
      console.error(error);
      toast.error('حدث خطأ أثناء تحديث الإشعارات', { id: toastId });
    }
  };

  const handleNotificationClick = async (notif: Notification) => {
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
        return <BookOpen className="h-5 w-5 text-amber-500" />;
      case 'milestone':
        return <Award className="h-5 w-5 text-emerald-500" />;
      case 'achievement':
        return <Sparkles className="h-5 w-5 text-purple-500" />;
      case 'system':
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const formatFullDate = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('ar-EG', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTypeName = (type: NotificationType) => {
    switch (type) {
      case 'review_due':
        return 'مراجعة مطلوبة';
      case 'milestone':
        return 'إنجاز مهم';
      case 'achievement':
        return 'وسام تميز';
      case 'system':
      default:
        return 'تنبيه نظام';
    }
  };

  // Client-side filtering of the real-time stream
  const filteredNotifications = notifications.filter((notif) => {
    if (filter === 'unread') return !notif.isRead;
    if (filter === 'read') return notif.isRead;
    if (filter === 'review_due') return notif.type === 'review_due';
    return true;
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="text-sm font-semibold text-muted-foreground">جاري تحميل إشعاراتك...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto dir-rtl text-right select-none">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-foreground flex items-center gap-2">
            <Bell className="h-8 w-8 text-primary" />
            <span>الإشعارات والتنبيهات</span>
          </h1>
          <p className="text-muted-foreground text-sm mt-1">تابع إشعارات المراجعات اليومية وإنجازاتك الشخصية على المنصة.</p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border bg-card hover:bg-muted text-sm font-semibold transition-all duration-200 shadow-sm text-primary border-primary/20"
          >
            <CheckSquare className="h-4 w-4" />
            <span>تحديد الكل كمقروء ({unreadCount})</span>
          </button>
        )}
      </div>

      {/* Main Container */}
      <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
        {/* Filters Tabs */}
        <div className="flex border-b overflow-x-auto bg-muted/20 scrollbar-none">
          {(['all', 'unread', 'read', 'review_due'] as const).map((tab) => {
            const count = 
              tab === 'all' ? notifications.length :
              tab === 'unread' ? unreadCount :
              tab === 'read' ? notifications.filter(n => n.isRead).length :
              notifications.filter(n => n.type === 'review_due').length;

            const labels = {
              all: 'الكل',
              unread: 'غير مقروء',
              read: 'المقروءة',
              review_due: 'المراجعات اليومية',
            };

            return (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={cn(
                  "px-5 py-4 text-xs font-bold border-b-2 transition-all duration-200 whitespace-nowrap focus:outline-none flex items-center gap-2",
                  filter === tab 
                    ? "border-primary text-primary bg-background" 
                    : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/30"
                )}
              >
                <span>{labels[tab]}</span>
                {count > 0 && (
                  <span className={cn(
                    "text-[10px] px-2 py-0.5 rounded-full font-black",
                    tab === 'unread' && filter !== tab ? "bg-destructive text-destructive-foreground animate-pulse" : "bg-muted text-muted-foreground border"
                  )}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* List Content */}
        <div className="divide-y">
          {filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center text-muted-foreground">
              <Bell className="h-12 w-12 mb-3 opacity-20 text-primary" />
              <h3 className="font-bold text-sm text-foreground">لا توجد إشعارات حالياً</h3>
              <p className="text-xs text-muted-foreground max-w-sm mt-1">
                {filter === 'unread' ? 'لقد قرأت جميع الإشعارات المتاحة.' : 
                 filter === 'review_due' ? 'ليس لديك أي إشعارات مراجعات معلقة اليوم.' : 
                 'عندما تحصل على إشعار جديد، سيظهر في هذه القائمة.'}
              </p>
            </div>
          ) : (
            filteredNotifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => handleNotificationClick(notif)}
                className={cn(
                  "flex gap-4 p-5 hover:bg-muted/30 cursor-pointer transition-all duration-150 relative",
                  !notif.isRead && "bg-primary/5 hover:bg-primary/10 border-r-4 border-r-primary"
                )}
              >
                {/* Icon Container */}
                <div className="flex-shrink-0 h-10 w-10 rounded-xl bg-background border flex items-center justify-center shadow-sm">
                  {getIcon(notif.type)}
                </div>

                {/* Main Content Area */}
                <div className="flex-1 space-y-1.5 min-w-0">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-[10px] font-black tracking-wider text-muted-foreground uppercase bg-muted px-2 py-0.5 rounded">
                      {getTypeName(notif.type)}
                    </span>
                    
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>{formatFullDate(notif.createdAt)}</span>
                    </span>
                  </div>

                  <h3 className={cn(
                    "text-sm font-semibold text-foreground",
                    !notif.isRead && "font-black text-primary"
                  )}>
                    {notif.title}
                  </h3>

                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {notif.message}
                  </p>

                  {/* Actions indication */}
                  {notif.actionUrl && (
                    <div className="pt-2">
                      <span className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1">
                        <span>انقر للانتقال والمتابعة &larr;</span>
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
