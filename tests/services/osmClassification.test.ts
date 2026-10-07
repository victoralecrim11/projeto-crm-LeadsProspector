import test from 'node:test';
import assert from 'node:assert/strict';
import { classifyOsmBusiness, BUSINESS_TAXONOMY_VERSION } from '../../src/domain/businessTaxonomy';
import { normalizeStoredOsmLead } from '../../src/utils/osmLead';
import { fetchLeadsFromOverpass } from '../../src/services/overpassService';
import { resolveLeadCanonicalNiche } from '../../src/site-builder/leadSource';
import { matchesNiche } from '../../src/services/leadGeneratorService';
import type { Lead } from '../../src/types';

const legacy: Lead = {
  id: 'julia', name: 'Júlia Cabeleireira', category: 'Barbearia', niche: 'Barbearia',
  city: 'Belo Horizonte', state: 'MG', address: 'Rua Rosinha Sigaud, 1324', phone: '',
  hasWebsite: false, inCrm: true, temperature: 'quente', score: 75, createdAt: '2026-01-01',
  osmType: 'node', osmId: '123', geoLat: -19.88, geoLng: -43.97, dataSource: 'real',
};

test('salão spa is beauty, while explicit OSM tags remain the source evidence', () => {
  assert.equal(classifyOsmBusiness({ name: 'Júlia’s Salão Spa' }).canonicalNiche, 'beauty-studio');
  assert.equal(classifyOsmBusiness({ name: 'Espaço Central' }).canonicalNiche, 'other');
  assert.equal(classifyOsmBusiness({ name: 'Júlia', shop: 'beauty' }, 'Barbearia').canonicalNiche, 'beauty-studio');
  assert.equal(classifyOsmBusiness({ name: 'Júlia Cabeleireira', shop: 'hairdresser' }).canonicalNiche, 'hair-salon');
  assert.equal(classifyOsmBusiness({ shop: 'hairdresser', hairdresser: 'barber' }).canonicalNiche, 'barbershop');
  assert.equal(resolveLeadCanonicalNiche({ ...legacy, name: 'Júlia’s Salão Spa' }), 'beauty-studio');
});

test('legacy address/name do not prove the niche, and normalization is idempotent', () => {
  const normalized = normalizeStoredOsmLead(legacy);
  assert.equal(normalized.category, 'Nicho não confirmado');
  assert.equal(resolveLeadCanonicalNiche(normalized), 'other');
  assert.equal(normalized.address, legacy.address);
  assert.equal(normalized.name, legacy.name);
  assert.deepEqual(normalizeStoredOsmLead(normalized), normalized);
  assert.deepEqual(normalizeStoredOsmLead({ ...legacy, dataSource: 'manual' }), { ...legacy, dataSource: 'manual' });
});

test('stored source tags repair stale categories but preserve a manual correction', () => {
  const updated = normalizeStoredOsmLead({ ...legacy, osmTags: { name: legacy.name, shop: 'beauty' } });
  assert.equal(updated.canonicalNiche, 'beauty-studio');
  assert.equal(updated.category, 'Estética & Beleza');
  assert.equal(updated.inCrm, true);
  const manual = normalizeStoredOsmLead({ ...updated, osmTags: { shop: 'hairdresser' }, classificationRule: 'manual' });
  assert.equal(manual.canonicalNiche, 'beauty-studio');
});

test('search preserves classification version and raw tags without inheriting the search group', async t => {
  const tags = { name: 'Júlia’s Salão Spa', shop: 'beauty', 'addr:street': 'Rua Rosinha Sigaud', 'addr:housenumber': '1324' };
  t.mock.method(globalThis, 'fetch', async () => new Response(JSON.stringify({ elements: [
    { type: 'node', id: 123, lat: -19.88, lon: -43.97, tags },
  ] }), { status: 200 }));
  const [lead] = await fetchLeadsFromOverpass({ lat: -19.88, lng: -43.97, radiusMeters: 1000, niche: 'Barbearia' }, 'Belo Horizonte', 'MG');
  assert.equal(lead.category, 'Estética & Beleza');
  assert.equal(lead.classificationVersion, BUSINESS_TAXONOMY_VERSION);
  assert.deepEqual(lead.osmTags, tags);
  assert.equal(matchesNiche('Salão de Beleza / Cabeleireiro', 'Barbearia'), true);
});

test('rescan updates exact OSM identity without losing CRM data or manual corrections', async () => {
  const storage = new Map<string, string>();
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => storage.set(key, value),
    removeItem: (key: string) => storage.delete(key),
  } });
  const { useLeadStore } = await import('../../src/store/leadStore');
  useLeadStore.getState().setLeads([{ ...legacy, crmStage: 'negociacao', dealValue: 2500, notes: ['Contato feito'] }]);
  const incoming = { ...legacy, inCrm: false, osmTags: { shop: 'beauty' } };
  useLeadStore.getState().addCustomLead(incoming);
  const [updated] = useLeadStore.getState().leads;
  assert.equal(useLeadStore.getState().leads.length, 1);
  assert.equal(updated.category, 'Estética & Beleza');
  assert.equal(updated.crmStage, 'negociacao');
  assert.equal(updated.dealValue, 2500);
  assert.deepEqual(updated.notes, ['Contato feito']);
  useLeadStore.getState().updateLeadDetails({ ...updated, classificationRule: 'manual' });
  useLeadStore.getState().addCustomLead({ ...incoming, osmTags: { shop: 'hairdresser' } });
  assert.equal(useLeadStore.getState().leads[0].canonicalNiche, 'beauty-studio');
});
