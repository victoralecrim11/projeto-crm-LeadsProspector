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
import { isCooling, setCooldown } from '../ai/providerCooldown.js';

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
  let lastError: unknown;
  try {
    const catalog = await (dependencies.discoverModels ?? discoverModels)(credentials);
    const models = resolveModels(catalog.models, selection);
    if (!models.length) {
      return fallback('provider-unavailable', 'provider-no-compatible-model');
    }

    const isAuto = selection.mode === 'auto';
    for (const model of models) {
      if (isAuto && isCooling(model.provider, model.model)) {
        console.warn(`[SiteAI] Skipping model in cooldown: ${model.id}`);
        continue;
      }
      
      try {
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
        lastError = error;
        if (error instanceof Error && error.name === 'SiteAiError') {
          const siteAiError = error as import('../ai/modelRegistry.js').SiteAiError;
          const isTransient = siteAiError.status === 429 || siteAiError.status === 503 || siteAiError.status === 504 || siteAiError.code === 'SITE_AI_PROVIDER_TIMEOUT' || siteAiError.code === 'SITE_AI_PROVIDER_NETWORK' || siteAiError.safeDetail === 'provider-network-error';
          const isAuthError = siteAiError.status === 401 || siteAiError.status === 403;
          
          if (isAuto && (isTransient || isAuthError)) {
            // For 429/503/504, requestBlueprint already sets cooldown based on Retry-After.
            // But just in case it didn't, or for network errors:
            if (isTransient && !isCooling(model.provider, model.model)) {
              setCooldown(model.provider, model.model, siteAiError.status === 429 ? 60000 : 30000);
            }
            console.warn(`[SiteAI] Provider error (${siteAiError.status}) for ${model.id}. Moving to next model.`);
            continue;
          }

          // If it's a non-retryable error (e.g. 400 Bad Request), we throw immediately (Hard failure)
          if (!siteAiError.retryable) {
            throw error;
          }
          
          if (!isAuto) {
            throw error;
          }
        } else {
          throw error;
        }
      }
    }
    
      // Se esgotou os modelos no modo auto
      // (a fallback validation happens below if nothing returned)
      
    } catch (error) {
      lastError = error;
    }

    const error = lastError;
    if (error) {
      if (error instanceof Error && error.name === 'SiteAiError') {
        const siteAiError = error as import('../ai/modelRegistry.js').SiteAiError;
        
        // Manual mode should throw immediately and NEVER fallback
        if (selection.mode !== 'auto') {
          throw error;
        }
        
        if (siteAiError.code === 'SITE_AI_PROVIDER_RATE_LIMIT' || siteAiError.status === 429) {
          return fallback('rate-limit', 'provider-http-429', siteAiError.upstreamStatus ?? 429);
        }
        if (siteAiError.safeDetail === 'provider-http-503' || (siteAiError.status === 503 && siteAiError.upstreamStatus === 503)) {
          return fallback('provider-unavailable', 'provider-http-503', 503);
        }
        if (siteAiError.safeDetail === 'provider-http-504' || siteAiError.upstreamStatus === 504) {
          return fallback('provider-unavailable', 'provider-http-504', 504);
        }
        if (siteAiError.code === 'SITE_AI_PROVIDER_TIMEOUT' || siteAiError.safeDetail === 'provider-timeout' || siteAiError.status === 504) {
          return fallback('provider-unavailable', 'provider-timeout', siteAiError.upstreamStatus);
        }
        if (siteAiError.code === 'SITE_AI_PROVIDER_NETWORK' || siteAiError.safeDetail === 'provider-network-error') {
          return fallback('provider-unavailable', 'provider-network-error', siteAiError.upstreamStatus);
        }
        if (siteAiError.code === 'SITE_AI_NO_COMPATIBLE_MODEL' || siteAiError.safeDetail === 'provider-no-compatible-model') {
          return fallback('provider-unavailable', 'provider-no-compatible-model');
        }
        if (siteAiError.status === 503) {
          return fallback('provider-unavailable', (siteAiError.safeDetail as import('../../../src/site-builder/types.js').FallbackDetail) ?? 'provider-http-503', 503);
        }
      }
      
      console.log(
        `[SiteAI] ${JSON.stringify({
          requestId,
          route: '/sites/standard-ai',
          result: 'error',
          error: error instanceof Error && error.name === 'SiteAiError' ? (error as import('../ai/modelRegistry.js').SiteAiError).code : 'UNKNOWN_ERROR',
          upstreamStatus: error instanceof Error && error.name === 'SiteAiError' ? (error as import('../ai/modelRegistry.js').SiteAiError).upstreamStatus : undefined,
          durationMs: Date.now() - startTime,
        })}`,
      );
      throw error;
    }

    return fallback('provider-unavailable', 'provider-no-compatible-model');
}