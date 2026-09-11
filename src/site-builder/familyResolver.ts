import {
  type LeadSourceContext,
  type CurrentBusinessReference,
  type DesignResearchSnapshot,
  type ResolvedDesign,
  resolvedDesignSchema,
} from './contracts/research.js';
import { businessFromSource } from './leadSource.js';
import { pilotFamilies, pilotSpecification } from './guidance/design-families/pilots.js';
import { getMarketReference, marketReferenceKey, type PilotNiche } from './guidance/niches/market.js';
import { foregroundFor } from './renderer/baseStyles.js';
import { designMarkdown } from './designPipeline.js';
import { defaultVisualVariants } from './types.js';

export interface FamilyResolverInput {
  source: LeadSourceContext;
  currentBusiness: CurrentBusinessReference;
  overrides?: { primary: string; accent: string };
  researchSnapshot?: DesignResearchSnapshot;
  now?: Date;
}

/**
 * Pure domain function: resolves visual design specification deterministically
 * based on pure inputs:
 * 1. USER_CONFIRMED: User explicit override colors
 * 2. CONFIRMED_BRAND: Current website preserved identity
 * 3. DYNAMIC_MARKET_RESEARCH: Synthesized snapshot candidates
 * 4. CURATED_PILOTS: Validated pilot families fallback
 * 5. LEGACY_DEFAULT
 */
export function resolveDesignWithResearch(input: FamilyResolverInput): ResolvedDesign {
  const now = input.now ?? new Date();
  const business = businessFromSource(input.source);
  const niche = business.derivedNiche;

  if (niche === 'other') {
    throw new Error('Este modo atende odontologia, restaurantes e barbearias. Use o gerador existente para outros nichos.');
  }

  const overrides = input.overrides;
  const snapshot = input.researchSnapshot;
  const current = input.currentBusiness;

  const hasBrandDecision = current.identity?.some(i => i.decision === 'PRESERVE') ?? false;

  let familyId: string;
  let variantName: string;
  let paletteOrigin: string;
  let primaryColor: string;
  let accentColor: string;
  let templateId: 'appointment-focused' | 'premium-service' | 'minimal-professional' = 'minimal-professional';
  let typography: 'modern' | 'editorial' = 'modern';
  let theme: 'light' | 'dark' = 'light';
  let sectionSpacing = 88;
  let compactSpacing = 56;
  let radiusCard = 8;
  let radiusCta = 8;
  let colors: readonly string[] = ['#f8fafc', '#ffffff', '#f1f5f9', '#0f172a', '#475569', '#cbd5e1'];

  // 1. User overrides (highest precedence: wins over everything)
  if (overrides) {
    const pilot = pilotFamilies[niche as PilotNiche] ?? pilotFamilies.dentistry;
    familyId = pilot.id;
    variantName = pilot.variant;
    templateId = pilot.template;
    typography = pilot.typography;
    theme = pilot.theme;
    colors = pilot.colors;
    sectionSpacing = pilot.section;
    compactSpacing = pilot.compact;
    radiusCard = pilot.radius;
    radiusCta = pilot.radius;
    primaryColor = overrides.primary;
    accentColor = overrides.accent;
    paletteOrigin = `USER_CONFIRMED: briefing do usuário (${overrides.primary}, ${overrides.accent})`;
  } else if (hasBrandDecision) {
    // 2. Confirmed / Current Business Brand (wins over market research)
    const pilot = pilotFamilies[niche as PilotNiche] ?? pilotFamilies.dentistry;
    familyId = pilot.id;
    variantName = 'brand-adapted';
    templateId = pilot.template;
    typography = pilot.typography;
    theme = pilot.theme;
    colors = pilot.colors;
    sectionSpacing = pilot.section;
    compactSpacing = pilot.compact;
    radiusCard = pilot.radius;
    radiusCta = pilot.radius;
    // Check if an explicit hex color was extracted in the brand identity elements
    const brandColorMatch = current.identity.find(i => i.decision === 'PRESERVE' && /#[0-9a-fA-F]{6}/.test(`${i.element} ${i.reason}`));
    const extractedHex = brandColorMatch ? (`${brandColorMatch.element} ${brandColorMatch.reason}`.match(/#[0-9a-fA-F]{6}/)?.[0]) : null;
    primaryColor = extractedHex ?? pilot.primary;
    accentColor = pilot.accent;
    paletteOrigin = `CONFIRMED_BRAND: identidade visual preservada de ${current.url ?? 'site do negócio'}`;
  } else if (snapshot && snapshot.candidates.length > 0 && snapshot.status === 'fresh') {
    // 3. Fresh Dynamic Market Research Snapshot
    const candidate = snapshot.candidates[0];
    familyId = candidate.id;
    variantName = candidate.variant;
    templateId = niche === 'dentistry' ? 'appointment-focused' : niche === 'restaurant' ? 'premium-service' : 'minimal-professional';
    typography = candidate.typography;
    theme = candidate.theme;
    primaryColor = candidate.primaryCandidate;
    accentColor = candidate.accentCandidate;
    radiusCard = theme === 'dark' ? 4 : 16;
    radiusCta = radiusCard;
    sectionSpacing = 96;
    compactSpacing = 56;
    colors = theme === 'dark'
      ? ['#09090b', '#18181b', '#27272a', '#fafafa', '#a1a1aa', '#3f3f46']
      : ['#fafafa', '#ffffff', '#f4f4f5', '#18181b', '#52525b', '#e4e4e7'];
    paletteOrigin = `DYNAMIC_MARKET_RESEARCH: candidato ${candidate.id} (${candidate.label}) via snapshot fresh v${snapshot.version}`;
  } else if (snapshot && snapshot.candidates.length > 0 && snapshot.status === 'stale') {
    // 4. Stale Dynamic Market Research Snapshot (Expired historical benchmark)
    const candidate = snapshot.candidates[0];
    familyId = candidate.id;
    variantName = candidate.variant;
    templateId = niche === 'dentistry' ? 'appointment-focused' : niche === 'restaurant' ? 'premium-service' : 'minimal-professional';
    typography = candidate.typography;
    theme = candidate.theme;
    primaryColor = candidate.primaryCandidate;
    accentColor = candidate.accentCandidate;
    radiusCard = theme === 'dark' ? 4 : 16;
    radiusCta = radiusCard;
    sectionSpacing = 96;
    compactSpacing = 56;
    colors = theme === 'dark'
      ? ['#09090b', '#18181b', '#27272a', '#fafafa', '#a1a1aa', '#3f3f46']
      : ['#fafafa', '#ffffff', '#f4f4f5', '#18181b', '#52525b', '#e4e4e7'];
    paletteOrigin = `DYNAMIC_MARKET_RESEARCH: candidato ${candidate.id} (${candidate.label}) via snapshot stale v${snapshot.version}`;
  } else if (pilotFamilies[niche as PilotNiche]) {
    // 5. Curated Pilot Family Fallback
    const pilot = pilotFamilies[niche as PilotNiche];
    familyId = pilot.id;
    variantName = pilot.variant;
    templateId = pilot.template;
    typography = pilot.typography;
    theme = pilot.theme;
    colors = pilot.colors;
    sectionSpacing = pilot.section;
    compactSpacing = pilot.compact;
    radiusCard = pilot.radius;
    radiusCta = pilot.radius;
    primaryColor = pilot.primary;
    accentColor = pilot.accent;
    paletteOrigin = `CURATED_PILOT: ${pilot.id}@1 (família curada de contingência)`;
  } else {
    // 6. Universal / Legacy Fallback
    familyId = 'legacy-default';
    variantName = 'default-legacy';
    templateId = 'minimal-professional';
    typography = 'modern';
    theme = 'light';
    colors = ['#f8fafc', '#ffffff', '#f1f5f9', '#0f172a', '#475569', '#cbd5e1'];
    sectionSpacing = 80;
    compactSpacing = 56;
    radiusCard = 16;
    radiusCta = 12;
    primaryColor = '#0284c7';
    accentColor = '#0f766e';
    paletteOrigin = 'LEGACY_DEFAULT: fallback universal legado';
  }

  const [background, surface, surfaceElevated, text, textMuted, border] = colors;
  const specification = {
    version: 1 as const,
    family: { id: familyId, version: 1 },
    templateId,
    visual: defaultVisualVariants(templateId),
    presentation: { theme, typography, motion: 'subtle' as const },
    tokens: {
      color: {
        background,
        surface,
        surfaceElevated,
        text,
        textMuted,
        border,
        primary: primaryColor,
        accent: accentColor,
        primaryForeground: foregroundFor(primaryColor),
        accentForeground: foregroundFor(accentColor),
      },
      typography,
      motion: 'subtle' as const,
      spacing: { section: sectionSpacing, sectionCompact: compactSpacing },
      radius: { card: radiusCard, cta: radiusCta },
    },
  };

  const composition = niche === 'dentistry'
    ? ['hero', 'services', 'about', 'location', 'contact'] as const
    : niche === 'barbershop'
    ? ['hero', 'services', 'about', 'contact', 'location'] as const
    : ['hero', 'about', 'services', 'contact', 'location'] as const;

  const conversionStrategy = niche === 'dentistry'
    ? 'Facilitar contato para consultar atendimento; não prometer agendamento confirmado.'
    : niche === 'barbershop'
    ? 'Facilitar contato para agendamentos e horários; destacar corte de cabelo e barba.'
    : 'Facilitar contato para consultar reservas; não simular disponibilidade.';

  const imageryDirection = niche === 'dentistry'
    ? 'Fase C: imagens autorizadas do negócio; nenhuma equipe, instalação ou resultado clínico inventado.'
    : niche === 'barbershop'
    ? 'Fase C: fotografias de cortes reais e ambiente com iluminação direcional; ferramentas e produtos autorizados.'
    : 'Fase C: fotografias autorizadas de pratos e ambiente; ilustrações devem ser identificadas.';

  const preservedBrandElements = overrides
    ? ['Paleta explicitamente escolhida no briefing; cores de texto calculadas para contraste.']
    : hasBrandDecision
    ? ['Identidade observada no site do cliente preservada provisoriamente.']
    : ['Identidade existente não confirmada: direção provisória, sem substituir logo ou alegar branding oficial.'];

  const marketBrief = getMarketReference(niche as PilotNiche, now);

  const direction = {
    version: 1 as const,
    mode: 'standard' as const,
    referenceBrief: {
      version: 1 as const,
      business,
      currentBusiness: current,
      market: marketBrief,
      marketKey: marketReferenceKey(niche as PilotNiche),
      opportunities: current.opportunities,
      ...(snapshot ? { researchSnapshot: snapshot } : {}),
    },
    specification,
    variant: variantName,
    resolution: {
      status: 'resolved' as const,
      reason: `Direção Standard resolvida por ${paletteOrigin}. Não equivale a aprovação humana ou visualização no Stitch.`,
      resolvedAt: now.toISOString(),
    },
    composition: [...composition],
    conversionStrategy,
    imageryDirection,
    responsiveBehavior: 'Desktop 1440: composição da família. Tablet 768 e mobile 390: colunas empilhadas, CTA acessível, sem rolagem horizontal; movimento reduzido respeitado.',
    preservedBrandElements,
    trace: [
      { decision: 'Nome, contatos e localização', origin: `Lead ${input.source.source}; dados ausentes omitidos` },
      { decision: 'Nicho', origin: 'Classificação derivada de categoria/nicho persistidos' },
      { decision: 'Composição e CTA', origin: `${niche}-market-v1 + Guidance` },
      { decision: 'Paleta e tipografia', origin: paletteOrigin },
    ],
    designMarkdown: '',
  };

  const parsed = resolvedDesignSchema.parse(direction);
  parsed.designMarkdown = designMarkdown(parsed);
  return parsed;
}
