import { auditCurrentSite } from './currentSiteAudit.js';
import { resolveStandardDesign, blueprintFromDesign } from '../../../src/site-builder/designPipeline.js';
import type { LeadSourceContext } from '../../../src/site-builder/contracts/research.js';
import { globalDesignResearchCache, DesignResearchCache } from './snapshotCache.js';
import { businessFromSource } from '../../../src/site-builder/leadSource.js';

export async function generateStandardSite(
  source: LeadSourceContext,
  overrides?: { primary: string; accent: string },
  audit = auditCurrentSite,
  cache: DesignResearchCache = globalDesignResearchCache,
) {
  // 1. Audit always precedes market lookup and design resolution.
  const current = await audit(source.context.onlinePresence.websiteUrl);
  const business = businessFromSource(source);

  // 2. Decoupled design research: fast cache lookup only (fresh or stale).
  // Live crawl is decoupled from standard site generation.
  let snapshot = undefined;
  if (business.derivedNiche !== 'other') {
    snapshot = cache.get(business.derivedNiche) ?? undefined;
  }

  const design = resolveStandardDesign(source, current, overrides, new Date(), snapshot);
  const blueprint = blueprintFromDesign(design);
  return {
    blueprint,
    design,
    warnings: blueprint.warnings,
    generation: {
      provider: 'standard',
      model: 'researched-family',
      modelId: design.specification.family.id,
      generatedAt: design.resolution.resolvedAt,
      blueprintVersion: 2,
    },
  };
}
