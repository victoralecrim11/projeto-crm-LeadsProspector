import { z } from 'zod';
import { sectionIds, templates, tones, visualSchema } from '../types';

export const siteUserOverridesSchema = z.object({
  brand: z.object({
    primaryColor: z.string().optional(),
    accentColor: z.string().optional(),
    tone: z.enum(tones).optional(),
  }).optional(),
  visual: visualSchema.partial().optional(),
  presentation: z.object({
    theme: z.enum(['light', 'dark']).optional(),
    typography: z.enum(['modern', 'editorial']).optional(),
    motion: z.enum(['none', 'subtle']).optional(),
  }).optional(),
  templateId: z.enum(templates).optional(),
  sectionOrder: z.array(z.enum(sectionIds)).optional(),
  sectionVisibility: z.record(z.enum(sectionIds), z.boolean()).optional(),
  content: z.object({
    hero: z.object({
      headline: z.string().optional(),
      subtitle: z.string().optional(),
      assetId: z.string().optional(), // Referencing MediaAssetStore
    }).optional(),
    about: z.object({
      title: z.string().optional(),
      description: z.string().optional(),
      assetId: z.string().optional(),
    }).optional(),
    // Allow custom services to be entirely replaced or overridden
    services: z.array(z.object({
      id: z.string(),
      title: z.string(),
      description: z.string(),
      assetId: z.string().optional(),
    })).optional(),
  }).optional(),
}).strict();

export type SiteUserOverrides = z.infer<typeof siteUserOverridesSchema>;
