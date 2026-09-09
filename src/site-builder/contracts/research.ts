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
  derivedNiche: z.enum(['dentistry', 'restaurant', 'other']),
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
export const combinedReferenceBriefSchema = z.object({
  version: z.literal(1), business: sourcedBusinessContextSchema,
  currentBusiness: currentBusinessReferenceSchema,
  market: referenceBriefSchema,
  marketKey: text, opportunities: z.array(text),
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
