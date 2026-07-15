'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, Bell, Settings, Info, Phone, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/firebase/config';

export function MobileMenu() {
  const { user, initialized } = useAuth();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close dropdown when route changes
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Listen to unread notifications count
  useEffect(() => {
    if (!initialized || !user?.id) {
      setUnreadCount(0);
      return;
    }

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

    return () => unsubUnread();
  }, [user?.id, initialized]);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "relative p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20",
          isOpen && "bg-accent text-foreground"
        )}
        aria-label="القائمة الرئيسية"
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        {!isOpen && unreadCount > 0 && (
          <span className="absolute top-0.5 right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground ring-2 ring-background">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 mt-2 w-56 rounded-xl border bg-card text-card-foreground shadow-lg ring-1 ring-black/5 z-50 overflow-hidden animate-in fade-in slide-in-from-top-3 duration-200">
          <div className="flex flex-col py-2">
            {user && (
              <>
                <Link
                  href="/notifications"
                  className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors"
                >
                  <div className="relative">
                    <Bell className="h-4 w-4 text-primary" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 flex h-2 w-2 rounded-full bg-destructive" />
                    )}
                  </div>
                  <span className="text-sm font-medium">الإشعارات</span>
                  {unreadCount > 0 && (
                    <span className="mr-auto text-xs font-bold text-destructive bg-destructive/10 px-1.5 rounded-md">
                      {unreadCount}
                    </span>
                  )}
                </Link>
                <Link
                  href="/settings"
                  className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors"
                >
                  <Settings className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">الإعدادات</span>
                </Link>
                <div className="h-px bg-border my-1" />
              </>
            )}
            
            <Link
              href="/about"
              className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors"
            >
              <Info className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">عنا</span>
            </Link>
            
            <Link
              href="/contact"
              className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors"
            >
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">التواصل</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
