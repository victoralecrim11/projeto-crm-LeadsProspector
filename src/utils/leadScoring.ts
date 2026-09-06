export interface OpportunityScoreInput {
  hasWebsite: boolean;
  phone?: string;
  email?: string;
  address?: string;
  category?: string;
}

/**
 * A transparent, deterministic opportunity score. It uses only fields actually
 * present on the lead and deliberately does not infer ratings, reviews or audits.
 */
export function calculateOpportunityScore(input: OpportunityScoreInput): number {
  let score = input.hasWebsite ? 20 : 55;
  if (input.phone?.trim()) score += 15;
  if (input.email?.trim()) score += 10;
  if (input.address?.trim()) score += 10;
  if (input.category?.trim()) score += 10;
  return Math.min(100, Math.max(0, score));
}
