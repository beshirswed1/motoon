import type { Metadata } from 'next';
import type { Book } from '@/types/book.types';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { FeaturedBooksCarousel } from '@/components/common/FeaturedBooksCarousel';
import { HeroInstallButton } from '@/components/common/HeroInstallButton';
import { CommunityCTA } from '@/components/common/CommunityCTA';
import { booksService } from '@/services/firebase/books.service';
import { getAllLocalBooks } from '@/lib/data';
import { analyticsService } from '@/services/firebase/analytics.service';
import { CATEGORIES } from '@/lib/constants/categories';
import {
  BookOpen, Mic, Award, TrendingUp, Users, BookMarked,
  Trophy, Star, CheckCircle2, Brain, Shield, Zap,
  ArrowLeft, GraduationCap, Heart, ScrollText, Scale,
  Languages, Landmark, Megaphone
} from 'lucide-react';


export async function generateMetadata(): Promise<Metadata> {
  return {
    title: '🟢 متون | منصة حفظ المتون العلمية',
    description: '📖 احفظ المتون الشرعية وتتبع تقدمك في الحفظ بنظام تكرار متباعد ذكي وتسميع صوتي تفاعلي.',
    openGraph: {
      title: '🟢 متون | منصة حفظ المتون العلمية',
      description: '📖 احفظ المتون الشرعية وتتبع تقدمك في الحفظ بنظام تكرار متباعد ذكي وتسميع صوتي تفاعلي.',
      locale: 'ar_SA',
      type: 'website',
      url: 'https://www.motoon.com.tr',
      images: [
        {
          url: 'https://www.motoon.com.tr/logo.png',
          width: 1200,
          height: 630,
          alt: 'شعار منصة متون',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: '🟢 متون | منصة حفظ المتون العلمية',
      description: '📖 احفظ المتون الشرعية وتتبع تقدمك في الحفظ بنظام تكرار متباعد ذكي وتسميع صوتي تفاعلي.',
      images: ['https://www.motoon.com.tr/logo.png'],
    },
  };
}

const platformFeatures = [
  {
    icon: Brain,
    title: 'حفظ ذكي بنظام التكرار المتباعد',
    desc: 'نظام ذكي يحدد وقت المراجعة المثالي لكل بيت بناءً على قدرتك الشخصية، فتحفظ أكثر في وقت أقل.',
    color: 'text-primary bg-primary/10',
  },
  {
    icon: Mic,
    title: 'التسميع الصوتي التفاعلي',
    desc: 'سمّع المتون بصوتك وستحلل المنصة كلمة بكلمة لتعرف مواضع القوة والضعف في حفظك بدقة عالية.',
    color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/30',
  },
  {
    icon: GraduationCap,
    title: 'شهادات إتمام المتون',
    desc: 'عند إتمام متن بدرجة 95% أو أعلى تحصل على شهادة إتمام احترافية يمكنك مشاركتها وطباعتها.',
    color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/30',
  },
  {
    icon: TrendingUp,
    title: 'متابعة التقدم لحظة بلحظة',
    desc: 'لوحة تحكم شخصية تعرض تقدمك في كل متن، مستوى الإتقان، وتاريخ المراجعات القادمة.',
    color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30',
  },
  {
    icon: BookOpen,
    title: 'مكتبة متون شرعية متنوعة',
    desc: 'مئات المتون العلمية في الفقه والعقيدة والنحو والحديث والأصول — تُضاف باستمرار.',
    color: 'text-teal-600 bg-teal-50 dark:bg-teal-950/30',
  },
  {
    icon: Shield,
    title: 'يعمل بدون إنترنت',
    desc: 'استخدم المنصة كتطبيق على هاتفك بدون اتصال بالإنترنت، مع مزامنة تلقائية عند عودة الاتصال.',
    color: 'text-violet-600 bg-violet-50 dark:bg-violet-950/30',
  },
];

const howToSteps = [
  {
    step: '١',
    icon: BookOpen,
    title: 'اختر متنك',
    desc: 'تصفح مكتبة المتون الشرعية واختر ما يناسب مستواك ورغبتك في البدء.',
    color: 'bg-primary text-primary-foreground',
  },
  {
    step: '٢',
    icon: Mic,
    title: 'اقرأ واستمع',
    desc: 'اقرأ الأبيات وكرّر الاستماع لتثبيت المعنى والنغم والإيقاع في ذهنك.',
    color: 'bg-indigo-600 text-white',
  },
  {
    step: '٣',
    icon: Brain,
    title: 'احفظ وسمّع',
    desc: 'احفظ الأبيات بمساعدة النظام الذكي وسمّع بصوتك لتوثيق تقدمك.',
    color: 'bg-amber-500 text-white',
  },
  {
    step: '٤',
    icon: Award,
    title: 'احصل على شهادتك',
    desc: 'أتمم المتن بدرجة ممتازة واحصل على شهادة إتمام احترافية مخصصة لك.',
    color: 'bg-emerald-600 text-white',
  },
];

// Icon mapping for categories
const categoryIconMap: Record<string, any> = {
  'BookOpen': BookOpen,
  'ScrollText': ScrollText,
  'Shield': Shield,
  'Scale': Scale,
  'Languages': Languages,
  'Landmark': Landmark,
  'Heart': Heart,
  'Megaphone': Megaphone,
  'Brain': Brain,
};

export default async function HomePage() {
  let featuredBooks: any[] = [];
  let stats = { totalUsers: 0, totalBooks: 0, totalSessions: 0, activeUsersToday: 0 };

  try {
    const [res, analyticsStats] = await Promise.all([
      booksService.getAll({ pageSize: 8, onlyPublished: true }),
      analyticsService.getTotalStats(),
    ]);
    
    const localBooks = getAllLocalBooks();
    const slugSet = new Set<string>();
    
    for (const book of res.books) {
      if (!slugSet.has(book.slug)) {
        slugSet.add(book.slug);
        featuredBooks.push(book);
      }
    }
    
    for (const book of localBooks) {
      if (!slugSet.has(book.slug)) {
        slugSet.add(book.slug);
        featuredBooks.push(book);
      }
    }
    
    stats = analyticsStats;
  } catch (err) {
    console.error('Error fetching homepage data:', err);
    featuredBooks = getAllLocalBooks();
  }

  // Sanitize books to remove Firebase Timestamp prototype methods which cause Next.js errors
  const sanitizedBooks: Book[] = JSON.parse(JSON.stringify(featuredBooks));
  const carouselBooks = sanitizedBooks.slice(0, 5);

  return (
    <div className="flex flex-col w-full">

      {/* ─── Hero Section ─────────────────────────── */}
      <section className="relative overflow-hidden py-20 md:py-28 section-padding">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-background to-background" />
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Cpath d='M40 0L80 40L40 80L0 40Z' fill='none' stroke='%230F766E' stroke-width='1'/%3E%3Ccircle cx='40' cy='40' r='15' fill='none' stroke='%230F766E' stroke-width='1'/%3E%3C/svg%3E")`,
        }} />

        <div className="container-motoon relative z-10 flex flex-col items-center text-center gap-8">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-bold">
            <Star className="h-3.5 w-3.5 fill-current" />
            منصة حفظ المتون العلمية 
          </div>

          {/* Headline */}
          <h1 className="max-w-4xl text-4xl md:text-6xl font-black tracking-tight text-foreground leading-tight">
            احفظ{' '}
            <span className="relative inline-block">
              <span className="gradient-text">المتون الشرعية</span>
              <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 300 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M2 8C50 2 100 10 150 6S250 2 298 8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="text-primary/40"/>
              </svg>
            </span>{' '}
            بسهولة و إتقان
          </h1>

          <p className="max-w-2xl text-lg md:text-xl text-muted-foreground leading-relaxed">
            منصة متون توفر لك بيئة تفاعلية لحفظ وتسميع المتون العلمية مع متابعة دقيقة لتقدمك
            بنظام التكرار الذكي للوصول إلى الإتقان الحقيقي.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Button size="lg" asChild className="text-base font-bold rounded-xl px-8 h-12 shadow-lg shadow-primary/25">
              <Link href="/books">
                <BookOpen className="h-5 w-5 ml-2" />
                تصفح المتون
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="text-base font-bold rounded-xl px-8 h-12 border-border/60">
              <Link href="/about">
                تعرف على المنصة
                <ArrowLeft className="h-4 w-4 mr-2" />
              </Link>
            </Button>
          </div>

          {/* PWA Install Button */}
          <HeroInstallButton />

          {/* Trust indicators */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground mt-2">
            {[
              { icon: CheckCircle2, label: 'مجاني تماماً' },
              { icon: Shield, label: 'آمن وخاص' },
              { icon: Zap, label: 'بدون إنترنت' },
            ].map(({ icon: Icon, label }) => (
              <span key={label} className="flex items-center gap-1.5 font-semibold">
                <Icon className="h-4 w-4 text-primary" />
                {label}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Featured Books Carousel ───────────────── */}
      {carouselBooks.length > 0 && (
        <section className="py-16 section-padding">
          <div className="container-motoon">
            <div className="mb-8 flex items-end justify-between">
              <div>
                <p className="text-sm font-bold text-primary uppercase tracking-widest mb-1">مميز</p>
                <h2 className="text-2xl md:text-3xl font-black">أبرز المتون</h2>
                <p className="text-muted-foreground mt-1">ابدأ رحلتك العلمية مع أهم المتون الشرعية</p>
              </div>
              <Button variant="ghost" asChild className="hidden md:flex gap-1 font-bold text-primary hover:text-primary">
                <Link href="/books">
                  عرض الكل
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </Button>
            </div>
            <FeaturedBooksCarousel books={carouselBooks} />
          </div>
        </section>
      )}

      {/* ─── Categories Section (replaces "المتون المتاحة") ───── */}
      <section className="py-16 section-padding bg-muted/30">
        <div className="container-motoon">
          <div className="mb-10 text-center">
            <p className="text-sm font-bold text-primary uppercase tracking-widest mb-2">التصنيفات</p>
            <h2 className="text-2xl md:text-3xl font-black mb-3">أقسام العلوم الشرعية</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              تصفح المتون حسب التخصص العلمي واختر ما يناسب رحلتك في طلب العلم
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-4">
            {CATEGORIES.map((cat) => {
              const IconComp = categoryIconMap[cat.icon] || BookOpen;
              return (
                <Link
                  key={cat.id}
                  href={`/books?category=${cat.id}`}
                  className="group flex flex-col items-center gap-3 p-5 md:p-6 rounded-2xl border border-border/50 bg-card hover:shadow-xl hover:border-primary/30 hover:-translate-y-1 transition-all duration-300"
                >
                  <div className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center ${cat.color} transition-transform duration-300 group-hover:scale-110`}>
                    <IconComp className="h-6 w-6 md:h-7 md:w-7" />
                  </div>
                  <div className="text-center">
                    <h3 className="font-bold text-sm md:text-base text-foreground mb-1">{cat.label}</h3>
                    <p className="text-[10px] md:text-xs text-muted-foreground">
                      {cat.subcategories.length} تخصص
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
          <div className="mt-8 flex justify-center">
            <Button variant="outline" asChild className="font-bold rounded-xl">
              <Link href="/books">
                تصفح كل المتون
                <ArrowLeft className="h-4 w-4 mr-2" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ─── How It Works ──────────────────────────── */}
      <section className="py-20 section-padding">
        <div className="container-motoon">
          <div className="text-center mb-14">
            <p className="text-sm font-bold text-primary uppercase tracking-widest mb-2">الطريقة</p>
            <h2 className="text-2xl md:text-3xl font-black mb-3">كيف تبدأ الحفظ؟</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              أربع خطوات بسيطة تفصلك عن إتقان المتن وتحصيل الشهادة
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {howToSteps.map(({ step, icon: Icon, title, desc, color }, idx) => (
              <div key={idx} className="relative flex flex-col gap-4 p-6 rounded-2xl border border-border/50 bg-card hover:shadow-lg hover:border-primary/20 transition-all duration-300 group">
                {/* Connector line */}
                {idx < howToSteps.length - 1 && (
                  <div className="hidden lg:block absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-0.5 bg-gradient-to-l from-border to-transparent z-10" />
                )}
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg ${color} shadow-sm`}>
                  {step}
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
                    <Icon className="h-4 w-4 text-primary" />
                    {title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
                </div>

                {/* Certificate callout on last step */}
                {idx === 3 && (
                  <div className="mt-auto pt-3 border-t border-border/40">
                    <span className="text-xs font-bold text-amber-600 flex items-center gap-1">
                      <Award className="h-3.5 w-3.5" />
                      شهادة عند 95% وأعلى
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Platform Features ─────────────────────── */}
      <section className="py-20 section-padding bg-muted/30">
        <div className="container-motoon">
          <div className="text-center mb-14">
            <p className="text-sm font-bold text-primary uppercase tracking-widest mb-2">المميزات</p>
            <h2 className="text-2xl md:text-3xl font-black mb-3">لماذا متون؟</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              منصة شاملة تجمع أحدث أساليب التعليم مع الأصالة الإسلامية
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {platformFeatures.map(({ icon: Icon, title, desc, color }, idx) => (
              <div
                key={idx}
                className="flex flex-col gap-4 p-6 rounded-2xl border border-border/50 bg-card hover:shadow-lg hover:border-primary/20 transition-all duration-300"
              >
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base mb-2">{title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Statistics Section ────────────────────── */}
      <section className="py-20 section-padding bg-primary text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60'%3E%3Cpath d='M30 0L60 30L30 60L0 30Z' fill='none' stroke='white' stroke-width='1'/%3E%3C/svg%3E")`,
        }} />
        <div className="container-motoon relative z-10">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-black mb-2">إنجازات المنصة</h2>
            <p className="opacity-80">أرقام حقيقية تعكس ثقة طلابنا</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { icon: Users, value: `+${stats.totalUsers.toLocaleString('ar-EG')}`, label: 'طالب وطالبة' },
              { icon: BookMarked, value: `+${stats.totalBooks.toLocaleString('ar-EG')}`, label: 'متن علمي' },
              { icon: Trophy, value: `+${stats.totalSessions.toLocaleString('ar-EG')}`, label: 'جلسة تسميع' },
              { icon: Star, value: `${stats.activeUsersToday.toLocaleString('ar-EG')}`, label: 'نشط اليوم' },
            ].map(({ icon: Icon, value, label }, idx) => (
              <div key={idx} className="flex flex-col items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center">
                  <Icon className="h-7 w-7 opacity-90" />
                </div>
                <span className="text-3xl md:text-4xl font-black">{value}</span>
                <span className="text-sm opacity-80 font-semibold">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Certificate Section ───────────────────── */}
      <section className="py-20 section-padding">
        <div className="container-motoon">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-950/20 dark:to-amber-900/10 border border-amber-200/50 dark:border-amber-800/30 p-8 md:p-14 text-center">
            <div className="absolute top-4 left-4 opacity-10 text-7xl">🏅</div>
            <div className="absolute bottom-4 right-4 opacity-10 text-7xl">📜</div>
            <div className="relative z-10 flex flex-col items-center gap-5 max-w-xl mx-auto">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/15 flex items-center justify-center">
                <Award className="h-8 w-8 text-amber-600" />
              </div>
              <h2 className="text-2xl md:text-3xl font-black text-foreground">
                اكسب شهادة إتمام المتن
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                عند إكمال أي متن بدرجة <strong className="text-amber-600">95% أو أعلى</strong> في التسميع الذاتي،
                تحصل على شهادة إتمام احترافية بالأسلوب الإسلامي تحمل اسمك ودرجتك،
                يمكنك تحميلها ومشاركتها وطباعتها.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-4 text-sm font-bold">
                <span className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400">
                  <CheckCircle2 className="h-4 w-4" /> شهادة احترافية
                </span>
                <span className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400">
                  <CheckCircle2 className="h-4 w-4" /> رمز تحقق
                </span>
                <span className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400">
                  <CheckCircle2 className="h-4 w-4" /> مشاركة فورية
                </span>
              </div>
              <Button asChild className="bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl px-8 h-11 shadow-md">
                <Link href="/books">ابدأ الحفظ الآن</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Community & Contact Section */}
      <CommunityCTA />
    </div>
  );
}
