import Link from 'next/link';
import Image from 'next/image';
import { Mail, Instagram, Twitter, Youtube, ExternalLink } from 'lucide-react';


const quickLinks = [
  { href: '/books', label: 'تصفح المتون' },
  { href: '/about', label: 'عن المنصة' },
  { href: '/contact', label: 'تواصل معنا' },
  { href: '/terms', label: 'الشروط والأحكام' },
  { href: '/privacy', label: 'سياسة الخصوصية' },
];

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-border/50 bg-card mt-auto pb-20 md:pb-0">
      <div className="container-motoon py-10 md:py-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">

          {/* Brand Column */}
          <div className="flex flex-col gap-4">
            <Link href="/" className="flex items-center gap-2.5 w-fit">
              <div className="relative w-8 h-8 rounded-lg overflow-hidden ring-1 ring-primary/20">
                <Image src="/logo.png" alt="متون" fill className="object-contain" sizes="32px" />
              </div>
              <span className="text-xl font-black text-primary">متون</span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-sm">
              منصة رائدة في حفظ وتعلم المتون الشرعية بأحدث أساليب التعلم الذكي ونظام التكرار المتباعد.
            </p>
            {/* Social Links */}
            <div className="flex items-center gap-2 mt-1">
              {[
                { href: 'https://twitter.com', icon: Twitter, label: 'تويتر' },
                { href: 'https://www.instagram.com/motooncom/', icon: Instagram, label: 'إنستغرام' },
                { href: 'https://youtube.com', icon: Youtube, label: 'يوتيوب' },
              ].map(({ href, icon: Icon, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all border border-border/40 hover:border-primary/30"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links + Contact */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h4 className="font-bold text-foreground mb-4 text-sm">روابط سريعة</h4>
              <ul className="space-y-2.5">
                {quickLinks.map(({ href, label }) => (
                  <li key={href}>
                    <Link
                      href={href}
                      className="text-sm text-muted-foreground hover:text-primary transition-colors font-medium"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-foreground mb-4 text-sm">تواصل معنا</h4>
              <ul className="space-y-2.5">
                <li>
                  <a
                    href="mailto:support@motoon.app"
                    className="text-sm text-muted-foreground hover:text-primary transition-colors font-medium flex items-center gap-1.5"
                  >
                    <Mail className="h-3.5 w-3.5" />
                    support@motoon.app
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* ─── Hadith Quote ─────────────────────────── */}
        <div className="mt-10 pt-8 border-t border-border/40">
          <div className="relative flex flex-col items-center text-center py-6 px-4 rounded-2xl bg-gradient-to-br from-primary/5 via-secondary/5 to-primary/5 dark:from-primary/10 dark:via-secondary/10 dark:to-primary/10 border border-primary/15 dark:border-primary/20 overflow-hidden">
            {/* Decorative corner ornaments */}
            <span className="absolute top-2 right-3 text-primary/20 text-3xl leading-none select-none" aria-hidden="true">﴿</span>
            <span className="absolute top-2 left-3 text-primary/20 text-3xl leading-none select-none" aria-hidden="true">﴾</span>
            <span className="absolute bottom-2 right-3 text-secondary/20 text-3xl leading-none select-none rotate-180" aria-hidden="true">﴿</span>
            <span className="absolute bottom-2 left-3 text-secondary/20 text-3xl leading-none select-none rotate-180" aria-hidden="true">﴾</span>

            {/* Ornamental divider top */}
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-px bg-gradient-to-l from-primary/50 to-transparent" />
              <span className="text-primary/60 text-lg select-none" aria-hidden="true">❋</span>
              <div className="w-12 h-px bg-gradient-to-r from-primary/50 to-transparent" />
            </div>

            {/* Quote text */}
            <p className="hadith-quote-text text-lg md:text-xl font-bold leading-loose tracking-wide" dir="rtl">
              <span className="bg-gradient-to-r from-primary via-emerald-600 to-primary dark:from-primary dark:via-emerald-400 dark:to-primary bg-clip-text text-transparent">
                إن يك صواباً فمن الله، وإن يكن خطأً فمنّي ومن الشيطان
              </span>
            </p>

            {/* Ornamental divider bottom */}
            <div className="flex items-center gap-3 mt-3">
              <div className="w-12 h-px bg-gradient-to-l from-secondary/50 to-transparent" />
              <span className="text-secondary/60 text-lg select-none" aria-hidden="true">❋</span>
              <div className="w-12 h-px bg-gradient-to-r from-secondary/50 to-transparent" />
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-6 pt-5 border-t border-border/40 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p className="flex items-center gap-1.5 text-center md:text-right">
            © {year} منصة متون. جميع الحقوق محفوظة.
          </p>
          <a
            href="https://www.beshirswed.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs font-bold text-white bg-gradient-to-r from-primary to-primary/80 px-4 py-1.5 rounded-full shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5"
          >
            تم التطوير بواسطة <span className="text-white text-sm">بَشِير</span>
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>
    </footer>
  );
}
