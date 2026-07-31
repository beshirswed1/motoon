import React from 'react';
import type { Metadata } from 'next';
import { getAllLocalBooks } from '@/lib/data';
import { AUTHORS } from '@/lib/data/authors.data';
import { SCIENCES } from '@/lib/data/sciences.data';
import { createPageMetadata } from '@/lib/seo/metadata.helpers';
import { createBreadcrumbSchema, combineSchemas } from '@/lib/seo/jsonld.helpers';
import { SEO_CONFIG, getFullUrl } from '@/lib/seo/seo.config';
import { JsonLd } from '@/components/seo/JsonLd';
import { Breadcrumb } from '@/components/seo/Breadcrumb';
import { SearchClientPage } from './SearchClientPage';

export async function generateMetadata(): Promise<Metadata> {
  return createPageMetadata({
    title: 'البحث الشامل في المتون والعلماء والعلوم — الموسوعة العلمية | متون',
    description: 'ابحث في كافة المتون الشرعية (الأجرومية، ألفية ابن مالك، البيقونية، الورقات)، والعلماء والمؤلفين والتخصصات العلمية في منصة متون.',
    keywords: ['بحث متون', 'البحث في المتون الشرعية', 'بحث الأجرومية', 'مكتبة المتون', 'بحث العلماء'],
    path: '/search',
  });
}

export default async function SearchPage(props: {
  searchParams?: Promise<{ q?: string }>;
}) {
  const searchParams = await props.searchParams;
  const initialQuery = searchParams?.q || '';

  const allBooks = getAllLocalBooks();

  const searchResultsSchema = {
    '@context': 'https://schema.org',
    '@type': 'SearchResultsPage',
    name: 'صفحة البحث في متون',
    description: 'ابحث في مكتبة المتون والعلماء والعلوم.',
    url: getFullUrl('/search'),
  };

  const breadcrumbSchema = createBreadcrumbSchema([
    { name: 'الرئيسية', url: getFullUrl('/') },
    { name: 'البحث الشامل', url: getFullUrl('/search') },
  ]);

  return (
    <div className="min-h-screen bg-background pb-20">
      <JsonLd data={combineSchemas(searchResultsSchema, breadcrumbSchema)} />

      {/* Header Banner */}
      <section className="relative overflow-hidden py-12 md:py-16 section-padding bg-muted/30 border-b">
        <div className="container-motoon relative z-10 text-center flex flex-col items-center gap-3">
          <Breadcrumb items={[{ label: 'البحث الشامل' }]} className="mb-2" />
          <h1 className="text-3xl md:text-4xl font-black text-foreground">
            محتوى الموسوعة العلمية
          </h1>
          <p className="text-sm md:text-base text-muted-foreground max-w-xl">
            ابحث عن متونك المفضلـة، العلماء والمؤلفين، أو العلوم الشرعية بكل يسر وسرعة.
          </p>
        </div>
      </section>

      <main className="container-motoon py-10">
        <SearchClientPage
          initialQuery={initialQuery}
          allBooks={allBooks}
          allAuthors={AUTHORS}
          allSciences={SCIENCES}
        />
      </main>
    </div>
  );
}
