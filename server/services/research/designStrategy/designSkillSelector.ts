import { type DesignStrategy } from '../../../../src/site-builder/contracts/research.js';

interface SkillSelectorInput {
  niche: string;
  subNiche: string;
  sitePurpose: string;
  performanceBudget: DesignStrategy['performanceBudget'];
  accessibility: string[];
  visualComplexity: string;
  designStrategy: Partial<DesignStrategy>;
}

export function selectDesignSkills(input: SkillSelectorInput): string[] {
  const skills: string[] = ['standard-web'];

  if (input.niche === 'dentistry' || input.niche.includes('health')) {
    // Clinical approach
    skills.push('accessibility-strong', 'clinical-layout');
  }

  if (input.niche === 'barbershop') {
    // Editorial approach
    skills.push('editorial-layout', 'bold-typography');
  }
  
  if (input.niche === 'restaurant' || input.subNiche.toLowerCase().includes('pizz')) {
    skills.push('food-centric-layout');
  }

  if (input.subNiche.toLowerCase().includes('hair') || input.subNiche.toLowerCase().includes('salon')) {
    skills.push('beauty-editorial');
  }

  // Adding threejs only when justified
  if (
    input.performanceBudget !== 'high' && 
    (input.designStrategy.visualMood === 'bold' || input.designStrategy.motionLevel === 'expressive')
  ) {
    skills.push('webgl-subtle');
  }

  return skills;
}
