import { 
  type LeadSourceContext, 
  type CurrentBusinessReference, 
  type ResolvedDesign, 
  type DesignStrategy,
  type DesignResearchSnapshot,
  designResearchSnapshotSchema,
  designCandidateSchema,
  type DesignCandidate,
  type DesignArtifactReference
} from '../../../src/site-builder/contracts/research.js';
import { resolveStandardDesign } from '../../../src/site-builder/designPipeline.js';
import { resolveDesignStrategy } from './designStrategy/designStrategyResolver.js';
import { probeStitch, ArtifactMcpProvider } from './stitch/index.js';
import { rankCandidates } from './stitch/stitchCandidateRanker.js';
import { globalDesignResearchCache } from './snapshotCache.js';
import { businessFromSource } from '../../../src/site-builder/leadSource.js';

export interface SiteGenerationDesignResult {
  strategy: DesignStrategy;
  resolvedDesign: ResolvedDesign;
  designSource: 'STITCH' | 'STALE_STITCH' | 'INVALID_STITCH' | 'MISMATCH_STITCH' | 'B3_RESEARCH' | 'CURATED' | 'LEGACY';
  selectedCandidateId?: string;
  artifactIdentity?: {
    projectId: string;
    requestId: string;
    strategyId: string;
  };
  fallbackReason?: string;
}

/**
 * Maps standard Site Generation identities to Stitch Domain identities.
 * Ensures we don't blindly couple `lead.id` everywhere, establishing a clear policy.
 * Now prioritizes an explicit DesignArtifactReference over 'latest'.
 */
export function resolveDesignArtifactIdentity(source: LeadSourceContext, ref?: DesignArtifactReference) {
  if (ref) {
    return { projectId: ref.projectId, requestId: ref.requestId };
  }
  const projectId = source.leadId; // Policy: projectId is the Lead ID (1:1 mapping currently)
  const requestId = 'latest';
  return { projectId, requestId };
}

/**
 * Resolves the final design to be used for Site Generation, checking for existing
 * Stitch artifacts and applying fallback rules without triggering an expensive live generation.
 */
export async function resolveSiteGenerationDesign(
  source: LeadSourceContext,
  current: CurrentBusinessReference,
  overrides?: { primary: string; accent: string },
  artifactReference?: DesignArtifactReference,
): Promise<SiteGenerationDesignResult> {
  const { projectId, requestId } = resolveDesignArtifactIdentity(source, artifactReference);
  
  if (!artifactReference) {
    console.warn(`[SiteGenerationResolver] ARTIFACT_REFERENCE_MISSING: Falling back to 'latest' artifact for lead ${projectId}. This is allowed for compatibility but explicit DesignArtifactReference is preferred.`);
  }
  
  // 1. Resolve base strategy to get strategyId for lookup
  // We use a dummy ResolvedDesign to derive the strategy, as we only need niche/subNiche/purpose.
  // We can just call resolveStandardDesign without research to get the base strategy constraints.
  const baseDesign = resolveStandardDesign(source, current, overrides, new Date());
  const strategy = resolveDesignStrategy(baseDesign);
  
  const provider = new ArtifactMcpProvider();
  
  let stitchStatus = 'STITCH_NOT_CONFIGURED';
  try {
    const res = await provider.probe(projectId, requestId, strategy.strategyId);
    stitchStatus = res.status;
  } catch {
    stitchStatus = 'STITCH_FAILED';
  }

  let finalSnapshot: DesignResearchSnapshot | undefined = undefined;
  let designSource: SiteGenerationDesignResult['designSource'] = 'LEGACY';
  let fallbackReason: string | undefined = undefined;
  let selectedCandidateId: string | undefined = undefined;
  let stitchSectionOrder: readonly ("hero" | "about" | "services" | "contact" | "location")[] | undefined;
  let stitchVisualPatterns: { hero: string; about: string; services: string; } | undefined;

  if (stitchStatus === 'STITCH_ARTIFACT_AVAILABLE') {
    try {
      const artifact = await provider.explore(projectId, requestId, strategy.strategyId);
      
      if (artifact) {
        if (artifact.strategyId !== strategy.strategyId) {
          designSource = 'MISMATCH_STITCH';
          fallbackReason = 'strategy-mismatch';
        } else {
          // Valid artifact found
          const ranked = rankCandidates(artifact.candidates, strategy);
          const winner = ranked[0];
          
          if (winner) {
            selectedCandidateId = winner.candidateId;
            designSource = 'STITCH';
            
            // Convert to a snapshot compatible with resolveStandardDesign
            const safeCandidate: DesignCandidate = designCandidateSchema.parse(winner);
            
            finalSnapshot = designResearchSnapshotSchema.parse({
              version: 1,
              niche: strategy.niche,
              subNiche: strategy.subNiche,
              status: 'fresh',
              expiresAt: new Date(Date.now() + 86400000).toISOString(),
              candidates: [
                {
                  id: safeCandidate.candidateId.toLowerCase().replace(/[^a-z0-9-]/g, '').substring(0, 80) || 'stitch-winner',
                  label: 'Stitch Winner',
                  description: 'Candidate resolved by Stitch MCP',
                  variant: safeCandidate.heroPattern,
                  primaryCandidate: safeCandidate.colorSignals.find(s => s.startsWith('primary:'))?.split(':')[1] || '#153a50',
                  accentCandidate: safeCandidate.colorSignals.find(s => s.startsWith('accent:'))?.split(':')[1] || '#d8aa63',
                  theme: 'light', // Simplify for now
                  typography: safeCandidate.typographySignals.some(s => s.includes('editorial')) ? 'editorial' : 'modern',
                }
              ],
              providerChain: ['stitch'],
              queries: [],
              sources: [],
              patterns: [],
              palettePatterns: {
                dominantFamilies: ['blue', 'gold'],
                contrast: 'high',
                saturation: 'medium',
                surfaceStrategy: 'light-clean',
                sampleEvidence: []
              },
              typographyPatterns: {
                headingStyles: ['modern-sans'],
                bodyStyles: ['modern-sans'],
                observedHeadings: [],
                observedBody: [],
                googleFonts: []
              },
              layoutPatterns: {
                hero: 'split',
                services: 'cards',
                navigation: 'inline',
                density: 'balanced',
                shape: 'soft'
              },
              imageryPatterns: [],
              conversionPatterns: [],
              avoid: [],
              confidence: 1,
              limitations: [],
              researchedAt: new Date().toISOString()
            });
            
            stitchSectionOrder = safeCandidate.sectionOrder;
            stitchVisualPatterns = {
              hero: safeCandidate.heroPattern,
              about: safeCandidate.aboutPattern,
              services: safeCandidate.servicePattern
            };
          } else {
            designSource = 'INVALID_STITCH';
            fallbackReason = 'no-valid-candidates';
          }
        }
      } else {
        designSource = 'INVALID_STITCH';
        fallbackReason = 'artifact-unreadable';
      }
    } catch (e) {
      console.error('[SiteGenerationResolver] INVALID_STITCH parse error:', e);
      designSource = 'INVALID_STITCH';
      fallbackReason = 'artifact-parse-error';
    }
  } else if (stitchStatus === 'STITCH_ARTIFACT_STALE') {
    designSource = 'STALE_STITCH';
    fallbackReason = 'artifact-stale';
  } else if (stitchStatus === 'STITCH_ARTIFACT_MISMATCH') {
    designSource = 'MISMATCH_STITCH';
    fallbackReason = 'strategy-mismatch';
  } else if (stitchStatus === 'STITCH_ARTIFACT_INVALID') {
    designSource = 'INVALID_STITCH';
    fallbackReason = 'schema-invalid';
  }

  // If we couldn't use Stitch, fallback to existing behavior (B3 cache)
  if (!finalSnapshot) {
    const business = businessFromSource(source);
    if (designSource === 'LEGACY') { // Only set B3_RESEARCH if we didn't just fail a Stitch check (for tracking)
       designSource = 'CURATED';
    }
    const b3Snapshot = business.derivedNiche !== 'other' ? globalDesignResearchCache.get(business.derivedNiche) : null;
    
    if (b3Snapshot) {
      finalSnapshot = b3Snapshot;
      if (designSource === 'CURATED') {
        designSource = 'B3_RESEARCH';
      }
    } else {
      if (designSource === 'CURATED') {
        // Leave as is, it's pilot fallback
      }
    }
  }

  // 2. Resolve the final design using the selected snapshot (Stitch Winner or Fallback)
  const resolvedDesign = resolveStandardDesign(source, current, overrides, new Date(), finalSnapshot);
  
  if (stitchSectionOrder && designSource === 'STITCH') {
    resolvedDesign.composition = [...stitchSectionOrder];
  }
  
  if (stitchVisualPatterns && designSource === 'STITCH') {
    resolvedDesign.specification.visual = {
      ...resolvedDesign.specification.visual,
      hero: stitchVisualPatterns.hero as any,
      about: stitchVisualPatterns.about as any,
      services: stitchVisualPatterns.services as any
    };
  }

  return {
    strategy,
    resolvedDesign,
    designSource,
    selectedCandidateId,
    artifactIdentity: {
      projectId,
      requestId,
      strategyId: strategy.strategyId
    },
    fallbackReason
  };
}
