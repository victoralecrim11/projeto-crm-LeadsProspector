import { type DesignCandidate, type DesignStrategy } from '../../../../src/site-builder/contracts/research.js';

export function rankCandidates(candidates: DesignCandidate[], strategy: DesignStrategy): DesignCandidate[] {
  if (!candidates || candidates.length === 0) return [];

  // Track historical layouts to penalize repetition (structural diversity)
  // Since we don't have a DB here, we just use a heuristic: 
  // If multiple candidates share the exact same pattern as the common 'split -> standard -> grid', penalize slightly.
  
  for (const c of candidates) {
    let nicheFit = 20;
    const purposeFit = 0; // No evaluated purpose evidence.
    const researchFit = 0;
    let responsive = 15;
    const accessibility = 0; // No accessibility audit was performed.
    const performance = 0; // No measured runtime performance.
    let structuralDiversity = 10;

    // Evaluate Structural Diversity
    // If it uses the very generic split -> standard -> grid, it gets lower diversity score
    if (c.heroPattern === 'split' && c.aboutPattern === 'standard' && c.servicePattern === 'grid') {
      structuralDiversity -= 5;
    } else {
      structuralDiversity += 2; // Bonus for non-standard
    }

    // Evaluate Niche Fit based on Strategy
    // Penalize if candidate layout patterns don't include the required composition direction
    if (strategy.compositionDirection && !c.layoutPatterns.includes(strategy.compositionDirection)) {
      nicheFit -= 15; // Increased penalty so it outweighs diversity bonus
    }
    
    // Declared responsive intent only; this is not a viewport audit.
    if (!c.responsiveSignals.includes('mobile-first')) {
      responsive -= 10;
    }
    
    c.scores = {
      nicheFit,
      purposeFit,
      researchFit,
      structuralDiversity,
      accessibility,
      performance,
      responsiveQuality: responsive,
      total: nicheFit + purposeFit + researchFit + structuralDiversity + accessibility + performance + responsive
    };
  }

  // Sort descending by total score. Tie-break using structural diversity.
  return candidates.sort((a, b) => {
    if (b.scores.total !== a.scores.total) {
      return b.scores.total - a.scores.total;
    }
    return b.scores.structuralDiversity - a.scores.structuralDiversity;
  });
}
