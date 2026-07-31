import React from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { getScienceBySlug, SCIENCES } from '@/lib/data/sciences.data';
import { getAllLocalBooks } from '@/lib/data';
import { createScienceMetadata } from '@/lib/seo/metadata.helpers';
import {
  createCollectionPageSchema,
  createBreadcrumbSchema,
  combineSchemas,
} from '@/lib/seo/jsonld.helpers';
import { getFullUrl } from '@/lib/seo/seo.config';
import { JsonLd } from '@/components/seo/JsonLd';
import { Breadcrumb } from '@/components/seo/Breadcrumb';
import { BookOpen, ScrollText, ArrowRight, User, Layers, CheckCircle2, Shield, Scale, Languages, Heart, Brain, Landmark, Megaphone } from 'lucide-react';

type Params = { slug: string };

const iconMap: Record<string, any> = {
  Languages,
  BookOpen,
  ScrollText,
  Shield,
  Scale,
  Heart,
  Brain,
  Landmark,
  Megaphone,
};

export async function generateStaticParams() {
  return SCIENCES.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata(
  props: { params: Promise<Params> }
): Promise<Metadata> {
  const params = await props.params;
  const science = getScienceBySlug(params.slug);

  if (!science) {
    return { title: 'علم غير موجود | متون' };
  }

  const allBooks = getAllLocalBooks();
  const scienceBooks = allBooks.filter((b) => b.category === science.id || b.category === science.slug);

  return createScienceMetadata({
    name: science.name,
    slug: science.slug,
    description: science.shortDescription,
    booksCount: scienceBooks.length,
  });
}

export default async function ScienceDetailPage(
  props: { params: Promise<Params> }
) {
  const params = await props.params;
  const science = getScienceBySlug(params.slug);

  if (!science) {
    notFound();
  }

  const allBooks = getAllLocalBooks();
  const scienceBooks = allBooks.filter(
    (b) => b.category === science.id || b.category === science.slug
  );

  const IconComp = iconMap[science.icon] || BookOpen;

  const collectionSchema = createCollectionPageSchema({
    name: `متون ${science.name}`,
    description: science.fullDescription,
    url: getFullUrl(`/sciences/${science.slug}`),
    items: scienceBooks.map((b) => ({
      name: b.title,
      url: getFullUrl(`/books/${b.slug}`),
      description: b.description,
      image: b.coverImageUrl,
    })),
  });

  const breadcrumbSchema = createBreadcrumbSchema([
    { name: 'الرئيسية', url: getFullUrl('/') },
    { name: 'العلوم الشرعية', url: getFullUrl('/sciences') },
    { name: science.name, url: getFullUrl(`/sciences/${science.slug}`) },
  ]);

  const pageSchemas = combineSchemas(collectionSchema, breadcrumbSchema);

  return (
    <div className="min-h-screen bg-background pb-20">
      <JsonLd data={pageSchemas} />

      {/* Header Banner */}
      <section className="relative bg-muted/30 border-b overflow-hidden pt-8 pb-12">
        <div className="absolute inset-0 bg-primary/5 pattern-dots opacity-40" />
        <div className="container-motoon relative z-10">
          <Breadcrumb
            className="mb-6"
            items={[
              { label: 'العلوم الشرعية', href: '/sciences' },
              { label: science.name },
            ]}
          />

          <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
            <div className="flex items-start gap-4">
              <div className={`w-16 h-16 md:w-20 md:h-20 rounded-3xl flex items-center justify-center ${science.color} border shrink-0 shadow-md`}>
                <IconComp className="w-8 h-8 md:w-10 md:h-10" />
              </div>

              <div>
                <span className="text-xs font-bold text-primary px-3 py-1 rounded-full bg-primary/10 mb-2 inline-block">
                  علم تخصصي
                </span>

                <h1 className="text-3xl md:text-4xl font-black text-foreground">
                  {science.name}
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-card border p-4 rounded-2xl shadow-sm">
              <BookOpen className="w-6 h-6 text-primary" />
              <div>
                <span className="text-xs text-muted-foreground block">المتون المتاحة</span>
                <span className="text-xl font-bold text-foreground">{scienceBooks.length} متون</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="container-motoon py-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* Main Content */}
          <main className="md:col-span-8 space-y-8">
            {/* Overview */}
            <section className="p-6 md:p-8 rounded-3xl border bg-card shadow-sm space-y-4">
              <h2 className="text-2xl font-bold flex items-center gap-2 text-foreground">
                <Layers className="w-6 h-6 text-primary" /> تعريف بـ {science.name}
              </h2>
              <p className="text-base md:text-lg leading-relaxed text-muted-foreground">
                {science.fullDescription}
              </p>
            </section>

            {/* Importance */}
            <section className="p-6 rounded-3xl border bg-primary/5 border-primary/20 space-y-3">
              <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-primary" /> أهمية هذا العلم في طلب العلم الشرعي
              </h3>
              <p className="text-sm md:text-base leading-relaxed text-muted-foreground">
                {science.importance}
              </p>
            </section>

            {/* Books List */}
            <section>
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-foreground">
                <BookOpen className="w-6 h-6 text-primary" /> متون {science.name} للحفظ والمراجعة
              </h2>

              {scienceBooks.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {scienceBooks.map((book) => (
                    <Link
                      key={book.id}
                      href={`/books/${book.slug}`}
                      className="group flex flex-col justify-between p-5 rounded-2xl border bg-card hover:border-primary/40 hover:shadow-lg transition-all duration-300"
                    >
                      <div>
                        <div className="relative aspect-[3/2] w-full rounded-xl overflow-hidden bg-muted mb-3">
                          {book.coverImageUrl ? (
                            <Image
                              src={book.coverImageUrl}
                              alt={`غلاف ${book.title}`}
                              fill
                              className="object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center bg-primary/10 text-primary font-bold">
                              {book.title}
                            </div>
                          )}
                        </div>

                        <h3 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors">
                          {book.title}
                        </h3>

                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                          <User className="w-3.5 h-3.5" />
                          <span>{book.author}</span>
                        </p>

                        <p className="text-xs text-muted-foreground line-clamp-2 mt-2">
                          {book.description}
                        </p>
                      </div>

                      <div className="mt-4 pt-3 border-t flex items-center justify-between text-xs">
                        <span className="font-semibold text-muted-foreground">
                          {book.versesCount ? `${book.versesCount} بيتاً` : 'متن مبارك'}
                        </span>
                        <span className="font-bold text-primary flex items-center gap-1">
                          تصفح واحتفظ
                          <ArrowRight className="w-3 h-3 rtl:rotate-180" />
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="p-8 rounded-2xl border text-center text-muted-foreground">
                  جاري رفع متون هذا القسم في التحديث القادم.
                </div>
              )}
            </section>
          </main>

          {/* Sidebar */}
          <aside className="md:col-span-4 space-y-6">
            <div className="p-6 rounded-3xl border bg-card shadow-sm space-y-4">
              <h3 className="font-bold text-lg border-b pb-3 text-foreground">أبرز مباحث {science.name}</h3>
              <ul className="space-y-2.5">
                {science.keyTopics.map((topic) => (
                  <li key={topic} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                    <span>{topic}</span>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
