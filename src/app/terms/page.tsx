import type { Metadata } from 'next';
import { FileText, AlertTriangle, CheckCircle2 } from 'lucide-react';


export const metadata: Metadata = {
  title: 'الشروط والأحكام | متون',
  description: 'شروط وأحكام استخدام منصة متون للتعليم الإسلامي وحفظ المتون الشرعية.',
};

const sections = [
  {
    id: 'acceptance',
    title: '1. قبول الشروط',
    content: `باستخدامك لمنصة متون (الموقع والتطبيق)، فإنك توافق على الالتزام بهذه الشروط والأحكام بالكامل. إذا كنت لا توافق على أي جزء من هذه الشروط، يرجى التوقف عن استخدام المنصة. نحتفظ بالحق في تعديل هذه الشروط في أي وقت، وسيتم إخطارك بالتغييرات الجوهرية عبر البريد الإلكتروني أو إشعار داخل المنصة.`,
  },
  {
    id: 'service',
    title: '2. وصف الخدمة',
    content: `منصة متون هي منصة تعليمية إسلامية تتيح للمستخدمين:
• حفظ المتون الشرعية في مختلف العلوم الإسلامية
• التسميع الصوتي وتقييم الأداء
• تتبع التقدم في الحفظ بخوارزمية التكرار المتباعد
• الحصول على شهادات إتمام المتون
• الوصول لمكتبة شاملة من المتون العلمية

المنصة مجانية للاستخدام الأساسي. نحتفظ بالحق في إضافة خدمات متميزة مدفوعة مستقبلاً مع إشعار مسبق.`,
  },
  {
    id: 'account',
    title: '3. حساب المستخدم',
    content: `لاستخدام بعض ميزات المنصة، يجب عليك إنشاء حساب. أنت مسؤول عن:
• دقة المعلومات التي تقدمها عند التسجيل
• سرية كلمة المرور الخاصة بك
• جميع الأنشطة التي تتم من خلال حسابك

يجب أن يكون عمرك 13 عاماً أو أكثر لاستخدام المنصة. إذا كنت أقل من 18 عاماً، يجب الحصول على موافقة ولي الأمر.`,
  },
  {
    id: 'conduct',
    title: '4. قواعد الاستخدام',
    content: `يلتزم المستخدم بما يلي:
• عدم نشر محتوى مسيء أو مخالف للشريعة الإسلامية أو القوانين النافذة
• عدم انتهاك حقوق الملكية الفكرية للمحتوى
• عدم استخدام المنصة لأغراض تجارية دون إذن صريح
• عدم محاولة الوصول غير المصرح به لأنظمة المنصة
• عدم نشر محتوى مضلل أو زائف عن المتون الشرعية
• الالتزام باحترام المحتوى الإسلامي وأصوله`,
  },
  {
    id: 'ip',
    title: '5. الملكية الفكرية',
    content: `محتوى المتون الشرعية في المنصة هو تراث إسلامي مشترك. أما:
• تصميم المنصة وبرمجتها وشعارها: ملك لمنصة متون
• الشهادات الصادرة عن المنصة: حقوق الطباعة والنشر محفوظة
• المحتوى الذي يضيفه المستخدمون: يمنحون المنصة حق استخدامه لتحسين الخدمة

يجوز للمستخدمين مشاركة المتون للأغراض التعليمية غير التجارية مع الإشارة للمصدر.`,
  },
  {
    id: 'privacy',
    title: '6. الخصوصية',
    content: `نجمع ونستخدم بياناتك وفق سياسة الخصوصية المنفصلة المتاحة على المنصة. باستخدامك للمنصة، توافق على جمع البيانات المذكورة في تلك السياسة. يمكنك الاطلاع على سياسة الخصوصية الكاملة من رابط "سياسة الخصوصية" في الفوتر.`,
  },
  {
    id: 'disclaimer',
    title: '7. إخلاء المسؤولية',
    content: `• الشهادات الصادرة عن منصة متون هي شهادات إتقان رقمية داخلية ولا تُعادل شهادات إجازة شرعية رسمية
• المنصة تُسهّل الحفظ والمراجعة لكنها لا تحل محل طلب العلم على يد العلماء المتخصصين
• المحتوى التعليمي يُراجَع للدقة لكن الاعتماد النهائي يكون على المصادر الأصيلة
• المنصة غير مسؤولة عن أي انقطاع في الخدمة أو فقدان بيانات ناتج عن ظروف خارجة عن إرادتها`,
  },
  {
    id: 'termination',
    title: '8. إنهاء الخدمة',
    content: `نحتفظ بالحق في تعليق أو إنهاء حسابك في حالات:
• انتهاك هذه الشروط والأحكام
• الاشتباه في الاستخدام الاحتيالي أو المسيء
• بناءً على طلبك الشخصي

يمكنك حذف حسابك في أي وقت من إعدادات الحساب، وسيتم حذف بياناتك وفق سياسة الخصوصية.`,
  },
  {
    id: 'governing',
    title: '9. القانون المعمول به',
    content: `تخضع هذه الشروط وتُفسَّر وفقاً للمبادئ العامة ومبادئ الشريعة الإسلامية، مع مراعاة القوانين المعمول بها في مكان إقامة المستخدم. أي نزاع ينشأ عن استخدام المنصة يُحل بالتفاهم المشترك أولاً.`,
  },
  {
    id: 'contact',
    title: '10. التواصل معنا',
    content: `إذا كان لديك أي استفسار حول هذه الشروط، يمكنك التواصل معنا عبر:
• البريد الإلكتروني: support@motoon.app
• صفحة "تواصل معنا" على المنصة`,
  },
];

export default function TermsPage() {
  const lastUpdated = '3 يوليو 2026';

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="py-14 section-padding bg-muted/30 border-b border-border/30">
        <div className="container-motoon flex flex-col items-center text-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
            <FileText className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-3xl md:text-4xl font-black">الشروط والأحكام</h1>
          <p className="text-muted-foreground max-w-xl">
            يرجى قراءة هذه الشروط بعناية قبل استخدام منصة متون
          </p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-card border border-border/50 px-4 py-2 rounded-full">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
            آخر تحديث: {lastUpdated}
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-12 section-padding">
        <div className="container-motoon max-w-4xl mx-auto">
          {/* Summary */}
          <div className="p-5 rounded-2xl bg-primary/5 border border-primary/20 mb-10 flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-primary mb-1">ملخص سريع</p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                منصة متون مجانية، تحترم خصوصيتك، ومحتواها للأغراض التعليمية الإسلامية. الشهادات رقمية داخلية.
                نطلب منك احترام المحتوى وعدم إساءة استخدام المنصة.
              </p>
            </div>
          </div>

          {/* Sections */}
          <div className="flex flex-col gap-8">
            {sections.map(({ id, title, content }) => (
              <div key={id} id={id} className="scroll-mt-20">
                <h2 className="text-lg font-black text-foreground mb-3 pb-2 border-b border-border/50">
                  {title}
                </h2>
                <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                  {content}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 p-5 rounded-2xl bg-muted/50 border border-border/30 text-center">
            <p className="text-sm text-muted-foreground">
              باستمرارك في استخدام المنصة، فأنت توافق على هذه الشروط والأحكام.
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              © {new Date().getFullYear()} منصة متون — جميع الحقوق محفوظة
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
