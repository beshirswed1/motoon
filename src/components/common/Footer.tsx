import Link from 'next/link';
import Image from 'next/image';
import { Mail, Instagram, Twitter, Youtube, Heart, ExternalLink } from 'lucide-react';


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
    <footer className="border-t border-border/50 bg-card mt-auto">
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
                { href: 'https://instagram.com', icon: Instagram, label: 'إنستغرام' },
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

        {/* Bottom Bar */}
        <div className="mt-8 pt-6 border-t border-border/40 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-muted-foreground">
          <p className="flex items-center gap-1.5">
            © {year} منصة متون. جميع الحقوق محفوظة.
          </p>
          <div className="flex items-center gap-4">
            <p className="flex items-center gap-1 text-xs">
              صُنع بـ <Heart className="h-3 w-3 text-red-500 fill-current" /> لخدمة طلاب العلم
            </p>
            <span className="text-border">|</span>
            <a
              href="https://www.beshirswed.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors font-semibold"
            >
              تم التطوير بواسطة <span className="text-primary font-bold">بَشِير</span>
              <ExternalLink className="h-2.5 w-2.5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
