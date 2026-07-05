'use client';

import React from 'react';
import { VerseListSkeleton } from '@/components/ui/Skeletons';

export default function ReciteLoading() {
  return (
    <div className="container-motoon py-12 section-padding min-h-screen">
      <div className="mb-10 animate-pulse">
        <div className="h-10 w-48 bg-muted rounded mb-4"></div>
        <div className="h-5 w-64 bg-muted rounded"></div>
      </div>
      <VerseListSkeleton />
    </div>
  );
}
