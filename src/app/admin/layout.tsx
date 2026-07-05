'use client';

import React, { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  LayoutDashboard, 
  BookOpen, 
  ArrowLeft, 
  Loader2, 
  ShieldAlert,
  Menu,
  X,
  Users,
  BarChart3,
  FileText,
  Settings
} from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, initialized, loading } = useAuth();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  useEffect(() => {
    if (initialized && !loading) {
      if (!user || user.role !== 'admin') {
        router.push('/');
      }
    }
  }, [user, initialized, loading, router]);

  if (!initialized || loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-3 bg-muted/10">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <span className="text-sm font-semibold text-muted-foreground select-none">جاري التحقق من الصلاحيات...</span>
      </div>
    );
  }

  // Double check authorization
  if (!user || user.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-6 text-center select-none max-w-sm mx-auto dir-rtl">
        <ShieldAlert className="w-16 h-16 text-destructive animate-bounce" />
        <h2 className="text-2xl font-bold">وصول غير مصرح به</h2>
        <p className="text-sm text-muted-foreground">ليست لديك الصلاحيات الكافية للوصول إلى لوحة التحكم.</p>
        <button 
          onClick={() => router.push('/')}
          className="w-full mt-2 bg-primary text-primary-foreground py-2.5 rounded-xl font-bold text-sm shadow-sm"
        >
          العودة للرئيسية
        </button>
      </div>
    );
  }

  const roleLabel = 'مدير النظام';

  const menuItems = [
    { href: '/admin', label: 'لوحة التحكم الرئيسية', icon: LayoutDashboard },
    { href: '/admin/books', label: 'إدارة المتون والأبيات', icon: BookOpen },
    { href: '/admin/users', label: 'إدارة الأعضاء والصلاحيات', icon: Users },
    { href: '/admin/analytics', label: 'التحليلات والتقارير', icon: BarChart3 },
    { href: '/admin/pages', label: 'الصفحات التعريفية', icon: FileText },
    { href: '/admin/settings', label: 'إعدادات المنصة', icon: Settings },
    { href: '/admin/audit', label: 'سجل عمليات المشرفين', icon: ShieldAlert },
  ];

  return (
    <div className="flex min-h-screen bg-muted/10 dir-rtl select-none">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-l bg-card h-screen sticky top-0">
        <div className="p-6 border-b flex flex-col gap-1.5">
          <span className="text-xl font-extrabold text-primary select-none">لوحة الإدارة</span>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="text-[10px] text-muted-foreground font-semibold">
              {user.name} ({roleLabel})
            </span>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-all"
              >
                <Icon className="h-5 w-5 text-primary" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t">
          <Link
            href="/"
            className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl text-sm font-bold text-primary border border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>العودة للموقع الرئيسي</span>
          </Link>
        </div>
      </aside>

      {/* Mobile Top Header */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="flex items-center justify-between h-16 border-b bg-card px-6 md:hidden">
          <span className="text-lg font-bold text-primary">لوحة الإدارة</span>
          <button 
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-1.5 border rounded-lg text-muted-foreground"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </header>

        {/* Mobile Navigation Drawer */}
        {mobileOpen && (
          <div className="fixed inset-0 top-16 z-50 bg-background/95 backdrop-blur-sm p-6 flex flex-col md:hidden animate-in fade-in slide-in-from-top-4 duration-200">
            <div className="flex items-center gap-2 mb-8 bg-muted/40 p-4 rounded-xl border">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
              <span className="text-sm font-bold text-foreground">
                {user.name} ({roleLabel})
              </span>
            </div>
            
            <nav className="flex-1 space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-muted-foreground hover:bg-accent hover:text-accent-foreground border"
                  >
                    <Icon className="h-5 w-5 text-primary" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="mt-8 border-t pt-6">
              <Link
                href="/"
                onClick={() => setMobileOpen(false)}
                className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl text-sm font-bold text-primary border border-primary/20 bg-primary/5 hover:bg-primary/10"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>العودة للموقع الرئيسي</span>
              </Link>
            </div>
          </div>
        )}

        {/* Main Admin Pages Area */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
