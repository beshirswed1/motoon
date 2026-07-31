/**
 * ═══════════════════════════════════════════════════════════════
 * Metadata Helpers — Factory functions for Next.js Metadata API
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
      siteName: SEO_CONFIG.siteName,
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
 * Create metadata for a book detail page with rich, unique data
 */
export function createBookMetadata(book: {
  title: string;
  slug: string;
  description: string;
  author: string;
  category?: string;
  difficulty?: string;
  tags?: string[];
  coverImageUrl?: string;
  versesCount?: number;
}): Metadata {
  const bookKeywords = [
    book.title,
    `حفظ ${book.title}`,
    `شرح ${book.title}`,
    `متن ${book.title}`,
    book.author,
    `مؤلف ${book.title}`,
    ...(book.tags || []),
    ...(book.difficulty ? [`متن ${book.difficulty === 'beginner' ? 'للمبتدئين' : book.difficulty === 'intermediate' ? 'متوسط' : 'متقدم'}`] : []),
  ];

  const difficultyLabel = book.difficulty === 'beginner' ? 'مبتدئ' : book.difficulty === 'intermediate' ? 'متوسط' : 'متقدم';
  const enrichedDescription = `${book.title} — ${book.description} | المؤلف: ${book.author} | المستوى: ${difficultyLabel}${book.versesCount ? ` | عدد الأبيات: ${book.versesCount}` : ''} — احفظه الآن في منصة متون.`;

  const opts: PageMetadataOptions = {
    title: `${book.title} — حفظ وتسميع | متون`,
    description: enrichedDescription.substring(0, 160),
    keywords: bookKeywords,
    path: `/books/${book.slug}`,
    ogType: 'book',
    category: book.category || 'education',
  };

  if (book.coverImageUrl) {
    opts.ogImage = book.coverImageUrl;
    opts.ogImages = [
      { url: book.coverImageUrl, width: 800, height: 1000, alt: `غلاف ${book.title}` },
      { url: getOgImageUrl(), width: 1200, height: 630, alt: `${book.title} | متون` },
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
    title: `${author.name} — ترجمة ومتون | متون`,
    description: `ترجمة ${author.name} وقائمة متونه الشرعية (${author.booksCount} متن). تعرف على حياته وأعماله واحفظ متونه في منصة متون.`.substring(0, 160),
    keywords: [
      author.name,
      `ترجمة ${author.name}`,
      `متون ${author.name}`,
      `كتب ${author.name}`,
      `مؤلفات ${author.name}`,
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
    title: `${science.name} — المتون والكتب | متون`,
    description: `${science.description} — ${science.booksCount} متن متاح للحفظ في منصة متون.`.substring(0, 160),
    keywords: [
      science.name,
      `متون ${science.name}`,
      `كتب ${science.name}`,
      `حفظ ${science.name}`,
      `تعلم ${science.name}`,
    ],
    path: `/sciences/${science.slug}`,
  });
}
