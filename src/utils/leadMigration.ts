import { Lead } from '../types';

export function migrateLegacyLeads(leads: Lead[]): { migratedLeads: Lead[], wasMigrated: boolean } {
  let wasMigrated = false;

  const migratedLeads = leads.map(lead => {
    // Se o lead não possui placeId antigo, ou se já possui as chaves novas, pula
    if (!lead.placeId) return lead;
    if (lead.osmId || lead.googlePlaceId) return lead;

    const newLead = { ...lead };
    let hasChanges = false;

    // Identifica e desestrutura o ID do OSM antigo
    if (lead.placeId.startsWith('node/') || lead.placeId.startsWith('way/') || lead.placeId.startsWith('relation/')) {
      const parts = lead.placeId.split('/');
      newLead.osmType = parts[0] as 'node' | 'way' | 'relation';
      newLead.osmId = parts[1];
      newLead.osmLat = lead.geoLat;
      newLead.osmLng = lead.geoLng;
      hasChanges = true;
    } else if (lead.placeId.startsWith('ChIJ')) {
      // Place IDs do Google Maps geralmente começam com ChIJ
      newLead.googlePlaceId = lead.placeId;
      hasChanges = true;
    }

    if (hasChanges) {
      wasMigrated = true;
      return newLead;
    }

    return lead;
  });

  return { migratedLeads, wasMigrated };
}
