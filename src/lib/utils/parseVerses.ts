import { ParsedVerse } from '@/types';
import { normalizeArabicText } from './normalizeArabic';

/**
 * Parses raw text into an array of structured verses.
 * 
 * Steps:
 * 1. Split raw text by newline characters (handles both Windows \r\n and Unix \n)
 * 2. Trim whitespace from each line
 * 3. Filter out empty lines
 * 4. Index verses starting from 1
 * 5. Compute normalizedText for each verse
 * 
 * @param raw The raw text input containing verses separated by newlines
 * @returns An array of ParsedVerse objects
 */
export function parseVerses(raw: string): ParsedVerse[] {
  if (!raw) return [];

  return raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line, index) => ({
      text: line,
      normalizedText: normalizeArabicText(line),
      order: index + 1,
    }));
}
