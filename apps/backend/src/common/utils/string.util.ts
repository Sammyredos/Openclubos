/**
 * Converts a string into proper Title Case for tournament and event names.
 * Corrects all-caps user entries (e.g. "MICCOM CLASSIC 2026" -> "Miccom Classic 2026")
 * while preserving standard golf acronyms, Roman numerals, and handling apostrophes/hyphens.
 */

const PRESERVED_ACRONYMS = new Set([
  'PGA',
  'USGA',
  'LPGA',
  'GHIN',
  'WHS',
  'DP',
  'OWGR',
  'UK',
  'USA',
  'USD',
  'NGN',
  'EUR',
  'GBP',
  'R&A',
]);

const ROMAN_NUMERALS = new Set([
  'I',
  'II',
  'III',
  'IV',
  'V',
  'VI',
  'VII',
  'VIII',
  'IX',
  'X',
  'XI',
  'XII',
  'XIII',
  'XIV',
  'XV',
  'XVI',
  'XVII',
  'XVIII',
  'XIX',
  'XX',
]);

const MINOR_WORDS = new Set([
  'a',
  'an',
  'the',
  'and',
  'but',
  'or',
  'nor',
  'for',
  'yet',
  'so',
  'at',
  'by',
  'in',
  'of',
  'on',
  'to',
  'up',
  'via',
  'with',
]);

function capitalizeSingleWord(word: string): string {
  if (!word) return '';

  const upper = word.toUpperCase();
  if (PRESERVED_ACRONYMS.has(upper)) return upper;
  if (ROMAN_NUMERALS.has(upper)) return upper;

  // Handle ordinals like 1st, 2nd, 3rd, 4th, 150th
  const ordinalMatch = word.match(/^(\d+)(st|nd|rd|th)$/i);
  if (ordinalMatch) {
    return `${ordinalMatch[1]}${ordinalMatch[2].toLowerCase()}`;
  }

  // Handle words with apostrophes like President's, Men's, O'Connor
  if (word.includes("'")) {
    return word
      .split("'")
      .map((part, index) => {
        if (index === 0) {
          return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
        }
        // If single letter like 's
        if (part.length === 1 && part.toLowerCase() === 's') {
          return 's';
        }
        return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
      })
      .join("'");
  }

  // Handle hyphenated words like Mid-Amateur, Four-Ball
  if (word.includes('-')) {
    return word
      .split('-')
      .map((part) => capitalizeSingleWord(part))
      .join('-');
  }

  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

export function toTitleCase(input?: string | null): string {
  if (!input) return '';
  const trimmed = input.trim();
  if (!trimmed) return '';

  const words = trimmed.split(/\s+/);
  const total = words.length;

  return words
    .map((word, index) => {
      // First and last words are always capitalized
      const lower = word.toLowerCase();
      if (index > 0 && index < total - 1 && MINOR_WORDS.has(lower)) {
        return lower;
      }
      return capitalizeSingleWord(word);
    })
    .join(' ');
}
