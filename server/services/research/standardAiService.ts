import crypto from 'node:crypto';
import { constrainBlueprint } from '../../../src/site-builder/context.js';
import { blueprintSchema, type ModelSelection, type GeneratedSiteBlueprint, type GenerationMetadata } from '../../../src/site-builder/types.js';
import { buildDesignSystemContract, blueprintFromDesign, resolveStandardDesign } from '../../../src/site-builder/designPipeline.js';
import type { LeadSourceContext, ResolvedDesign, DesignResearchSnapshot } from '../../../src/site-builder/contracts/research.js';
import { auditCurrentSite } from './currentSiteAudit.js';
import { buildStandardAiPrompt } from '../ai/sitePromptBuilder.js';
import { discoverModels, resolveModels, SiteAiError, type Credentials } from '../ai/modelRegistry.js';
import { requestBlueprint } from '../ai/providers/siteProviders.js';
import { reactToolkitProfile } from '../../../src/site-builder/guidance/reactToolkit.js';
import { globalDesignResearchCache, DesignResearchCache } from './snapshotCache.js';
import { businessFromSource } from '../../../src/site-builder/leadSource.js';

type Dependencies = {
  audit?: typeof auditCurrentSite;
  discoverModels?: typeof discoverModels;
  requestBlueprint?: typeof requestBlueprint;
  cache?: DesignResearchCache;
  snapshot?: DesignResearchSnapshot;
};

export function getFallbackUserMessage(
  detail?: GenerationMetadata['fallbackDetail'],
  reason?: GenerationMetadata['fallbackReason'],
): string {
  switch (detail) {
    case 'provider-http-429':
      return 'Limite temporário da API de IA atingido. O site foi criado com fallback determinístico.';
    case 'provider-http-503':
    case 'provider-http-504':
      return 'O provedor de IA está temporariamente indisponível. O site foi criado com fallback determinístico.';
    case 'provider-timeout':
      return 'A geração por IA excedeu o tempo limite. O site foi criado com fallback determinístico.';
    case 'provider-network-error':
      return 'Não foi possível concluir a comunicação com o provedor de IA. O site foi criado com fallback determinístico.';
    case 'provider-no-compatible-model':
      return 'Nenhum modelo compatível estava disponível para esta estratégia. O site foi criado com fallback determinístico.';
    default:
      if (reason === 'rate-limit') {
        return 'Limite temporário da API de IA atingido. O site foi criado com fallback determinístico.';
      }
      return 'O provedor de IA está temporariamente indisponível. O site foi criado com fallback determinístico.';
  }
}

function preserveDesign(raw: unknown, design: ResolvedDesign): GeneratedSiteBlueprint {
  const candidate = constrainBlueprint(raw, design.referenceBrief.business.lead, true);
  candidate.templateId = design.specification.templateId;
  candidate.visual = design.specification.visual;
  candidate.presentation = design.specification.presentation;
  candidate.brand.primaryColor = design.specification.tokens.color.primary;
  candidate.brand.accentColor = design.specification.tokens.color.accent;
  candidate.sectionOrder = design.composition;
  candidate.brand.tone = 'profissional';
  return blueprintSchema.parse(candidate);
}

export async function generateStandardAiSite(
  source: LeadSourceContext,
  selection: ModelSelection = { mode: 'auto' },
  overrides?: { primary: string; accent: string },
  credentials: Credentials = {},
  dependencies: Dependencies = {},
  requestId: string = `siteai_${crypto.randomUUID()}`,
) {
  const startTime = Date.now();
  const current = await (dependencies.audit ?? auditCurrentSite)(source.context.onlinePresence.websiteUrl);
  const business = businessFromSource(source);

  // Fast cache-only lookup (decoupled from live web crawl)
  const cache = dependencies.cache ?? globalDesignResearchCache;
  const snapshot = dependencies.snapshot ?? (business.derivedNiche !== 'other' ? (cache.get(business.derivedNiche) ?? undefined) : undefined);

  const design = resolveStandardDesign(source, current, overrides, new Date(), snapshot);
  const contract = buildDesignSystemContract(design);
  const fallback = (
    reason: GenerationMetadata['fallbackReason'],
    detail?: GenerationMetadata['fallbackDetail'],
    upstreamStatus?: number,
  ) => {
    const durationMs = Date.now() - startTime;
    console.log(
      `[SiteAI] ${JSON.stringify({
        requestId,
        route: '/sites/standard-ai',
        provider: 'standard',
        model: 'researched-family',
        result: 'fallback',
        reason,
        detail,
        upstreamStatus,
        durationMs,
      })}`,
    );
    return {
      blueprint: blueprintFromDesign(design),
      design,
      contract,
      warnings: [getFallbackUserMessage(detail, reason)],
      generation: {
        provider: 'standard',
        model: 'researched-family',
        modelId: design.specification.family.id,
        generatedAt: design.resolution.resolvedAt,
        blueprintVersion: 2,
        mode: 'standard-fallback' as const,
        fallbackUsed: true,
        fallbackReason: reason,
        fallbackDetail: detail,
        requestId,
        durationMs,
        designFamily: design.specification.family.id,
        guidance: reactToolkitProfile,
      } as GenerationMetadata,
    };
  };
  try {
    const catalog = await (dependencies.discoverModels ?? discoverModels)(credentials);
    const models = resolveModels(catalog.models, selection);
    const model = models[0];
    if (!model) {
      return fallback('provider-unavailable', 'provider-no-compatible-model');
    }
    const raw = await (dependencies.requestBlueprint ?? requestBlueprint)(
      model,
      buildStandardAiPrompt(source, design, contract),
      credentials,
    );
    const blueprint = preserveDesign(raw, design);
    const durationMs = Date.now() - startTime;
    console.log(
      `[SiteAI] ${JSON.stringify({
        requestId,
        route: '/sites/standard-ai',
        provider: model.provider,
        model: model.model,
        result: 'success',
        durationMs,
      })}`,
    );
    return {
      blueprint,
      design,
      contract,
      warnings: [...catalog.warnings, ...blueprint.warnings],
      generation: {
        provider: model.provider,
        model: model.model,
        modelId: model.id,
        generatedAt: new Date().toISOString(),
        blueprintVersion: 2,
        mode: 'standard-ai' as const,
        fallbackUsed: false,
        requestId,
        durationMs,
        designFamily: design.specification.family.id,
        guidance: reactToolkitProfile,
      } as GenerationMetadata,
    };
  } catch (error) {
    if (error instanceof SiteAiError) {
      if (error.code === 'SITE_AI_PROVIDER_RATE_LIMIT' || error.status === 429) {
        return fallback('rate-limit', 'provider-http-429', error.upstreamStatus ?? 429);
      }
      if (error.safeDetail === 'provider-http-503' || (error.status === 503 && error.upstreamStatus === 503)) {
        return fallback('provider-unavailable', 'provider-http-503', 503);
      }
      if (error.safeDetail === 'provider-http-504' || error.upstreamStatus === 504) {
        return fallback('provider-unavailable', 'provider-http-504', 504);
      }
      if (error.code === 'SITE_AI_PROVIDER_TIMEOUT' || error.safeDetail === 'provider-timeout' || error.status === 504) {
        return fallback('provider-unavailable', 'provider-timeout', error.upstreamStatus);
      }
      if (error.code === 'SITE_AI_PROVIDER_NETWORK' || error.safeDetail === 'provider-network-error') {
        return fallback('provider-unavailable', 'provider-network-error', error.upstreamStatus);
      }
      if (error.code === 'SITE_AI_NO_COMPATIBLE_MODEL' || error.safeDetail === 'provider-no-compatible-model') {
        return fallback('provider-unavailable', 'provider-no-compatible-model');
      }
      if (error.status === 503) {
        return fallback('provider-unavailable', (error.safeDetail as any) ?? 'provider-http-503', 503);
      }
    }
    // Hard failure for non-transient errors (401/403 provider auth, 400 invalid request, contract breach, etc.)
    console.log(
      `[SiteAI] ${JSON.stringify({
        requestId,
        route: '/sites/standard-ai',
        result: 'error',
        error: error instanceof SiteAiError ? error.code : 'UNKNOWN_ERROR',
        upstreamStatus: error instanceof SiteAiError ? error.upstreamStatus : undefined,
        durationMs: Date.now() - startTime,
      })}`,
    );
    throw error;
  }
}