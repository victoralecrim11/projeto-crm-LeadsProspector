import test from 'node:test';
import assert from 'node:assert/strict';
import { blueprint, context } from '../fixtures/siteFixture';
import { renderSiteDocument } from '../../src/site-builder/renderer/SiteRenderer';

test('ambas as versões do rodapé oferecem navegação e contato confirmado', () => {
  const withContact = {
    ...context,
    contact: { ...context.contact, whatsapp: '5531999999999' },
  };
  for (const variant of ['minimal', 'editorial'] as const) {
    const html = renderSiteDocument({ ...blueprint, visual: { ...blueprint.visual, footer: variant } }, withContact);
    const footer = html.match(/<footer[\s\S]*?<\/footer>/)?.[0] ?? '';
    assert.match(footer, /Atendimento/);
    assert.match(footer, /Conversar no WhatsApp/);
    assert.match(footer, /href="https:\/\/wa.me\/5531999999999"/);
    assert.match(footer, /Navegação do rodapé/);
    assert.match(footer, /href="#site-main"/);
    assert.match(footer, /Salão Renova/);
    assert.doesNotMatch(footer, /Conhecer os serviços/);
    assert.doesNotMatch(footer, /Créditos de imagem/);
  }
});

test('rodapé não inventa um meio de contato ausente', () => {
  const html = renderSiteDocument(blueprint, context);
  const footer = html.match(/<footer[\s\S]*?<\/footer>/)?.[0] ?? '';
  assert.doesNotMatch(footer, /wa\.me|tel:|mailto:/);
  assert.doesNotMatch(footer, /footer-cta/);
  assert.match(footer, /Voltar ao início/);
});
