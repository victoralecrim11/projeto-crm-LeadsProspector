import test from 'node:test';
import assert from 'node:assert/strict';
import { classifyOsmBusiness, BUSINESS_TAXONOMY_VERSION } from '../../src/domain/businessTaxonomy';
import { normalizeStoredOsmLead } from '../../src/utils/osmLead';
import { fetchLeadsFromOverpass } from '../../src/services/overpassService';
import { resolveLeadCanonicalNiche } from '../../src/site-builder/leadSource';
import { matchesNiche } from '../../src/services/leadGeneratorService';
import { buildOsmClassificationQuery, fetchOsmClassificationEvidence, recoverOsmClassifications } from '../../src/services/osmClassificationRecovery';
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

test('legacy migration retains existing fields while source evidence is missing', () => {
  const normalized = normalizeStoredOsmLead(legacy);
  assert.equal(normalized.category, 'Barbearia');
  assert.equal(normalized.classificationRule, 'missing-osm-evidence');
  assert.equal(resolveLeadCanonicalNiche(normalized), 'other');
  assert.equal(normalized.address, legacy.address);
  assert.equal(normalized.name, legacy.name);
  assert.deepEqual(normalizeStoredOsmLead(normalized), normalized);
  assert.deepEqual(normalizeStoredOsmLead({ ...legacy, dataSource: 'manual' }), { ...legacy, dataSource: 'manual' });
});

test('previously erased categories recover from exact OSM identities', async t => {
  const damaged = Array.from({ length: 46 }, (_, index): Lead => ({
    ...legacy, id: `lead-${index + 1}`, osmId: String(index + 1),
    name: index === 0 ? 'Vitalitá Instituto de Beleza' : `Negócio ${index + 1}`,
    category: 'Nicho não confirmado', niche: 'Nicho não confirmado',
    canonicalNiche: 'other', classificationVersion: BUSINESS_TAXONOMY_VERSION,
    classificationRule: 'missing-osm-evidence',
  }));
  assert.equal(resolveLeadCanonicalNiche(damaged[0]), 'beauty-studio');
  assert.equal(damaged.filter(lead => resolveLeadCanonicalNiche(lead) === 'other').length, 45);
  const query = buildOsmClassificationQuery(damaged);
  assert.match(query, /node\(id:1,2,3/);
  assert.ok(!query.includes('undefined'));
  t.mock.method(globalThis, 'fetch', async (_url, init) => {
    assert.equal(JSON.parse(init!.body as string).query, query);
    return new Response(JSON.stringify({ elements: damaged.map((lead, index) => ({
      type: 'node', id: Number(lead.osmId), tags: index === 0
        ? { name: lead.name, shop: 'beauty' }
        : { name: lead.name, amenity: 'restaurant' },
    })) }), { status: 200 });
  });
  const elements = await fetchOsmClassificationEvidence(damaged);
  const recovered = recoverOsmClassifications(damaged, elements);
  assert.equal(recovered.filter(lead => resolveLeadCanonicalNiche(lead) === 'other').length, 0);
  assert.equal(recovered[0].canonicalNiche, 'beauty-studio');
  assert.equal(recovered[1].canonicalNiche, 'restaurant');
  assert.equal(recovered[0].inCrm, true);
  assert.deepEqual(recoverOsmClassifications(recovered, elements), recovered);
  assert.equal(recoverOsmClassifications(damaged, [{ type: 'node', id: 999, tags: { shop: 'barber' } }])[0], damaged[0]);
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
