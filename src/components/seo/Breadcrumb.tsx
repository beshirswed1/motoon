import React from 'react';
import Link from 'next/link';
import { ChevronLeft, Home } from 'lucide-react';
import { createBreadcrumbSchema } from '@/lib/seo/jsonld.helpers';
import { getFullUrl } from '@/lib/seo/seo.config';
import { JsonLd } from './JsonLd';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  showHome?: boolean;
  className?: string;
}

export function Breadcrumb({ items, showHome = true, className = '' }: BreadcrumbProps) {
  const allItems: BreadcrumbItem[] = [
    ...(showHome ? [{ label: 'الرئيسية', href: '/' }] : []),
    ...items,
  ];

  // Schema items require full absolute URLs
  const schemaItems = allItems.map((item) => ({
    name: item.label,
    url: getFullUrl(item.href || ''),
  }));

  const breadcrumbSchema = createBreadcrumbSchema(schemaItems);

  return (
    <>
      <JsonLd data={breadcrumbSchema} />
      <nav
        aria-label="مسار التنقل (Breadcrumb)"
        className={`flex items-center gap-1.5 text-xs md:text-sm text-muted-foreground ${className}`}
      >
        <ol className="flex items-center gap-1.5 flex-wrap">
          {allItems.map((item, index) => {
            const isLast = index === allItems.length - 1;

            return (
              <li key={index} className="flex items-center gap-1.5">
                {index > 0 && (
                  <ChevronLeft className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0 rtl:rotate-0 ltr:rotate-180" aria-hidden="true" />
                )}

                {isLast || !item.href ? (
                  <span
                    className="font-bold text-foreground truncate max-w-[200px] md:max-w-[300px]"
                    aria-current="page"
                  >
                    {index === 0 && showHome && (
                      <Home className="h-3.5 w-3.5 inline-block ml-1 -mt-0.5" />
                    )}
                    {item.label}
                  </span>
                ) : (
                  <Link
                    href={item.href}
                    className="hover:text-primary transition-colors flex items-center gap-1 truncate max-w-[150px] md:max-w-[250px]"
                  >
                    {index === 0 && showHome && (
                      <Home className="h-3.5 w-3.5 shrink-0" />
                    )}
                    <span>{item.label}</span>
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
}
