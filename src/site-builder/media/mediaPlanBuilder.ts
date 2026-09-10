import type { GeneratedSiteBlueprint, LeadSiteContext } from '../types.js';
import type { MediaPlan } from '../contracts/index.js';
import { mediaPlanSchema } from '../contracts/index.js';
import type { ResolvedDesign } from '../contracts/research.js';
import type { Project } from '../../types.js';

/**
 * Sections eligible for stock photography auto-resolution.
 * These are conceptual/illustrative slots where licensed imagery is appropriate.
 */
const GENERIC_ILLUSTRATIVE_SECTIONS = new Set(['hero', 'about']);

/**
 * Determines whether a media plan item is eligible for automatic stock resolution.
 *
 * AUTO-RESOLVE allowed for generic/illustrative slots:
 * - hero conceitual, ambiente genérico, serviço genérico, gastronomia genérica, etc.
 *
 * AUTO-RESOLVE prohibited for:
 * - equipe real, fachada real, proprietário, produto específico, antes/depois,
 *   resultado clínico, certificado, depoimento, instalações específicas.
 */
export function isLicensedAutoResolveEligible(
  item: MediaPlan['items'][number],
): boolean {
  return item.sourcePreference === 'licensed';
}

/**
 * Aspect ratio per section slot.
 */
function defaultAspectRatio(section: string): '16:9' | '4:3' | '1:1' {
  if (section === 'hero') return '16:9';
  if (section === 'about') return '4:3';
  return '4:3';
}

/**
 * Imagery purpose per section, contextualized by niche.
 */
function sectionPurpose(
  section: string,
  niche: string,
  imageryDirection?: string,
): string {
  const nicheLabel =
    niche === 'dentistry'
      ? 'clínica odontológica'
      : niche === 'restaurant'
        ? 'restaurante'
        : niche === 'barbershop'
          ? 'barbearia'
          : niche;

  const directionSuffix = imageryDirection
    ? ` Direção visual: ${imageryDirection.slice(0, 200)}.`
    : '';

  const purposes: Record<string, string> = {
    hero: `Fotografia de ambientação ilustrativa para o topo da página de ${nicheLabel}.${directionSuffix}`,
    about: `Imagem ilustrativa do espaço ou serviço para a seção sobre de ${nicheLabel}.${directionSuffix}`,
  };

  return purposes[section] || `Imagem ilustrativa para a seção ${section} de ${nicheLabel}.${directionSuffix}`;
}

/**
 * Alt text per section — decorative sections use empty alt.
 */
function sectionAlt(section: string, niche: string, decorative: boolean): string {
  if (decorative) return '';

  const nicheLabel =
    niche === 'dentistry'
      ? 'clínica odontológica'
      : niche === 'restaurant'
        ? 'ambiente gastronômico'
        : niche === 'barbershop'
          ? 'barbearia'
          : niche;

  const alts: Record<string, string> = {
    hero: `Ambiente acolhedor e profissional de ${nicheLabel}`,
    about: `Detalhes do espaço e atendimento de ${nicheLabel}`,
  };

  return alts[section] || `Imagem ilustrativa de ${nicheLabel}`;
}

export interface BuildMediaPlanOptions {
  blueprint: GeneratedSiteBlueprint;
  design?: ResolvedDesign;
  niche: string;
  subNiche?: string;
  imageryDirection?: string;
}

/**
 * Builds a deterministic MediaPlan from Blueprint sections.
 * Does NOT require LLM. Uses only sections actually present in the blueprint.
 */
export function buildMediaPlan({
  blueprint,
  design,
  niche,
  subNiche,
  imageryDirection: imageryDir,
}: BuildMediaPlanOptions): MediaPlan {
  const imageryDirection = imageryDir ?? design?.imageryDirection;
  const items: MediaPlan['items'] = [];

  const activeSections = blueprint.sectionOrder.filter(
    (s) => blueprint.sections[s] && GENERIC_ILLUSTRATIVE_SECTIONS.has(s),
  );

  for (const section of activeSections) {
    const isHeroFullBleed = section === 'hero' && blueprint.visual.hero === 'full-bleed';
    const decorative = isHeroFullBleed; // full-bleed overlay is decorative

    items.push({
      id: `media-${section}`,
      section: section as MediaPlan['items'][number]['section'],
      purpose: sectionPurpose(section, niche, imageryDirection),
      sourcePreference: GENERIC_ILLUSTRATIVE_SECTIONS.has(section) ? 'licensed' : 'business',
      aspectRatio: defaultAspectRatio(section),
      decorative,
      alt: sectionAlt(section, niche, decorative),
    });
  }

  const plan: MediaPlan = { version: 1, items };
  return mediaPlanSchema.parse(plan);
}

/**
 * Derives a default MediaPlan for legacy projects that don't have one.
 * Does NOT modify the project's blueprint.
 */
export function deriveDefaultMediaPlan(project: Project): MediaPlan | undefined {
  if (!project.siteBlueprint || !project.siteContext) return undefined;

  const niche = project.category?.toLowerCase() || 'business';
  const subNiche = undefined;
  const imageryDirection = project.siteDesign?.imageryDirection;

  return buildMediaPlan({
    blueprint: project.siteBlueprint,
    design: project.siteDesign,
    niche,
    subNiche,
    imageryDirection,
  });
}
