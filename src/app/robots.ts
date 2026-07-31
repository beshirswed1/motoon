import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const rawAppUrl = process.env.NEXT_PUBLIC_APP_URL;
  const baseUrl = rawAppUrl && !rawAppUrl.includes('localhost')
    ? rawAppUrl.replace(/\/$/, '')
    : 'https://www.motoon.com.tr';

  const disallowedPaths = [
    '/admin/',
    '/api/',
    '/login',
    '/register',
    '/sign-in',
    '/sign-up',
    '/profile/',
    '/settings/',
    '/favorites/',
    '/notifications/',
    '/progress/',
    '/offline',
    '/*/memorize',
    '/*/recite',
    '/*/certificate',
  ];

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: disallowedPaths,
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: disallowedPaths,
      },
      {
        userAgent: 'Bingbot',
        allow: '/',
        disallow: disallowedPaths,
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
