'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useRouter, usePathname } from 'next/navigation';
import {
  LayoutDashboard, User, LogOut, BookOpen, TrendingUp,
  Menu, X, Home, Phone, Info, ChevronRight, Download,
} from 'lucide-react';

import toast from 'react-hot-toast';
import { NotificationBell } from './NotificationBell';
import { reviewReminderService } from '@/services/firebase/reviewReminder.service';
import { usePWA } from '@/contexts/PWAContext';
import { useEffect, useState, useCallback } from 'react';

const navLinks = [
  { href: '/', label: 'الرئيسية', icon: Home },
  { href: '/books', label: 'المتون', icon: BookOpen },
  { href: '/about', label: 'عن المنصة', icon: Info },
  { href: '/contact', label: 'تواصل معنا', icon: Phone },
];

const userLinks = [
  { href: '/progress', label: 'تقدمي', icon: TrendingUp },
];

export function Navbar() {
  const { user, signOut } = useAuth();
  const { isInstallable, installPwa, isStandalone, isIOS } = usePWA();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (user?.id) {
      reviewReminderService.checkAndCreateReviewReminders(user.id).catch(console.error);
    }
  }, [user?.id]);

  const handleLogout = useCallback(async () => {
    try {
      await signOut();
      toast.success('تم تسجيل الخروج بنجاح');
      router.push('/login');
    } catch {
      toast.error('حدث خطأ أثناء تسجيل الخروج');
    }
  }, [signOut, router]);

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
      {/* ── Desktop Header ── */}
      <header
        className={`sticky top-0 z-50 w-full transition-all duration-300 ${
          scrolled
            ? 'bg-background/95 backdrop-blur-xl shadow-lg border-b border-border/60'
            : 'bg-background/80 backdrop-blur-md border-b border-border/40'
        }`}
      >
        <div className="container-motoon flex h-16 items-center justify-between">
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
            {user && userLinks.map(({ href, label }) => (
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
          </nav>

          {/* Actions Container */}
          <div className="flex items-center gap-2">
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
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleLogout}
                    className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-8 w-8"
                    title="تسجيل الخروج"
                  >
                    <LogOut className="h-3.5 w-3.5" />
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

            {/* Mobile Menu Toggle */}
            <button
              className="md:hidden p-2 rounded-xl text-foreground/70 hover:text-foreground hover:bg-muted transition-colors"
              onClick={() => setMobileMenuOpen(v => !v)}
              aria-label="قائمة التنقل"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border/40 bg-background/98 backdrop-blur-xl animate-in slide-in-from-top-2 duration-200">
            <div className="container-motoon py-4 flex flex-col gap-1">
              {navLinks.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                    isActive(href)
                      ? 'bg-primary/10 text-primary'
                      : 'text-foreground/70 hover:bg-muted hover:text-foreground'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                  <ChevronRight className="h-3.5 w-3.5 mr-auto rotate-180" />
                </Link>
              ))}
              {user && userLinks.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                    isActive(href)
                      ? 'bg-primary/10 text-primary'
                      : 'text-foreground/70 hover:bg-muted hover:text-foreground'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                  <ChevronRight className="h-3.5 w-3.5 mr-auto rotate-180" />
                </Link>
              ))}

              <div className="border-t border-border/30 mt-2 pt-3 flex flex-col gap-2">
                {!isStandalone && (
                  <button
                    onClick={() => {
                      handleInstallClick();
                      setMobileMenuOpen(false);
                    }}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-primary bg-primary/10 hover:bg-primary/20 transition-all duration-200"
                  >
                    <Download className="h-4 w-4" />
                    تحميل التطبيق
                  </button>
                )}
                {user ? (
                  <>
                    {user.role === 'admin' && (
                      <Link href="/admin" className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-primary bg-primary/5">
                        <LayoutDashboard className="h-4 w-4" />
                        لوحة التحكم
                      </Link>
                    )}
                    <Link href="/profile" className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold hover:bg-muted">
                      <User className="h-4 w-4 text-muted-foreground" />
                      {user.name || 'حسابي'}
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-destructive hover:bg-destructive/10 w-full text-right"
                    >
                      <LogOut className="h-4 w-4" />
                      تسجيل الخروج
                    </button>
                  </>
                ) : (
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" asChild className="flex-1 font-bold">
                      <Link href="/login">تسجيل الدخول</Link>
                    </Button>
                    <Button size="sm" asChild className="flex-1 font-bold">
                      <Link href="/register">ابدأ الآن</Link>
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </header>

      {/* ── Mobile Bottom Navigation Bar ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-xl border-t border-border/50 shadow-2xl safe-area-pb">
        <div className="flex items-center justify-around h-16 px-2">
          {[
            { href: '/', icon: Home, label: 'الرئيسية' },
            { href: '/books', icon: BookOpen, label: 'المتون' },
            ...(user ? [{ href: '/progress', icon: TrendingUp, label: 'تقدمي' }] : []),
            { href: '/about', icon: Info, label: 'عن المنصة' },
            ...(user
              ? [{ href: '/profile', icon: User, label: 'حسابي' }]
              : [{ href: '/login', icon: User, label: 'دخول' }]
            ),
          ].map(({ href, icon: Icon, label }) => (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-all duration-200 min-w-0 ${
                isActive(href)
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <div className={`p-1.5 rounded-lg transition-all duration-200 ${
                isActive(href) ? 'bg-primary/15' : ''
              }`}>
                <Icon className={`h-5 w-5 transition-all ${isActive(href) ? 'scale-110' : ''}`} />
              </div>
              <span className="text-[10px] font-bold leading-none truncate">{label}</span>
            </Link>
          ))}
        </div>
      </nav>

      {/* Bottom nav spacer on mobile */}
      <div className="md:hidden h-16" aria-hidden />
    </>
  );
}
