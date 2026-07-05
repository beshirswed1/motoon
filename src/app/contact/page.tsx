'use client';

import { useState } from 'react';

import { Mail, MessageSquare, User, Send, CheckCircle2, ExternalLink, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import toast from 'react-hot-toast';


const WHATSAPP_NUMBER = '905377906230';

function formatWhatsAppMessage(name: string, email: string, subject: string, message: string): string {
  return encodeURIComponent(
    `📩 *رسالة من منصة متون*\n\n` +
    `👤 *الاسم:* ${name}\n` +
    `📧 *البريد:* ${email}\n` +
    `📌 *الموضوع:* ${subject}\n\n` +
    `💬 *الرسالة:*\n${message}\n\n` +
    `─────────────────\n` +
    `أُرسلت عبر موقع متون - motoon.app`
  );
}

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      toast.error('يرجى ملء جميع الحقول المطلوبة');
      return;
    }
    setLoading(true);

    const waMsg = formatWhatsAppMessage(form.name, form.email, form.subject || 'استفسار عام', form.message);
    const waUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${waMsg}`;

    setTimeout(() => {
      setLoading(false);
      setSent(true);
      window.open(waUrl, '_blank', 'noopener,noreferrer');
    }, 800);
  };

  const subjects = [
    'استفسار عام',
    'مشكلة تقنية',
    'اقتراح تحسين',
    'الإبلاغ عن خطأ في متن',
    'طلب إضافة متن جديد',
    'الشراكة والتعاون',
    'أخرى',
  ];

  return (
    <div className="min-h-screen bg-background">

      {/* Hero */}
      <section className="relative overflow-hidden py-16 md:py-20 section-padding">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/8 to-transparent" />
        <div className="container-motoon relative z-10 text-center flex flex-col items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
            <MessageSquare className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-3xl md:text-4xl font-black">تواصل معنا</h1>
          <p className="text-muted-foreground max-w-xl leading-relaxed">
            نسعد بسماع أسئلتك ومقترحاتك وملاحظاتك. فريقنا يرد في أقرب وقت ممكن.
          </p>
        </div>
      </section>

      <section className="py-12 section-padding">
        <div className="container-motoon">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 max-w-5xl mx-auto">

            {/* Contact Info Sidebar */}
            <div className="lg:col-span-2 flex flex-col gap-5">
              <h2 className="text-xl font-bold">معلومات التواصل</h2>

              {[
                {
                  icon: MessageSquare,
                  title: 'واتساب',
                  value: `+${WHATSAPP_NUMBER.replace(/(\d{2})(\d{3})(\d{3})(\d{4})/, '$1 $2 $3 $4')}`,
                  href: `https://wa.me/${WHATSAPP_NUMBER}`,
                  color: 'bg-green-500/10 text-green-600',
                },
                {
                  icon: Mail,
                  title: 'البريد الإلكتروني',
                  value: 'support@motoon.app',
                  href: 'mailto:support@motoon.app',
                  color: 'bg-primary/10 text-primary',
                },
                {
                  icon: Clock,
                  title: 'ساعات الاستجابة',
                  value: 'خلال 24 ساعة في أيام العمل',
                  href: null,
                  color: 'bg-amber-500/10 text-amber-600',
                },
              ].map(({ icon: Icon, title, value, href, color }) => (
                <div key={title} className="flex items-start gap-4 p-4 rounded-2xl border border-border/50 bg-card">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-muted-foreground mb-0.5">{title}</p>
                    {href ? (
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-semibold text-foreground hover:text-primary transition-colors flex items-center gap-1"
                      >
                        {value}
                        <ExternalLink className="h-3 w-3 opacity-50" />
                      </a>
                    ) : (
                      <p className="text-sm font-semibold text-foreground">{value}</p>
                    )}
                  </div>
                </div>
              ))}

              {/* WhatsApp Quick */}
              <a
                href={`https://wa.me/${WHATSAPP_NUMBER}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 p-4 rounded-2xl bg-green-500 text-white font-bold hover:bg-green-600 transition-colors shadow-md shadow-green-500/25"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                  <path d="M12 0C5.373 0 0 5.373 0 12c0 2.119.552 4.107 1.518 5.837L.057 24l6.306-1.654A11.954 11.954 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.839 0-3.565-.478-5.065-1.317l-.363-.215-3.741.981.999-3.649-.236-.375A9.954 9.954 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
                </svg>
                تواصل عبر واتساب مباشرةً
              </a>
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-3">
              {sent ? (
                <div className="flex flex-col items-center justify-center gap-5 p-12 text-center rounded-2xl border border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-800/30 h-full">
                  <div className="w-16 h-16 rounded-full bg-green-500/15 flex items-center justify-center">
                    <CheckCircle2 className="h-8 w-8 text-green-600" />
                  </div>
                  <h3 className="text-xl font-black text-green-700 dark:text-green-400">تم فتح واتساب!</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    تم تجهيز رسالتك وفتح واتساب. أرسلها مباشرةً للتواصل مع فريقنا.
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => { setSent(false); setForm({ name: '', email: '', subject: '', message: '' }); }}
                    className="rounded-xl font-bold"
                  >
                    إرسال رسالة أخرى
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="flex flex-col gap-5 p-6 md:p-8 rounded-2xl border border-border/50 bg-card shadow-sm">
                  <h2 className="text-xl font-black">أرسل رسالتك</h2>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="contact-name" className="text-sm font-bold">
                        الاسم <span className="text-destructive">*</span>
                      </label>
                      <div className="relative">
                        <User className="absolute top-1/2 right-3 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="contact-name"
                          name="name"
                          value={form.name}
                          onChange={handleChange}
                          placeholder="اسمك الكريم"
                          className="pr-9 rounded-xl"
                          required
                        />
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="contact-email" className="text-sm font-bold">
                        البريد الإلكتروني <span className="text-destructive">*</span>
                      </label>
                      <div className="relative">
                        <Mail className="absolute top-1/2 right-3 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="contact-email"
                          name="email"
                          type="email"
                          value={form.email}
                          onChange={handleChange}
                          placeholder="example@email.com"
                          className="pr-9 rounded-xl"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="contact-subject" className="text-sm font-bold">الموضوع</label>
                    <select
                      id="contact-subject"
                      name="subject"
                      value={form.subject}
                      onChange={handleChange}
                      className="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm font-medium focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="">اختر الموضوع...</option>
                      {subjects.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="contact-message" className="text-sm font-bold">
                      رسالتك <span className="text-destructive">*</span>
                    </label>
                    <Textarea
                      id="contact-message"
                      name="message"
                      value={form.message}
                      onChange={handleChange}
                      placeholder="اكتب رسالتك هنا..."
                      rows={5}
                      className="rounded-xl resize-none"
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-11 rounded-xl font-bold gap-2 text-base"
                  >
                    {loading ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        جاري التجهيز...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        إرسال عبر واتساب
                      </>
                    )}
                  </Button>

                  <p className="text-xs text-muted-foreground text-center">
                    ستُفتح واتساب تلقائياً مع رسالتك مجهزة ومنسقة ✨
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
