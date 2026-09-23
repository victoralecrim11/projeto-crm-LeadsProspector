import { SiteAiError } from '../ai/modelRegistry.js';
import { resolveSiteGenerationDesign } from './siteGenerationDesignResolver.js';
import { resolveRuntimeResponsiveDesign } from './siteGenerationResponsiveResolver.js';
import { buildDesignSystemContract, designMarkdown } from '../../../src/site-builder/designPipeline.js';
import type { LeadSourceContext, CurrentBusinessReference, DesignArtifactReference } from '../../../src/site-builder/contracts/research.js';

export interface ArtifactResolutionContext {
  generationRequestId: string;
  designProductionId: string;
  strategyId: string;
  mobileReference?: DesignArtifactReference;
  desktopReference?: DesignArtifactReference;
  createdAt: number;
  responsivePairId?: string;
}

export interface PrepareStandardAiDesignContextParams {
  generationRequestId: string;
  designProductionId: string;
  allowPreTerminal?: boolean;
  runtimeContext?: {
    source: LeadSourceContext;
    current: CurrentBusinessReference;
    overrides?: { primary: string; accent: string };
  };
}

/** Read-only replay: all identity and initial design inputs come from disk. */
export async function prepareStandardAiDesignContext(params: PrepareStandardAiDesignContextParams) {
  const { stitchDesignProductionService } = await import('./stitchProductionService.js');
  const production = await stitchDesignProductionService.loadDesignProduction(params.generationRequestId, true);
  if (!production) throw new SiteAiError('A sessão de criação do design expirou. Gere o design novamente.', 404, false, 'SITE_DESIGN_JOB_NOT_FOUND');
  if (production.generationRequestId !== params.generationRequestId || production.designProductionId !== params.designProductionId) {
    throw new SiteAiError('Os dados da sessão de design são inconsistentes.', 422, false, 'SITE_DESIGN_JOB_INVALID');
  }
  if (params.runtimeContext && production.leadId !== params.runtimeContext.source.leadId) {
    throw new SiteAiError('O design não pertence a este negócio.', 403, false, 'SITE_DESIGN_JOB_INVALID');
  }
  if (!params.allowPreTerminal && !['PAIRED', 'PARTIAL'].includes(production.status)) {
    throw new SiteAiError('O design ainda não está disponível para finalizar o site.', 409, false, 'SITE_DESIGN_NOT_READY');
  }
  if (Date.now() > (production.terminalAt ?? production.createdAt) + 60 * 60 * 1000) {
    throw new SiteAiError('A sessão de design expirou.', 422, false, 'SITE_DESIGN_ARTIFACT_STALE');
  }
  const input = production.preparationInput;
  if (!input || input.source.leadId !== production.leadId) {
    throw new SiteAiError('Os dados persistidos do design estão incompletos. Gere um novo design.', 422, false, 'SITE_DESIGN_JOB_INVALID');
  }
  if (!production.mobileReference) throw new SiteAiError('A referência principal do design está ausente.', 422, false, 'SITE_DESIGN_REF_MISSING');
  for (const [role, ref] of [['mob', production.mobileReference], ['desk', production.desktopReference]] as const) {
    if (!ref) continue;
    if (ref.strategyId !== production.strategyId) throw new SiteAiError('As referências do design são inconsistentes.', 422, false, 'SITE_DESIGN_STRATEGY_MISMATCH');
    if (ref.projectId !== production.leadId || ref.requestId !== `${production.generationRequestId}-${role}` || ref.source !== 'stitch') {
      throw new SiteAiError('As referências não pertencem a esta produção.', 422, false, 'SITE_DESIGN_ARTIFACT_MISMATCH');
    }
  }
  const artifactContext: ArtifactResolutionContext = {
    generationRequestId: production.generationRequestId, designProductionId: production.designProductionId,
    strategyId: production.strategyId, mobileReference: production.mobileReference,
    desktopReference: production.desktopReference, createdAt: production.createdAt,
    responsivePairId: production.responsivePairId,
  };
  const designResult = await resolveSiteGenerationDesign(input.source, input.current, undefined, production.mobileReference, true, artifactContext);
  const anchors = { mobile: production.mobileReference, desktop: production.desktopReference };
  let responsive;
  try {
    responsive = await resolveRuntimeResponsiveDesign(designResult.resolvedDesign, anchors, undefined, artifactContext);
  } catch (error) {
    if (error instanceof SiteAiError) throw error;
    throw new SiteAiError('Não foi possível validar a estrutura do design.', 422, false, 'SITE_DESIGN_CONTRACT_INVALID');
  }
  const finalDesign = responsive.resolvedDesign;
  if (!finalDesign.stitch?.alternatives.length) throw new SiteAiError('Nenhuma alternativa de design utilizável foi encontrada.', 422, false, 'SITE_DESIGN_NO_USABLE_ALTERNATIVES');
  if (production.status === 'PAIRED' && responsive.resolution.status !== 'PAIRED') {
    throw new SiteAiError('O par de referências do design está incompleto.', 422, false, 'SITE_DESIGN_CONTRACT_INVALID');
  }
  try {
    buildDesignSystemContract(finalDesign);
    // Only downstream context and presentation change after canonical validation.
    if (params.runtimeContext) {
      finalDesign.referenceBrief.currentBusiness = structuredClone(params.runtimeContext.current);
      if (params.runtimeContext.overrides) {
        finalDesign.specification.tokens.color.primary = params.runtimeContext.overrides.primary;
        finalDesign.specification.tokens.color.accent = params.runtimeContext.overrides.accent;
      }
      finalDesign.designMarkdown = designMarkdown(finalDesign);
    }
    buildDesignSystemContract(finalDesign);
  } catch {
    throw new SiteAiError('Não foi possível validar a estrutura do design.', 422, false, 'SITE_DESIGN_CONTRACT_INVALID');
  }
  return { production, artifactContext, finalDesign, anchors, alternatives: finalDesign.stitch.alternatives,
    resolution: responsive.resolution, runtimeContext: params.runtimeContext,
    designSource: designResult.designSource, fallbackReason: designResult.fallbackReason };
}
