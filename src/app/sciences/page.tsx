import type { Metadata } from 'next';
import Link from 'next/link';
import { getAllSciences } from '@/lib/data/sciences.data';
import { getAllLocalBooks } from '@/lib/data';
import { createPageMetadata } from '@/lib/seo/metadata.helpers';
import { createCollectionPageSchema, createBreadcrumbSchema, combineSchemas } from '@/lib/seo/jsonld.helpers';
import { getFullUrl } from '@/lib/seo/seo.config';
import { JsonLd } from '@/components/seo/JsonLd';
import { Breadcrumb } from '@/components/seo/Breadcrumb';
import {
  BookOpen, ScrollText, Shield, Scale, Languages, Landmark,
  Heart, Megaphone, Brain, ArrowLeft, Layers
} from 'lucide-react';

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

export async function generateMetadata(): Promise<Metadata> {
  return createPageMetadata({
    title: 'أقسام العلوم الشرعية والتخصصات — دليل العلوم | متون',
    description: 'تصفح دليل العلوم الشرعية والإسلامية: علوم القرآن، الحديث، العقيدة والتوحيد، الفقه وأصوله، اللغة العربية (النحو والصرف والبلاغة)، والتزكية والمنطق.',
    keywords: [
      'العلوم الشرعية',
      'علوم القرآن',
      'علوم الحديث',
      'العقيدة والتوحيد',
      'الفقه وأصوله',
      'اللغة العربية والنحو',
      'تخصصات العلوم الإسلامية',
    ],
    path: '/sciences',
  });
}

export default function SciencesListingPage() {
  const sciences = getAllSciences();
  const allBooks = getAllLocalBooks();

  const collectionSchema = createCollectionPageSchema({
    name: 'دليل العلوم الشرعية والتخصصات',
    description: 'دليل تخصصات وفروع العلوم الإسلامية واللغوية.',
    url: getFullUrl('/sciences'),
    items: sciences.map((s) => ({
      name: s.name,
      url: getFullUrl(`/sciences/${s.slug}`),
      description: s.shortDescription,
    })),
  });

  const breadcrumbSchema = createBreadcrumbSchema([
    { name: 'الرئيسية', url: getFullUrl('/') },
    { name: 'أقسام العلوم الشرعية', url: getFullUrl('/sciences') },
  ]);

  return (
    <div className="min-h-screen bg-background pb-20">
      <JsonLd data={combineSchemas(collectionSchema, breadcrumbSchema)} />

      {/* Hero Header */}
      <section className="relative overflow-hidden py-16 md:py-20 section-padding bg-muted/30 border-b">
        <div className="absolute inset-0 bg-primary/5 pattern-dots opacity-40" />
        <div className="container-motoon relative z-10 text-center flex flex-col items-center gap-4">
          <Breadcrumb items={[{ label: 'العلوم الشرعية' }]} className="mb-2" />

          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
            <Layers className="h-7 w-7" />
          </div>

          <h1 className="text-3xl md:text-5xl font-black text-foreground">
            أقسام العلوم الشرعية
          </h1>

          <p className="text-base md:text-lg text-muted-foreground max-w-2xl leading-relaxed">
            تصفح متون الحفظ مرتبة ومصنفة بحسب العلوم والتخصصات الشرعية واللغوية،
            واختر العلم الذي تريد البدء في تحصيله وإتقانه.
          </p>
        </div>
      </section>

      {/* Sciences Grid */}
      <main className="container-motoon py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sciences.map((science) => {
            const IconComp = iconMap[science.icon] || BookOpen;
            const scienceBooks = allBooks.filter((b) => b.category === science.id || b.category === science.slug);

            return (
              <article
                key={science.id}
                className="group flex flex-col justify-between p-6 rounded-3xl border border-border/60 bg-card hover:border-primary/40 hover:shadow-xl transition-all duration-300"
              >
                <div>
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${science.color} transition-transform group-hover:scale-110`}>
                      <IconComp className="w-7 h-7" />
                    </div>
                    <span className="text-xs font-bold text-primary px-3 py-1 rounded-full bg-primary/10">
                      {scienceBooks.length} متون
                    </span>
                  </div>

                  <h2 className="font-bold text-xl text-foreground mb-2 group-hover:text-primary transition-colors">
                    {science.name}
                  </h2>

                  <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3 mb-4">
                    {science.shortDescription}
                  </p>

                  {/* Topics List */}
                  <div className="flex flex-wrap gap-1.5 mb-6">
                    {science.keyTopics.slice(0, 3).map((topic) => (
                      <span key={topic} className="text-[11px] font-semibold text-muted-foreground px-2.5 py-0.5 rounded-md bg-muted">
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-border/40 flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground">
                    تصفح متون هذا العلم
                  </span>

                  <Link
                    href={`/sciences/${science.slug}`}
                    className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
                  >
                    <span>الدليل والمتون</span>
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
