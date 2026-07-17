import { NextResponse } from 'next/server';
import { getAllLocalBooks } from '@/lib/data';

export async function GET() {
  try {
    const books = getAllLocalBooks();
    return NextResponse.json({ books });
  } catch (error) {
    console.error('Error fetching all local books:', error);
    return NextResponse.json({ books: [] }, { status: 500 });
  }
}
