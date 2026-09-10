import { blueprintSchema, type GeneratedSiteBlueprint } from './types.js';
import { contactAvailable } from './context.js';
import { resolvedDesignSchema, type LeadSourceContext, type CurrentBusinessReference, type ResolvedDesign, type DesignResearchSnapshot } from './contracts/research.js';
import { businessFromSource } from './leadSource.js';
import { getMarketReference, marketReferenceKey } from './guidance/niches/market.js';
import { pilotFamilies, pilotSpecification } from './guidance/design-families/pilots.js';
import { foregroundFor } from './renderer/baseStyles.js';
import { designSystemContractSchema, type DesignSystemContract } from './contracts/index.js';
export { resolveDesignWithResearch } from './familyResolver.js';

export function resolveStandardDesign(source: LeadSourceContext, currentBusiness: CurrentBusinessReference,
  overrides?: { primary: string; accent: string }, now = new Date(), researchSnapshot?: DesignResearchSnapshot): ResolvedDesign {
  const business = businessFromSource(source);
  const niche = business.derivedNiche;
  if (niche === 'other') throw new Error('Este modo atende odontologia, restaurantes e barbearias. Use o gerador existente para outros nichos.');
  const candidate = !overrides && researchSnapshot?.candidates?.length ? researchSnapshot.candidates[0] : null;
  const specification = candidate
    ? {
        ...pilotSpecification(niche, { primary: candidate.primaryCandidate, accent: candidate.accentCandidate }),
        family: { id: candidate.id, version: 1 },
      }
    : pilotSpecification(niche, overrides);
  const composition = niche === 'dentistry'
    ? ['hero', 'services', 'about', 'location', 'contact'] as const
    : niche === 'barbershop'
    ? ['hero', 'services', 'about', 'contact', 'location'] as const
    : ['hero', 'about', 'services', 'contact', 'location'] as const;
  const variant = candidate?.variant ?? pilotFamilies[niche].variant;
  const paletteOrigin = overrides
    ? `${specification.family.id}@1 + briefing do usuário`
    : candidate
    ? `dynamic-research:${candidate.id}@1`
    : `${specification.family.id}@1`;
  const conversionStrategy = niche === 'dentistry'
    ? 'Facilitar contato para consultar atendimento; não prometer agendamento confirmado.'
    : niche === 'barbershop'
    ? 'Facilitar contato para agendamentos e horários; destacar corte de cabelo e barba.'
    : 'Facilitar contato para consultar reservas; não simular disponibilidade.';
  const imageryDirection = niche === 'dentistry'
    ? 'Fase C: imagens autorizadas do negócio; nenhuma equipe, instalação ou resultado clínico inventado.'
    : niche === 'barbershop'
    ? 'Fase C: fotografias de cortes reais e ambiente da barbearia com iluminação direcional; ferramentas e produtos autorizados.'
    : 'Fase C: fotografias autorizadas de pratos e ambiente; ilustrações devem ser identificadas.';
  const direction = {
    version: 1, mode: 'standard',
    referenceBrief: { version: 1, business, currentBusiness, market: getMarketReference(niche, now), marketKey: marketReferenceKey(niche), opportunities: currentBusiness.opportunities, ...(researchSnapshot ? { researchSnapshot } : {}) },
    specification, variant,
    resolution: { status: 'resolved', reason: 'Direção Standard resolvida pelas regras da família pesquisada. Não equivale a aprovação humana ou visualização no Stitch.', resolvedAt: now.toISOString() },
    composition: [...composition],
    conversionStrategy,
    imageryDirection,
    responsiveBehavior: 'Desktop 1440: composição da família. Tablet 768 e mobile 390: colunas empilhadas, CTA acessível, sem rolagem horizontal; movimento reduzido respeitado.',
    preservedBrandElements: overrides ? ['Paleta explicitamente escolhida no briefing; cores de texto calculadas para contraste.'] : ['Identidade existente não confirmada: direção provisória, sem substituir logo ou alegar branding oficial.'],
    trace: [ { decision: 'Nome, contatos e localização', origin: `Lead ${source.source}; dados ausentes omitidos` },
      { decision: 'Nicho', origin: 'Classificação derivada de categoria/nicho persistidos' },
      { decision: 'Composição e CTA', origin: `${niche}-market-v1 + Guidance` },
      { decision: 'Paleta e tipografia', origin: paletteOrigin } ],
    designMarkdown: '',
  };
  const parsed = resolvedDesignSchema.parse(direction);
  parsed.designMarkdown = designMarkdown(parsed);
  return parsed;
}
export function designMarkdown(d: ResolvedDesign) {
  const s = d.specification, t = s.tokens;
  const sections: Record<string, string> = {
    Purpose: d.conversionStrategy,
    'Brand Personality': `${s.family.id} / ${d.variant}; direção de design, não característica confirmada do negócio.`,
    'Visual Principles': d.referenceBrief.market.patterns.join('\n- '),
    'Brand Elements to Preserve': d.preservedBrandElements.join('\n'),
    Colors: Object.entries(t.color).map(([k,v]) => `${k}: ${v}`).join('\n'),
    Typography: t.typography === 'editorial' ? 'Georgia nos títulos; Segoe UI/system-ui no corpo.' : 'Segoe UI/system-ui; títulos claros e leitura confortável.',
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
    typography: { strategy: tokens.typography, headingFamily: tokens.typography === 'editorial' ? 'playfair-display' : 'manrope', bodyFamily: 'nunito-sans', headingFallback: 'Georgia, serif', bodyFallback: 'system-ui, sans-serif', source: 'system', typographyProfile: tokens.typographyProfile },
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

// Editor changes are explicit user decisions; keep the specification and export coherent.
export function designForBlueprint(input: ResolvedDesign, blueprint: GeneratedSiteBlueprint): ResolvedDesign {
  const d = resolvedDesignSchema.parse(input);
  const s = d.specification;
  const changed = s.templateId !== blueprint.templateId || JSON.stringify(s.visual) !== JSON.stringify(blueprint.visual)
    || JSON.stringify(s.presentation) !== JSON.stringify(blueprint.presentation ?? s.presentation)
    || s.tokens.color.primary !== blueprint.brand.primaryColor || s.tokens.color.accent !== blueprint.brand.accentColor
    || JSON.stringify(d.composition) !== JSON.stringify(blueprint.sectionOrder);
  if (!changed) return d;
  s.templateId = blueprint.templateId; s.visual = blueprint.visual; s.presentation = blueprint.presentation ?? s.presentation;
  s.tokens.typography = s.presentation.typography; s.tokens.motion = s.presentation.motion;
  s.tokens.color.primary = blueprint.brand.primaryColor; s.tokens.color.accent = blueprint.brand.accentColor;
  s.tokens.color.primaryForeground = foregroundFor(blueprint.brand.primaryColor); s.tokens.color.accentForeground = foregroundFor(blueprint.brand.accentColor);
  d.composition = blueprint.sectionOrder;
  d.variant = 'user-edited';
  if (!d.trace.some(t => t.origin === 'USER_CONFIRMED: editor')) d.trace.push({ decision: 'Composição, variantes e paleta editadas', origin: 'USER_CONFIRMED: editor' });
  d.designMarkdown = designMarkdown(d);
  return resolvedDesignSchema.parse(d);
}

export function resolvePremiumSelection(base: ResolvedDesign, evidence: NonNullable<ResolvedDesign['stitch']>): ResolvedDesign {
  if (!evidence.alternatives.includes(evidence.selected)) throw new Error('A direção deve pertencer à exploração revisada.');
  const d = resolvedDesignSchema.parse({ ...base, mode: 'premium', stitch: evidence });
  d.variant = evidence.selected;
  d.resolution = { status: 'resolved', resolvedAt: new Date().toISOString(), reason: evidence.review };
  d.trace.push({ decision: 'Direção visual Premium', origin: `Stitch: ${evidence.projectUrl}; seleção ${evidence.selected}. Mapeamento para componentes suportados; copy externa não importada.` });
  d.designMarkdown = designMarkdown(d);
  return resolvedDesignSchema.parse(d);
}
