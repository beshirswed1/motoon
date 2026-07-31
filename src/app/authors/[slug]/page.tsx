import React from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { getAuthorBySlug, AUTHORS } from '@/lib/data/authors.data';
import { getAllLocalBooks } from '@/lib/data';
import { getCategoryLabel } from '@/lib/constants/categories';
import { createAuthorMetadata } from '@/lib/seo/metadata.helpers';
import {
  createPersonSchema,
  createProfilePageSchema,
  createBreadcrumbSchema,
  combineSchemas,
} from '@/lib/seo/jsonld.helpers';
import { getFullUrl } from '@/lib/seo/seo.config';
import { JsonLd } from '@/components/seo/JsonLd';
import { Breadcrumb } from '@/components/seo/Breadcrumb';
import { User, BookOpen, ScrollText, ArrowRight, Calendar, Hash, Award } from 'lucide-react';

type Params = { slug: string };

export async function generateStaticParams() {
  return AUTHORS.map((author) => ({
    slug: author.slug,
  }));
}

export async function generateMetadata(
  props: { params: Promise<Params> }
): Promise<Metadata> {
  const params = await props.params;
  const author = getAuthorBySlug(params.slug);

  if (!author) {
    return { title: 'مؤلف غير موجود | متون' };
  }

  const allBooks = getAllLocalBooks();
  const authorBooks = allBooks.filter((b) => author.bookSlugs.includes(b.slug) || b.author.includes(author.shortName));

  return createAuthorMetadata({
    name: author.name,
    slug: author.slug,
    bio: author.bio,
    booksCount: authorBooks.length,
  });
}

export default async function AuthorDetailPage(
  props: { params: Promise<Params> }
) {
  const params = await props.params;
  const author = getAuthorBySlug(params.slug);

  if (!author) {
    notFound();
  }

  const allBooks = getAllLocalBooks();
  const authorBooks = allBooks.filter(
    (b) => author.bookSlugs.includes(b.slug) || b.author.includes(author.shortName)
  );

  // Schemas
  const personSchema = createPersonSchema({
    name: author.name,
    slug: author.slug,
    bio: author.bio,
    era: author.era,
    books: authorBooks.map((b) => b.title),
  });

  const profileSchema = createProfilePageSchema({
    name: author.name,
    slug: author.slug,
    description: author.bio,
  });

  const breadcrumbSchema = createBreadcrumbSchema([
    { name: 'الرئيسية', url: getFullUrl('/') },
    { name: 'أعلام العلماء', url: getFullUrl('/authors') },
    { name: author.shortName, url: getFullUrl(`/authors/${author.slug}`) },
  ]);

  const pageSchemas = combineSchemas(personSchema, profileSchema, breadcrumbSchema);

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
              { label: 'أعلام العلماء', href: '/authors' },
              { label: author.shortName },
            ]}
          />

          <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-3xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0 shadow-md">
                <User className="w-8 h-8 md:w-10 md:h-10" />
              </div>

              <div>
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="text-xs font-bold text-primary px-3 py-1 rounded-full bg-primary/10">
                    عالم ومؤلف
                  </span>
                  <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    توفي {author.era}
                  </span>
                </div>

                <h1 className="text-3xl md:text-4xl font-black text-foreground">
                  {author.name}
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-card border p-4 rounded-2xl shadow-sm">
              <BookOpen className="w-6 h-6 text-primary" />
              <div>
                <span className="text-xs text-muted-foreground block">المتون في المنصة</span>
                <span className="text-xl font-bold text-foreground">{authorBooks.length} متون</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="container-motoon py-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* Main Biography */}
          <main className="md:col-span-8 space-y-8">
            <section className="p-6 md:p-8 rounded-3xl border bg-card shadow-sm">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2 text-foreground">
                <ScrollText className="w-6 h-6 text-primary" /> السيرة والترجمة العلمية
              </h2>
              <p className="text-base md:text-lg leading-relaxed text-muted-foreground whitespace-pre-line">
                {author.bio}
              </p>
            </section>

            {/* Author's Books Section */}
            <section>
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-foreground">
                <BookOpen className="w-6 h-6 text-primary" /> متون ومؤلفات {author.shortName} في المنصة
              </h2>

              {authorBooks.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {authorBooks.map((book) => (
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

                        <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                          {book.description}
                        </p>
                      </div>

                      <div className="mt-4 pt-3 border-t flex items-center justify-between text-xs">
                        {book.category && (
                          <span className="font-semibold text-muted-foreground">
                            {getCategoryLabel(book.category)}
                          </span>
                        )}
                        <span className="font-bold text-primary flex items-center gap-1">
                          ابدأ الحفظ
                          <ArrowRight className="w-3 h-3 rtl:rotate-180" />
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="p-8 rounded-2xl border text-center text-muted-foreground">
                  جاري إضافة باقي منظومات ومتون الشيخ في التحديثات القادمة.
                </div>
              )}
            </section>
          </main>

          {/* Sidebar Info */}
          <aside className="md:col-span-4 space-y-6">
            <div className="p-6 rounded-3xl border bg-card shadow-sm space-y-4">
              <h3 className="font-bold text-lg border-b pb-3 text-foreground">بطاقة تعريفية</h3>

              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-xs text-muted-foreground block">الاسم الكامل</span>
                  <span className="font-semibold text-foreground">{author.name}</span>
                </div>

                <div>
                  <span className="text-xs text-muted-foreground block">عصر الوفاة</span>
                  <span className="font-semibold text-foreground">{author.era}</span>
                </div>

                <div>
                  <span className="text-xs text-muted-foreground block">العلوم البارز فيها</span>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {author.sciences.map((sci) => (
                      <Link
                        key={sci}
                        href={`/sciences/${sci}`}
                        className="text-xs font-bold px-2.5 py-1 rounded-lg bg-primary/10 text-primary hover:underline"
                      >
                        {getCategoryLabel(sci)}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
