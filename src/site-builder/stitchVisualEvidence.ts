import type { DesignCandidate, ResolvedDesign } from './contracts/research.js';
import { foregroundFor } from './renderer/baseStyles.js';

/** Apply explicit provider color roles; unrelated signal prose is not interpreted as CSS. */
export function applyStitchVisualEvidence(design: ResolvedDesign, candidate: DesignCandidate): void {
  const colors = new Map(candidate.colorSignals.flatMap(signal => {
    const match = /^([a-z-]+):(#[a-f0-9]{6})$/i.exec(signal);
    return match ? [[match[1], match[2]] as const] : [];
  }));
  if (candidate.appearance) {
    const a = candidate.appearance;
    if (design.stitch) design.stitch.appearance = { mobile: a };
    if (a.heroLayout) design.specification.visual.hero = a.heroLayout;
    if (a.radius !== undefined) design.specification.tokens.radius = { card: Math.round(a.radius), cta: Math.round(a.radius) };
    if (a.sectionSpace !== undefined) design.specification.tokens.spacing = { section: Math.round(a.sectionSpace), sectionCompact: Math.round(a.sectionSpace) };
  }
  const tokens = design.specification.tokens.color;
  const roles = {
    background: 'background', surface: 'surface', surfaceElevated: 'surface-container-high',
    text: 'on-surface', textMuted: 'on-surface-variant', border: 'outline-variant',
    primary: 'primary', accent: 'secondary', primaryForeground: 'on-primary', accentForeground: 'on-secondary',
  } as const;
  for (const [target, source] of Object.entries(roles)) {
    const value = colors.get(source);
    if (value) tokens[target as keyof typeof tokens] = value;
  }
  if (colors.has('primary') && !colors.has('on-primary')) tokens.primaryForeground = foregroundFor(tokens.primary);
  if (colors.has('secondary') && !colors.has('on-secondary')) tokens.accentForeground = foregroundFor(tokens.accent);
  if (colors.has('background')) design.specification.presentation.theme = foregroundFor(tokens.background) === '#ffffff' ? 'dark' : 'light';
}
