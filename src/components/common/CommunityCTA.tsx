'use client';

import Link from 'next/link';
import { Users, MessageCircle, Send, ArrowLeft } from 'lucide-react';

interface CommunityCTAProps {
  showContactCard?: boolean;
}

export function CommunityCTA({ showContactCard = true }: CommunityCTAProps) {
  return (
    <section className="py-16 section-padding bg-muted/30 w-full border-t border-border/40">
      <div className="container-motoon">
        <div className={`grid grid-cols-1 ${showContactCard ? 'md:grid-cols-2' : 'max-w-2xl mx-auto'} gap-8`}>
          
          {/* Telegram Community Card */}
          <Link
            href="https://t.me/+nDWyO83iLIkzMGQ0"
            target="_blank"
            rel="noopener noreferrer"
            className="group relative block overflow-hidden rounded-3xl border border-border/50 bg-card p-8 md:p-10 hover:shadow-2xl hover:border-sky-500/30 transition-all duration-500"
          >
            {/* Background gradient on hover */}
            <div className="absolute inset-0 bg-gradient-to-br from-sky-500/5 via-transparent to-sky-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            {/* Decorative pattern */}
            <div className="absolute top-0 left-0 w-24 h-24 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40'%3E%3Cpath d='M20 0L40 20L20 40L0 20Z' fill='none' stroke='%230284c7' stroke-width='1'/%3E%3C/svg%3E")`,
            }} />

            <div className="relative z-10 flex flex-col sm:flex-row items-center gap-6">
              {/* Icon */}
              <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-sky-500/10 dark:bg-sky-500/20 flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-md shadow-sky-500/5">
                <Users className="h-8 w-8 text-sky-600 dark:text-sky-400" />
              </div>

              {/* Content */}
              <div className="flex-1 text-center sm:text-right">
                <h3 className="text-xl font-black text-foreground mb-2 flex items-center justify-center sm:justify-start gap-2">
                  <span>انضم لمجتمع متون</span>
                  <span className="inline-block animate-bounce text-base">💬</span>
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                  شارك زملائك الحفظ والمراجعة في مجموعتنا التفاعلية على التلغرام لتبادل الفائدة.
                </p>
                <div className="inline-flex items-center gap-2 text-xs font-bold text-sky-600 dark:text-sky-400 group-hover:underline">
                  <span>انتقل إلى مجتمع متون</span>
                  <ArrowLeft className="h-3.5 w-3.5 group-hover:-translate-x-1 transition-transform" />
                </div>
              </div>

              {/* Go Button Indicator */}
              <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-sky-500/10 flex items-center justify-center group-hover:bg-sky-500 group-hover:shadow-lg group-hover:shadow-sky-500/25 transition-all duration-500">
                <ArrowLeft className="h-5 w-5 text-sky-600 group-hover:text-white group-hover:-translate-x-1 transition-all duration-500" />
              </div>
            </div>
          </Link>

          {/* Contact Card (Only shown if showContactCard is true) */}
          {showContactCard && (
            <Link
              href="/contact"
              className="group relative block overflow-hidden rounded-3xl border border-border/50 bg-card p-8 md:p-10 hover:shadow-2xl hover:border-primary/30 transition-all duration-500"
            >
              {/* Background gradient on hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              {/* Decorative pattern */}
              <div className="absolute top-0 left-0 w-24 h-24 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity" style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40'%3E%3Ccircle cx='20' cy='20' r='10' fill='none' stroke='%230F766E' stroke-width='1'/%3E%3C/svg%3E")`,
              }} />

              <div className="relative z-10 flex flex-col sm:flex-row items-center gap-6">
                {/* Icon */}
                <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center group-hover:scale-110 group-hover:-rotate-6 transition-all duration-500 shadow-md shadow-primary/5">
                  <MessageCircle className="h-8 w-8 text-primary" />
                </div>

                {/* Content */}
                <div className="flex-1 text-center sm:text-right">
                  <h3 className="text-xl font-black text-foreground mb-2">
                    تواصل معنا
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                    لديك اقتراح أو استفسار؟ راسل فريق المنصة وسنكون سعداء بالإجابة عليك فوراً.
                  </p>
                  <div className="inline-flex items-center gap-2 text-xs font-bold text-primary group-hover:underline">
                    <span>افتح صفحة التواصل</span>
                    <ArrowLeft className="h-3.5 w-3.5 group-hover:-translate-x-1 transition-transform" />
                  </div>
                </div>

                {/* Go Button */}
                <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:shadow-lg group-hover:shadow-primary/25 transition-all duration-500">
                  <Send className="h-5 w-5 text-primary group-hover:text-white transition-colors duration-500" />
                </div>
              </div>
            </Link>
          )}

        </div>
      </div>
    </section>
  );
}
