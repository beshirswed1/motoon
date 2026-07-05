'use client';

import { cn } from '@/lib/utils';

// Helper Skeleton Base Component
function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted/65", className)}
      {...props}
    />
  );
}

// 1. BookCardSkeleton: Matches BookCard.tsx layout exactly
export function BookCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-xl border bg-card shadow-sm min-h-[380px]">
      {/* 3:4 aspect ratio image area */}
      <div className="relative aspect-[3/4] w-full bg-muted flex items-center justify-center">
        {/* Placeholder badge in top right */}
        <Skeleton className="absolute top-2 right-2 h-5 w-16 rounded-full" />
      </div>
      
      {/* Card Details */}
      <div className="flex flex-1 flex-col p-4 space-y-3">
        {/* Title */}
        <Skeleton className="h-5 w-3/4 rounded" />
        {/* Author */}
        <Skeleton className="h-4 w-1/2 rounded" />
        
        {/* Verses Count Indicator */}
        <div className="mt-4 flex items-center justify-between pt-2">
          <Skeleton className="h-4 w-1/4 rounded" />
        </div>
      </div>
    </div>
  );
}

// 2. VerseListSkeleton: Matches standard verse rows
export function VerseListSkeleton() {
  return (
    <div className="border rounded-2xl bg-card/50 p-4 space-y-4 shadow-inner">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="flex items-center gap-4 py-3 border-b border-muted/30 last:border-0">
          {/* Badge */}
          <Skeleton className="h-6 w-6 rounded-full flex-shrink-0" />
          
          {/* Verse Couplet lines */}
          <div className="flex-1 grid grid-cols-2 gap-8">
            <Skeleton className="h-4 w-5/6 justify-self-end" />
            <Skeleton className="h-4 w-4/6" />
          </div>
        </div>
      ))}
    </div>
  );
}

// 3. ProgressCardSkeleton: Matches progress/page.tsx dashboard cards
export function ProgressCardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* 4 Stats Grid Skeletons */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-xl border bg-card p-6 shadow-sm flex flex-col justify-between min-h-[120px]">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-1/3 rounded" />
              <Skeleton className="h-5 w-5 rounded-full" />
            </div>
            <div className="flex items-baseline gap-2 mt-4">
              <Skeleton className="h-8 w-16 rounded" />
              <Skeleton className="h-3.5 w-1/3 rounded" />
            </div>
          </div>
        ))}
      </div>

      {/* Grid for Calendar & Due items Skeletons */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-4">
        {/* Calendar Card Skeleton */}
        <div className="lg:col-span-2 rounded-xl border bg-card p-6 shadow-sm space-y-4">
          <Skeleton className="h-5 w-1/4 rounded" />
          <Skeleton className="h-3.5 w-1/2 rounded" />
          
          <div className="grid grid-cols-7 gap-2 pt-4">
            {[...Array(7)].map((_, i) => (
              <div key={i} className="flex flex-col items-center justify-center p-3 rounded-xl border border-dashed space-y-2">
                <Skeleton className="h-3 w-1/2 rounded" />
                <Skeleton className="h-4 w-1/3 rounded" />
                <Skeleton className="h-5 w-5 rounded-full mt-2" />
              </div>
            ))}
          </div>
        </div>

        {/* Due Items Sidebar Skeleton */}
        <div className="rounded-xl border bg-card p-6 shadow-sm space-y-4">
          <Skeleton className="h-5 w-1/3 rounded" />
          <Skeleton className="h-3.5 w-2/3 rounded" />
          
          <div className="space-y-3 pt-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center justify-between p-3 border rounded-xl">
                <Skeleton className="h-4 w-1/2 rounded" />
                <Skeleton className="h-5 w-8 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
