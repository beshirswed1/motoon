import React from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { booksService } from '@/services/firebase/books.service';
import { versesService } from '@/services/firebase/verses.service';
import { getLocalBookBySlug } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { Mic, BookOpen, Hash, BarChart, Tags, Quote, ArrowRight, Eye, Download } from 'lucide-react';
import type { BookDifficulty } from '@/types/book.types';
import { FavoriteButton } from '@/features/books/components/FavoriteButton';

type Params = { slug: string };

const difficultyLabels: Record<BookDifficulty, string> = {
  beginner: 'مبتدئ',
  intermediate: 'متوسط',
  advanced: 'متقدم',
};

const difficultyColors: Record<BookDifficulty, string> = {
  beginner: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800',
  intermediate: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800',
  advanced: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800',
};

export async function generateStaticParams() {
  return [];
}

export async function generateMetadata(
  props: { params: Promise<Params> }
): Promise<Metadata> {
  const params = await props.params;
  const decodedSlug = decodeURIComponent(params.slug);
  
  let book = null;
  const localData = getLocalBookBySlug(decodedSlug);
  if (localData) {
    book = localData.book;
  } else {
    book = await booksService.getBySlug(decodedSlug);
  }

  if (!book) {
    return {
      title: 'متن غير موجود | متون',
    };
  }

  const imageUrl = book.coverImageUrl || 'https://www.motoon.com.tr/logo.png';

  return {
    title: `${book.title} | متون`,
    description: book.description,
    openGraph: {
      title: `${book.title} | متون`,
      description: book.description,
      locale: 'ar_SA',
      type: 'website',
      url: `https://www.motoon.com.tr/books/${encodeURIComponent(book.slug)}`,
      images: [{ url: imageUrl, width: 800, height: 1000, alt: `غلاف ${book.title}` }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${book.title} | متون`,
      description: book.description,
      images: [imageUrl],
    },
  };
}

export default async function BookDetailsPage(
  props: { params: Promise<Params> }
) {
  const params = await props.params;
  const decodedSlug = decodeURIComponent(params.slug);
  
  let book = null;
  let verses: any[] = [];
  
  const localData = getLocalBookBySlug(decodedSlug);
  if (localData) {
    book = localData.book;
    verses = localData.verses;
  } else {
    book = await booksService.getBySlug(decodedSlug);
    if (book) {
      verses = await versesService.getByBookId(book.id);
    }
  }

  if (!book) {
    notFound();
  }
  const sampleVerses = verses.slice(0, 7); // عرض أول 7 أبيات

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Hero Header Section */}
      <div className="relative bg-muted/30 border-b overflow-hidden pt-12 pb-8">
        <div className="absolute inset-0 bg-primary/5 pattern-dots opacity-50" />
        <div className="container-motoon relative z-10">
          <Link href="/books" className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors text-sm font-semibold mb-6 px-3 py-1.5 rounded-full hover:bg-primary/10">
            <ArrowRight className="w-4 h-4" /> العودة للمتون
          </Link>
          <div className="flex flex-col md:flex-row gap-6 md:gap-10 items-start md:items-end">
            <h1 className="text-4xl md:text-5xl font-black text-foreground">{book.title}</h1>
            <div className="flex gap-2">
              <span className={`rounded-full px-4 py-1.5 text-sm font-bold border shadow-sm ${difficultyColors[book.difficulty]}`}>
                {difficultyLabels[book.difficulty]}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="container-motoon py-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12">
          {/* Main Content Area */}
          <div className="flex flex-col md:col-span-8 lg:col-span-8 order-2 md:order-1">
            <div className="prose prose-slate dark:prose-invert max-w-none mb-10 text-lg leading-relaxed">
              <p className="text-xl font-medium text-foreground/90 border-r-4 border-primary/50 pr-4 py-1 bg-primary/5 rounded-l-lg mb-8">
                <span className="text-primary font-bold">المؤلف:</span> {book.author}
              </p>
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <InfoIcon className="w-6 h-6 text-primary" /> عن المتن
              </h2>
              <p>{book.description}</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-12">
              <div className="flex items-center gap-4 p-4 border rounded-2xl bg-card shadow-sm hover:shadow-md transition-shadow">
                <div className="p-3 bg-primary/10 rounded-full text-primary">
                  <Hash className="w-6 h-6" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm text-muted-foreground font-medium">عدد الأبيات</span>
                  <span className="font-bold text-xl">{verses.length > 0 ? verses.length : book.versesCount}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-4 p-4 border rounded-2xl bg-card shadow-sm hover:shadow-md transition-shadow">
                <div className="p-3 bg-amber-500/10 rounded-full text-amber-500">
                  <BarChart className="w-6 h-6" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm text-muted-foreground font-medium">المستوى</span>
                  <span className="font-bold text-lg">{difficultyLabels[book.difficulty]}</span>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 border rounded-2xl bg-card shadow-sm hover:shadow-md transition-shadow col-span-2 md:col-span-1">
                <div className="p-3 bg-indigo-500/10 rounded-full text-indigo-500">
                  <Tags className="w-6 h-6" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm text-muted-foreground font-medium">التصنيف</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {book.tags.slice(0, 2).map(tag => (
                      <span key={tag} className="text-xs font-semibold">{tag}</span>
                    ))}
                    {book.tags.length > 2 && <span className="text-xs text-muted-foreground">+{book.tags.length - 2}</span>}
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-10 relative">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Quote className="w-6 h-6 text-primary" /> مقتطف من المتن
              </h2>
              <div className="relative rounded-3xl border bg-card overflow-hidden shadow-sm">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary/40 via-primary to-primary/40" />
                <div className="p-8 md:p-12 text-center font-arabic leading-loose space-y-6">
                  {sampleVerses.length > 0 ? (
                    <>
                      {sampleVerses.map(verse => (
                        <p key={verse.id} className="text-xl md:text-2xl font-bold text-foreground">
                          {verse.text}
                        </p>
                      ))}
                      {verses.length > 7 && (
                        <div className="pt-6 mt-6 border-t border-dashed">
                          <p className="text-sm font-semibold text-muted-foreground">... (عينة من الأبيات الأولى للمتن) ...</p>
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-muted-foreground font-semibold">لم يتم إضافة أبيات لهذا المتن بعد.</p>
                  )}
                </div>
              </div>
            </div>

            {verses.length > 0 && (
              <div className="mb-10 p-6 rounded-3xl border border-primary/20 bg-primary/5 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    <Download className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-foreground">تحميل وقراءة المتن كاملاً</h3>
                    <p className="text-sm text-muted-foreground">يمكنك قراءة الأبيات كاملة أو تحميلها كـ PDF للطباعة بشعار الموقع، أو كملف نصي TXT.</p>
                  </div>
                </div>
                <Button asChild className="font-bold rounded-xl gap-1.5 shadow-md shrink-0">
                  <Link href={`/books/${book.slug}/read`}>
                    <Eye className="w-4 h-4" /> عرض وتحميل المتن
                  </Link>
                </Button>
              </div>
            )}
          </div>

          {/* Sticky Sidebar */}
          <div className="md:col-span-4 lg:col-span-4 order-1 md:order-2">
            <div className="sticky top-24 flex flex-col gap-6">
              <div className="relative aspect-[3/4] w-full max-w-sm mx-auto overflow-hidden rounded-2xl border bg-muted shadow-lg ring-1 ring-border/50">
                {book.coverImageUrl ? (
                  <Image
                    src={book.coverImageUrl}
                    alt={`غلاف ${book.title}`}
                    fill
                    className="object-cover transition-transform duration-700 hover:scale-105"
                    sizes="(max-width: 768px) 100vw, 33vw"
                    priority
                  />
                ) : (
                  <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5 p-6 text-center">
                    <span className="text-4xl font-black text-primary/30">{book.title}</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-80" />
                <div className="absolute bottom-4 left-4 right-4 text-center">
                  <h3 className="text-white font-bold text-xl drop-shadow-md">{book.title}</h3>
                </div>
              </div>

              <div className="flex flex-col gap-3 max-w-sm mx-auto w-full">
                <Button size="lg" asChild className="w-full text-lg font-bold h-14 rounded-xl shadow-md gap-2">
                  <Link href={`/books/${book.slug}/memorize`}>
                    <BookOpen className="w-5 h-5" /> ابدأ الحفظ والمراجعة
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild className="w-full text-lg font-bold h-14 rounded-xl border-primary text-primary hover:bg-primary/10 gap-2">
                  <Link href={`/books/${book.slug}/recite`}>
                    <Mic className="w-5 h-5" /> التسميع الذاتي الصوتي
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild className="w-full text-lg font-bold h-14 rounded-xl border-primary/50 text-primary hover:bg-primary/5 gap-2">
                  <Link href={`/books/${book.slug}/read`}>
                    <Eye className="w-5 h-5" /> عرض وتحميل المتن
                  </Link>
                </Button>
                <FavoriteButton bookId={book.id} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4" />
      <path d="M12 8h.01" />
    </svg>
  );
}
