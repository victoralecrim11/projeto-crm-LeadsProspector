import type { Lead } from '../types';
import { normalizeStoredOsmLead } from '../utils/osmLead';

type OsmIdentity = Pick<Lead, 'osmType' | 'osmId'>;
type OsmElement = { type: 'node' | 'way' | 'relation'; id: number; tags?: Record<string, string> };

export function needsOsmClassificationRecovery(lead: Lead): boolean {
  return lead.dataSource === 'real'
    && lead.classificationRule === 'missing-osm-evidence'
    && !lead.osmTags
    && /^(node|way|relation)$/.test(lead.osmType ?? '')
    && /^[1-9]\d*$/.test(lead.osmId ?? '');
}

export function buildOsmClassificationQuery(leads: OsmIdentity[]): string {
  const clauses = (['node', 'way', 'relation'] as const).flatMap(type => {
    const ids = [...new Set(leads.filter(lead => lead.osmType === type && /^[1-9]\d*$/.test(lead.osmId ?? ''))
      .map(lead => lead.osmId!))];
    return ids.length ? [`${type}(id:${ids.join(',')});`] : [];
  });
  return `[out:json][timeout:25];(${clauses.join('')});out tags;`;
}

export function recoverOsmClassifications(leads: Lead[], elements: OsmElement[]): Lead[] {
  const byId = new Map(elements
    .filter(element => element.tags && ['node', 'way', 'relation'].includes(element.type))
    .map(element => [`${element.type}/${element.id}`, element.tags!]));

  return leads.map(lead => {
    if (!needsOsmClassificationRecovery(lead)) return lead;
    const tags = byId.get(`${lead.osmType}/${lead.osmId}`);
    return tags ? normalizeStoredOsmLead({ ...lead, osmTags: tags }) : lead;
  });
}

/** Refresh only records whose category was lost by the old migration. */
export async function fetchOsmClassificationEvidence(leads: Lead[]): Promise<OsmElement[]> {
  const candidates = leads.filter(needsOsmClassificationRecovery);
  const elements: OsmElement[] = [];
  for (let offset = 0; offset < candidates.length; offset += 50) {
    const response = await fetch('/api/overpass', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: buildOsmClassificationQuery(candidates.slice(offset, offset + 50)) }),
    });
    if (!response.ok) throw new Error(`Falha ao consultar o OSM (${response.status})`);
    const data: { elements?: OsmElement[] } = await response.json();
    if (!Array.isArray(data.elements)) throw new Error('Resposta inválida do OSM');
    elements.push(...data.elements);
  }
  return elements;
}
