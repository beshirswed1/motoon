import type { Metadata } from 'next';
import React from 'react';
import { createPageMetadata } from '@/lib/seo/metadata.helpers';
import { createOrganizationSchema, createBreadcrumbSchema, combineSchemas } from '@/lib/seo/jsonld.helpers';
import { getFullUrl } from '@/lib/seo/seo.config';
import { JsonLd } from '@/components/seo/JsonLd';

export async function generateMetadata(): Promise<Metadata> {
  return createPageMetadata({
    title: 'تواصل معنا — الدعم والاستفسارات | متون',
    description: 'تواصل مع فريق منصة متون للاستفسارات، اقتراحات المتون، الشراكات، والإبلاغ عن الملاحظات التقنية عبر واتساب أو البريد الإلكتروني.',
    keywords: ['تواصل معنا', 'اتصل بنا متون', 'دعم منصة متون', 'واتساب متون', 'البريد الإلكتروني متون'],
    path: '/contact',
  });
}

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  const contactSchema = {
    '@context': 'https://schema.org',
    '@type': 'ContactPage',
    name: 'صفحة التواصل — منصة متون',
    description: 'تواصل مع فريق منصة متون للاستفسارات والمساعدات.',
    url: getFullUrl('/contact'),
    mainEntity: createOrganizationSchema(),
  };

  const breadcrumbSchema = createBreadcrumbSchema([
    { name: 'الرئيسية', url: getFullUrl('/') },
    { name: 'تواصل معنا', url: getFullUrl('/contact') },
  ]);

  return (
    <>
      <JsonLd data={combineSchemas(contactSchema, breadcrumbSchema)} />
      {children}
    </>
  );
}
