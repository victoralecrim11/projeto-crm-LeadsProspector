import type { Lead } from '../types.js';
import { buildLeadSiteContext } from './context.js';
import { leadSourceContextSchema, sourcedBusinessContextSchema, type LeadSourceContext } from './contracts/research.js';

export function normalizeLeadSource(lead: Lead): LeadSourceContext {
  const osmElement = lead.osmType && /^\d+$/.test(lead.osmId ?? '') ? `${lead.osmType}/${lead.osmId}` : undefined;
  return leadSourceContextSchema.parse({
    leadId: lead.id, source: lead.dataSource === 'manual' ? 'manual' : lead.dataSource === 'real' && osmElement ? 'overpass' : 'other',
    context: buildLeadSiteContext(lead), state: lead.state || '', niche: lead.niche || '', osmElement,
  });
}
export function businessFromSource(input: LeadSourceContext) {
  const source = leadSourceContextSchema.parse(input);
  const label = `${source.context.business.category} ${source.niche}`.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const derivedNiche = /odont|dentist/.test(label) ? 'dentistry' : /restaur|pizzaria/.test(label) ? 'restaurant' : 'other';
  const facts: Record<string, { value: string; provenance: 'CONFIRMED_FROM_LEAD' | 'DERIVED'; verified: boolean; evidence: string }> = {};
  const values = { name: source.context.business.name, category: source.context.business.category, city: source.context.business.city,
    neighborhood: source.context.business.neighborhood, state: source.state, ...source.context.contact, website: source.context.onlinePresence.websiteUrl };
  for (const [key, value] of Object.entries(values)) if (value) facts[key] = {
    value, provenance: 'CONFIRMED_FROM_LEAD', verified: false,
    evidence: `Campo persistido no lead (${source.source}); não verificado independentemente. Localização pode conter fallback da busca.`,
  };
  facts.niche = { value: derivedNiche, provenance: 'DERIVED', verified: false, evidence: 'Classificação por categoria/nicho persistidos; não confirma subnicho ou posicionamento premium.' };
  return sourcedBusinessContextSchema.parse({ version: 1, lead: source.context, confirmed: {}, source, businessType: 'local-business', derivedNiche, facts });
}
