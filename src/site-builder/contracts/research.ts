import { z } from 'zod';
import { businessContextSchema, designSpecificationSchema, referenceBriefSchema } from './index.js';
import { contextSchema, sectionIds } from '../types.js';

const text = z.string().trim().max(1600);
export const provenanceSchema = z.enum(['CONFIRMED_FROM_LEAD', 'FOUND_ON_BUSINESS_WEBSITE', 'DERIVED', 'INFERRED', 'MARKET_REFERENCE', 'USER_CONFIRMED']);
export const leadSourceContextSchema = z.object({
  leadId: z.string().min(1).max(160),
  source: z.enum(['overpass', 'manual', 'import', 'other']),
  context: contextSchema,
  state: z.string().max(180),
  niche: z.string().max(180),
  osmElement: z.string().regex(/^(node|way|relation)\/\d+$/).optional(),
}).strict();
export type LeadSourceContext = z.infer<typeof leadSourceContextSchema>;
export const sourcedFactSchema = z.object({ value: text, provenance: provenanceSchema, verified: z.boolean(), evidence: text }).strict();
export const sourcedBusinessContextSchema = businessContextSchema.extend({
  source: leadSourceContextSchema,
  businessType: z.literal('local-business'),
  derivedNiche: z.enum(['dentistry', 'restaurant', 'barbershop', 'other']),
  facts: z.record(z.string(), sourcedFactSchema),
}).strict();
export type SourcedBusinessContext = z.infer<typeof sourcedBusinessContextSchema>;
export const currentBusinessReferenceSchema = z.object({
  kind: z.literal('current-business'),
  status: z.enum(['absent', 'audited', 'blocked', 'failed']),
  url: z.string().max(2048).optional(), auditedAt: z.iso.datetime(),
  method: z.literal('bounded-static-html'),
  observations: z.array(sourcedFactSchema).max(40),
  structure: z.array(text).max(30),
  identity: z.array(z.object({ element: text, decision: z.enum(['PRESERVE', 'ADAPT', 'REPLACE', 'UNKNOWN']), reason: text }).strict()).max(12),
  technicalProblems: z.array(text), visualProblems: z.array(text), conversionProblems: z.array(text), contentProblems: z.array(text), accessibilityProblems: z.array(text),
  opportunities: z.array(text), limitations: z.array(text),
}).strict();
export type CurrentBusinessReference = z.infer<typeof currentBusinessReferenceSchema>;

export const designResearchSourceSchema = z.object({
  url: z.string().url().max(2048).refine(v => {
    try {
      return new URL(v).protocol === 'https:';
    } catch {
      return false;
    }
  }, 'Referências devem usar HTTPS.'),
  title: text,
  searchProvider: z.enum(['searxng', 'brave', 'curated', 'fallback']),
  retrievedAt: z.iso.datetime(),
  reason: text,
  analysisStatus: z.enum(['analyzed', 'blocked', 'failed', 'curated']),
  siteType: z.enum(['real-business', 'design-showcase', 'editorial', 'unknown']).optional(),
  confidence: z.number().min(0).max(1).optional(),
}).strict();
export type DesignResearchSource = z.infer<typeof designResearchSourceSchema>;

export const palettePatternSchema = z.object({
  dominantFamilies: z.array(text).max(10),
  contrast: z.enum(['high', 'medium', 'soft']),
  saturation: z.enum(['low', 'low-medium', 'medium', 'vibrant']),
  surfaceStrategy: z.enum(['light-clean', 'light-organic', 'dark-editorial', 'dark-bold', 'mixed']),
  sampleEvidence: z.array(z.object({
    hex: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    uses: z.number().int().nonnegative(),
    context: text,
  }).strict()).max(25),
}).strict();
export type PalettePattern = z.infer<typeof palettePatternSchema>;

export const typographyPatternSchema = z.object({
  headingStyles: z.array(z.enum(['modern-sans', 'editorial-serif', 'geometric', 'humanist', 'condensed'])).max(5),
  bodyStyles: z.array(z.enum(['modern-sans', 'neutral-sans', 'humanist-sans', 'serif'])).max(5),
  observedHeadings: z.array(text).max(10),
  observedBody: z.array(text).max(10),
  googleFonts: z.array(text).max(10),
}).strict();
export type TypographyPattern = z.infer<typeof typographyPatternSchema>;

export const layoutPatternSchema = z.object({
  hero: z.enum(['full-bleed', 'split', 'centered', 'minimal']),
  services: z.enum(['list', 'cards', 'editorial', 'grid']),
  navigation: z.enum(['inline', 'centered', 'sticky', 'minimal']),
  density: z.enum(['airy', 'balanced', 'compact']),
  shape: z.enum(['sharp', 'soft', 'pill-heavy']),
}).strict();
export type LayoutPattern = z.infer<typeof layoutPatternSchema>;

export const designFamilyCandidateSchema = z.object({
  id: z.string().regex(/^[a-z][a-z0-9-]{0,79}$/),
  label: text,
  description: text,
  variant: text,
  primaryCandidate: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  accentCandidate: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  theme: z.enum(['light', 'dark']),
  typography: z.enum(['modern', 'editorial']),
}).strict();
export type DesignFamilyCandidate = z.infer<typeof designFamilyCandidateSchema>;

export const designResearchSnapshotSchema = z.object({
  version: z.literal(1),
  niche: text,
  subNiche: text.optional(),
  researchedAt: z.iso.datetime(),
  expiresAt: z.iso.datetime(),
  status: z.enum(['fresh', 'stale', 'failed', 'fallback']),
  providerChain: z.array(text).max(10),
  queries: z.array(text).max(10),
  sources: z.array(designResearchSourceSchema).max(10),
  patterns: z.array(text).max(20),
  palettePatterns: palettePatternSchema,
  typographyPatterns: typographyPatternSchema,
  layoutPatterns: layoutPatternSchema,
  imageryPatterns: z.array(text).max(15),
  conversionPatterns: z.array(text).max(15),
  candidates: z.array(designFamilyCandidateSchema).min(1).max(8),
  avoid: z.array(text).max(20),
  confidence: z.number().min(0).max(1),
  limitations: z.array(text).max(10),
}).strict();
export type DesignResearchSnapshot = z.infer<typeof designResearchSnapshotSchema>;

export const combinedReferenceBriefSchema = z.object({
  version: z.literal(1), business: sourcedBusinessContextSchema,
  currentBusiness: currentBusinessReferenceSchema,
  market: referenceBriefSchema,
  marketKey: text, opportunities: z.array(text),
  researchSnapshot: designResearchSnapshotSchema.optional(),
}).strict();
export const resolvedDesignSchema = z.object({
  version: z.literal(1), mode: z.enum(['standard', 'premium']),
  referenceBrief: combinedReferenceBriefSchema,
  specification: designSpecificationSchema,
  variant: z.string().min(1).max(100),
  resolution: z.object({ status: z.literal('resolved'), reason: text, resolvedAt: z.iso.datetime() }).strict(),
  composition: z.array(z.enum(sectionIds)).length(5).refine(v => new Set(v).size === 5),
  conversionStrategy: text, imageryDirection: text,
  responsiveBehavior: text, preservedBrandElements: z.array(text),
  designMarkdown: z.string().max(24000),
  trace: z.array(z.object({ decision: text, origin: text }).strict()).max(30),
  stitch: z.object({ projectUrl: z.string().url().refine(v => new URL(v).origin === 'https://stitch.withgoogle.com'),
    alternatives: z.array(text).min(2).max(3), selected: text, review: text }).strict().optional(),
}).strict();
export type ResolvedDesign = z.infer<typeof resolvedDesignSchema>;
