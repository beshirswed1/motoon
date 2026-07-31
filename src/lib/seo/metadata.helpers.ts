/**
 * ═══════════════════════════════════════════════════════════════
 * Metadata Helpers — Factory functions for Next.js Metadata API
 * Optimized for #1 Search Engine Ranking & High CTR
 * ═══════════════════════════════════════════════════════════════
 */
import type { Metadata } from 'next';
import { SEO_CONFIG, getFullUrl, getOgImageUrl } from './seo.config';

export interface PageMetadataOptions {
  title: string;
  description: string;
  keywords?: string[];
  path?: string;
  ogImage?: string;
  ogType?: 'website' | 'article' | 'book' | 'profile';
  noIndex?: boolean;
  publishedTime?: string;
  modifiedTime?: string;
  category?: string;
  section?: string;
  ogImages?: Array<{
    url: string;
    width?: number;
    height?: number;
    alt?: string;
  }>;
}

/**
 * Creates a comprehensive Metadata object for any page.
 */
export function createPageMetadata(options: PageMetadataOptions): Metadata {
  const {
    title,
    description,
    keywords = [],
    path = '',
    ogImage,
    ogType = 'website',
    noIndex = false,
    publishedTime,
    modifiedTime,
    category,
    section,
    ogImages,
  } = options;

  const canonicalUrl = getFullUrl(path);
  const imageUrl = getOgImageUrl(ogImage);
  const allKeywords = [...new Set([...keywords, ...SEO_CONFIG.defaultKeywords])];

  const resolvedOgImages = ogImages?.length
    ? ogImages.map((img) => ({
        url: img.url.startsWith('http') ? img.url : getFullUrl(img.url),
        width: img.width || 1200,
        height: img.height || 630,
        alt: img.alt || title,
      }))
    : [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: title,
        },
      ];

  const metadataObj: Metadata = {
    title,
    description,
    keywords: allKeywords,
    authors: SEO_CONFIG.authors,
    creator: SEO_CONFIG.creator,
    publisher: SEO_CONFIG.publisher,
    applicationName: SEO_CONFIG.applicationName,
    generator: SEO_CONFIG.generator,
    referrer: SEO_CONFIG.referrer,
    category: category || SEO_CONFIG.category,
    classification: SEO_CONFIG.classification,

    metadataBase: new URL(SEO_CONFIG.siteUrl),
    alternates: {
      canonical: canonicalUrl,
      languages: {
        'ar-SA': canonicalUrl,
        'ar': canonicalUrl,
      },
    },

    robots: noIndex
      ? { index: false, follow: false }
      : {
          index: true,
          follow: true,
          'max-image-preview': 'large' as const,
          'max-video-preview': -1,
          'max-snippet': -1,
          googleBot: {
            index: true,
            follow: true,
            'max-image-preview': 'large' as const,
            'max-video-preview': -1,
            'max-snippet': -1,
          },
        },

    openGraph: {
      type: ogType,
      locale: SEO_CONFIG.locale,
      url: canonicalUrl,
      siteName: 'متون — منصة حفظ المتون الشرعية',
      title,
      description,
      images: resolvedOgImages,
      ...(publishedTime ? { publishedTime } : {}),
      ...(modifiedTime ? { modifiedTime } : {}),
      ...(section ? { section } : {}),
    },

    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: resolvedOgImages.map((img) => img.url),
      creator: '@motooncom',
      site: '@motooncom',
    },

    icons: {
      icon: [
        { url: '/icons/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
        { url: '/icons/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      ],
      apple: [{ url: '/icons/apple-touch-icon.png', sizes: '180x180' }],
      other: [{ rel: 'mask-icon', url: '/icons/icon-192x192.png' }],
    },

    manifest: '/manifest.json',

    verification: {
      google: SEO_CONFIG.verification.google,
    },

    appleWebApp: {
      capable: true,
      statusBarStyle: 'default',
      title: SEO_CONFIG.applicationName,
    },

    formatDetection: {
      telephone: false,
      email: false,
      address: false,
    },

    other: {
      'mobile-web-app-capable': 'yes',
      'msapplication-TileColor': SEO_CONFIG.themeColor,
      'msapplication-TileImage': '/icons/icon-144x144.png',
      'theme-color': SEO_CONFIG.themeColor,
      'content-language': SEO_CONFIG.language,
    },
  };

  return metadataObj;
}

/**
 * Create metadata for a book detail page optimized for Google Search #1 spot
 */
export function createBookMetadata(book: {
  title: string;
  slug: string;
  description: string;
  author: string;
  category?: string | undefined;
  difficulty?: string | undefined;
  tags?: string[] | undefined;
  coverImageUrl?: string | undefined;
  versesCount?: number | undefined;
}): Metadata {
  const isNazmOrMatn = book.title.includes('متن') || book.title.includes('منظومة') ? book.title : `متن ${book.title}`;

  const bookKeywords = [
    book.title,
    isNazmOrMatn,
    `متن ${book.title} كامل`,
    `متن ${book.title} مكتوب`,
    `تحميل ${book.title} PDF`,
    `حفظ ${book.title}`,
    `شرح ${book.title}`,
    `قراءة ${book.title}`,
    `أبيات ${book.title}`,
    `متون ${book.title}`,
    book.author,
    `مؤلف ${book.title}`,
    `تسميع ${book.title}`,
    'متن',
    'متون',
    'م',
    ...(book.tags || []),
  ];

  const difficultyLabel = book.difficulty === 'beginner' ? 'مبتدئ' : book.difficulty === 'intermediate' ? 'متوسط' : 'متقدم';
  const metaTitle = `${isNazmOrMatn} كامل مكتوب مع الحفظ والتسميع — منصة متون`;
  const enrichedDescription = `${isNazmOrMatn} كاملاً مكتوباً مع إمكانية القراءة والحفظ والتسميع الصوتي بالذكاء الاصطناعي وتحميل PDF. المؤلف: ${book.author} | المستوى: ${difficultyLabel}${book.versesCount ? ` | عدد الأبيات: ${book.versesCount}` : ''}.`;

  const opts: PageMetadataOptions = {
    title: metaTitle,
    description: enrichedDescription.substring(0, 165),
    keywords: bookKeywords,
    path: `/books/${book.slug}`,
    ogType: 'book',
    category: book.category || 'education',
  };

  if (book.coverImageUrl) {
    opts.ogImage = book.coverImageUrl;
    opts.ogImages = [
      { url: book.coverImageUrl, width: 800, height: 1000, alt: `غلاف ${isNazmOrMatn}` },
      { url: getOgImageUrl(), width: 1200, height: 630, alt: `${isNazmOrMatn} | منصة متون` },
    ];
  }

  return createPageMetadata(opts);
}

/**
 * Create metadata for an author page
 */
export function createAuthorMetadata(author: {
  name: string;
  slug: string;
  bio: string;
  booksCount: number;
}): Metadata {
  return createPageMetadata({
    title: `ترجمة ومؤلفات ${author.name} — جميع متونه في منصة متون`,
    description: `تعرف على ترجمة وحياة وسيرة ${author.name} وقائمة جميع متونه ومنظوماته الشرعية (${author.booksCount} متون). احفظ وأتقن مؤلفاته في منصة متون.`.substring(0, 165),
    keywords: [
      author.name,
      `ترجمة ${author.name}`,
      `سيرة ${author.name}`,
      `متون ${author.name}`,
      `كتب ${author.name}`,
      `مؤلفات ${author.name}`,
      `منظومات ${author.name}`,
      'علماء الإسلام',
      'متون',
    ],
    path: `/authors/${author.slug}`,
    ogType: 'profile',
  });
}

/**
 * Create metadata for a science page
 */
export function createScienceMetadata(science: {
  name: string;
  slug: string;
  description: string;
  booksCount: number;
}): Metadata {
  return createPageMetadata({
    title: `متون ${science.name} كاملة مكتوبة للحفظ والتسميع — منصة متون`,
    description: `جميع متون ومنظومات ${science.name} مكتوبة ومتاحة للحفظ والتسميع الصوتي التفاعلي (${science.booksCount} متون). ${science.description}`.substring(0, 165),
    keywords: [
      science.name,
      `متون ${science.name}`,
      `كتب ${science.name}`,
      `منظومات ${science.name}`,
      `حفظ ${science.name}`,
      `تعلم ${science.name}`,
      'علوم شرعية',
      'متون',
    ],
    path: `/sciences/${science.slug}`,
  });
}
