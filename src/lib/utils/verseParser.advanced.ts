import { AdvancedParsedVerse } from '@/types';
import { normalizeArabicText } from './normalizeArabic';

export interface ParseAdvancedOptions {
  /**
   * If true, merges consecutive non-empty lines as couplets.
   * Line 1 = Sadr (first hemistich), Line 2 = Ajez (second hemistich).
   */
  mergeConsecutive?: boolean;

  /**
   * String or regular expression separator to split a single line into couplets.
   * Commonly used separators: '*', '|', '---', '\t', or multiple spaces.
   */
  separator?: string | RegExp;

  /**
   * Delimiter to use when joining the Sadr and Ajez into the final verse `text` field.
   * Defaults to " | ".
   */
  joinSeparator?: string;
}

/**
 * Parses raw text into structured verses supporting advanced couplet (hemistich) merging.
 * Designed for classical Arabic poetry (Metred verses composed of Sadr and Ajez).
 * 
 * @param raw The raw text input containing verses or hemistichs.
 * @param options Configuration options for parsing and merging couplets.
 * @returns An array of AdvancedParsedVerse objects.
 */
export function parseVersesAdvanced(
  raw: string,
  options: ParseAdvancedOptions = {}
): AdvancedParsedVerse[] {
  if (!raw) return [];

  const joinSeparator = options.joinSeparator ?? ' | ';

  // Get trimmed, non-empty lines
  const lines = raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (options.mergeConsecutive) {
    const verses: AdvancedParsedVerse[] = [];
    let order = 1;

    for (let i = 0; i < lines.length; i += 2) {
      const sadr = lines[i];
      const ajez = i + 1 < lines.length ? lines[i + 1] : '';

      const text = ajez ? `${sadr}${joinSeparator}${ajez}` : sadr;
      const normalizedText = normalizeArabicText(text);

      verses.push({
        text,
        normalizedText,
        order: order++,
        sadr,
        sadrNormalized: normalizeArabicText(sadr),
        ...(ajez
          ? {
              ajez,
              ajezNormalized: normalizeArabicText(ajez),
            }
          : {
              ajez: '',
              ajezNormalized: '',
            }),
      });
    }

    return verses;
  }

  if (options.separator) {
    return lines.map((line, index) => {
      const parts = line.split(options.separator!);
      
      let sadr = line;
      let ajez = '';

      if (parts.length > 1) {
        sadr = parts[0].trim();
        ajez = parts.slice(1).join(typeof options.separator === 'string' ? options.separator : ' ').trim();
      }

      const text = ajez ? `${sadr}${joinSeparator}${ajez}` : sadr;

      return {
        text,
        normalizedText: normalizeArabicText(text),
        order: index + 1,
        sadr,
        sadrNormalized: normalizeArabicText(sadr),
        ajez,
        ajezNormalized: normalizeArabicText(ajez),
      };
    });
  }

  // Default: Each line is treated as a single complete verse (no hemistich split)
  return lines.map((line, index) => ({
    text: line,
    normalizedText: normalizeArabicText(line),
    order: index + 1,
    sadr: line,
    sadrNormalized: normalizeArabicText(line),
    ajez: '',
    ajezNormalized: '',
  }));
}
