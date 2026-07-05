'use client';

import { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Verse } from '@/types/verse.types';
import { cn } from '@/lib/utils';

export interface VirtualizedVerseListProps {
  verses: Verse[];
  activeVerseId?: string;
  onVerseClick?: (verse: Verse, index: number) => void;
  className?: string;
}

export function VirtualizedVerseList({
  verses,
  activeVerseId,
  onVerseClick,
  className
}: VirtualizedVerseListProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  // Initialize the list virtualizer
  const rowVirtualizer = useVirtualizer({
    count: verses.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 60, // Estimate 60px height per verse row
    overscan: 5,
  });

  // Helper to split classical Arabic verses into Sadr (الصدر) and Ajez (العجز)
  const parseCouplet = (text: string) => {
    // Delimiters could be three stars '***', double space '  ', or standard tab
    let parts = text.split('***').map(p => p.trim());
    if (parts.length < 2) {
      parts = text.split('  ').map(p => p.trim()).filter(Boolean);
    }
    return {
      sadr: parts[0] || '',
      ajez: parts[1] || ''
    };
  };

  return (
    <div
      ref={parentRef}
      className={cn(
        "h-[550px] overflow-y-auto border rounded-2xl bg-card/50 shadow-inner dir-rtl scrollbar-thin select-none",
        className
      )}
    >
      <div
        className="w-full relative"
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
        }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
          const verse = verses[virtualRow.index];
          const { sadr, ajez } = parseCouplet(verse.text);
          const isActive = activeVerseId === verse.id;

          return (
            <div
              key={virtualRow.key}
              ref={rowVirtualizer.measureElement}
              data-index={virtualRow.index}
              onClick={() => onVerseClick?.(verse, virtualRow.index)}
              className={cn(
                "absolute top-0 right-0 left-0 w-full p-4 border-b flex items-start gap-4 cursor-pointer transition-all duration-150",
                isActive 
                  ? "bg-primary/10 border-r-4 border-r-primary border-b-primary/20" 
                  : "hover:bg-muted/30 border-b-muted/40"
              )}
              style={{
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              {/* Verse order number badge */}
              <span className={cn(
                "h-6 w-6 rounded-full border text-[10px] font-black flex items-center justify-center bg-background shadow-sm flex-shrink-0 mt-0.5",
                isActive ? "text-primary border-primary bg-primary/5" : "text-muted-foreground"
              )}>
                {verse.order}
              </span>

              {/* Verse content: Split couplet if available, otherwise single line */}
              <div className="flex-1 min-w-0 font-arabic text-sm sm:text-base leading-loose text-foreground">
                {ajez ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 w-full">
                    {/* Sadr (Right half in RTL) */}
                    <div className="text-right font-medium text-foreground select-text pr-2">
                      {sadr}
                    </div>
                    {/* Ajez (Left half in RTL) */}
                    <div className="text-right md:text-left text-foreground/90 font-medium select-text pl-2">
                      {ajez}
                    </div>
                  </div>
                ) : (
                  <div className="text-right font-medium select-text px-2">
                    {verse.text}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
