import test from 'node:test';
import assert from 'node:assert/strict';
import JSZip from 'jszip';
import { addExampleServicePrices } from '../../src/site-builder/exampleServicePrices.js';
import { renderSiteDocument } from '../../src/site-builder/renderer/SiteRenderer.js';
import { createSiteZip } from '../../src/site-builder/exportSite.js';
import { blueprint, context, project } from '../fixtures/siteFixture.js';
import { getMockResolvedDesign } from '../fixtures/stitchProducerFixtures.js';

test('valores ilustrativos de barbearia aparecem na prévia e no ZIP sem virar preço confirmado', async () => {
  const draft = { ...blueprint, sections: { ...blueprint.sections, services: true }, services: [
    { title: 'Corte de Cabelo', description: 'Corte masculino.', source: 'ai_suggestion' as const },
    { title: 'Barba', description: 'Cuidado com a barba.', source: 'ai_suggestion' as const },
    { title: 'Corte e Barba', description: 'Serviço combinado.', source: 'ai_suggestion' as const },
  ] };
  const withPrices = addExampleServicePrices(draft, 'Barbearia');
  const design = { ...getMockResolvedDesign('Barbearia'), stitch: {
    alternatives: ['test'], selected: 'test', review: 'test',
    appearance: { mobile: { version: 1 as const, imageryPresent: false, limitations: [], serviceCardStyle: 'technical' as const } },
  } };
  assert.deepEqual(withPrices.services.map(s => s.price), ['R$ 85,00', 'R$ 65,00', 'R$ 135,00']);
  assert.ok(withPrices.services.every(s => s.priceKind === 'example' && s.source === 'ai_suggestion'));
  const preview = renderSiteDocument(withPrices, context, design);
  assert.match(preview, /Valor ilustrativo/);
  assert.match(preview, /stitch-services/);
  assert.match(preview, /box-shadow:6px 6px/);
  await assert.rejects(createSiteZip({ ...project, siteBlueprint: withPrices }), /Aceite ou remova/);

  const approvedServices = withPrices.services.map(s => ({ ...s, source: 'known' as const }));
  const bytes = await createSiteZip({ ...project, siteBlueprint: { ...withPrices, services: approvedServices }, siteDesign: design });
  const html = await (await JSZip.loadAsync(bytes)).file('index.html')!.async('string');
  assert.match(html, /R\$ 85,00/);
  assert.match(html, /Valor ilustrativo/);
  assert.ok(approvedServices.every(s => s.priceKind === 'example'));
});

test('preço exemplificativo só é sugerido para serviços reconhecidos do nicho', () => {
  const input = { ...blueprint, services: [
    { title: 'Consultoria', description: '', source: 'ai_suggestion' as const },
    { title: 'Barba', description: '', source: 'known' as const },
  ] };
  assert.deepEqual(addExampleServicePrices(input, 'Barbearia').services, input.services);
  assert.deepEqual(addExampleServicePrices(input, 'Restaurante').services, input.services);
});
