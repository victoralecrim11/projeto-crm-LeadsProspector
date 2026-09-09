import type { Lead } from '../../src/types';
// Entirely fictitious; no captured lead IDs, contact details or addresses.
export function pilotLead(niche: 'dentistry' | 'restaurant'): Lead {
  return { id: `fictional-${niche}`, name: niche === 'dentistry' ? 'Clínica Exemplo Fictício' : 'Mesa Exemplo Fictício',
    category: niche === 'dentistry' ? 'Clínica Odontológica' : 'Restaurante & Pizzaria', niche,
    phone: '', email: 'contato@example.invalid', city: 'Cidade Exemplo', state: 'EX', address: 'Rua Fictícia, 0',
    hasWebsite: false, inCrm: false, createdAt: '2026-09-08', temperature: 'frio', score: 0,
    dataSource: 'real', osmId: '0', osmType: 'node', geoLat: 0, geoLng: 0 };
}
