import { z } from 'zod';

// Literal, bounded visual values only. No HTML, CSS rules, scripts or asset claims.
export const stitchAppearanceSchema = z.object({
  version: z.literal(1),
  headingFont: z.string().regex(/^[A-Za-z][A-Za-z0-9 ]{0,79}$/).optional(),
  bodyFont: z.string().regex(/^[A-Za-z][A-Za-z0-9 ]{0,79}$/).optional(),
  heroSize: z.number().min(24).max(120).optional(),
  sectionSpace: z.number().min(0).max(160).optional(),
  radius: z.number().min(0).max(64).optional(),
  heroLayout: z.enum(['split', 'full-bleed', 'minimal']).optional(),
  imageryPresent: z.boolean(),
  limitations: z.array(z.string().max(180)).max(8),
}).strict();
export type StitchAppearance = z.infer<typeof stitchAppearanceSchema>;
