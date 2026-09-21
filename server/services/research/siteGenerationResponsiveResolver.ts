import type { ResolvedDesign } from '../../../src/site-builder/contracts/research.js';
import { ArtifactMcpProvider } from './stitch/providers/artifactMcpProvider.js';
import { resolveResponsiveAnchorPair, type ResponsiveDesignResolution } from '../../../src/site-builder/responsiveResolution.js';
import { resolvePremiumSelectionResponsive } from '../../../src/site-builder/designPipeline.js';
import { rankCandidates } from './stitch/stitchCandidateRanker.js';
import { resolveDesignStrategy } from './designStrategy/designStrategyResolver.js';

/**
 * Executes the runtime resolution of a Responsive Design Pair using the D.5 boundary.
 * 
 * 1. Reads Mobile Anchor via ArtifactMcpProvider
 * 2. Reads Desktop Companion via ArtifactMcpProvider
 * 3. Ranks candidates if necessary to find the effective candidate
 * 4. Passes them to responsiveResolution.ts
 * 5. Integrates into ResolvedDesign via designPipeline.ts
 */
export async function resolveRuntimeResponsiveDesign(
  resolvedDesign: ResolvedDesign,
  anchors: { mobile?: any, desktop?: any },
  provider: ArtifactMcpProvider = new ArtifactMcpProvider()
): Promise<{ resolvedDesign: ResolvedDesign; resolution: ResponsiveDesignResolution }> {
  
  const mobileRef = anchors.mobile;
  const desktopRef = anchors.desktop;

  if (!mobileRef) {
    throw new Error('Mobile anchor reference is missing. Cannot resolve responsive design.');
  }

  // 1. Read Mobile Anchor using explicitly provided identity (Boundary D.5)
  const mobileArtifact = await provider.readArtifact(
    mobileRef.projectId,
    mobileRef.requestId,
    mobileRef.strategyId
  );

  if (!mobileArtifact || !mobileArtifact.candidates || mobileArtifact.candidates.length === 0) {
    const probe = await provider.probe(mobileRef.projectId, mobileRef.requestId, mobileRef.strategyId);
    if (probe.status === 'STITCH_ARTIFACT_STALE') {
      throw new Error(`SITE_DESIGN_ARTIFACT_STALE: Mobile artifact ${mobileRef.requestId} is stale.`);
    } else if (probe.status === 'STITCH_ARTIFACT_INVALID') {
      throw new Error(`SITE_DESIGN_ARTIFACT_INVALID: Mobile artifact ${mobileRef.requestId} has an invalid schema.`);
    } else if (probe.status === 'STITCH_ARTIFACT_MISMATCH') {
      throw new Error(`SITE_DESIGN_ARTIFACT_MISMATCH: Mobile artifact ${mobileRef.requestId} does not match strategy.`);
    }
    throw new Error(`SITE_DESIGN_ARTIFACT_UNAVAILABLE: Failed to read Mobile Anchor artifact ${mobileRef.projectId}/${mobileRef.requestId}. Probe: ${probe.status}`);
  }

  // Rank Mobile Candidates to find the winner
  const strategy = resolveDesignStrategy(resolvedDesign);
  const rankedMobile = rankCandidates(mobileArtifact.candidates, strategy);
  const mobileWinner = rankedMobile[0];

  // 2. Read Desktop Companion using explicitly provided identity
  let desktopCompanion;
  if (desktopRef) {
    const desktopArtifact = await provider.readArtifact(
      desktopRef.projectId,
      desktopRef.requestId,
      desktopRef.strategyId
    );
    
    if (desktopArtifact && desktopArtifact.candidates && desktopArtifact.candidates.length > 0) {
      // Desktop usually only has 1 candidate, but we rank it just in case
      const rankedDesktop = rankCandidates(desktopArtifact.candidates, strategy);
      desktopCompanion = rankedDesktop[0];
    }
  }

  // 3. Resolve Coherence
  const resolution = resolveResponsiveAnchorPair(mobileWinner, desktopCompanion);

  // Define canonical alternatives from Mobile candidates
  const canonicalAlternatives = rankedMobile.map(c => c.candidateId).slice(0, 3);
  if (canonicalAlternatives.length === 0) {
    throw new Error('SITE_DESIGN_NO_USABLE_ALTERNATIVES: No usable candidates found after filtering.');
  }

  // Preserve selected winner and inject resolved alternatives
  const updatedStitch = {
    ...(resolvedDesign.stitch || { 
      review: 'Resolved at runtime',
      generatedAt: new Date().toISOString()
    }),
    viewportAnchors: anchors,
    alternatives: canonicalAlternatives,
    selected: mobileWinner.candidateId,
  };

  // 4. Update the ResolvedDesign using designPipeline's responsive integrator
  const finalResolvedDesign = resolvePremiumSelectionResponsive(
    resolvedDesign,
    updatedStitch,
    resolution
  );

  return {
    resolvedDesign: finalResolvedDesign,
    resolution
  };
}
