import { NextResponse } from 'next/server';
import { getLocalBookBySlug } from '@/lib/data';

/**
 * API route to fetch local book data (books stored in JSON files).
 * This is needed because the local book loading uses `fs` which only works server-side.
 * Client components call this endpoint to get local book data.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const decodedSlug = decodeURIComponent(slug);
  
  const localData = getLocalBookBySlug(decodedSlug);
  
  if (!localData) {
    return NextResponse.json(
      { error: 'Local book not found' },
      { status: 404 }
    );
  }

  // Serialize the book and verses (strip any non-plain objects)
  return NextResponse.json({
    book: JSON.parse(JSON.stringify(localData.book)),
    verses: JSON.parse(JSON.stringify(localData.verses)),
  });
}
