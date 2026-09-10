import { sanitizeCssContent } from './safeCss.js';

export interface ExtractedColor {
  hex: string;
  uses: number;
  contexts: string[];
}

export interface ExtractedTypography {
  headingFonts: string[];
  bodyFonts: string[];
  googleFonts: string[];
}

export interface ExtractedLayout {
  theme: 'light' | 'dark' | 'mixed';
  hero: 'full-bleed' | 'split' | 'centered' | 'minimal';
  services: 'list' | 'cards' | 'editorial' | 'grid';
  navigation: 'inline' | 'centered' | 'sticky' | 'minimal';
  density: 'airy' | 'balanced' | 'compact';
  shape: 'sharp' | 'soft' | 'pill-heavy';
}

export interface DesignAnalysisResult {
  colors: ExtractedColor[];
  typography: ExtractedTypography;
  layout: ExtractedLayout;
  confidence: number;
  limitations: string[];
}

// Helpers for color conversion
function hslToHex(h: number, s: number, l: number): string {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;
  if (0 <= h && h < 60) { r = c; g = x; b = 0; }
  else if (60 <= h && h < 120) { r = x; g = c; b = 0; }
  else if (120 <= h && h < 180) { r = 0; g = c; b = x; }
  else if (180 <= h && h < 240) { r = 0; g = x; b = c; }
  else if (240 <= h && h < 300) { r = x; g = 0; b = c; }
  else if (300 <= h && h < 360) { r = c; g = 0; b = x; }
  const toHex = (n: number) => Math.round((n + m) * 255).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toLowerCase();
}

function normalizeHex(input: string): string | null {
  const clean = input.trim().toLowerCase().replace(/^#/, '');
  if (clean.length === 3) {
    return `#${clean[0]}${clean[0]}${clean[1]}${clean[1]}${clean[2]}${clean[2]}`;
  }
  if (clean.length === 6) {
    return `#${clean}`;
  }
  if (clean.length === 8) {
    // 8-digit hex with alpha: if alpha is near zero, discard; otherwise return RGB part
    const alpha = parseInt(clean.slice(6, 8), 16);
    if (alpha < 20) return null;
    return `#${clean.slice(0, 6)}`;
  }
  return null;
}

function rgbToHex(r: number, g: number, b: number): string | null {
  if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) return null;
  const clamp = (n: number) => Math.max(0, Math.min(255, Math.round(n)));
  const toHex = (n: number) => clamp(n).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toLowerCase();
}

export function extractColorsFromText(cssText: string, defaultContext = 'general'): Map<string, { uses: number; contexts: Set<string> }> {
  const colorMap = new Map<string, { uses: number; contexts: Set<string> }>();

  const register = (hex: string | null, ctx: string) => {
    if (!hex) return;
    const lower = hex.toLowerCase();
    // Exclude full white and full black from dominating brand evidence if arbitrary, but keep them tracked
    const existing = colorMap.get(lower) ?? { uses: 0, contexts: new Set<string>() };
    existing.uses++;
    existing.contexts.add(ctx);
    colorMap.set(lower, existing);
  };

  // 1. Hex colors
  const hexRegex = /#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/g;
  let match: RegExpExecArray | null;
  while ((match = hexRegex.exec(cssText)) !== null) {
    const startIdx = Math.max(0, match.index - 40);
    const preceding = cssText.slice(startIdx, match.index).toLowerCase();
    let ctx = defaultContext;
    if (/background|bg-/.test(preceding)) ctx = 'background';
    else if (/border/.test(preceding)) ctx = 'border';
    else if (/color/.test(preceding)) ctx = 'text';
    if (/button|btn|cta/.test(preceding)) ctx = 'button';

    const normalized = normalizeHex(match[0]);
    register(normalized, ctx);
  }

  // 2. rgb / rgba
  const rgbRegex = /rgba?\s*\(\s*(\d{1,3})\s*[,\s]\s*(\d{1,3})\s*[,\s]\s*(\d{1,3})(?:\s*[/,]\s*([\d.]+))?\s*\)/gi;
  while ((match = rgbRegex.exec(cssText)) !== null) {
    const alpha = match[4] !== undefined ? parseFloat(match[4]) : 1;
    if (alpha > 0.1) {
      const hex = rgbToHex(parseInt(match[1], 10), parseInt(match[2], 10), parseInt(match[3], 10));
      register(hex, defaultContext);
    }
  }

  // 3. hsl / hsla
  const hslRegex = /hsla?\s*\(\s*(\d{1,3})\s*[,\s]\s*(\d{1,3})%\s*[,\s]\s*(\d{1,3})%(?:\s*[/,]\s*([\d.]+))?\s*\)/gi;
  while ((match = hslRegex.exec(cssText)) !== null) {
    const alpha = match[4] !== undefined ? parseFloat(match[4]) : 1;
    if (alpha > 0.1) {
      const h = parseInt(match[1], 10);
      const s = parseInt(match[2], 10) / 100;
      const l = parseInt(match[3], 10) / 100;
      register(hslToHex(h, s, l), defaultContext);
    }
  }

  return colorMap;
}

export function analyzeReferenceDesign(htmlContent: string): DesignAnalysisResult {
  const limitations: string[] = [
    'Análise determinística estática sem execução de JavaScript; estilos dinâmicos de runtime não foram avaliados.',
  ];

  // Sanitize: strip script, template, noscript
  const cleanHtml = htmlContent.replace(/<(script|template|noscript)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, '');

  // Extract <style> contents and inline style attributes, passed through safe CSS policy
  const styleBlocks: string[] = [];
  for (const m of cleanHtml.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)) {
    styleBlocks.push(sanitizeCssContent(m[1]));
  }
  for (const m of cleanHtml.matchAll(/style\s*=\s*["']([^"']+)["']/gi)) {
    styleBlocks.push(sanitizeCssContent(m[1]));
  }

  // meta theme-color
  const themeColorMatch = cleanHtml.match(/<meta\b[^>]*name\s*=\s*["']theme-color["'][^>]*content\s*=\s*["']([^"']+)["']/i);
  if (themeColorMatch) {
    styleBlocks.push(`--theme-color: ${themeColorMatch[1]};`);
  }

  const combinedCss = styleBlocks.join('\n');

  // Color Extraction
  const colorMap = extractColorsFromText(combinedCss);
  const colors: ExtractedColor[] = Array.from(colorMap.entries())
    .map(([hex, data]) => ({
      hex,
      uses: data.uses,
      contexts: Array.from(data.contexts),
    }))
    .sort((a, b) => b.uses - a.uses)
    .slice(0, 15);

  // Typography Extraction
  const headingFonts = new Set<string>();
  const bodyFonts = new Set<string>();
  const googleFonts = new Set<string>();

  // Detect Google Fonts link
  for (const m of cleanHtml.matchAll(/fonts\.googleapis\.com\/css2?\?family=([^"'>\s&]+)/gi)) {
    const rawFamilies = decodeURIComponent(m[1]).split('&family=');
    for (const raw of rawFamilies) {
      const name = raw.split(':')[0].replace(/\+/g, ' ').trim();
      if (name) googleFonts.add(name);
    }
  }

  // Extract font-family from CSS
  for (const m of combinedCss.matchAll(/font-family\s*:\s*([^;!}]+)/gi)) {
    const val = m[1].replace(/!important/g, '').trim();
    const primary = val.split(',')[0].replace(/['"]/g, '').trim();
    if (primary && !/^(inherit|initial|unset|system-ui)$/i.test(primary)) {
      if (/display|playfair|merriweather|cormorant|serif|cinzel|lora/i.test(primary)) {
        headingFonts.add(primary);
      } else {
        bodyFonts.add(primary);
      }
    }
  }

  // Fallback defaults if no font-family was explicitly matched
  if (headingFonts.size === 0 && googleFonts.size > 0) {
    headingFonts.add(Array.from(googleFonts)[0]);
  }
  if (bodyFonts.size === 0 && googleFonts.size > 1) {
    bodyFonts.add(Array.from(googleFonts)[1]);
  }

  // Layout & Theme Classification
  const darkEvidence = (combinedCss.match(/#1[0-9a-f]{5}|#0[0-9a-f]{5}|#2[0-9a-f]{5}|rgb\(\s*[0-3]\d/gi) ?? []).length;
  const lightEvidence = (combinedCss.match(/#f[0-9a-f]{5}|#e[0-9a-f]{5}|rgb\(\s*2[45]\d/gi) ?? []).length;
  const theme: ExtractedLayout['theme'] =
    darkEvidence > lightEvidence * 1.5 ? 'dark' : lightEvidence > darkEvidence * 1.5 ? 'light' : 'mixed';

  // Hero classification
  let hero: ExtractedLayout['hero'] = 'full-bleed';
  if (/split|grid-cols-2|columns-2/i.test(cleanHtml)) hero = 'split';
  else if (/text-center|justify-center|items-center/i.test(cleanHtml) && cleanHtml.includes('<h1')) hero = 'centered';
  else if (!/<img\b[^>]*hero/i.test(cleanHtml) && !cleanHtml.includes('background-image')) hero = 'minimal';

  // Services layout
  let services: ExtractedLayout['services'] = 'cards';
  if (/table|tabular|<ul\b[^>]*services/i.test(cleanHtml)) services = 'list';
  else if (/editorial|asymmetric/i.test(cleanHtml)) services = 'editorial';
  else if (/grid-cols-3|grid-cols-4/i.test(cleanHtml)) services = 'grid';

  // Navigation
  let navigation: ExtractedLayout['navigation'] = 'inline';
  if (/sticky|fixed/i.test(combinedCss)) navigation = 'sticky';
  else if (/justify-center|nav-center/i.test(cleanHtml)) navigation = 'centered';

  // Density & Shape
  const radiusMatches = combinedCss.match(/border-radius\s*:\s*(\d+)px/gi);
  let shape: ExtractedLayout['shape'] = 'soft';
  if (radiusMatches) {
    const avgRadius = radiusMatches
      .map(r => parseInt(r.replace(/\D/g, ''), 10))
      .filter(n => !Number.isNaN(n));
    const mean = avgRadius.length > 0 ? avgRadius.reduce((a, b) => a + b, 0) / avgRadius.length : 8;
    if (mean <= 4) shape = 'sharp';
    else if (mean > 20) shape = 'pill-heavy';
    else shape = 'soft';
  }

  // Confidence calculation
  let score = 0.5;
  if (colors.length >= 3) score += 0.2;
  if (headingFonts.size > 0 || googleFonts.size > 0) score += 0.15;
  if (cleanHtml.includes('<h1') && cleanHtml.includes('<nav')) score += 0.15;
  const confidence = Math.min(0.95, Math.max(0.2, Math.round(score * 100) / 100));

  return {
    colors,
    typography: {
      headingFonts: Array.from(headingFonts).slice(0, 5),
      bodyFonts: Array.from(bodyFonts).slice(0, 5),
      googleFonts: Array.from(googleFonts).slice(0, 5),
    },
    layout: {
      theme,
      hero,
      services,
      navigation,
      density: 'balanced',
      shape,
    },
    confidence,
    limitations,
  };
}
