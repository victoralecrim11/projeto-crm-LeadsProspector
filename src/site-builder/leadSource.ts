import type { Lead } from '../types.js';
import { buildLeadSiteContext } from './context.js';
import { leadSourceContextSchema, sourcedBusinessContextSchema, type LeadSourceContext } from './contracts/research.js';
import { BUSINESS_TAXONOMY_VERSION, CanonicalNiche, getCanonicalBusinessCategory, normalizeLegacyBusinessNiche } from '../domain/businessTaxonomy.js';

export function normalizeLeadSource(lead: Lead): LeadSourceContext {
  const osmElement = lead.osmType && /^\d+$/.test(lead.osmId ?? '') ? `${lead.osmType}/${lead.osmId}` : undefined;
  return leadSourceContextSchema.parse({
    leadId: lead.id, source: lead.dataSource === 'manual' ? 'manual' : lead.dataSource === 'real' && osmElement ? 'overpass' : 'other',
    context: buildLeadSiteContext(lead), state: lead.state || '', niche: lead.niche || '', 
    canonicalNiche: lead.canonicalNiche,
    osmElement,
  });
}
export function businessFromSource(input: LeadSourceContext) {
  const source = leadSourceContextSchema.parse(input);
  const label = `${source.context.business.category} ${source.niche}`.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  
  const derivedNiche = source.canonicalNiche || normalizeLegacyBusinessNiche(label);
  
  const facts: Record<string, { value: string; provenance: 'CONFIRMED_FROM_LEAD' | 'DERIVED'; verified: boolean; evidence: string }> = {};
  const values = { name: source.context.business.name, category: source.context.business.category, city: source.context.business.city,
    neighborhood: source.context.business.neighborhood, state: source.state, ...source.context.contact, website: source.context.onlinePresence.websiteUrl };
  for (const [key, value] of Object.entries(values)) if (value) facts[key] = {
    value, provenance: 'CONFIRMED_FROM_LEAD', verified: false,
    evidence: `Campo persistido no lead (${source.source}); não verificado independentemente. Localização pode conter fallback da busca.`,
  };
  facts.niche = { value: derivedNiche, provenance: 'DERIVED', verified: false, evidence: 'Classificação por categoria canônica, sem confirmação extra.' };
  return sourcedBusinessContextSchema.parse({ version: 1, lead: source.context, confirmed: {}, source, businessType: 'local-business', derivedNiche, facts });
}

export function resolveLeadCanonicalNiche(lead: Lead): CanonicalNiche {
  // 1. Current classification version
  if (lead.classificationVersion === BUSINESS_TAXONOMY_VERSION && lead.canonicalNiche) {
    return lead.canonicalNiche;
  }
  
  // 2. Name-based override if it strongly indicates hair-salon over barbershop
  const nameNorm = (lead.name || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (nameNorm.includes('cabeleireir') || nameNorm.includes('salao de beleza')) {
    return 'hair-salon';
  }

  // 3. Aliases legacy inequívocos
  const catFallback = normalizeLegacyBusinessNiche(lead.category || '');
  if (catFallback !== 'other') return catFallback;

  const nicheFallback = normalizeLegacyBusinessNiche(lead.niche || '');
  if (nicheFallback !== 'other') return nicheFallback;

  // 4. General name inference
  const nameFallback = normalizeLegacyBusinessNiche(lead.name || '');
  if (nameFallback !== 'other') return nameFallback;

  // 5. Stale canonical niche se nada funcionou
  if (lead.canonicalNiche) return lead.canonicalNiche;

  return 'other';
}

export function getLeadCategory(lead: Lead): string {
  const niche = resolveLeadCanonicalNiche(lead);
  return getCanonicalBusinessCategory(niche);
}
