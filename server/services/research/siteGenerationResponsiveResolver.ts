import type { ResolvedDesign, DesignArtifactReference, StitchCandidateArtifact } from '../../../src/site-builder/contracts/research.js';
import { SiteAiError, type SiteAiErrorCode } from '../ai/modelRegistry.js';
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
  anchors: { mobile?: DesignArtifactReference, desktop?: DesignArtifactReference },
  provider?: ArtifactMcpProvider,
  artifactContext?: import('./stitchConsumerPreparation.js').ArtifactResolutionContext
): Promise<{ resolvedDesign: ResolvedDesign; resolution: ResponsiveDesignResolution }> {

  const mobileRef = artifactContext ? artifactContext.mobileReference : anchors.mobile;
  const desktopRef = artifactContext ? artifactContext.desktopReference : anchors.desktop;

  if (!provider) {
    const { resolveStitchRuntimeRoot } = await import('./stitchProductionService.js');
    provider = new ArtifactMcpProvider(resolveStitchRuntimeRoot());
  }

  if (!mobileRef) {
    throw new Error('Mobile anchor reference is missing. Cannot resolve responsive design.');
  }

  // Use artifactContext.strategyId as canonical identity if provided
  const mobileStrategyId = artifactContext ? artifactContext.strategyId : mobileRef.strategyId;
  const desktopStrategyId = artifactContext ? artifactContext.strategyId : (desktopRef ? desktopRef.strategyId : undefined);

  const validateArtifact = (artifact: StitchCandidateArtifact, role: 'mobile' | 'desktop') => {
    if (artifactContext && (artifact.strategyId !== artifactContext.strategyId || artifact.candidates.some(c =>
      c.strategyId !== artifactContext.strategyId || c.viewport !== role ||
      (artifactContext.responsivePairId && c.responsivePairId !== artifactContext.responsivePairId)))) {
      throw new SiteAiError('O design foi criado, mas houve uma inconsistência ao preparar os dados para finalizar o site.', 422, false, 'SITE_DESIGN_ARTIFACT_MISMATCH');
    }
  };
  const unreadable = async (ref: DesignArtifactReference, strategyId: string) => {
    const probe = await provider.probe(ref.projectId, ref.requestId, strategyId);
    const codes: Record<string, SiteAiErrorCode> = {
      STITCH_ARTIFACT_MISMATCH: 'SITE_DESIGN_ARTIFACT_MISMATCH',
      STITCH_ARTIFACT_INVALID: 'SITE_DESIGN_ARTIFACT_INVALID',
      STITCH_ARTIFACT_STALE: 'SITE_DESIGN_ARTIFACT_STALE',
    };
    throw new SiteAiError('Não foi possível recuperar uma referência válida do design.', 422, false, codes[probe.status] ?? 'SITE_DESIGN_ARTIFACT_UNAVAILABLE');
  };

  // 1. Read Mobile Anchor using explicitly provided identity (Boundary D.5)
  const mobileArtifact = await provider.readArtifact(
    mobileRef.projectId,
    mobileRef.requestId,
    mobileStrategyId
  );

  if (!mobileArtifact || !mobileArtifact.candidates || mobileArtifact.candidates.length === 0) {
    if (artifactContext) {
      if (mobileArtifact) throw new SiteAiError('Nenhuma alternativa utilizável foi encontrada.', 422, false, 'SITE_DESIGN_NO_USABLE_ALTERNATIVES');
      await unreadable(mobileRef, mobileStrategyId);
    }
    const probe = await provider.probe(mobileRef.projectId, mobileRef.requestId, mobileStrategyId);
    if (probe.status === 'STITCH_ARTIFACT_STALE') {
      throw new Error(`SITE_DESIGN_ARTIFACT_STALE: Mobile artifact ${mobileRef.requestId} is stale.`);
    } else if (probe.status === 'STITCH_ARTIFACT_INVALID') {
      throw new Error(`SITE_DESIGN_ARTIFACT_INVALID: Mobile artifact ${mobileRef.requestId} has an invalid schema.`);
    } else if (probe.status === 'STITCH_ARTIFACT_MISMATCH') {
      throw new Error(`SITE_DESIGN_ARTIFACT_MISMATCH: Mobile artifact ${mobileRef.requestId} does not match strategy.`);
    }
    throw new Error(`SITE_DESIGN_ARTIFACT_UNAVAILABLE: Failed to read Mobile Anchor artifact ${mobileRef.projectId}/${mobileRef.requestId}. Probe: ${probe.status}`);
  }
  validateArtifact(mobileArtifact, 'mobile');

  // Rank Mobile Candidates to find the winner
  const strategy = resolveDesignStrategy(resolvedDesign);
  const rankedMobile = rankCandidates(mobileArtifact.candidates, strategy);
  const mobileWinner = rankedMobile[0];

  // 2. Read Desktop Companion using explicitly provided identity
  let desktopCompanion;
  if (desktopRef && desktopStrategyId) {
    const desktopArtifact = await provider.readArtifact(
      desktopRef.projectId,
      desktopRef.requestId,
      desktopStrategyId
    );
    if (artifactContext && !desktopArtifact) await unreadable(desktopRef, desktopStrategyId);
    if (desktopArtifact) validateArtifact(desktopArtifact, 'desktop');
    if (artifactContext && desktopArtifact?.candidates.length === 0) {
      throw new SiteAiError('A referência desktop não contém candidatos utilizáveis.', 422, false, 'SITE_DESIGN_NO_USABLE_ALTERNATIVES');
    }
    
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
      generatedAt: mobileArtifact.generatedAt
    }),
    viewportAnchors: { mobile: mobileRef, desktop: desktopRef },
    strategyId: mobileStrategyId,
    alternatives: canonicalAlternatives,
    selected: mobileWinner.candidateId,
  };

  // 4. Update the ResolvedDesign using designPipeline's responsive integrator
  const finalResolvedDesign = resolvePremiumSelectionResponsive(
    resolvedDesign,
    updatedStitch,
    resolution,
    artifactContext ? new Date(artifactContext.createdAt) : new Date()
  );

  return {
    resolvedDesign: finalResolvedDesign,
    resolution
  };
}
