'use client';
import React from 'react';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { db } from '@/firebase/config';
import { doc, onSnapshot } from 'firebase/firestore';
import { ShieldAlert } from 'lucide-react';

interface MaintenanceGuardProps {
  children: React.ReactNode;
}

export function MaintenanceGuard({ children }: MaintenanceGuardProps) {
  const { user, initialized, loading } = useAuth();
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const docRef = doc(db, 'site_settings', 'general');
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setMaintenanceMode(!!data.maintenanceMode);
      }
      setChecking(false);
    }, (err) => {
      console.error("Error listening to site settings:", err);
      setChecking(false);
    });

    return () => unsubscribe();
  }, []);

  // While settings or auth are initializing, show nothing or children
  if (checking || !initialized || loading) {
    return <>{children}</>;
  }

  // If maintenance mode is active and the user is NOT an admin, block access
  if (maintenanceMode && user?.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-muted/10 text-center dir-rtl select-none">
        <div className="max-w-md w-full bg-card border rounded-2xl p-8 shadow-xl flex flex-col items-center gap-6">
          <div className="p-4 bg-teal-500/10 rounded-full text-teal-600 animate-pulse">
            <ShieldAlert className="w-16 h-16" />
          </div>
          
          <h1 className="text-2xl font-black text-foreground">المنصة في وضع الصيانة</h1>
          
          <p className="text-sm text-muted-foreground leading-relaxed">
            نعمل حالياً على تحديث وتطوير منصة متون لتقديم أفضل تجربة تعليمية لكم. سنعود للعمل قريباً إن شاء الله.
          </p>
          
          <div className="w-full h-[1px] bg-muted/60" />
          
          <p className="text-[10px] text-muted-foreground">فريق دعم متون © {new Date().getFullYear()}</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
