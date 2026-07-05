'use client';
import React from 'react';

import { Sidebar } from '@/components/common/Sidebar';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { BarChart3, User, Settings } from 'lucide-react';

export default function UserLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const navItems = [
    { href: '/progress', label: 'المتابعة', icon: BarChart3 },
    { href: '/profile', label: 'حسابي', icon: User },
    { href: '/settings', label: 'الإعدادات', icon: Settings },
  ];

  return (
    <div className="flex min-h-screen bg-muted/20">
      {/* Desktop Sidebar (Renders on the right side in RTL) */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col pb-16 md:pb-0 min-h-screen overflow-y-auto">
        <main className="flex-1 p-6 md:p-8">{children}</main>
      </div>

      {/* Mobile Bottom Navigation (Renders at bottom of mobile screens) */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 h-16 border-t bg-background flex items-center justify-around md:hidden">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center flex-1 h-full gap-1 text-xs transition-colors',
                isActive ? 'text-primary font-medium' : 'text-muted-foreground'
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
