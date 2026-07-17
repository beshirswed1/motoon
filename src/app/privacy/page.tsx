import type { Metadata } from 'next';
import { Shield, Eye, Database, Lock, UserCheck, Mail } from 'lucide-react';

export const metadata: Metadata = {
  title: 'سياسة الخصوصية | متون',
  description: 'سياسة الخصوصية لمنصة متون — كيف نجمع بياناتك ونحافظ عليها.',
};

const sections = [
  {
    icon: Database,
    title: '1. البيانات التي نجمعها',
    content: `نجمع البيانات التالية عند استخدامك للمنصة:

البيانات التي تقدمها مباشرةً:
• الاسم والبريد الإلكتروني عند التسجيل
• صورة الملف الشخصي (اختيارية)
• بيانات جلسات التسميع والحفظ

البيانات المُجمَعة تلقائياً:
• معلومات الجهاز والمتصفح (للتوافق التقني)
• بيانات الاستخدام (الصفحات المزورة، مدة الجلسة)
• بيانات تقدم الحفظ (للخوارزمية الذكية)

لا نجمع:
• معلومات الدفع (المنصة مجانية حالياً)
• الموقع الجغرافي الدقيق
• أي بيانات مالية أو صحية`,
  },
  {
    icon: Eye,
    title: '2. كيف نستخدم بياناتك',
    content: `نستخدم البيانات المجمعة للأغراض التالية:
• تشغيل خوارزمية التكرار المتباعد وتخصيص تجربة الحفظ
• تتبع تقدمك في حفظ المتون
• إرسال إشعارات المراجعة (يمكنك إيقافها)
• تحسين المنصة وإصلاح الأخطاء التقنية
• إصدار شهادات إتمام المتون
• التواصل معك بشأن التحديثات المهمة

لا نستخدم بياناتك للتسويق لجهات خارجية أو بيعها.`,
  },
  {
    icon: Lock,
    title: '3. حماية بياناتك',
    content: `نلتزم بحماية بياناتك بالطرق التالية:
• تشفير البيانات أثناء النقل (SSL/TLS)
• تخزين آمن على Firebase (Google Cloud)
• قواعد وصول صارمة لقواعد البيانات
• مراجعة دورية لإجراءات الأمان
• عدم تخزين كلمات المرور بشكل مقروء (تشفير hash)

نستخدم خدمة Firebase Authentication من Google لإدارة كلمات المرور بأمان.`,
  },
  {
    icon: UserCheck,
    title: '4. حقوقك',
    content: `تملك الحقوق التالية بشأن بياناتك الشخصية:
• حق الوصول: عرض بيانات حسابك في أي وقت
• حق التصحيح: تعديل معلوماتك الشخصية من إعدادات الحساب
• حق الحذف: طلب حذف حسابك وبياناتك نهائياً
• حق التصدير: طلب نسخة من بياناتك
• حق الاعتراض: إيقاف تلقي الإشعارات غير الأساسية

لممارسة أي من هذه الحقوق، تواصل معنا عبر: beshirswed07@gmail.com`,
  },
  {
    icon: Shield,
    title: '5. مشاركة البيانات',
    content: `لا نبيع بياناتك ولا نشاركها مع أطراف ثالثة إلا في الحالات التالية:
• مزودو الخدمة الضروريون (Firebase/Google): لتشغيل المنصة تقنياً
• الامتثال للقانون: إذا طُلب منا بموجب أمر قضائي
• حماية الحقوق: للدفاع عن حقوق المنصة ومستخدميها

جميع مزودي الخدمة ملتزمون بمعايير حماية البيانات.`,
  },
  {
    icon: Database,
    title: '6. ملفات تعريف الارتباط (Cookies)',
    content: `نستخدم ملفات تعريف الارتباط للأغراض التالية:
• الجلسة وتسجيل الدخول (ضرورية)
• تفضيلات المستخدم (الوضع المظلم، إعدادات التسميع)
• تحليلات الاستخدام (مجهولة الهوية)

يمكنك ضبط إعدادات ملفات تعريف الارتباط من متصفحك، مع ملاحظة أن بعض ميزات المنصة قد لا تعمل بشكل كامل.`,
  },
  {
    icon: Shield,
    title: '7. خصوصية وحماية الأطفال',
    content: `نرحب بأشبال الأمة ومستقبلها المشرق للاستفادة الكاملة من منصة متون في حفظ وتثبيت العلوم الشرعية. المنصة آمنة تماماً للأطفال من جميع الأعمار، حيث:
• لا توجد أي طرق أو وسائل دفع أو تكاليف داخل المنصة (مجانية بالكامل).
• لا نشارك أي معلومات شخصية تخص الأطفال مع أي جهات خارجية مطلقاً.
• نوفر بيئة علمية نقية وهادفة وخالية من الإعلانات.

ننصح أولياء الأمور الكرام بمتابعة أبنائهم لتشجيعهم على الحفظ والاستفادة القصوى من ميزات التسميع التفاعلي.`,
  },
  {
    icon: Eye,
    title: '8. التغييرات على هذه السياسة',
    content: `قد نحدّث سياسة الخصوصية هذه من وقت لآخر. عند إجراء تغييرات جوهرية:
• سنُشعرك بالبريد الإلكتروني المسجل
• سنعرض إشعاراً داخل المنصة
• سنحدّث تاريخ "آخر تحديث" في أعلى هذه الصفحة

استمرارك في استخدام المنصة بعد إشعار التغيير يعني موافقتك على السياسة المحدّثة.`,
  },
  {
    icon: Mail,
    title: '9. التواصل بشأن الخصوصية',
    content: `للاستفسار عن خصوصيتك أو ممارسة حقوقك:
• البريد الإلكتروني: beshirswed07@gmail.com
• صفحة "تواصل معنا" على المنصة

نلتزم بالرد خلال 72 ساعة من استلام طلبك.`,
  },
];

export default function PrivacyPage() {
  const lastUpdated = '3 يوليو 2026';

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="py-14 section-padding bg-muted/30 border-b border-border/30">
        <div className="container-motoon flex flex-col items-center text-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Shield className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-3xl md:text-4xl font-black">سياسة الخصوصية</h1>
          <p className="text-muted-foreground max-w-xl">
            نحن نأخذ خصوصيتك على محمل الجد — تعرف على كيفية تعاملنا مع بياناتك
          </p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-card border border-border/50 px-4 py-2 rounded-full">
            <Shield className="h-3.5 w-3.5 text-primary" />
            آخر تحديث: {lastUpdated}
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-12 section-padding">
        <div className="container-motoon max-w-4xl mx-auto">

          {/* Commitment Banner */}
          <div className="p-5 rounded-2xl bg-primary/5 border border-primary/20 mb-10 flex items-start gap-3">
            <Shield className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-primary mb-1">التزامنا بخصوصيتك</p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                لا نبيع بياناتك. لا نشاركها مع المعلنين. نجمع فقط ما نحتاجه لتقديم خدمة أفضل.
                بياناتك ملكك وحدك.
              </p>
            </div>
          </div>

          {/* Sections */}
          <div className="flex flex-col gap-8">
            {sections.map(({ icon: Icon, title, content }) => (
              <div key={title} className="flex flex-col gap-3">
                <h2 className="text-lg font-black text-foreground flex items-center gap-2.5 pb-2 border-b border-border/50">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  {title}
                </h2>
                <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line pr-11">
                  {content}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 p-5 rounded-2xl bg-muted/50 border border-border/30 text-center">
            <p className="text-sm text-muted-foreground">
              إذا كان لديك أي تساؤل عن سياسة الخصوصية، لا تتردد في التواصل معنا.
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              © {new Date().getFullYear()} منصة متون — بياناتك في أمان معنا
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
