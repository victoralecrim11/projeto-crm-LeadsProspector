/**
 * D.2 Test Fixtures — Realistic Stitch raw responses for 3 niches.
 * 
 * Each niche produces 3 structurally DIVERSE variants with different
 * hero patterns, section orders, about/services patterns, typography,
 * and layout density. Diversity is structural, not just color.
 * 
 * These fixtures live in tests/ — they are NOT imported by production code.
 */

import type { StitchRawResult, StitchRawVariant, StitchMcpClient, StitchExplorationRequest } from '../../tools/stitch-producer/types.js';
import type { DesignStrategy } from '../../src/site-builder/contracts/research.js';
import { resolveDesignStrategy } from '../../server/services/research/designStrategy/designStrategyResolver.js';
import { resolveStandardDesign } from '../../src/site-builder/designPipeline.js';
import { normalizeLeadSource } from '../../src/site-builder/leadSource.js';
import type { Lead } from '../../src/types.js';

// ── Barbershop Fixtures ───────────────────────────────────────────

const barbershopVariants: StitchRawVariant[] = [
  {
    id: 'barber-editorial-split',
    heroPattern: 'split',
    aboutPattern: 'story',
    servicePattern: 'horizontal',
    layoutPatterns: ['image-led', 'editorial-grid'],
    sectionOrder: ['hero', 'services', 'about', 'contact', 'location'],
    typographySignals: ['editorial', 'condensed-headings', 'strong-weight'],
    colorSignals: ['dark-surface', 'warm-accent', 'high-contrast'],
    spacingSignals: ['generous-section', 'tight-cards'],
    imageryDirection: 'Directional lighting, craft tools, raw textures',
    motionSignals: ['moderate', 'parallax-hero'],
    responsiveSignals: ['mobile-first', 'stack-at-768'],
  },
  {
    id: 'barber-bold-fullbleed',
    heroPattern: 'full-bleed',
    aboutPattern: 'image-left',
    servicePattern: 'cards',
    layoutPatterns: ['image-led', 'bold-asymmetric'],
    sectionOrder: ['hero', 'about', 'services', 'contact', 'location'],
    typographySignals: ['bold', 'uppercase-headings', 'geometric-sans'],
    colorSignals: ['dark-editorial', 'gold-accent', 'monochrome-base'],
    spacingSignals: ['compact-hero', 'spacious-content'],
    imageryDirection: 'Cinematic portraits, before/after compositions',
    motionSignals: ['moderate', 'scroll-reveal'],
    responsiveSignals: ['mobile-first', 'fluid-grid'],
  },
  {
    id: 'barber-craftsmanship-centered',
    heroPattern: 'centered',
    aboutPattern: 'craftsmanship-timeline',
    servicePattern: 'editorial',
    layoutPatterns: ['image-led', 'centered-elegant'],
    sectionOrder: ['hero', 'about', 'services', 'location', 'contact'],
    typographySignals: ['editorial', 'serif-headings', 'refined-spacing'],
    colorSignals: ['warm-neutral', 'leather-tones', 'subtle-contrast'],
    spacingSignals: ['generous-section', 'generous-cards'],
    imageryDirection: 'Heritage tools, workspace atmosphere, hand details',
    motionSignals: ['subtle', 'fade-in'],
    responsiveSignals: ['mobile-first', 'single-column-mobile'],
  },
];

// ── Dentist Fixtures ──────────────────────────────────────────────

const dentistVariants: StitchRawVariant[] = [
  {
    id: 'dentist-clean-text',
    heroPattern: 'centered',
    aboutPattern: 'trust-grid',
    servicePattern: 'icon-grid',
    layoutPatterns: ['text-led', 'clinical-hierarchy'],
    sectionOrder: ['hero', 'services', 'about', 'location', 'contact'],
    typographySignals: ['modern', 'clean-sans', 'high-readability'],
    colorSignals: ['light-clean', 'blue-primary', 'soft-accent'],
    spacingSignals: ['generous-section', 'structured-grid'],
    imageryDirection: 'Clinical environment, professional team context',
    motionSignals: ['none'],
    responsiveSignals: ['mobile-first', 'table-responsive'],
  },
  {
    id: 'dentist-minimal-split',
    heroPattern: 'split',
    aboutPattern: 'professional-credentials',
    servicePattern: 'list',
    layoutPatterns: ['text-led', 'minimal-structured'],
    sectionOrder: ['hero', 'about', 'services', 'contact', 'location'],
    typographySignals: ['modern', 'geometric-headings', 'generous-line-height'],
    colorSignals: ['white-dominant', 'teal-primary', 'neutral-accent'],
    spacingSignals: ['airy-sections', 'clear-hierarchy'],
    imageryDirection: 'Minimal, trust-oriented, facility overview only',
    motionSignals: ['none'],
    responsiveSignals: ['mobile-first', 'stack-at-768'],
  },
  {
    id: 'dentist-accessible-card',
    heroPattern: 'minimal',
    aboutPattern: 'standard',
    servicePattern: 'cards',
    layoutPatterns: ['balanced', 'accessibility-first'],
    sectionOrder: ['hero', 'services', 'about', 'contact', 'location'],
    typographySignals: ['modern', 'large-body', 'AA-contrast'],
    colorSignals: ['light-organic', 'green-primary', 'warm-neutral'],
    spacingSignals: ['spacious-touch-targets', 'clear-separation'],
    imageryDirection: 'Welcoming environment, accessibility cues',
    motionSignals: ['none'],
    responsiveSignals: ['mobile-first', 'large-touch-targets'],
  },
];

// ── Pizzeria Fixtures ─────────────────────────────────────────────

const pizzeriaVariants: StitchRawVariant[] = [
  {
    id: 'pizzeria-warm-fullbleed',
    heroPattern: 'full-bleed',
    aboutPattern: 'image-story',
    servicePattern: 'menu-cards',
    layoutPatterns: ['image-led', 'food-centric-grid'],
    sectionOrder: ['hero', 'services', 'about', 'contact', 'location'],
    typographySignals: ['expressive', 'handwritten-accent', 'warm-serif'],
    colorSignals: ['warm-palette', 'terracotta-primary', 'cream-surface'],
    spacingSignals: ['immersive-hero', 'card-grid-tight'],
    imageryDirection: 'Food photography, wood-fired oven, rustic textures',
    motionSignals: ['expressive', 'parallax-food'],
    responsiveSignals: ['mobile-first', 'swipe-gallery'],
  },
  {
    id: 'pizzeria-conversion-split',
    heroPattern: 'split',
    aboutPattern: 'tradition-narrative',
    servicePattern: 'grid',
    layoutPatterns: ['image-led', 'conversion-focused'],
    sectionOrder: ['hero', 'about', 'services', 'location', 'contact'],
    typographySignals: ['expressive', 'bold-display', 'italian-influence'],
    colorSignals: ['red-accent', 'dark-hero', 'warm-surfaces'],
    spacingSignals: ['compact-hero', 'generous-menu'],
    imageryDirection: 'Ingredient close-ups, preparation process',
    motionSignals: ['moderate', 'hover-scale'],
    responsiveSignals: ['mobile-first', 'grid-to-stack'],
  },
  {
    id: 'pizzeria-editorial-centered',
    heroPattern: 'centered',
    aboutPattern: 'founder-story',
    servicePattern: 'editorial',
    layoutPatterns: ['balanced', 'editorial-food'],
    sectionOrder: ['hero', 'about', 'services', 'contact', 'location'],
    typographySignals: ['expressive', 'editorial-serif', 'decorative-accent'],
    colorSignals: ['olive-accent', 'neutral-base', 'organic-contrast'],
    spacingSignals: ['generous-section', 'editorial-rhythm'],
    imageryDirection: 'Editorial food photography, ambient shots',
    motionSignals: ['subtle', 'scroll-reveal'],
    responsiveSignals: ['mobile-first', 'single-column-mobile'],
  },
];

// ── Fixture Stitch MCP Client ─────────────────────────────────────

function fixtureForNiche(niche: string): StitchRawVariant[] {
  if (niche === 'barbershop') return barbershopVariants;
  if (niche === 'dentistry') return dentistVariants;
  if (niche === 'restaurant') return pizzeriaVariants;
  return dentistVariants; // fallback
}

/**
 * A MockStitchMcpClient that returns fixture variants based on the niche
 * in the exploration request. This lives in tests/ — never imported by production.
 */
export class FixtureStitchMcpClient {
  public lastRequest: StitchExplorationRequest | null = null;

  async explore(request: StitchExplorationRequest): Promise<StitchRawResult> {
    this.lastRequest = request;
    const variants = fixtureForNiche(request.niche);
    return {
      status: 'ok',
      variants: variants.slice(0, request.variantCount),
    };
  }
}

/** Returns an error result. */
export class ErrorStitchMcpClient {
  constructor(private errorType: 'error' | 'timeout' | 'auth-failure' = 'error') {}

  async explore(): Promise<StitchRawResult> {
    return { status: this.errorType, variants: [], errorMessage: `Simulated ${this.errorType}` };
  }
}

/** Throws on explore() call. */
export class ThrowingStitchMcpClient {
  constructor(private message: string = 'Connection timeout') {}

  async explore(): Promise<StitchRawResult> {
    throw new Error(this.message);
  }
}

/** Returns empty variants. */
export class EmptyStitchMcpClient {
  async explore(): Promise<StitchRawResult> {
    return { status: 'ok', variants: [] };
  }
}

// ── Helper: Mock ResolvedDesign for strategy resolver ─────────────

export function getMockResolvedDesign(niche: string, subNiche: string = niche, overrides?: any) {
  const lead: Lead = { 
    id: `fictional-${niche}`, name: `Test ${niche}`,
    category: niche, niche: subNiche,
    phone: '123456789', email: 'test@test.com', city: 'Test City', state: 'EX', address: '123 Test St',
    hasWebsite: false, inCrm: false, createdAt: '2026-09-08', temperature: 'frio', score: 0,
    dataSource: 'real', osmId: '0', osmType: 'node', geoLat: 0, geoLng: 0 
  };
  
  const source = normalizeLeadSource(lead);
  const currentBusiness: any = {
    kind: 'current-business',
    status: 'absent',
    auditedAt: new Date().toISOString(),
    method: 'bounded-static-html',
    observations: [],
    structure: [],
    technicalProblems: [],
    visualProblems: [],
    conversionProblems: [],
    contentProblems: [],
    accessibilityProblems: [],
    opportunities: [],
    limitations: [],
    identity: overrides?.identity || []
  };
  
  const validOverrides = (overrides?.primary && overrides?.accent) 
    ? { primary: overrides.primary, accent: overrides.accent } 
    : undefined;
  
  return resolveStandardDesign(source, currentBusiness, validOverrides);
}

// ── Exported fixture arrays for direct inspection ─────────────────

export { barbershopVariants, dentistVariants, pizzeriaVariants };
