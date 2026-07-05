import type { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  BookOpen, Brain, GraduationCap, Heart, Shield, Zap,
  Target, Users, Star, Award, ArrowLeft, Mic
} from 'lucide-react';


export const metadata: Metadata = {
  title: 'عن منصة متون',
  description: 'تعرف على منصة متون — المنصة الرائدة في حفظ المتون الشرعية بالذكاء الاصطناعي وخوارزمية التكرار المتباعد.',
};

const values = [
  {
    icon: BookOpen,
    title: 'الأصالة العلمية',
    desc: 'نلتزم بمنهج أهل العلم في حفظ المتون الشرعية وتعظيم العلم النافع.',
    color: 'bg-primary/10 text-primary',
  },
  {
    icon: Brain,
    title: 'التقنية الذكية',
    desc: 'نوظّف أحدث خوارزميات علم النفس المعرفي لجعل الحفظ أسهل وأثبت في الذاكرة.',
    color: 'bg-indigo-500/10 text-indigo-600',
  },
  {
    icon: Heart,
    title: 'النية الصادقة',
    desc: 'نبني هذه المنصة لوجه الله خالصاً، لتيسير الوصول للعلم الشرعي لكل مسلم.',
    color: 'bg-rose-500/10 text-rose-600',
  },
  {
    icon: Shield,
    title: 'الخصوصية والأمان',
    desc: 'بياناتك ملكك وحدك، نحافظ عليها بأعلى معايير الأمان والخصوصية.',
    color: 'bg-emerald-500/10 text-emerald-600',
  },
];

const features = [
  { icon: Mic, text: 'التسميع الصوتي التفاعلي بتقييم آني' },
  { icon: Brain, text: 'خوارزمية التكرار المتباعد SM-2 للحفظ الذكي' },
  { icon: GraduationCap, text: 'شهادات إتمام احترافية للمتون المُتقنة' },
  { icon: Zap, text: 'العمل دون اتصال بالإنترنت (PWA)' },
  { icon: Target, text: 'تتبع دقيق للتقدم في كل متن ومقطع' },
  { icon: Award, text: 'نظام تقييم ذكي يحدد نقاط القوة والضعف' },
  { icon: Users, text: 'مجتمع من طلاب العلم المتحمسين' },
  { icon: BookOpen, text: 'مكتبة متنوعة من المتون تُحدَّث باستمرار' },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">

      {/* Hero */}
      <section className="relative overflow-hidden py-20 md:py-28 section-padding">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/8 to-transparent" />
        <div className="container-motoon relative z-10 text-center flex flex-col items-center gap-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-bold">
            <Star className="h-3.5 w-3.5 fill-current" />
            تعرف على متون
          </div>
          <h1 className="text-4xl md:text-5xl font-black max-w-3xl leading-tight">
            منصة{' '}
            <span className="gradient-text">متون</span>
            {' '}— في خدمة طلاب العلم الشرعي
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl leading-relaxed">
            وُلدت منصة متون من إدراك عميق لحاجة طلاب العلم إلى أداة حديثة تُعينهم على حفظ
            المتون الشرعية بطريقة علمية منهجية، تجمع بين عراقة التراث وحداثة التقنية.
          </p>
        </div>
      </section>

      {/* Mission */}
      <section className="py-16 section-padding">
        <div className="container-motoon">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="flex flex-col gap-5">
              <p className="text-sm font-bold text-primary uppercase tracking-widest">رسالتنا</p>
              <h2 className="text-3xl font-black">نُيسِّر حفظ العلم الشرعي للجميع</h2>
              <p className="text-muted-foreground leading-relaxed">
                نؤمن بأن العلم الشرعي حق لكل مسلم، وأن المتون الشرعية هي مفاتيح هذا العلم.
                لذا بنينا منصة متون لتكون الرفيق الأمين لكل من أراد حفظ المتون الشرعية من
                مبادئ الفقه والعقيدة والحديث والنحو.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                نستخدم خوارزمية التكرار المتباعد المبنية على علم النفس المعرفي لضمان بقاء
                المحفوظ في الذاكرة طويلة المدى، مع نظام تسميع صوتي يحلل أداءك كلمة بكلمة.
              </p>
              <Button asChild className="w-fit rounded-xl font-bold px-6">
                <Link href="/books">
                  ابدأ الحفظ الآن
                  <ArrowLeft className="h-4 w-4 mr-2" />
                </Link>
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { num: '+50', label: 'متن علمي' },
                { num: '+10K', label: 'طالب وطالبة' },
                { num: '+500K', label: 'بيت تم حفظه' },
                { num: '95%+', label: 'معدل الرضا' },
              ].map(({ num, label }) => (
                <div key={label} className="flex flex-col items-center justify-center gap-2 p-6 rounded-2xl border border-border/50 bg-card text-center">
                  <span className="text-3xl font-black text-primary">{num}</span>
                  <span className="text-sm text-muted-foreground font-semibold">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-16 section-padding bg-muted/30">
        <div className="container-motoon">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-black mb-3">قيمنا ومبادئنا</h2>
            <p className="text-muted-foreground">المبادئ التي تحكم كل قرار نتخذه</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {values.map(({ icon: Icon, title, desc, color }, idx) => (
              <div key={idx} className="flex flex-col gap-4 p-6 rounded-2xl border border-border/50 bg-card hover:shadow-lg transition-all">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="font-bold text-lg">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 section-padding">
        <div className="container-motoon">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-black mb-3">ما تقدمه المنصة</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl mx-auto">
            {features.map(({ icon: Icon, text }, idx) => (
              <div key={idx} className="flex items-center gap-3 p-4 rounded-xl border border-border/50 bg-card">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <span className="text-sm font-semibold">{text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 section-padding bg-primary text-primary-foreground">
        <div className="container-motoon text-center flex flex-col items-center gap-5">
          <h2 className="text-2xl md:text-3xl font-black">انضم لمجتمع متون اليوم</h2>
          <p className="opacity-80 max-w-lg">
            ابدأ رحلتك في حفظ المتون الشرعية مجاناً، وكن جزءاً من مجتمع طلاب العلم
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button size="lg" variant="secondary" asChild className="font-bold rounded-xl px-8">
              <Link href="/register">إنشاء حساب مجاني</Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="font-bold rounded-xl px-8 border-white/30 text-white hover:bg-white/10">
              <Link href="/contact">تواصل معنا</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
