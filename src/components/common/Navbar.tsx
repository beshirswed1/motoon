'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, User, BookOpen, TrendingUp,
  Home, Download, Heart, Settings
} from 'lucide-react';

import toast from 'react-hot-toast';
import { NotificationBell } from './NotificationBell';
import { reviewReminderService } from '@/services/firebase/reviewReminder.service';
import { usePWA } from '@/contexts/PWAContext';
import { useEffect, useState, useCallback } from 'react';

const navLinks = [
  { href: '/', label: 'الرئيسية', icon: Home },
  { href: '/books', label: 'المتون', icon: BookOpen },
];

export function Navbar() {
  const { user } = useAuth();
  const { isInstallable, installPwa, isStandalone, isIOS } = usePWA();
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (user?.id) {
      reviewReminderService.checkAndCreateReviewReminders(user.id).catch(console.error);
    }
  }, [user?.id]);

  const handleInstallClick = useCallback(async () => {
    if (isInstallable || isIOS) {
      await installPwa();
    } else {
      toast('متصفحك لا يدعم تثبيت التطبيق مباشرة.', {
        icon: 'ℹ️',
        duration: 4000,
      });
    }
  }, [isInstallable, isIOS, installPwa]);

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* ── Header ── */}
      <header
        className={`sticky top-0 z-50 w-full transition-all duration-300 ${
          scrolled
            ? 'bg-background/95 backdrop-blur-xl shadow-lg border-b border-border/60'
            : 'bg-background/80 backdrop-blur-md border-b border-border/40'
        }`}
      >
        <div className="container-motoon flex h-14 md:h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group shrink-0">
            <div className="w-8 h-8 rounded-lg overflow-hidden ring-2 ring-primary/20 group-hover:ring-primary/50 transition-all flex items-center justify-center bg-transparent">
              <img
                src="/logo.png"
                alt="شعار متون"
                className="w-full h-full object-contain"
              />
            </div>
            <span className="text-xl font-black text-primary tracking-tight group-hover:opacity-80 transition-opacity">
              متون
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1 text-sm font-semibold">
            {navLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={`relative px-4 py-2 rounded-full transition-all duration-200 ${
                  isActive(href)
                    ? 'text-primary bg-primary/10'
                    : 'text-foreground/70 hover:text-foreground hover:bg-muted'
                }`}
              >
                {label}
                {isActive(href) && (
                  <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
                )}
              </Link>
            ))}
            <Link
              href="/about"
              className={`relative px-4 py-2 rounded-full transition-all duration-200 ${
                isActive('/about')
                  ? 'text-primary bg-primary/10'
                  : 'text-foreground/70 hover:text-foreground hover:bg-muted'
              }`}
            >
              عن المنصة
            </Link>
            <Link
              href="/contact"
              className={`relative px-4 py-2 rounded-full transition-all duration-200 ${
                isActive('/contact')
                  ? 'text-primary bg-primary/10'
                  : 'text-foreground/70 hover:text-foreground hover:bg-muted'
              }`}
            >
              تواصل معنا
            </Link>
            {user && (
              <Link
                href="/progress"
                className={`relative px-4 py-2 rounded-full transition-all duration-200 ${
                  isActive('/progress')
                    ? 'text-primary bg-primary/10'
                    : 'text-foreground/70 hover:text-foreground hover:bg-muted'
                }`}
              >
                تقدمي
              </Link>
            )}
          </nav>

          {/* Actions Container */}
          <div className="flex items-center gap-1.5 md:gap-2">
            {!isStandalone && (
              <Button
                onClick={handleInstallClick}
                variant="secondary"
                size="sm"
                className="h-8 w-8 p-0 sm:w-auto sm:h-9 sm:px-4 gap-1.5 text-xs font-bold bg-primary/10 text-primary hover:bg-primary/20 rounded-full border-none shadow-none flex items-center justify-center transition-all duration-200"
              >
                <Download className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
                <span className="hidden sm:inline">تحميل التطبيق</span>
              </Button>
            )}

            {/* Favorites (logged in only) */}
            {user && (
              <Link
                href="/favorites"
                className={`h-8 w-8 rounded-full flex items-center justify-center transition-all duration-200 ${
                  isActive('/favorites')
                    ? 'text-red-500 bg-red-500/10'
                    : 'text-muted-foreground hover:text-red-500 hover:bg-red-500/10'
                }`}
                title="المفضلة"
              >
                <Heart className={`h-4 w-4 ${isActive('/favorites') ? 'fill-current' : ''}`} />
              </Link>
            )}

            {/* Desktop Actions */}
            <div className="hidden md:flex items-center gap-2">
              {user ? (
                <>
                  {user.role === 'admin' && (
                    <Button variant="ghost" size="sm" asChild className="gap-1.5 text-xs font-bold text-primary hover:text-primary hover:bg-primary/10">
                      <Link href="/admin">
                        <LayoutDashboard className="h-3.5 w-3.5" />
                        لوحة التحكم
                      </Link>
                    </Button>
                  )}
                  <NotificationBell />
                  <Button variant="outline" size="sm" asChild className="gap-1.5 text-xs font-bold border-border/60 hover:border-primary/40 hover:bg-primary/5">
                    <Link href="/profile">
                      <div className="w-5 h-5 rounded-full bg-primary/15 flex items-center justify-center">
                        <User className="h-3 w-3 text-primary" />
                      </div>
                      {user.name ? user.name.split(' ')[0] : 'حسابي'}
                    </Link>
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="ghost" size="sm" asChild className="text-sm font-bold text-foreground/70 hover:text-foreground">
                    <Link href="/login">تسجيل الدخول</Link>
                  </Button>
                  <Button size="sm" asChild className="text-sm font-bold rounded-full px-5 shadow-sm">
                    <Link href="/register">ابدأ الآن</Link>
                  </Button>
                </>
              )}
            </div>

            {/* Mobile: Notification bell + Profile */}
            <div className="flex md:hidden items-center gap-1">
              {user && <NotificationBell />}
            </div>
          </div>
        </div>
      </header>

      {/* ── Mobile Bottom Navigation Bar ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-xl border-t border-border/50 shadow-[0_-4px_20px_-4px_rgba(0,0,0,0.1)] safe-area-pb">
        <div className="flex items-center justify-around h-16 px-1">
          {[
            { href: '/', icon: Home, label: 'الرئيسية' },
            { href: '/books', icon: BookOpen, label: 'المتون' },
            ...(user ? [{ href: '/progress', icon: TrendingUp, label: 'تقدمي' }] : []),
            ...(user ? [{ href: '/settings', icon: Settings, label: 'الإعدادات' }] : []),
            ...(user
              ? [{ href: '/profile', icon: User, label: 'حسابي' }]
              : [{ href: '/login', icon: User, label: 'دخول' }]
            ),
          ].map(({ href, icon: Icon, label }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                className="flex flex-col items-center justify-center gap-0.5 py-1 min-w-[56px] max-w-[72px] rounded-xl transition-all duration-200 group"
              >
                <div className={`relative flex items-center justify-center h-8 transition-all duration-300 ${
                  active ? 'w-12 rounded-2xl bg-primary/15' : 'w-8 rounded-lg'
                }`}>
                  <Icon className={`h-5 w-5 transition-all duration-200 ${
                    active ? 'text-primary scale-110' : 'text-muted-foreground group-hover:text-foreground'
                  }`} />
                  {active && (
                    <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
                  )}
                </div>
                <span className={`text-[10px] font-bold leading-none truncate transition-colors ${
                  active ? 'text-primary' : 'text-muted-foreground'
                }`}>{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Bottom nav spacer on mobile */}
      <div className="md:hidden h-16" aria-hidden />
    </>
  );
}
