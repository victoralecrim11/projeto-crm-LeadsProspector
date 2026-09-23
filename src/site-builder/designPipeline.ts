import { applyStitchVisualEvidence } from './stitchVisualEvidence.js';
import { blueprintSchema, type GeneratedSiteBlueprint } from './types.js';
import { contactAvailable } from './context.js';
import { resolvedDesignSchema, type LeadSourceContext, type CurrentBusinessReference, type ResolvedDesign, type DesignResearchSnapshot, type DesignCandidate } from './contracts/research.js';
import { businessFromSource } from './leadSource.js';
import { getMarketReference, marketReferenceKey } from './guidance/niches/market.js';
import { pilotFamilies, pilotSpecification } from './guidance/design-families/pilots.js';
import { foregroundFor } from './renderer/baseStyles.js';
import { designSystemContractSchema, type DesignSystemContract } from './contracts/index.js';
import { resolveDesignWithResearch } from './familyResolver.js';
export { resolveDesignWithResearch };

export function resolveStandardDesign(
  source: LeadSourceContext,
  currentBusiness: CurrentBusinessReference,
  overrides?: { primary: string; accent: string },
  now = new Date(),
  researchSnapshot?: DesignResearchSnapshot
): ResolvedDesign {
  return resolveDesignWithResearch({
    source,
    currentBusiness,
    overrides,
    now,
    researchSnapshot,
  });
}
export function designMarkdown(d: ResolvedDesign) {
  const s = d.specification, t = s.tokens;
  const sections: Record<string, string> = {
    Purpose: d.conversionStrategy,
    'Brand Personality': `${s.family.id} / ${d.variant}; direção de design, não característica confirmada do negócio.`,
    'Visual Principles': d.referenceBrief.market.patterns.join('\n- '),
    'Brand Elements to Preserve': d.preservedBrandElements.join('\n'),
    Colors: Object.entries(t.color).map(([k,v]) => `${k}: ${v}`).join('\n'),
    Typography: d.stitch?.appearance?.mobile.headingFont ? `${d.stitch.appearance.mobile.headingFont} nos títulos; ${d.stitch.appearance.mobile.bodyFont || 'fonte de sistema'} no corpo (Google Fonts quando disponível).` : t.typography === 'editorial' ? 'Georgia nos títulos; Segoe UI/system-ui no corpo.' : 'Segoe UI/system-ui; títulos claros e leitura confortável.',
    Spacing: `Seções ${t.spacing.section}px; compacto ${t.spacing.sectionCompact}px.`,
    Radius: `Cards ${t.radius.card}px; botões ${t.radius.cta}px.`, Shadows: 'Sombra discreta nos controles; sem profundidade decorativa excessiva.',
    Layout: d.composition.join(' → '), Grid: 'Contêiner fluido; máximo 1200px; empilhar abaixo de 800px.',
    Hero: s.visual.hero, Cards: s.visual.services, Navigation: 'Links apenas para seções presentes; skip link.',
    Buttons: 'Contato confirmado no lead; rótulos não simulam conclusão de reserva.', Forms: 'Sem formulário sem backend. Usar canais de contato disponíveis.',
    Imagery: d.imageryDirection, Motion: `${t.motion}; respeitar prefers-reduced-motion.`,
    Responsive: d.responsiveBehavior, Accessibility: 'Contraste AA para textos; foco visível; landmarks semânticos; não depender apenas de cor.',
    'Patterns to Avoid': d.referenceBrief.market.avoid.join('\n- '),
    Provenance: d.trace.map(x => `${x.decision}: ${x.origin}`).join('\n'),
  };
  return `# DESIGN.md\n\nFamília ${s.family.id} v${s.family.version}; resolução ${d.resolution.resolvedAt}.\n\n` + Object.entries(sections).map(([k,v]) => `## ${k}\n\n${v}\n`).join('\n');
}
export function buildDesignSystemContract(d: ResolvedDesign): DesignSystemContract {
  const s = resolvedDesignSchema.parse(d), tokens = s.specification.tokens;
  return designSystemContractSchema.parse({
    version: 1,
    productContext: { niche: s.referenceBrief.business.derivedNiche, businessType: s.referenceBrief.business.businessType, goal: s.conversionStrategy },
    visualStyle: { family: s.specification.family.id, variant: s.variant, principles: s.referenceBrief.market.patterns.slice(0, 12) },
    color: tokens.color,
    typography: { strategy: tokens.typography, headingFamily: d.stitch?.appearance?.mobile.headingFont || (tokens.typography === 'editorial' ? 'playfair-display' : 'manrope'), bodyFamily: d.stitch?.appearance?.mobile.bodyFont || 'nunito-sans', headingFallback: 'Georgia, serif', bodyFallback: 'system-ui, sans-serif', source: d.stitch?.appearance?.mobile.headingFont ? 'google-font' : 'system', typographyProfile: tokens.typographyProfile },
    spacing: tokens.spacing, radius: tokens.radius,
    shadow: { level: tokens.radius.card > 8 ? 'soft' : 'subtle' },
    container: { maxWidth: 1200, sectionGap: tokens.spacing.section },
    motion: { preference: tokens.motion, reducedMotion: true },
    accessibility: { contrast: 'AA', visibleFocus: true, semanticLandmarks: true },
    responsive: { mobile: s.responsiveBehavior, desktop: `Composição ${s.composition.join(' -> ')}; contêiner máximo 1200px.` },
    implementation: { templates: [s.specification.templateId], visualVariants: s.specification.visual, renderer: 'blueprint-v2' },
  });
}
export function designSystemMarkdown(contract: DesignSystemContract) {
  return `# Design System Contract\n\n${Object.entries(contract).map(([key, value]) => `## ${key}\n\n${typeof value === 'string' ? value : '```json\n' + JSON.stringify(value, null, 2) + '\n```'}\n`).join('\n')}`;
}
// Content is deterministic: unknown services, proof, hours, staff and prices stay absent.
export function blueprintFromDesign(input: ResolvedDesign): GeneratedSiteBlueprint {
  const d = resolvedDesignSchema.parse(input), c = d.referenceBrief.business.lead, s = d.specification;
  const hasContact = contactAvailable(c);
  return blueprintSchema.parse({
    version: 2, templateId: s.templateId, visual: s.visual, presentation: s.presentation,
    brand: { primaryColor: s.tokens.color.primary, accentColor: s.tokens.color.accent, tone: 'profissional' },
    seo: { title: c.business.name, description: `${c.business.category} · ${c.business.city}` },
    hero: { headline: c.business.name, subtitle: `${c.business.category} em ${c.business.city}`, ctaText: hasContact ? 'Entre em contato' : '', ctaType: hasContact ? 'contact' : 'none' },
    about: { title: c.business.category, description: [c.business.neighborhood, c.business.city].filter(Boolean).join(' · ') },
    services: [], sections: { hero: true, about: true, services: false, contact: hasContact, location: Boolean(c.contact.address), testimonials: false },
    sectionOrder: d.composition, warnings: ['Revise os dados do lead. Serviços, equipe, avaliações e horários ausentes não foram inventados.'],
  });
}



export function resolvePremiumSelection(base: ResolvedDesign, evidence: NonNullable<ResolvedDesign['stitch']>, candidate?: DesignCandidate): ResolvedDesign {
  if (!evidence.alternatives.includes(evidence.selected)) throw new Error('A direção deve pertencer à exploração revisada.');
  const d = resolvedDesignSchema.parse({ ...base, mode: 'premium', stitch: evidence });
  d.variant = evidence.selected;
  
  let originStr = `Stitch: ${evidence.projectUrl || 'mcp-fallback'}; seleção ${evidence.selected}. Mapeamento para componentes suportados; copy externa não importada.`;
  if (candidate) {
    originStr = `Stitch MCP Candidate: ${candidate.candidateId}; strategy: ${candidate.strategyId}. Diversidade Estrutural aplicada.`;
    if (candidate.sectionOrder && candidate.sectionOrder.length === 5) {
      d.composition = candidate.sectionOrder;
    }
  }

  d.resolution = { status: 'resolved', resolvedAt: new Date().toISOString(), reason: evidence.review };
  d.trace.push({ decision: 'Direção visual Premium', origin: originStr });
  d.designMarkdown = designMarkdown(d);
  return resolvedDesignSchema.parse(d);
}

import type { ResponsiveDesignResolution } from './responsiveResolution.js';

export function resolvePremiumSelectionResponsive(
  base: ResolvedDesign,
  evidence: NonNullable<ResolvedDesign['stitch']>,
  resolution: ResponsiveDesignResolution,
  now = new Date()
): ResolvedDesign {
  const d = resolvedDesignSchema.parse({ ...base, mode: 'premium', stitch: evidence });
  d.variant = evidence.selected;
  
  const candidate = resolution.effectiveCandidate;
  const companion = resolution.desktopCompanion;
  applyStitchVisualEvidence(d, candidate);
  if (d.stitch?.appearance && companion?.appearance) d.stitch.appearance.desktop = companion.appearance;
  
  let originStr = `Responsive Resolution: ${resolution.status}. Mobile Winner: ${candidate.candidateId}`;
  if (companion) originStr += ` + Desktop Companion: ${companion.candidateId}`;

  if (candidate.sectionOrder && candidate.sectionOrder.length === 5) {
    d.composition = candidate.sectionOrder;
  }

  d.resolution = { status: 'resolved', resolvedAt: now.toISOString(), reason: evidence.review };
  d.trace.push({ decision: 'Direção visual Premium Responsiva', origin: originStr });
  
  // NOTE: This does NOT mutate base. It returns a new ResolvedDesign matching the schema.
  d.designMarkdown = designMarkdown(d);
  return resolvedDesignSchema.parse(d);
}

