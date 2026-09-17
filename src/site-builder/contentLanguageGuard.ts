/**
 * Language guard to ensure that hardcoded or leaked English strings from the 
 * underlying generation model (e.g. Gemini via Stitch) do not make it into the final Brazilian Portuguese UI.
 */

const BLACKLISTED_TERMS = [
  'FAST BOOK', 'BOOK NOW', 'LEARN MORE', 'CONTACT US', 'ABOUT US',
  'READ MORE', 'SERVICES', 'OUR SERVICES', 'GET STARTED',
];

export function isLeakedEnglishContent(text: string): boolean {
  if (!text) return false;
  const normalized = text.toUpperCase();
  return BLACKLISTED_TERMS.some(term => normalized.includes(term));
}

export function sanitizePtBr(text: string, fallback: string): string {
  if (!text) return fallback;
  if (isLeakedEnglishContent(text)) {
    return fallback;
  }
  return text;
}
