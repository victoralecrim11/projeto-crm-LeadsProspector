import type { StitchExplorationRequest } from './types.js';
import { createHash } from 'node:crypto';

/** Concrete, mutually distinct art directions for the same abstract barbershop strategy. */
const BARBERSHOP_DIRECTIONS = [
  {
    label: 'atelier-claro',
    brief: 'Contemporary editorial atelier. Warm ivory #F3F0E8 background, ink #20262B text, cobalt #315AD3 accent. Use a bold geometric sans heading and a quiet humanist sans body; avoid serif display type. Asymmetric typography-led hero with a narrow vertical image placeholder, generous white space and thin rules. Avoid black-and-gold styling.',
  },
  {
    label: 'oficio-vintage',
    brief: 'Heritage craft editorial. Parchment #EFE4D2 background, oxblood #722E36 text/accent, deep brown #302625 details. Use a high-contrast serif headline paired with a restrained grotesk body. The hero must be one full-width image-placeholder panel with an inset text overlay, never a two-column split. Use engraved-style dividers. Avoid black-and-gold styling.',
  },
  {
    label: 'urbano-grafico',
    brief: 'Urban graphic studio. Concrete #E8E8E3 background, charcoal #242629 text and electric lime #B4D455 accent. Use a heavy condensed sans headline and neutral sans body, no serif. Create a single typographic poster hero with offset blocks and no two-column split; follow with a strong grid and square cards. Avoid gold accents and generic luxury cues.',
  },
  {
    label: 'natural-contemporaneo',
    brief: 'Warm contemporary neighborhood studio. Pale sand #F4EBDD background, forest green #254D40 text and clay #BC694C accent. Use a rounded humanist sans headline and highly legible sans body, no ornate serif. Make a calm editorial split with an organic image-placeholder crop, rounded details and spacious service rows. Avoid black-and-gold styling.',
  },
  {
    label: 'monocromatico-ousado',
    brief: 'Monochrome photographic direction. Soft white #F5F5F1 background, near-black #181818 type and restrained signal red #BA3F36 accent. Use an oversized neo-grotesk sans headline with compact mono-style labels; no serif. The hero must be a single full-width image-placeholder with bold overlaid typography, never a two-column split; then use an editorial list instead of repeated cards. Avoid gold accents.',
  },
  {
    label: 'noturno-industrial',
    brief: 'Night industrial workshop. Midnight navy #142636 background, chalk #F0EEE8 text and cool teal #5BC0B0 accent. Use a squared techno sans headline and clean sans body; no serif. Build a split hero with one dramatic image-placeholder panel, visible grid lines and utilitarian service rows. Avoid warm gold and the conventional black salon template.',
  },
] as const;

/** A bounded index avoids sending raw IDs or a phone-like numeric hash to Stitch. */
export function creativeDirectionOffset(requestId: string): number {
  return createHash('sha256').update(requestId).digest().readUInt32BE(0) % BARBERSHOP_DIRECTIONS.length;
}

export function barbershopDirectionForVariant(request: StitchExplorationRequest, variantIndex: number) {
  if (request.niche !== 'barbershop' || request.referenceScreenId) return undefined;
  const offset = request.creativeDirectionOffset ?? 0;
  return BARBERSHOP_DIRECTIONS[(offset + variantIndex) % BARBERSHOP_DIRECTIONS.length];
}
