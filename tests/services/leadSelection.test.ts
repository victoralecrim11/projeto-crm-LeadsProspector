import test from 'node:test';
import assert from 'node:assert/strict';
import type { Lead } from '../../src/types.js';
import {
  createInitialLeadSelection,
  filterLeadsByCategory,
} from '../../src/site-builder/components/wizard/leadSelection.js';

function createLead(overrides: Partial<Lead>): Lead {
  return {
    id: 'lead-default',
    name: 'Negócio local',
    category: 'Barbearia',
    niche: 'barbearia',
    city: 'Belo Horizonte',
    state: 'MG',
    address: 'Rua de teste',
    phone: '31999999999',
    hasWebsite: false,
    inCrm: true,
    temperature: 'frio',
    score: 50,
    createdAt: new Date(0).toISOString(),
    ...overrides,
  };
}

test('mantém o lead legado selecionado dentro do filtro canônico do gerador', () => {
  const julia = createLead({
    id: 'julia',
    name: 'Júlia Cabeleireira',
    category: 'Barbearia',
    niche: 'barbearia',
  });
  const eustaquio = createLead({
    id: 'eustaquio',
    name: 'Eustáquio Cabeleireiros',
  });
  const barbearia = createLead({
    id: 'barbearia',
    name: 'Barbearia Central',
  });
  const leads = [julia, eustaquio, barbearia];

  const selection = createInitialLeadSelection(leads, julia.id);
  const filteredLeads = filterLeadsByCategory(leads, selection.categoryId || 'all');

  assert.deepEqual(selection, {
    categoryId: 'hair-salon',
    leadId: julia.id,
  });
  assert.deepEqual(
    filteredLeads.map((lead) => lead.id),
    ['julia', 'eustaquio'],
  );
});

test('não conserva um identificador inicial que não existe na lista atual', () => {
  const selection = createInitialLeadSelection([], 'lead-removido');

  assert.deepEqual(selection, { categoryId: null, leadId: null });
});
