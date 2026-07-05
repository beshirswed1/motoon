// Auth route group layout
import type { ReactNode } from 'react';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-hero">
      <div className="w-full max-w-md px-4">{children}</div>
    </div>
  );
}
