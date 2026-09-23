import { stitchAppearanceSchema } from '../../../src/site-builder/contracts/stitchAppearance.js';
import type { StitchRawVariant } from '../types.js';

/** SDK output projection. Missing or wrong-device screens are not generated candidates. */
export function extractStitchScreen(response: any, projectId: string, deviceType: string): StitchRawVariant {
  const screens = (response?.outputComponents ?? []).flatMap((component: any) => component?.design?.screens ?? []);
  const screen = screens.find((item: any) => item.deviceType === deviceType);
  const prefix = `projects/${projectId}/screens/`;
  if (!screen || typeof screen.name !== 'string' || !screen.name.startsWith(prefix)) {
    if (process.env.NODE_ENV !== 'production') console.warn('[StitchScreenEnvelope]', { expectedDevice: deviceType, screenCount: screens.length, deviceMatched: Boolean(screen), projectMatched: Boolean(screen?.name?.startsWith(prefix)) });
    throw new Error('STITCH_SCREEN_IDENTITY_INVALID');
  }
  const screenId = screen.name.slice(prefix.length);
  if (!/^[a-zA-Z0-9_-]+$/.test(screenId)) throw new Error('STITCH_SCREEN_IDENTITY_INVALID');
  return {
    id: screenId, screenId, projectId,
    projectUrl: `https://stitch.google.com/projects/${projectId}`,
    screenshotUrl: screen.screenshot?.downloadUrl,
    htmlDownloadUrl: screen.htmlCode?.downloadUrl,
  };
}

/** Only literal hex color data crosses this boundary; remote scripts are never evaluated. */
export function extractStitchColors(html: string): string[] {
  const block = html.match(/["']?colors["']?\s*:\s*(\{[^{}]*\})/);
  if (!block) return [];
  try {
    const colors: unknown = JSON.parse(block[1]);
    if (!colors || typeof colors !== 'object' || Array.isArray(colors)) return [];
    return Object.entries(colors).filter(([key, value]) => /^[a-z-]{1,60}$/.test(key) && typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value))
      .map(([key, value]) => `${key}:${value}`);
  } catch { return []; }
}

export async function readStitchVisuals(downloadUrl: unknown): Promise<Partial<StitchRawVariant>> {
  if (typeof downloadUrl !== 'string') return {};
  const url = new URL(downloadUrl);
  if (url.protocol !== 'https:' || url.username || url.password || url.port || url.hostname !== 'contribution.usercontent.google.com') {
    throw new Error('STITCH_DOWNLOAD_REFERENCE_INVALID');
  }
  const response = await fetch(url, { redirect: 'error', signal: AbortSignal.timeout(30000) });
  if (!response.ok || !response.body) throw new Error('STITCH_DESIGN_DOWNLOAD_UNAVAILABLE');
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    while (true) {
      const next = await reader.read();
      if (next.done) break;
      length += next.value.length;
      if (length > 2_000_000) throw new Error('STITCH_DESIGN_TOO_LARGE');
      chunks.push(next.value);
    }
  } finally { await reader.cancel(); }
  return extractStitchVisuals(Buffer.concat(chunks).toString('utf8'));
}

export async function readStitchColors(downloadUrl: unknown) {
  return (await readStitchVisuals(downloadUrl)).colorSignals ?? [];
}

/** Parse a JSON literal member with balanced braces; never evaluate provider code. */
function literalBlock(html: string, key: string): Record<string, unknown> {
  const match = new RegExp('["\']?' + key + '["\']?\\s*:\\s*\\{').exec(html);
  if (!match) return {};
  const start = match.index + match[0].length - 1;
  let depth = 0, quoted = false, escape = false;
  for (let i = start; i < Math.min(html.length, start + 20000); i++) {
    const ch = html[i];
    if (quoted) { if (escape) escape = false; else if (ch === '\\') escape = true; else if (ch === '"') quoted = false; continue; }
    if (ch === '"') quoted = true;
    else if (ch === '{') depth++;
    else if (ch === '}' && --depth === 0) {
      try { return JSON.parse(html.slice(start, i + 1)); } catch { return {}; }
    }
  }
  return {};
}
function pixels(value: unknown, min: number, max: number) {
  if (Array.isArray(value)) value = value[0];
  if (typeof value !== 'string') return undefined;
  const match = /^(\d+(?:\.\d+)?)(px|rem)$/.exec(value);
  const n = match ? Number(match[1]) * (match[2] === 'rem' ? 16 : 1) : NaN;
  return Number.isFinite(n) && n >= min && n <= max ? n : undefined;
}
export function extractStitchVisuals(html: string): Partial<StitchRawVariant> {
  const families = literalBlock(html, 'fontFamily');
  const sizes = literalBlock(html, 'fontSize');
  const spacing = literalBlock(html, 'spacing');
  const radius = literalBlock(html, 'borderRadius');
  const h1 = /<h1\b[^>]*class=["']([^"']*)["']/i.exec(html)?.[1] ?? '';
  const fontKey = /(?:^|\s)font-([a-z-]+)/.exec(h1)?.[1];
  const sizeKey = /(?:^|\s)text-([a-z-]+)/.exec(h1)?.[1];
  const font = (value: unknown) => { const v = Array.isArray(value) ? value[0] : value; return typeof v === 'string' && /^[A-Za-z][A-Za-z0-9 ]{0,79}$/.test(v) ? v : undefined; };
  const headingFont = font(families[fontKey ?? '']) ?? font(families.display) ?? font(families.headline);
  const bodyFont = font(families.body) ?? font(families['body-md']) ?? font(families.sans);
  const sections = [...html.matchAll(/<section\b[^>]*>([\s\S]*?)<\/section>/gi)];
  const hero = sections.find(s => /<h1\b/i.test(s[1]))?.[0] ?? '';
  const heroClass = /^<section\b[^>]*class=["']([^"']*)["']/i.exec(hero)?.[1] ?? '';
  // Map only layouts supported by the renderer. Unknown compositions remain explicitly unmeasured.
  const heroLayout = /(?:grid-cols-2|flex-row)/.test(hero) ? 'split' as const
    : /text-center/.test(heroClass) ? 'minimal' as const
    : /(?:absolute[^>]*|background-image:)/.test(hero) && /(?:<img|background-image:)/.test(hero) ? 'full-bleed' as const : undefined;
  const spaceKey = /(?:^|[\s"'])py-([a-z-]+)/.exec(sections[1]?.[0].split('>')[0] ?? '')?.[1];
  const sectionAliases: Record<string, string> = { hero: 'hero', inicio: 'hero', about: 'about', sobre: 'about', services: 'services', servicos: 'services', contact: 'contact', contato: 'contact', location: 'location', localizacao: 'location' };
  const sectionOrder = sections.flatMap(section => {
    if (/<h1\b/i.test(section[1])) return ['hero'];
    const id = /\bid=["']([a-z-]+)["']/i.exec(section[0].split('>')[0])?.[1];
    return id && sectionAliases[id] ? [sectionAliases[id]] : [];
  });
  const appearance = stitchAppearanceSchema.parse({ version: 1, headingFont, bodyFont,
    heroSize: pixels(sizes[sizeKey ?? ''], 24, 120), sectionSpace: pixels(spacing[spaceKey ?? ''], 0, 160),
    radius: pixels(radius.DEFAULT, 0, 64), heroLayout,
    imageryPresent: /<img\b|background-image\s*:/i.test(html),
    limitations: ['Composição adaptada ao catálogo de seções; fidelidade visual requer revisão.', 'Imagens da referência não são assets licenciados do projeto.'],
  });
  return { appearance, sectionOrder, colorSignals: extractStitchColors(html), heroPattern: heroLayout,
    typographySignals: [headingFont, bodyFont].filter((v): v is string => Boolean(v)),
    layoutPatterns: heroLayout ? [heroLayout] : [], spacingSignals: appearance.sectionSpace === undefined ? [] : [`section:${appearance.sectionSpace}px`] };
}
