'use client';
import React from 'react';

import { Sidebar } from '@/components/common/Sidebar';
import { ProtectedRoute } from '@/components/guards/ProtectedRoute';

export default function UserLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <div className="flex min-h-screen bg-muted/20">
        {/* Desktop Sidebar (Renders on the right side in RTL) */}
        <div className="hidden md:block">
          <Sidebar />
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-h-screen overflow-y-auto">
          <main className="flex-1 p-4 md:p-8">{children}</main>
        </div>
      </div>
    </ProtectedRoute>
  );
}

