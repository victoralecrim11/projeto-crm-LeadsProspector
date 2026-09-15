import { type DesignCandidate, type DesignStrategy } from '../../../../src/site-builder/contracts/research.js';

export function mapStitchCandidate(raw: any, strategy: DesignStrategy): DesignCandidate {
  return {
    candidateId: raw.id || `candidate_${Math.random().toString(36).substring(7)}`,
    source: 'stitch',
    strategyId: strategy.strategyId,
    layoutPatterns: raw.layoutPatterns || ['standard-split'],
    heroPattern: raw.heroPattern || 'split',
    aboutPattern: raw.aboutPattern || 'standard',
    servicePattern: raw.servicePattern || 'grid',
    sectionOrder: strategy.sectionPriorities,
    typographySignals: raw.typographySignals || [],
    colorSignals: raw.colorSignals || [],
    spacingSignals: raw.spacingSignals || [],
    imageryDirection: raw.imageryDirection || strategy.imageryDirection,
    motionSignals: raw.motionSignals || [],
    responsiveSignals: raw.responsiveSignals || ['mobile-first'],
    scores: {
      nicheFit: 0,
      purposeFit: 0,
      researchFit: 0,
      structuralDiversity: 0,
      accessibility: 0,
      performance: 0,
      responsiveQuality: 0,
      total: 0
    },
    provenance: [{ decision: 'Mapped from raw stitch output', origin: 'StitchCandidateMapper' }]
  };
}
