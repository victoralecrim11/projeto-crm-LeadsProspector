import { z } from "zod";

const text = z.string().trim().max(1600);
const short = z.string().trim().max(180);
const optional = short.default("");
export const sectionIds = [
  "hero",
  "about",
  "services",
  "contact",
  "location",
] as const;
export const templates = [
  "modern-local-business",
  "premium-service",
  "minimal-professional",
  "appointment-focused",
] as const;
export const templatePreferences = ["auto", ...templates] as const;
export const tones = [
  "premium",
  "moderno",
  "minimalista",
  "acolhedor",
  "profissional",
] as const;
export const designBriefSchema = z
  .object({
    paletteMode: z
      .enum(["recommended", "custom", "imported"])
      .default("recommended"),
    primaryColor: z
      .string()
      .regex(/^#[0-9a-fA-F]{6}$/)
      .default("#153a50"),
    accentColor: z
      .string()
      .regex(/^#[0-9a-fA-F]{6}$/)
      .default("#d8aa63"),
    designSystemInput: z.string().trim().max(4000).default(""),
    motion: z.enum(["subtle", "cinematic", "none"]).default("subtle"),
    referenceNotes: z.string().trim().max(600).default(""),
  })
  .strict();
export const contextSchema = z
  .object({
    business: z.object({
      name: short.min(1),
      category: short.min(1),
      city: short.min(1),
      neighborhood: optional,
    }),
    contact: z.object({
      phone: optional,
      whatsapp: optional,
      email: optional,
      address: optional,
    }),
    onlinePresence: z.object({ hasWebsite: z.boolean(), websiteUrl: optional }),
    reputation: z.object({
      rating: z.number().min(0).max(5).nullable(),
      reviewsCount: z.number().int().nonnegative().nullable(),
    }),
  })
  .strict();
export const blueprintSchema = z
  .object({
    version: z.literal(1),
    templateId: z.enum(templates),
    seo: z.object({ title: short.min(1), description: text }),
    brand: z.object({
      primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
      accentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
      tone: z.enum(tones),
    }),
    hero: z.object({
      headline: short.min(1),
      subtitle: text,
      ctaText: short,
      ctaType: z.enum(["whatsapp", "phone", "contact", "none"]),
    }),
    about: z.object({ title: short, description: text }),
    services: z
      .array(
        z
          .object({
            title: short.min(1),
            description: text,
            price: short.optional(),
            source: z.enum(["known", "ai_suggestion"]),
          })
          .strict(),
      )
      .max(12),
    sections: z.object({
      hero: z.boolean(),
      about: z.boolean(),
      services: z.boolean(),
      contact: z.boolean(),
      location: z.boolean(),
      testimonials: z.literal(false),
    }),
    sectionOrder: z
      .array(z.enum(sectionIds))
      .length(5)
      .refine(
        (v) => new Set(v).size === 5,
        "Cada seção deve aparecer uma vez.",
      ),
    warnings: z.array(short).max(20),
  })
  .strict();
export const preferencesSchema = z
  .object({
    siteType: z
      .enum(["landing-page", "institutional"])
      .default("landing-page"),
    templateId: z.enum(templatePreferences),
    style: z.enum(tones),
    goal: z.enum(["contact", "phone", "whatsapp", "none"]),
    designBrief: designBriefSchema.optional(),
  })
  .strict();
export const selectionSchema = z
  .object({
    mode: z.enum(["auto", "fast", "quality", "premium", "local", "explicit"]),
    modelId: z.string().max(180).nullable().optional(),
  })
  .refine(
    (s) => s.mode !== "explicit" || Boolean(s.modelId),
    "Escolha um modelo.",
  );
export type LeadSiteContext = z.infer<typeof contextSchema>;
export type GeneratedSiteBlueprint = z.infer<typeof blueprintSchema>;
export type SitePreferences = z.infer<typeof preferencesSchema>;
export type DesignBrief = z.infer<typeof designBriefSchema>;
export type ModelSelection = z.infer<typeof selectionSchema>;
export type GenerationMetadata = {
  provider: string;
  model: string;
  modelId: string;
  generatedAt: string;
  blueprintVersion: number;
};
export type AiModelDefinition = {
  id: string;
  provider: "gemini" | "ollama";
  model: string;
  label: string;
  description: string;
  tier: "fast" | "quality" | "premium" | "local";
  capabilities: { structuredOutput: boolean; coding: boolean; vision: boolean };
  enabled: boolean;
};
export const regenerationSections = [
  "headline",
  "about",
  "cta",
  "services",
  "tone",
] as const;
export type RegenerationSection = (typeof regenerationSections)[number];
