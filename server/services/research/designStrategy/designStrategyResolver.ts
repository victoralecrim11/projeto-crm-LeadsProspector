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
  if (niche === 'health-clinic' || niche === 'dentistry' || niche === 'veterinary') {
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
  } else if (niche === 'hair-salon' || niche === 'beauty-studio' || niche === 'cosmetics-retail') {
    visualMood = 'refined';
    compositionDirection = 'image-led';
    typographyDirection = 'editorial';
    motionLevel = 'moderate';
    informationDensity = 'medium';
  } else if (niche === 'restaurant' || niche === 'fast-food') {
    visualMood = 'warm';
    compositionDirection = 'image-led';
    typographyDirection = 'expressive';
    motionLevel = 'expressive';
    informationDensity = 'medium';
  } else if (niche === 'pizzeria') {
    visualMood = 'warm';
    compositionDirection = 'image-led';
    typographyDirection = 'expressive';
    motionLevel = 'expressive';
    informationDensity = 'medium';
  } else if (niche === 'law-firm' || niche === 'auto-repair' || niche === 'real-estate' || niche === 'accounting' || niche === 'financial-services') {
    visualMood = 'corporate';
    compositionDirection = 'balanced';
    typographyDirection = 'modern';
    motionLevel = 'subtle';
    informationDensity = 'high';
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
