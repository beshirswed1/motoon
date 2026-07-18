import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const rawAppUrl = process.env.NEXT_PUBLIC_APP_URL;
  const baseUrl = rawAppUrl && !rawAppUrl.includes('localhost')
    ? rawAppUrl
    : 'https://www.motoon.com.tr';

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
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
        '/*/memorize',
        '/*/recite',
        '/*/certificate',
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
