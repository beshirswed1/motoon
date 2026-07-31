/**
 * ═══════════════════════════════════════════════════════════════
 * JSON-LD Schema Helpers — Structured Data for all page types
 * ═══════════════════════════════════════════════════════════════
 */
import { SEO_CONFIG, getFullUrl } from './seo.config';

type JsonLdObject = Record<string, unknown>;

function createSchema(type: string, data: JsonLdObject): JsonLdObject {
  return {
    '@context': 'https://schema.org',
    '@type': type,
    ...data,
  };
}

/* ── Organization ─────────────────────────────────────────── */

export function createOrganizationSchema(): JsonLdObject {
  return createSchema('EducationalOrganization', {
    '@id': `${getFullUrl()}#organization`,
    name: SEO_CONFIG.organization.name,
    alternateName: SEO_CONFIG.organization.nameEn,
    url: SEO_CONFIG.organization.url,
    logo: {
      '@type': 'ImageObject',
      url: getFullUrl(SEO_CONFIG.logo),
      width: 512,
      height: 512,
    },
    image: getFullUrl(SEO_CONFIG.logo),
    email: SEO_CONFIG.organization.email,
    foundingDate: SEO_CONFIG.organization.foundingDate,
    description: SEO_CONFIG.siteDescription,
    sameAs: [SEO_CONFIG.social.instagram],
    contactPoint: {
      '@type': 'ContactPoint',
      email: SEO_CONFIG.organization.email,
      contactType: 'customer support',
      availableLanguage: 'Arabic',
    },
  });
}

/* ── WebSite with SearchAction ────────────────────────────── */

export function createWebSiteSchema(): JsonLdObject {
  return createSchema('WebSite', {
    '@id': `${getFullUrl()}#website`,
    name: SEO_CONFIG.siteName,
    alternateName: SEO_CONFIG.siteNameEn,
    url: getFullUrl(),
    description: SEO_CONFIG.siteDescription,
    inLanguage: SEO_CONFIG.language,
    publisher: { '@id': `${getFullUrl()}#organization` },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${getFullUrl('/search')}?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  });
}

/* ── WebPage ──────────────────────────────────────────────── */

export function createWebPageSchema(options: {
  name: string;
  description: string;
  url: string;
  breadcrumb?: JsonLdObject;
}): JsonLdObject {
  const schema: JsonLdObject = {
    '@id': `${options.url}#webpage`,
    name: options.name,
    description: options.description,
    url: options.url,
    isPartOf: { '@id': `${getFullUrl()}#website` },
    about: { '@id': `${getFullUrl()}#organization` },
    inLanguage: SEO_CONFIG.language,
  };
  if (options.breadcrumb) {
    schema.breadcrumb = options.breadcrumb;
  }
  return createSchema('WebPage', schema);
}

/* ── Breadcrumb ───────────────────────────────────────────── */

export interface BreadcrumbItem {
  name: string;
  url: string;
}

export function createBreadcrumbSchema(items: BreadcrumbItem[]): JsonLdObject {
  return createSchema('BreadcrumbList', {
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  });
}

/* ── Book ─────────────────────────────────────────────────── */

export function createBookSchema(book: {
  title: string;
  slug: string;
  description: string;
  author: string;
  authorSlug?: string | undefined;
  category?: string | undefined;
  difficulty?: string | undefined;
  versesCount?: number | undefined;
  coverImageUrl?: string | undefined;
  tags?: string[] | undefined;
}): JsonLdObject {
  const difficultyMap: Record<string, string> = {
    beginner: 'Beginner',
    intermediate: 'Intermediate',
    advanced: 'Advanced',
  };

  const schema: JsonLdObject = {
    '@id': `${getFullUrl(`/books/${book.slug}`)}#book`,
    name: book.title,
    description: book.description,
    url: getFullUrl(`/books/${book.slug}`),
    author: {
      '@type': 'Person',
      name: book.author,
      ...(book.authorSlug ? { url: getFullUrl(`/authors/${book.authorSlug}`) } : {}),
    },
    publisher: { '@id': `${getFullUrl()}#organization` },
    inLanguage: SEO_CONFIG.language,
    genre: book.category || 'علوم شرعية',
    isAccessibleForFree: true,
  };

  if (book.coverImageUrl) {
    schema.image = {
      '@type': 'ImageObject',
      url: book.coverImageUrl,
      caption: `غلاف ${book.title}`,
    };
  }
  if (book.versesCount) schema.numberOfPages = book.versesCount;
  if (book.tags?.length) schema.keywords = book.tags.join(', ');
  if (book.difficulty) schema.proficiencyLevel = difficultyMap[book.difficulty] || book.difficulty;

  return createSchema('Book', schema);
}

/* ── Course / LearningResource ────────────────────────────── */

export function createCourseSchema(book: {
  title: string;
  slug: string;
  description: string;
  author: string;
  difficulty?: string;
  versesCount?: number;
  category?: string;
}): JsonLdObject {
  const difficultyMap: Record<string, string> = {
    beginner: 'مبتدئ',
    intermediate: 'متوسط',
    advanced: 'متقدم',
  };

  const schema: JsonLdObject = {
    name: `حفظ ${book.title}`,
    description: `دورة حفظ ${book.title} — ${book.description}`,
    url: getFullUrl(`/books/${book.slug}`),
    provider: { '@id': `${getFullUrl()}#organization` },
    educationalLevel: difficultyMap[book.difficulty || 'beginner'] || book.difficulty,
    inLanguage: SEO_CONFIG.language,
    isAccessibleForFree: true,
    courseMode: 'online',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
    },
    hasCourseInstance: {
      '@type': 'CourseInstance',
      courseMode: 'online',
      ...(book.versesCount ? { courseWorkload: `${book.versesCount} بيت` } : {}),
    },
  };

  if (book.category) {
    schema.about = { '@type': 'Thing', name: book.category };
  }

  return createSchema('Course', schema);
}

export function createLearningResourceSchema(book: {
  title: string;
  slug: string;
  description: string;
  author: string;
  difficulty?: string;
}): JsonLdObject {
  return createSchema('LearningResource', {
    name: book.title,
    description: book.description,
    url: getFullUrl(`/books/${book.slug}`),
    author: { '@type': 'Person', name: book.author },
    provider: { '@id': `${getFullUrl()}#organization` },
    educationalLevel: book.difficulty || 'beginner',
    inLanguage: SEO_CONFIG.language,
    isAccessibleForFree: true,
    learningResourceType: 'متن شرعي',
  });
}

/* ── Person (Author) ──────────────────────────────────────── */

export function createPersonSchema(author: {
  name: string;
  slug: string;
  bio: string;
  era?: string;
  books?: string[];
}): JsonLdObject {
  const schema: JsonLdObject = {
    '@id': `${getFullUrl(`/authors/${author.slug}`)}#person`,
    name: author.name,
    description: author.bio,
    url: getFullUrl(`/authors/${author.slug}`),
    sameAs: [],
  };
  if (author.era) schema.birthDate = author.era;
  if (author.books?.length) {
    schema.hasOccupation = {
      '@type': 'Occupation',
      name: 'عالم ومؤلف',
    };
  }
  return createSchema('Person', schema);
}

/* ── FAQ ──────────────────────────────────────────────────── */

export function createFAQSchema(faqs: Array<{ question: string; answer: string }>): JsonLdObject {
  return createSchema('FAQPage', {
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  });
}

/* ── CollectionPage (ItemList) ────────────────────────────── */

export function createCollectionPageSchema(options: {
  name: string;
  description: string;
  url: string;
  items: Array<{ name: string; url: string; description?: string; image?: string }>;
}): JsonLdObject {
  return createSchema('CollectionPage', {
    name: options.name,
    description: options.description,
    url: options.url,
    isPartOf: { '@id': `${getFullUrl()}#website` },
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: options.items.length,
      itemListElement: options.items.map((item, index) => {
        const itemObj: JsonLdObject = {
          '@type': 'ListItem',
          position: index + 1,
          name: item.name,
          url: item.url,
        };
        if (item.description) itemObj.description = item.description;
        if (item.image) itemObj.image = item.image;
        return itemObj;
      }),
    },
  });
}

/* ── HowTo ────────────────────────────────────────────────── */

export function createHowToSchema(options: {
  name: string;
  description: string;
  steps: Array<{ name: string; text: string }>;
}): JsonLdObject {
  return createSchema('HowTo', {
    name: options.name,
    description: options.description,
    step: options.steps.map((step, index) => ({
      '@type': 'HowToStep',
      position: index + 1,
      name: step.name,
      text: step.text,
    })),
  });
}

/* ── SoftwareApplication ──────────────────────────────────── */

export function createSoftwareApplicationSchema(): JsonLdObject {
  return createSchema('SoftwareApplication', {
    name: SEO_CONFIG.applicationName,
    description: SEO_CONFIG.siteDescription,
    url: getFullUrl(),
    applicationCategory: 'EducationalApplication',
    operatingSystem: 'Web, Android, iOS',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      ratingCount: '150',
      bestRating: '5',
      worstRating: '1',
    },
  });
}

/* ── ProfilePage ──────────────────────────────────────────── */

export function createProfilePageSchema(person: {
  name: string;
  slug: string;
  description: string;
}): JsonLdObject {
  return createSchema('ProfilePage', {
    name: `صفحة ${person.name}`,
    description: person.description,
    url: getFullUrl(`/authors/${person.slug}`),
    mainEntity: { '@id': `${getFullUrl(`/authors/${person.slug}`)}#person` },
    isPartOf: { '@id': `${getFullUrl()}#website` },
  });
}

/* ── Combine Multiple Schemas ─────────────────────────────── */

export function combineSchemas(...schemas: JsonLdObject[]): JsonLdObject[] {
  return schemas;
}
