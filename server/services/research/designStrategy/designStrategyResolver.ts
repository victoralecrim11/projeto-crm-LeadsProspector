import { type ResolvedDesign, type DesignStrategy } from '../../../../src/site-builder/contracts/research.js';
import { selectDesignSkills } from './designSkillSelector.js';
import crypto from 'node:crypto';

export function resolveDesignStrategy(d: ResolvedDesign): DesignStrategy {
  const niche = d.referenceBrief.business.derivedNiche.trim().toLowerCase();
  const subNiche = d.referenceBrief.business.source.niche.trim().toLowerCase();
  const sitePurpose = d.conversionStrategy;
  
  // Default values
  let visualMood: DesignStrategy['visualMood'] = 'clean';
  let compositionDirection: DesignStrategy['compositionDirection'] = 'balanced';
  let typographyDirection: DesignStrategy['typographyDirection'] = 'modern';
  let motionLevel: DesignStrategy['motionLevel'] = 'subtle';
  let informationDensity: DesignStrategy['informationDensity'] = 'medium';
  let performanceBudget: DesignStrategy['performanceBudget'] = 'medium';

  // Niche-specific guidance
  if (niche === 'dentistry') {
    visualMood = 'clean';
    compositionDirection = 'text-led';
    typographyDirection = 'modern';
    motionLevel = 'none';
    informationDensity = 'high';
    performanceBudget = 'high';
  } else if (niche === 'barbershop') {
    visualMood = 'bold';
    compositionDirection = 'image-led';
    typographyDirection = 'editorial';
    motionLevel = 'moderate';
    informationDensity = 'low';
  } else if (niche === 'restaurant') {
    visualMood = 'warm';
    compositionDirection = 'image-led';
    typographyDirection = 'expressive';
    motionLevel = 'expressive';
    informationDensity = 'medium';
  }

  // Pizzeria uses restaurant niche but could have specific traits
  if (d.referenceBrief.business.businessType === 'local-business' && subNiche.toLowerCase().includes('pizz')) {
    visualMood = 'warm';
    compositionDirection = 'image-led';
    motionLevel = 'expressive';
  }
  
  // Hair salon uses barbershop or other but needs refinement
  if (subNiche.toLowerCase().includes('hair') || subNiche.toLowerCase().includes('salon')) {
    visualMood = 'refined';
    compositionDirection = 'image-led';
    typographyDirection = 'editorial';
    motionLevel = 'moderate';
  }

  const skillProfile = selectDesignSkills({
    niche,
    subNiche,
    sitePurpose,
    performanceBudget,
    accessibility: ['WCAG AA', 'Prefers Reduced Motion Support'],
    visualComplexity: 'standard',
    designStrategy: { visualMood, motionLevel }
  });

  // Canonicalize inputs
  // (niche and subNiche are normalized at the top of the function)

  // Stable stringify helper for nested objects
  function stableStringify(obj: any): string {
    if (obj === null || typeof obj !== 'object') {
      return JSON.stringify(obj);
    }
    if (Array.isArray(obj)) {
      // Arrays with semantic order (like sectionPriorities) maintain their order.
      // We stringify each element recursively.
      return '[' + obj.map(stableStringify).join(',') + ']';
    }
    const keys = Object.keys(obj).sort();
    let res = '';
    for (const key of keys) {
      if (obj[key] !== undefined) {
        res += (res ? ',' : '') + JSON.stringify(key) + ':' + stableStringify(obj[key]);
      }
    }
    return '{' + res + '}';
  }

  const canonicalPayload = {
    identityVersion: 1,
    niche,
    subNiche,
    sitePurpose,
    visualMood,
    compositionDirection,
    typographyDirection,
    imageryDirection: d.imageryDirection,
    informationDensity,
    motionLevel,
    sectionPriorities: d.composition
  };

  const rawToHash = stableStringify(canonicalPayload);
  const hash = crypto.createHash('sha256').update(rawToHash).digest('hex').substring(0, 12);
  const strategyId = `strategy-v1:${hash}`;

  return {
    strategyId,
    version: 1,
    niche,
    subNiche,
    sitePurpose,
    visualMood,
    compositionDirection,
    typographyDirection,
    imageryDirection: d.imageryDirection,
    informationDensity,
    motionLevel,
    interactionLevel: motionLevel === 'none' ? 'static' : (motionLevel === 'expressive' ? 'rich' : 'micro-interactions'),
    heroPatterns: ['split', 'centered'], // defaults
    aboutPatterns: ['image-right', 'image-left'], // defaults
    servicePatterns: ['grid', 'cards'], // defaults
    sectionPriorities: d.composition,
    skillProfile,
    stitchRecommended: true,
    stitchVariantCount: 3,
    performanceBudget,
    accessibilityConstraints: ['WCAG AA', 'Prefers Reduced Motion Support'],
    provenance: [{ decision: 'Strategy resolved based on niche and purpose', origin: 'DesignStrategyResolver' }]
  };
}
