import { designSpecificationSchema } from '../../contracts/index.js';
import { defaultVisualVariants } from '../../types.js';
import { foregroundFor } from '../../renderer/baseStyles.js';
import type { PilotNiche } from '../niches/market.js';

export const pilotFamilies = {
  dentistry: { id: 'health-trust', version: 1, variant: 'minimal-clinical', template: 'appointment-focused', primary: '#194f50', accent: '#dcece6', typography: 'modern', theme: 'light',
    colors: ['#f7faf8', '#ffffff', '#eaf2ee', '#183332', '#425e58', '#829b91'], section: 88, compact: 56, radius: 20 },
  restaurant: { id: 'hospitality-editorial', version: 1, variant: 'editorial-dining', template: 'premium-service', primary: '#422a21', accent: '#e7b777', typography: 'editorial', theme: 'dark',
    colors: ['#1e1915', '#29221c', '#352b22', '#fcf3e4', '#d4c2ad', '#8e7961'], section: 104, compact: 64, radius: 2 },
  barbershop: { id: 'heritage-craft', version: 1, variant: 'classic-heritage', template: 'minimal-professional', primary: '#1c1917', accent: '#d97706', typography: 'modern', theme: 'dark',
    colors: ['#0c0a09', '#1c1917', '#292524', '#f5f5f4', '#a8a29e', '#44403c'], section: 96, compact: 56, radius: 4 },
} as const;
export function pilotSpecification(niche: PilotNiche, overrides?: { primary: string; accent: string }) {
  const f = pilotFamilies[niche];
  const [background, surface, surfaceElevated, text, textMuted, border] = f.colors;
  const primary = overrides?.primary ?? f.primary, accent = overrides?.accent ?? f.accent;
  return designSpecificationSchema.parse({
    version: 1, family: { id: f.id, version: f.version }, templateId: f.template,
    visual: defaultVisualVariants(f.template),
    presentation: { theme: f.theme, typography: f.typography, motion: 'subtle' },
    tokens: { color: { background, surface, surfaceElevated, text, textMuted, border, primary, accent,
      primaryForeground: foregroundFor(primary), accentForeground: foregroundFor(accent) },
      typography: f.typography, motion: 'subtle', spacing: { section: f.section, sectionCompact: f.compact }, radius: { card: f.radius, cta: f.radius } },
  });
}
