import type { DesignCandidate, ResolvedDesign } from './contracts/research.js';
import { validateAnchorCoherence } from './anchorCoherence.js';

export type ResponsivePairStatus = 'PAIRED' | 'PARTIAL' | 'INVALID';

export interface ResponsiveDesignResolution {
  status: ResponsivePairStatus;
  effectiveCandidate: DesignCandidate;
  desktopCompanion?: DesignCandidate;
  incoherenceReason?: string;
}

/**
 * Resolves the responsive anchor pair into a single set of responsive design decisions.
 * Does NOT mutate the ResolvedDesign.
 * 
 * If Desktop fails coherence, we fallback to Mobile-only (PARTIAL status).
 */
export function resolveResponsiveAnchorPair(
  mobileCandidate: DesignCandidate,
  desktopCandidate?: DesignCandidate,
): ResponsiveDesignResolution {
  if (!desktopCandidate) {
    return {
      status: 'PARTIAL',
      effectiveCandidate: mobileCandidate,
      incoherenceReason: 'No desktop candidate provided',
    };
  }

  const coherence = validateAnchorCoherence(mobileCandidate, desktopCandidate);

  if (coherence.status !== 'PAIRED') {
    return {
      status: 'PARTIAL',
      effectiveCandidate: mobileCandidate,
      incoherenceReason: coherence.reason,
    };
  }

  // If paired, we still use the mobile candidate as the primary structural intent,
  // but we acknowledge the desktop companion is valid and part of the resolution.
  // In a more complex renderer, we might merge signals, but for now we pass both down.
  return {
    status: 'PAIRED',
    effectiveCandidate: mobileCandidate, // Blueprint generation primarily looks at this
    desktopCompanion: desktopCandidate, // Renderers can peek at desktop-specific layout if needed
  };
}
