import { Lead } from '../types';
import { isValidCoordinate } from './coordinates';

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

  return {
    ...lead,
    rating: typeof lead.osmRating === 'number' ? lead.osmRating : undefined,
    reviewsCount: undefined,
    audit: undefined,
  };
}
