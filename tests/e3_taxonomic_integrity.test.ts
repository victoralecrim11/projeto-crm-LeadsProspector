import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveLeadCanonicalNiche, getLeadCategory } from '../src/site-builder/leadSource.js';
import { Lead } from '../src/types.js';
import { BUSINESS_TAXONOMY_VERSION } from '../src/domain/businessTaxonomy.js';

test('E.3 Taxonomic Integrity - should reclassify legacy "Júlia Cabeleireira" correctly', () => {
  const legacyLead: Lead = {
    id: 'legacy-1',
    name: 'Júlia Cabeleireira',
    category: 'Barbearia', // Erroneously mapped in v1
    niche: 'barbearia',
    city: 'Belo Horizonte',
    state: 'MG',
    address: 'Rua X',
    phone: '31999999999',
    hasWebsite: false,
    inCrm: false,
    temperature: 'frio',
    score: 50,
    createdAt: new Date().toISOString()
  };

  const niche = resolveLeadCanonicalNiche(legacyLead);
  assert.equal(niche, 'hair-salon');
  assert.equal(getLeadCategory(legacyLead), 'Salão de Beleza / Cabeleireiro');
});

test('E.3 Taxonomic Integrity - should fallback to category if name is generic', () => {
  const legacyLead: Lead = {
    id: 'legacy-2',
    name: 'Studio Master',
    category: 'Barbearia',
    niche: 'barbearia',
    city: 'Belo Horizonte',
    state: 'MG',
    address: 'Rua X',
    phone: '31999999999',
    hasWebsite: false,
    inCrm: false,
    temperature: 'frio',
    score: 50,
    createdAt: new Date().toISOString()
  };

  const niche = resolveLeadCanonicalNiche(legacyLead);
  assert.equal(niche, 'barbershop');
});

test('E.3 Taxonomic Integrity - should respect classificationVersion === 2', () => {
  const explicitLead: Lead = {
    id: 'v2-1',
    name: 'Júlia Cabeleireira', // The name says hair-salon...
    category: 'Barbearia', // The legacy fields say barbearia...
    niche: 'barbearia',
    canonicalNiche: 'barbershop', // ...but we explicitly classified it as barbershop using V2
    classificationVersion: BUSINESS_TAXONOMY_VERSION,
    city: 'Belo Horizonte',
    state: 'MG',
    address: 'Rua X',
    phone: '31999999999',
    hasWebsite: false,
    inCrm: false,
    temperature: 'frio',
    score: 50,
    createdAt: new Date().toISOString()
  };

  const niche = resolveLeadCanonicalNiche(explicitLead);
  assert.equal(niche, 'barbershop');
});

test('E.3 Taxonomic Integrity - should override stale canonicalNiche if classificationVersion is missing or old', () => {
  const staleLead: Lead = {
    id: 'stale-1',
    name: 'Júlia Cabeleireira',
    category: 'Barbearia',
    niche: 'barbearia',
    canonicalNiche: 'barbershop', // Stale!
    classificationVersion: 1, // Old version
    city: 'Belo Horizonte',
    state: 'MG',
    address: 'Rua X',
    phone: '31999999999',
    hasWebsite: false,
    inCrm: false,
    temperature: 'frio',
    score: 50,
    createdAt: new Date().toISOString()
  };

  const niche = resolveLeadCanonicalNiche(staleLead);
  assert.equal(niche, 'hair-salon'); // Fixed!
});
