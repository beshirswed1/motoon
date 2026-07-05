import type { Metadata, Viewport } from 'next';
import { IBM_Plex_Sans_Arabic } from 'next/font/google';
import '@/styles/globals.css';
import { Providers } from '@/components/common/Providers';
import { Navbar } from '@/components/common/Navbar';
import { Footer } from '@/components/common/Footer';
import { ToastContainer } from '@/components/common/ToastContainer';
import { PWAInstallPrompt } from '@/components/common/PWAInstallPrompt';

/* ── Font ─────────────────────────────────────────────────── */
const ibmPlexSansArabic = IBM_Plex_Sans_Arabic({
  subsets: ['arabic'],
  weight: ['100', '200', '300', '400', '500', '600', '700'],
  variable: '--font-arabic',
  display: 'swap',
  preload: true,
});

/* ── Metadata ─────────────────────────────────────────────── */
export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'https://motoon.app'),
  title: {
    default: 'متون — منصة التعليم الإسلامي',
    template: '%s | متون',
  },
  description:
    'منصة متون للتعليم الإسلامي — احفظ المتون الشرعية وتتبع تقدمك في الحفظ بتقنيات الذكاء الاصطناعي',
  keywords: ['متون', 'حفظ القرآن', 'تعليم إسلامي', 'متون شرعية', 'فقه', 'عقيدة'],
  authors: [{ name: 'فريق متون' }],
  creator: 'منصة متون',
  publisher: 'منصة متون',
  applicationName: 'متون',
  referrer: 'origin-when-cross-origin',
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  openGraph: {
    type: 'website',
    locale: 'ar_SA',
    url: 'https://motoon.app',
    siteName: 'متون',
    title: 'متون — منصة التعليم الإسلامي لحفظ المتون',
    description: 'منصة متون للتعليم الإسلامي — احفظ المتون الشرعية، القرآن الكريم، وتتبع تقدمك في الحفظ والمراجعة بتقنيات الذكاء الاصطناعي.',
    images: [
      {
        url: '/logo.png',
        width: 800,
        height: 600,
        alt: 'شعار منصة متون',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'متون — منصة التعليم الإسلامي',
    description: 'احفظ المتون الشرعية وتتبع تقدمك في الحفظ',
    images: ['/logo.png'],
  },
  alternates: {
    canonical: 'https://motoon.app',
    languages: {
      'ar-SA': 'https://motoon.app/ar',
    },
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'متون',
  },
  formatDetection: {
    telephone: false,
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
  return (
    <html
      lang="ar"
      dir="rtl"
      suppressHydrationWarning
      className={ibmPlexSansArabic.variable}
    >
      <head>
        {/* Preconnect to Google Fonts for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

        {/* Apple touch icons */}
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/icons/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/icons/favicon-16x16.png" />

        {/* iOS PWA status bar */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="mobile-web-app-capable" content="yes" />

        {/* Microsoft Tile */}
        <meta name="msapplication-TileColor" content="#0F766E" />
        <meta name="msapplication-TileImage" content="/icons/icon-144x144.png" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
      </head>
      <body className="font-arabic antialiased min-h-screen flex flex-col">
        <Providers>
          <Navbar />
          <main className="flex-1 flex flex-col">{children}</main>
          <Footer />
          <ToastContainer />
          <PWAInstallPrompt />
        </Providers>
      </body>
    </html>
  );
}
