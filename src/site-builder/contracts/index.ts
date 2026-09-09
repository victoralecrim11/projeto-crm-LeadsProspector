import { z } from "zod";
import { contextSchema, templates, visualSchema, blueprintV2Schema, sectionIds } from "../types.js";

const label = z.string().trim().min(1).max(180);
const description = z.string().trim().min(1).max(1600);
const hex = z.string().regex(/^#[\da-fA-F]{6}$/);
const id = z.string().regex(/^[a-z][a-z0-9-]{0,79}$/);

// Sidecar contracts: no new required fields in persisted Blueprint v1/v2.
export const businessContextSchema = z.object({
  version: z.literal(1),
  lead: contextSchema,
  // Only user-confirmed additions. Absence is not inferred from category.
  confirmed: z.object({
    niche: label.optional(), subNiche: label.optional(),
    audience: description.optional(), positioning: description.optional(),
  }).strict(),
}).strict();

// URL syntax is validated here; network authorization belongs to the future adapter.
const referenceUrl = z.string().url().max(2048).refine((value) => {
  const url = new URL(value);
  return url.protocol === "https:" && !url.username && !url.password;
}, "Referências devem usar HTTPS sem credenciais.");
export const referenceBriefSchema = z.object({
  version: z.literal(1), id, niche: label,
  researchedAt: z.iso.datetime(),
  references: z.array(z.object({ url: referenceUrl, reason: description }).strict()).min(1).max(12),
  patterns: z.array(description).min(1).max(20),
  avoid: z.array(description).max(20),
}).strict();

// Deliberately limited to decisions already represented by the current styles.
export const designTokensSchema = z.object({
  color: z.object({
    background: hex, surface: hex, surfaceElevated: hex,
    text: hex, textMuted: hex, border: hex,
    primary: hex, accent: hex, primaryForeground: hex, accentForeground: hex,
  }).strict(),
  typography: z.enum(["modern", "editorial"]),
  typographyProfile: z.object({
    headingFamily: z.enum(["rubik", "nunito-sans", "inter", "manrope", "playfair-display", "source-serif"]),
    bodyFamily: z.enum(["rubik", "nunito-sans", "inter", "manrope", "playfair-display", "source-serif"]),
    headingFallback: label, bodyFallback: label, source: z.enum(["system", "google-font"]),
  }).strict().optional(),
  spacing: z.object({ section: z.number().int().min(0).max(160), sectionCompact: z.number().int().min(0).max(160) }).strict(),
  radius: z.object({ card: z.number().int().min(0).max(64), cta: z.number().int().min(0).max(64) }).strict(),
  motion: z.enum(["none", "subtle"]),
}).strict();
export const designSpecificationSchema = z.object({
  version: z.literal(1),
  family: z.object({ id, version: z.number().int().positive() }).strict(),
  templateId: z.enum(templates), visual: visualSchema,
  presentation: blueprintV2Schema.shape.presentation.unwrap(),
  tokens: designTokensSchema,
}).strict().refine((value) => value.tokens.typography === value.presentation.typography && value.tokens.motion === value.presentation.motion,
  "Tokens e apresentação devem representar a mesma decisão.");

export const designSystemContractSchema = z.object({
  version: z.literal(1),
  productContext: z.object({ niche: label, businessType: label, goal: description }).strict(),
  visualStyle: z.object({ family: id, variant: label, principles: z.array(description).min(1).max(12) }).strict(),
  color: designTokensSchema.shape.color,
  typography: z.object({
    strategy: z.enum(["modern", "editorial"]), headingFamily: label, bodyFamily: label,
    headingFallback: label, bodyFallback: label, source: z.enum(["system", "google-font"]),
    typographyProfile: designTokensSchema.shape.typographyProfile,
  }).strict(),
  spacing: designTokensSchema.shape.spacing,
  radius: designTokensSchema.shape.radius,
  shadow: z.object({ level: z.enum(["none", "subtle", "soft"]) }).strict(),
  container: z.object({ maxWidth: z.number().int().min(640).max(1600), sectionGap: z.number().int().min(0).max(160) }).strict(),
  motion: z.object({ preference: z.enum(["none", "subtle"]), reducedMotion: z.literal(true) }).strict(),
  accessibility: z.object({ contrast: z.literal("AA"), visibleFocus: z.literal(true), semanticLandmarks: z.literal(true) }).strict(),
  responsive: z.object({ mobile: description, desktop: description }).strict(),
  implementation: z.object({ templates: z.array(z.enum(templates)).min(1), visualVariants: visualSchema, renderer: z.literal("blueprint-v2") }).strict(),
}).strict();

export const mediaPlanSchema = z.object({
  version: z.literal(1),
  // Requests only: no provider, URL or claim of generated/approved assets.
  items: z.array(z.object({
    id, section: z.enum(sectionIds), purpose: description,
    sourcePreference: z.enum(["business", "client", "licensed", "generated-illustration"]),
    aspectRatio: z.enum(["1:1", "4:3", "3:4", "16:9"]),
    decorative: z.boolean(), alt: z.string().trim().max(300),
  }).strict().refine((item) => item.decorative ? item.alt === "" : item.alt.length > 0,
    "Mídia decorativa usa alt vazio; mídia informativa exige descrição.")).max(20),
}).strict().refine((value) => new Set(value.items.map((item) => item.id)).size === value.items.length,
  "IDs de mídia devem ser únicos.");

export type BusinessContext = z.infer<typeof businessContextSchema>;
export type ReferenceBrief = z.infer<typeof referenceBriefSchema>;
export type DesignTokens = z.infer<typeof designTokensSchema>;
export type DesignSpecification = z.infer<typeof designSpecificationSchema>;
export type DesignSystemContract = z.infer<typeof designSystemContractSchema>;
export type MediaPlan = z.infer<typeof mediaPlanSchema>;
