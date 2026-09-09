import { auditCurrentSite } from './currentSiteAudit.js';
import { resolveStandardDesign, blueprintFromDesign } from '../../../src/site-builder/designPipeline.js';
import type { LeadSourceContext } from '../../../src/site-builder/contracts/research.js';

export async function generateStandardSite(source: LeadSourceContext, overrides?: { primary: string; accent: string }, audit = auditCurrentSite) {
  // Audit always precedes market lookup and design resolution.
  const current = await audit(source.context.onlinePresence.websiteUrl);
  const design = resolveStandardDesign(source, current, overrides);
  const blueprint = blueprintFromDesign(design);
  return { blueprint, design, warnings: blueprint.warnings,
    generation: { provider: 'standard', model: 'researched-family', modelId: design.specification.family.id,
      generatedAt: design.resolution.resolvedAt, blueprintVersion: 2 } };
}
