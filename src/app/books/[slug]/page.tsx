
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { booksService } from '@/services/firebase/books.service';
import { versesService } from '@/services/firebase/verses.service';
import { getLocalBookBySlug, getAllLocalBooks } from '@/lib/data';
import { getAuthorByName } from '@/lib/data/authors.data';
import { getCategoryLabel } from '@/lib/constants/categories';
import { Button } from '@/components/ui/button';
import { Mic, BookOpen, Hash, BarChart, Quote, Eye, Download, HelpCircle, Layers } from 'lucide-react';
import type { BookDifficulty } from '@/types/book.types';
import { FavoriteButton } from '@/features/books/components/FavoriteButton';
import { createBookMetadata } from '@/lib/seo/metadata.helpers';
import {
  createBookSchema,
  createCourseSchema,
  createLearningResourceSchema,
  createFAQSchema,
  createBreadcrumbSchema,
  combineSchemas,
} from '@/lib/seo/jsonld.helpers';
import { getFullUrl } from '@/lib/seo/seo.config';
import { JsonLd } from '@/components/seo/JsonLd';
import { Breadcrumb } from '@/components/seo/Breadcrumb';
import { AuthorCard } from '@/components/seo/AuthorCard';
import { RelatedBooks } from '@/components/seo/RelatedBooks';

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

  return createBookMetadata({
    title: book.title,
    slug: book.slug,
    description: book.description,
    author: book.author,
    category: book.category || undefined,
    difficulty: book.difficulty,
    tags: book.tags,
    coverImageUrl: book.coverImageUrl || undefined,
    versesCount: book.versesCount,
  });
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

  const allLocalBooks = getAllLocalBooks();
  const authorData = getAuthorByName(book.author);
  const categoryLabel = book.category ? getCategoryLabel(book.category) : 'علوم شرعية';
  const totalVerses = verses.length > 0 ? verses.length : book.versesCount || 0;
  const sampleVerses = verses.slice(0, 7);

  // Dynamic FAQs for the book
  const bookFaqs = [
    {
      question: `ما هو متن ${book.title}؟`,
      answer: `${book.description}`,
    },
    {
      question: `من هو مؤلف ${book.title}؟`,
      answer: `${book.author}. ${authorData?.bio || ''}`,
    },
    {
      question: `كم عدد أبيات ${book.title} وما مستواه؟`,
      answer: `يتكون متن ${book.title} من ${totalVerses} بيتاً، وهو مخصص لمستوى ${difficultyLabels[book.difficulty]}.`,
    },
    {
      question: `كيف يمكنني حفظ ${book.title} في منصة متون؟`,
      answer: `يمكنك البدء بالحفظ مباشرةً عبر النقر على زر "ابدأ الحفظ والمراجعة". توفر المنصة تكراراً متباعداً وتسميعاً صوتياً تفاعلياً وشهادة إتمام عند الإتقان.`,
    },
  ];

  // JSON-LD Schemas
  const bookSchema = createBookSchema({
    title: book.title,
    slug: book.slug,
    description: book.description,
    author: book.author,
    authorSlug: authorData?.slug || undefined,
    category: categoryLabel,
    difficulty: book.difficulty,
    versesCount: totalVerses,
    coverImageUrl: book.coverImageUrl || undefined,
    tags: book.tags,
  });

  const courseSchema = createCourseSchema({
    title: book.title,
    slug: book.slug,
    description: book.description,
    author: book.author,
    difficulty: book.difficulty,
    versesCount: totalVerses,
    category: categoryLabel,
  });

  const resourceSchema = createLearningResourceSchema({
    title: book.title,
    slug: book.slug,
    description: book.description,
    author: book.author,
    difficulty: book.difficulty,
  });

  const faqSchema = createFAQSchema(bookFaqs);

  const breadcrumbSchema = createBreadcrumbSchema([
    { name: 'الرئيسية', url: getFullUrl('/') },
    { name: 'المكتبة العلمية للمتون', url: getFullUrl('/books') },
    { name: book.title, url: getFullUrl(`/books/${book.slug}`) },
  ]);

  const pageSchemas = combineSchemas(bookSchema, courseSchema, resourceSchema, faqSchema, breadcrumbSchema);

  return (
    <div className="min-h-screen bg-background pb-20">
      <JsonLd data={pageSchemas} />

      {/* Header Banner */}
      <div className="relative bg-muted/30 border-b overflow-hidden pt-8 pb-8">
        <div className="absolute inset-0 bg-primary/5 pattern-dots opacity-50" />
        <div className="container-motoon relative z-10">
          <Breadcrumb
            className="mb-6"
            items={[
              { label: 'المتون', href: '/books' },
              ...(book.category ? [{ label: categoryLabel, href: `/sciences/${book.category}` }] : []),
              { label: book.title },
            ]}
          />

          <div className="flex flex-col md:flex-row gap-6 md:gap-10 items-start md:items-end">
            <h1 className="text-3xl md:text-5xl font-black text-foreground">{book.title}</h1>
            <div className="flex flex-wrap gap-2">
              <span className={`rounded-full px-4 py-1.5 text-sm font-bold border shadow-sm ${difficultyColors[book.difficulty]}`}>
                {difficultyLabels[book.difficulty]}
              </span>
              {book.category && (
                <Link
                  href={`/sciences/${book.category}`}
                  className="rounded-full px-4 py-1.5 text-sm font-bold border bg-card hover:bg-muted text-foreground transition-colors"
                >
                  {categoryLabel}
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container-motoon py-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12">
          {/* Main Content */}
          <main className="flex flex-col md:col-span-8 lg:col-span-8 order-2 md:order-1">
            <div className="prose prose-slate dark:prose-invert max-w-none mb-8 text-lg leading-relaxed">
              <div className="text-xl font-medium text-foreground/90 border-r-4 border-primary/50 pr-4 py-2 bg-primary/5 rounded-l-lg mb-8 flex items-center justify-between flex-wrap gap-2">
                <span>
                  <span className="text-primary font-bold">المؤلف:</span>{' '}
                  {authorData ? (
                    <Link href={`/authors/${authorData.slug}`} className="text-primary hover:underline font-bold">
                      {book.author}
                    </Link>
                  ) : (
                    book.author
                  )}
                </span>
                {authorData && (
                  <span className="text-xs text-muted-foreground font-normal">
                    توفي ({authorData.era})
                  </span>
                )}
              </div>

              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <InfoIcon className="w-6 h-6 text-primary" /> عن المتن
              </h2>
              <p className="text-base md:text-lg leading-relaxed">{book.description}</p>
            </div>

            {/* Quick Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
              <div className="flex items-center gap-4 p-4 border rounded-2xl bg-card shadow-sm hover:shadow-md transition-shadow">
                <div className="p-3 bg-primary/10 rounded-full text-primary">
                  <Hash className="w-6 h-6" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground font-medium">عدد الأبيات</span>
                  <span className="font-bold text-xl">{totalVerses}</span>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 border rounded-2xl bg-card shadow-sm hover:shadow-md transition-shadow">
                <div className="p-3 bg-amber-500/10 rounded-full text-amber-500">
                  <BarChart className="w-6 h-6" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground font-medium">المستوى</span>
                  <span className="font-bold text-lg">{difficultyLabels[book.difficulty]}</span>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 border rounded-2xl bg-card shadow-sm hover:shadow-md transition-shadow col-span-2 md:col-span-1">
                <div className="p-3 bg-indigo-500/10 rounded-full text-indigo-500">
                  <Layers className="w-6 h-6" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground font-medium">التخصص</span>
                  <span className="font-bold text-sm truncate">{categoryLabel}</span>
                </div>
              </div>
            </div>

            {/* Author Biography Section (Internal Link) */}
            <AuthorCard authorName={book.author} />

            {/* Sample Verses */}
            <div className="mb-10 relative">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Quote className="w-6 h-6 text-primary" /> مقتطف من أبيات المتن
              </h2>
              <div className="relative rounded-3xl border bg-card overflow-hidden shadow-sm">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary/40 via-primary to-primary/40" />
                <div className="p-8 md:p-12 text-center font-arabic leading-loose space-y-6">
                  {sampleVerses.length > 0 ? (
                    <>
                      {sampleVerses.map((verse) => (
                        <p key={verse.id} className="text-xl md:text-2xl font-bold text-foreground">
                          {verse.text}
                        </p>
                      ))}
                      {verses.length > 7 && (
                        <div className="pt-6 mt-6 border-t border-dashed">
                          <p className="text-sm font-semibold text-muted-foreground">... (عينة من أول الأبيات) ...</p>
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-muted-foreground font-semibold">تصفح القراءة الكاملة لعرض أبيات هذا المتن.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Download & Read CTA */}
            <div className="mb-10 p-6 rounded-3xl border border-primary/20 bg-primary/5 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <Download className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-foreground">قراءة وتحميل المتن كاملاً</h3>
                  <p className="text-sm text-muted-foreground">يمكنك قراءة الأبيات كاملة أو تحميلها كـ PDF للطباعة أو TXT.</p>
                </div>
              </div>
              <Button asChild className="font-bold rounded-xl gap-1.5 shadow-md shrink-0">
                <Link href={`/books/${book.slug}/read`}>
                  <Eye className="w-4 h-4" /> عرض وتحميل المتن
                </Link>
              </Button>
            </div>

            {/* FAQ Section */}
            <div className="mb-10">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <HelpCircle className="w-6 h-6 text-primary" /> أسئلة شائعة عن {book.title}
              </h2>
              <div className="grid gap-4">
                {bookFaqs.map((faq, idx) => (
                  <div key={idx} className="p-5 rounded-2xl border border-border/50 bg-card">
                    <h3 className="font-bold text-base text-foreground mb-1">{faq.question}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{faq.answer}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Similar Books Section */}
            <RelatedBooks
              currentBookSlug={book.slug}
              category={book.category || ''}
              author={book.author}
              allBooks={allLocalBooks}
            />
          </main>

          {/* Sticky Sidebar */}
          <aside className="md:col-span-4 lg:col-span-4 order-1 md:order-2">
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
          </aside>
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
