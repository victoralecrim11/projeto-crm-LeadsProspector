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
) {
  const current = await (dependencies.audit ?? auditCurrentSite)(source.context.onlinePresence.websiteUrl);
  const business = businessFromSource(source);

  // Fast cache-only lookup (decoupled from live web crawl)
  const cache = dependencies.cache ?? globalDesignResearchCache;
  const snapshot = dependencies.snapshot ?? (business.derivedNiche !== 'other' ? (cache.get(business.derivedNiche) ?? undefined) : undefined);

  const design = resolveStandardDesign(source, current, overrides, new Date(), snapshot);
  const contract = buildDesignSystemContract(design);
  const fallback = (reason: GenerationMetadata['fallbackReason']) => ({
    blueprint: blueprintFromDesign(design),
    design,
    contract,
    warnings: ['A IA não estava disponível. O site foi criado usando o fallback determinístico do Design System.'],
    generation: {
      provider: 'standard',
      model: 'researched-family',
      modelId: design.specification.family.id,
      generatedAt: design.resolution.resolvedAt,
      blueprintVersion: 2,
      mode: 'standard-fallback' as const,
      fallbackUsed: true,
      fallbackReason: reason,
      designFamily: design.specification.family.id,
      guidance: reactToolkitProfile,
    },
  });
  try {
    const catalog = await (dependencies.discoverModels ?? discoverModels)(credentials);
    const model = resolveModels(catalog.models, selection)[0];
    const raw = await (dependencies.requestBlueprint ?? requestBlueprint)(
      model,
      buildStandardAiPrompt(source, design, contract),
      credentials,
    );
    const blueprint = preserveDesign(raw, design);
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
        designFamily: design.specification.family.id,
        guidance: reactToolkitProfile,
      },
    };
  } catch (error) {
    if (error instanceof SiteAiError && (error.status === 503 || error.status === 429)) {
      return fallback(error.status === 429 ? 'rate-limit' : 'provider-unavailable');
    }
    throw error;
  }
}