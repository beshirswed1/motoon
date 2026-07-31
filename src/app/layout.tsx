import React from 'react';
import type { Metadata, Viewport } from 'next';
import { IBM_Plex_Sans_Arabic } from 'next/font/google';
import '@/styles/globals.css';
import { Providers } from '@/components/common/Providers';
import { Navbar } from '@/components/common/Navbar';
import { Footer } from '@/components/common/Footer';
import { ToastContainer } from '@/components/common/ToastContainer';
import { PWAInstallPrompt } from '@/components/common/PWAInstallPrompt';
import { JsonLd } from '@/components/seo/JsonLd';
import {
  createOrganizationSchema,
  createWebSiteSchema,
  createSoftwareApplicationSchema,
  combineSchemas,
} from '@/lib/seo/jsonld.helpers';
import { SEO_CONFIG, getFullUrl } from '@/lib/seo/seo.config';

/* ── Font ─────────────────────────────────────────────────── */
const ibmPlexSansArabic = IBM_Plex_Sans_Arabic({
  subsets: ['arabic'],
  weight: ['100', '200', '300', '400', '500', '600', '700'],
  variable: '--font-arabic',
  display: 'swap',
  preload: true,
});

/* ── Comprehensive Root Metadata ──────────────────────────── */
export const metadata: Metadata = {
  metadataBase: new URL(SEO_CONFIG.siteUrl),
  title: {
    default: '🟢 متون | الموسوعة التعليمية لحفظ المتون الشرعية',
    template: '%s | متون',
  },
  description: SEO_CONFIG.siteDescription,
  keywords: [...SEO_CONFIG.defaultKeywords],
  authors: SEO_CONFIG.authors,
  creator: SEO_CONFIG.creator,
  publisher: SEO_CONFIG.publisher,
  applicationName: SEO_CONFIG.applicationName,
  generator: SEO_CONFIG.generator,
  referrer: SEO_CONFIG.referrer,
  category: SEO_CONFIG.category,
  classification: SEO_CONFIG.classification,

  alternates: {
    canonical: getFullUrl(),
    languages: {
      'ar-SA': getFullUrl(),
    },
  },

  robots: {
    index: true,
    follow: true,
    'max-image-preview': 'large',
    'max-video-preview': -1,
    'max-snippet': -1,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-video-preview': -1,
      'max-snippet': -1,
    },
  },

  openGraph: {
    type: 'website',
    locale: SEO_CONFIG.locale,
    url: SEO_CONFIG.siteUrl,
    siteName: SEO_CONFIG.siteName,
    title: '🟢 متون | الموسوعة التعليمية لحفظ المتون الشرعية',
    description: SEO_CONFIG.siteDescription,
    images: [
      {
        url: getFullUrl(SEO_CONFIG.ogImageDefault),
        width: 1200,
        height: 630,
        alt: 'منصة متون للتعليم الإسلامي وحفظ المتون الشرعية',
      },
    ],
  },

  twitter: {
    card: 'summary_large_image',
    title: '🟢 متون | الموسوعة التعليمية لحفظ المتون الشرعية',
    description: SEO_CONFIG.siteDescriptionShort,
    images: [getFullUrl(SEO_CONFIG.ogImageDefault)],
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
    'content-language': 'ar',
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#0F766E' },
    { media: '(prefers-color-scheme: dark)', color: '#115E59' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

/* ── Root Layout ──────────────────────────────────────────── */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Global Schemas: Organization + WebSite (SearchAction) + SoftwareApplication
  const globalSchemas = combineSchemas(
    createOrganizationSchema(),
    createWebSiteSchema(),
    createSoftwareApplicationSchema()
  );

  return (
    <html
      lang="ar"
      dir="rtl"
      suppressHydrationWarning
      className={ibmPlexSansArabic.variable}
    >
      <head>
        {/* Preconnect for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://firestore.googleapis.com" />
        <link rel="dns-prefetch" href="https://firebasestorage.googleapis.com" />

        {/* Global Structured Data (JSON-LD) */}
        <JsonLd data={globalSchemas} />

        {/* PWA Icons & Meta */}
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/icons/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/icons/favicon-16x16.png" />

        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="mobile-web-app-capable" content="yes" />

        <meta name="msapplication-TileColor" content="#0F766E" />
        <meta name="msapplication-TileImage" content="/icons/icon-144x144.png" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
      </head>
      <body className="font-arabic antialiased min-h-screen flex flex-col">
        <Providers>
          <Navbar />
          <main id="main-content" className="flex-1 flex flex-col">{children}</main>
          <Footer />
          <ToastContainer />
          <PWAInstallPrompt />
        </Providers>
      </body>
    </html>
  );
}
