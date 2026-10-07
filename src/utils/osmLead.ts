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

  // Existing canonical classifications must not be erased merely because older
  // records did not persist the source tags. Those tags can be recovered by OSM ID.
  const classification = lead.osmTags && lead.classificationRule !== 'manual'
    ? classifyOsmBusiness(lead.osmTags, lead.prospectingGroup)
    : undefined;
  const needsEvidence = !classification && !lead.classificationRule;

  return {
    ...lead,
    ...(classification ? {
      category: classification.categoryLabel,
      niche: classification.categoryLabel,
      canonicalNiche: classification.canonicalNiche,
      classificationVersion: BUSINESS_TAXONOMY_VERSION,
      classificationRule: classification.ruleId,
    } : needsEvidence ? { classificationRule: 'missing-osm-evidence' } : {}),
    rating: typeof lead.osmRating === 'number' ? lead.osmRating : undefined,
    reviewsCount: undefined,
    audit: undefined,
  };
}
