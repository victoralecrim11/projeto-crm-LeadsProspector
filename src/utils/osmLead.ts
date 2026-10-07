import { Lead } from '../types';
import { isValidCoordinate } from './coordinates';
import { BUSINESS_TAXONOMY_VERSION, classifyOsmBusiness } from '../domain/businessTaxonomy';

/** True only for leads that can be traced back to a concrete OSM element. */
export function isVerifiedOsmLead(lead: Lead): boolean {
  return lead.dataSource === 'real'
    && (lead.osmType === 'node' || lead.osmType === 'way' || lead.osmType === 'relation')
    && Boolean(lead.osmId)
    && isValidCoordinate(lead.geoLat, lead.geoLng);
}

/** Removes fields from old local records when their OSM source cannot prove them. */
export function normalizeStoredOsmLead(lead: Lead): Lead {
  if (!isVerifiedOsmLead(lead)) return lead;

  // Legacy search-group labels are not evidence of an individual business's niche.
  // Without the original tags, wait for a rescan instead of guessing from its name.
  const classification = lead.osmTags && lead.classificationRule !== 'manual'
    ? classifyOsmBusiness(lead.osmTags, lead.prospectingGroup)
    : undefined;
  const needsEvidence = !classification && lead.classificationVersion !== BUSINESS_TAXONOMY_VERSION;

  return {
    ...lead,
    ...(classification ? {
      category: classification.categoryLabel,
      niche: classification.categoryLabel,
      canonicalNiche: classification.canonicalNiche,
      classificationVersion: BUSINESS_TAXONOMY_VERSION,
      classificationRule: classification.ruleId,
    } : needsEvidence ? {
      category: 'Nicho não confirmado',
      niche: 'Nicho não confirmado',
      canonicalNiche: 'other' as const,
      classificationVersion: BUSINESS_TAXONOMY_VERSION,
      classificationRule: 'missing-osm-evidence',
    } : {}),
    rating: typeof lead.osmRating === 'number' ? lead.osmRating : undefined,
    reviewsCount: undefined,
    audit: undefined,
  };
}
