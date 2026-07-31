import type { Metadata } from 'next';
import { booksService } from '@/services/firebase/books.service';
import { getAllLocalBooks } from '@/lib/data';
import { BooksClientPage } from '@/features/books/components/BooksClientPage';
import { createPageMetadata } from '@/lib/seo/metadata.helpers';
import { createCollectionPageSchema, createBreadcrumbSchema, combineSchemas } from '@/lib/seo/jsonld.helpers';
import { getFullUrl } from '@/lib/seo/seo.config';
import { JsonLd } from '@/components/seo/JsonLd';
import { Breadcrumb } from '@/components/seo/Breadcrumb';

export async function generateMetadata(): Promise<Metadata> {
  return createPageMetadata({
    title: 'المكتبة العلمية للمتون الشرعية — تصفح كافة المتون | متون',
    description: 'تصفح كافة المتون الشرعية المتاحة للحفظ والدراسة والتسميع في منصة متون. متون النحو والفقه والعقيدة والحديث والأصول مع الإحصائيات والشروح.',
    keywords: [
      'المتون الشرعية',
      'مكتبة المتون',
      'حفظ المتون',
      'قائمة المتون العلمية',
      'متون الفقه',
      'متون العقيدة',
      'متون الحديث',
      'متون النحو',
    ],
    path: '/books',
  });
}

export default async function BooksPage(props: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await props.searchParams;
  const initialCategory = typeof searchParams?.category === 'string' ? searchParams.category : '';

  const localBooks = getAllLocalBooks();
  let firebaseBooks: any[] = [];
  try {
    const res = await booksService.getAll({ onlyPublished: true });
    firebaseBooks = res.books;
  } catch (err) {
    console.error('Error fetching books from Firebase:', err);
  }

  const slugSet = new Set<string>();
  let allBooks: any[] = [];

  for (const book of firebaseBooks) {
    if (!slugSet.has(book.slug)) {
      slugSet.add(book.slug);
      allBooks.push(book);
    }
  }

  for (const book of localBooks) {
    if (!slugSet.has(book.slug)) {
      slugSet.add(book.slug);
      allBooks.push(book);
    }
  }

  const sanitizedBooks = JSON.parse(JSON.stringify(allBooks));

  // Schemas
  const collectionSchema = createCollectionPageSchema({
    name: 'المكتبة العلمية للمتون الشرعية',
    description: 'تصفح واحتفظ بالمتون الشرعية في مختلف العلوم الإسلامية.',
    url: getFullUrl('/books'),
    items: sanitizedBooks.map((b: any) => ({
      name: b.title,
      url: getFullUrl(`/books/${b.slug}`),
      description: b.description,
      image: b.coverImageUrl,
    })),
  });

  const breadcrumbSchema = createBreadcrumbSchema([
    { name: 'الرئيسية', url: getFullUrl('/') },
    { name: 'المكتبة العلمية للمتون', url: getFullUrl('/books') },
  ]);

  return (
    <>
      <JsonLd data={combineSchemas(collectionSchema, breadcrumbSchema)} />
      <div className="container-motoon pt-6">
        <Breadcrumb items={[{ label: 'المكتبة العلمية للمتون' }]} />
      </div>
      <BooksClientPage allBooks={sanitizedBooks} initialCategory={initialCategory} />
    </>
  );
}
