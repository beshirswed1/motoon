/**
 * ═══════════════════════════════════════════════════════════════
 * SEO Configuration — Central source of truth for all SEO data
 * ═══════════════════════════════════════════════════════════════
 */

export const SEO_CONFIG = {
  /* ── Site Identity ──────────────────────────────────────── */
  siteName: 'متون',
  siteNameEn: 'Motoon',
  siteUrl: process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.motoon.com.tr',
  siteDescription:
    'منصة متون — المنصة الرائدة في حفظ المتون الشرعية بنظام التكرار المتباعد والتسميع الصوتي بالذكاء الاصطناعي. احفظ المتون في الفقه والعقيدة والنحو والحديث.',
  siteDescriptionShort:
    'احفظ المتون الشرعية وتتبع تقدمك في الحفظ بنظام ذكي وتسميع صوتي بالذكاء الاصطناعي.',

  /* ── Branding ───────────────────────────────────────────── */
  logo: '/logo.png',
  ogImageDefault: '/og/main.png',
  ogImageBooks: '/og/books.png',
  themeColor: '#0F766E',
  backgroundColor: '#ffffff',

  /* ── Organization ───────────────────────────────────────── */
  organization: {
    name: 'منصة متون',
    nameEn: 'Motoon Platform',
    type: 'EducationalOrganization',
    foundingDate: '2024',
    email: 'beshirswed07@gmail.com',
    url: 'https://www.motoon.com.tr',
  },

  /* ── Creator / Publisher ────────────────────────────────── */
  creator: 'منصة متون',
  publisher: 'منصة متون',
  authors: [{ name: 'فريق متون', url: 'https://www.motoon.com.tr/about' }] as Array<{ name: string; url?: string }>,
  generator: 'Next.js',

  /* ── Social Media ───────────────────────────────────────── */
  social: {
    instagram: 'https://www.instagram.com/motooncom/',
    whatsapp: '905377906230',
  },

  /* ── Locale & Language ──────────────────────────────────── */
  locale: 'ar_SA',
  language: 'ar',
  direction: 'rtl' as const,

  /* ── Verification Tokens ────────────────────────────────── */
  verification: {
    google: 'google054ee476501d6baa',
  },

  /* ── Default Robots ─────────────────────────────────────── */
  defaultRobots: {
    index: true,
    follow: true,
    'max-image-preview': 'large' as const,
    'max-video-preview': -1,
    'max-snippet': -1,
  },

  /* ── Application Info ───────────────────────────────────── */
  applicationName: 'متون',
  applicationCategory: 'EducationalApplication',
  referrer: 'origin-when-cross-origin' as const,
  category: 'education',
  classification: 'Islamic Education Platform',

  /* ── Keywords (Global) ──────────────────────────────────── */
  defaultKeywords: [
    'متون',
    'حفظ المتون',
    'المتون الشرعية',
    'حفظ القرآن',
    'تعليم إسلامي',
    'التكرار المتباعد',
    'تسميع صوتي',
    'فقه',
    'عقيدة',
    'نحو',
    'حديث',
    'أصول الفقه',
    'علوم شرعية',
    'منصة تعليمية إسلامية',
    'حفظ الأبيات',
    'Motoon',
    'Islamic education',
    'memorization',
  ],
};

/**
 * Build a full URL from a relative path
 */
export function getFullUrl(path: string = ''): string {
  const base = SEO_CONFIG.siteUrl.replace(/\/$/, '');
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${base}${cleanPath}`;
}

/**
 * Build an OG image URL
 */
export function getOgImageUrl(imagePath?: string): string {
  if (imagePath && imagePath.startsWith('http')) return imagePath;
  return getFullUrl(imagePath || SEO_CONFIG.ogImageDefault);
}
