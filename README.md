<div align="center">
  <img src="public/logo.png" alt="Motoon Logo" width="120" />
  <h1>📖 منصة مُتون</h1>
  <p><strong>منصة التعليم الإسلامي الأولى لحفظ المتون الشرعية وتتبع التقدم بتقنيات الذكاء الاصطناعي</strong></p>
  
  <p>
    <a href="https://motoon.app"><img src="https://img.shields.io/badge/Website-motoon.app-0F766E?style=flat-square&logo=vercel" alt="Website" /></a>
    <img src="https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js" alt="Next.js" />
    <img src="https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript" alt="TypeScript" />
    <img src="https://img.shields.io/badge/TailwindCSS-3.0-38B2AC?style=flat-square&logo=tailwind-css" alt="Tailwind CSS" />
    <img src="https://img.shields.io/badge/Firebase-v10-FFCA28?style=flat-square&logo=firebase" alt="Firebase" />
  </p>
</div>

<hr />

## 🌟 نبذة عن المشروع
**متون** هي منصة ويب متطورة مصممة لمساعدة طلاب العلم الشرعي في حفظ ومراجعة المتون العلمية والقرآن الكريم بطريقة عصرية وفعالة. توفر المنصة أدوات متقدمة لتتبع الإنجاز، وإدارة الخطط الدراسية، مع دعم للعمل بدون اتصال بالإنترنت (Offline Mode) كتطبيق ويب تقدمي (PWA).

---

## ✨ المميزات الرئيسية
- 📱 **تطبيق ويب تقدمي (PWA):** قابل للتثبيت على الهواتف والأجهزة المكتبية ويعمل بدون اتصال بالإنترنت.
- 🎯 **تتبع الحفظ والمراجعة:** خوارزميات ذكية لتنظيم المراجعة المتباعدة.
- 🌙 **الوضع الليلي والنهاري:** واجهة مستخدم مريحة للعين في جميع الأوقات.
- 📊 **لوحة تحكم للمديرين:** إدارة المحتوى، المستخدمين، والمتون بسهولة.
- ⚡ **أداء فائق السرعة:** مبني باستخدام أحدث تقنيات الـ Server Components في Next.js.
- 🔒 **نظام حسابات وتزامن سحابي:** باستخدام Firebase Auth & Firestore لحفظ بياناتك بأمان.
- 🎨 **تصميم عصري (UI/UX):** مبني على TailwindCSS بلمسة عربية أصيلة وخطوط مريحة (IBM Plex Sans Arabic).

---

## 🛠 التقنيات المستخدمة

| التقنية | الاستخدام |
| --- | --- |
| **[Next.js 15](https://nextjs.org/)** | إطار العمل الأساسي (App Router) |
| **[React 19](https://react.dev/)** | بناء واجهات المستخدم |
| **[TypeScript](https://www.typescriptlang.org/)** | لغة البرمجة (Type Safety) |
| **[Tailwind CSS](https://tailwindcss.com/)** | التنسيق والتصميم |
| **[Firebase](https://firebase.google.com/)** | قواعد البيانات، المصادقة، والتخزين |
| **[Zustand / Redux](https://zustand-demo.pmnd.rs/)** | إدارة حالة التطبيق (State Management) |
| **[PWA (next-pwa)](https://github.com/shadowwalker/next-pwa)** | دعم تطبيق الويب التقدمي |

---

## 🚀 البدء السريع (للمطورين)

### المتطلبات المسبقة
- Node.js (v18.17 أو أحدث)
- npm أو yarn أو pnpm
- مشروع Firebase (لإعداد قاعدة البيانات)

### 1. الاستنساخ والتثبيت
```bash
git clone https://github.com/YourUsername/Motoon.git
cd Motoon
npm install
```

### 2. إعداد متغيرات البيئة
قم بإنشاء ملف `.env.local` في الجذر الأساسي للمشروع، وأضف فيه الإعدادات التالية (تجدها في إعدادات مشروعك على Firebase):
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### 3. تشغيل خادم التطوير
```bash
npm run dev
```
افتح [http://localhost:3000](http://localhost:3000) في متصفحك.

---

## 📦 بناء ونشر المشروع (Deployment)

المنصة مهيأة وجاهزة للنشر على **Vercel**:
1. قم برفع مستودعك على GitHub.
2. اذهب إلى [Vercel](https://vercel.com) وقم باستيراد المشروع.
3. أضف متغيرات البيئة (Environment Variables) الموجودة في ملف `.env.local`.
4. اضغط على **Deploy**.

---

## 📱 أيقونات التطبيق (ملاحظة هامة للـ PWA)
لتفعيل الـ PWA بشكل كامل وصحيح لتظهر الأيقونات على شاشة هواتف المستخدمين، يجب التأكد من رفع الأيقونات بالأحجام المطلوبة إلى المسار `public/icons/`.
الملفات المطلوبة (حسب إعدادات `manifest.json`):
- `icon-72x72.png`
- `icon-96x96.png`
- `icon-128x128.png`
- `icon-144x144.png`
- `icon-152x152.png`
- `icon-192x192.png`
- `icon-384x384.png`
- `icon-512x512.png`
- `apple-touch-icon.png`

---

## 🤝 المساهمة
نرحب دائماً بالمساهمات! إذا كان لديك أي اقتراحات لتحسين المنصة، لا تتردد في فتح *Issue* أو إرسال *Pull Request*.

<div align="center">
  <p>تم الصنع بحب لخدمة طلاب العلم الشرعي 🕌</p>
</div>
