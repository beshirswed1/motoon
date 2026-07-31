import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { getAllAuthors } from '@/lib/data/authors.data';
import { getAllLocalBooks } from '@/lib/data';
import { createPageMetadata } from '@/lib/seo/metadata.helpers';
import { createCollectionPageSchema, createBreadcrumbSchema, combineSchemas } from '@/lib/seo/jsonld.helpers';
import { SEO_CONFIG, getFullUrl } from '@/lib/seo/seo.config';
import { JsonLd } from '@/components/seo/JsonLd';
import { Breadcrumb } from '@/components/seo/Breadcrumb';
import { User, BookOpen, ScrollText, ArrowLeft, GraduationCap } from 'lucide-react';

export async function generateMetadata(): Promise<Metadata> {
  return createPageMetadata({
    title: 'أعلام العلماء والمؤلفين — تراجم العلماء وصناع المتون | متون',
    description: 'تصفح دليل وأعلام أئمة وعلماء الإسلام مؤلفي المتون الشرعية (ابن مالك، النووي، ابن تيمية، ابن آجروم، الطحاوي والجزري) وتعرف على سبر حياتهم ومتونهم.',
    keywords: [
      'علماء الإسلام',
      'مؤلفو المتون',
      'تراجم العلماء',
      'ابن مالك',
      'الإمام النووي',
      'ابن آجروم',
      'ابن تيمية',
      'ابن الجزري',
      'علماء النحو والحديث',
    ],
    path: '/authors',
  });
}

export default function AuthorsListingPage() {
  const authors = getAllAuthors();
  const allBooks = getAllLocalBooks();

  const collectionSchema = createCollectionPageSchema({
    name: 'دليل العلماء والمؤلفين',
    description: 'تراجم وأعمال أئمة الإسلام واضعي المتون الشرعية.',
    url: getFullUrl('/authors'),
    items: authors.map((a) => ({
      name: a.name,
      url: getFullUrl(`/authors/${a.slug}`),
      description: a.bio,
    })),
  });

  const breadcrumbSchema = createBreadcrumbSchema([
    { name: 'الرئيسية', url: getFullUrl('/') },
    { name: 'أعلام العلماء والمؤلفين', url: getFullUrl('/authors') },
  ]);

  return (
    <div className="min-h-screen bg-background pb-20">
      <JsonLd data={combineSchemas(collectionSchema, breadcrumbSchema)} />

      {/* Hero Header */}
      <section className="relative overflow-hidden py-16 md:py-20 section-padding bg-muted/30 border-b">
        <div className="absolute inset-0 bg-primary/5 pattern-dots opacity-40" />
        <div className="container-motoon relative z-10 text-center flex flex-col items-center gap-4">
          <Breadcrumb items={[{ label: 'أعلام العلماء' }]} className="mb-2" />

          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
            <GraduationCap className="h-7 w-7" />
          </div>

          <h1 className="text-3xl md:text-5xl font-black text-foreground">
            أعلام العلماء والمؤلفين
          </h1>

          <p className="text-base md:text-lg text-muted-foreground max-w-2xl leading-relaxed">
            تراجم وسير أئمة الإسلام والعلماء الأعلام واضعي المنظومات والمتون الشرعية
            التي قُدمت لخدمة الأمة ونقل العلم عبر القرون.
          </p>
        </div>
      </section>

      {/* Authors Grid */}
      <main className="container-motoon py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {authors.map((author) => {
            const authorBooks = allBooks.filter((b) => author.bookSlugs.includes(b.slug) || b.author.includes(author.shortName));

            return (
              <article
                key={author.id}
                className="group flex flex-col justify-between p-6 rounded-3xl border border-border/60 bg-card hover:border-primary/40 hover:shadow-xl transition-all duration-300"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0 group-hover:scale-110 transition-transform">
                      <User className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-bold text-muted-foreground px-3 py-1 rounded-full bg-muted border border-border/40">
                      توفي: {author.era}
                    </span>
                  </div>

                  <h2 className="font-bold text-xl text-foreground mb-2 group-hover:text-primary transition-colors">
                    {author.name}
                  </h2>

                  <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3 mb-6">
                    {author.bio}
                  </p>
                </div>

                <div className="pt-4 border-t border-border/40 flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                    <BookOpen className="w-3.5 h-3.5 text-primary" />
                    {authorBooks.length > 0 ? `${authorBooks.length} متون في المنصة` : 'متون مباركة'}
                  </span>

                  <Link
                    href={`/authors/${author.slug}`}
                    className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
                  >
                    <span>الترجمة والمتون</span>
                    <ArrowLeft className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </main>
    </div>
  );
}
