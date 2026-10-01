import test from 'node:test';
import assert from 'node:assert/strict';
import { buildAboutContent } from '../../src/site-builder/aboutContent.js';
import { BUSINESS_CATEGORIES } from '../../src/domain/businessTaxonomy.js';
import { constrainBlueprint } from '../../src/site-builder/context.js';
import { renderSiteDocument } from '../../src/site-builder/renderer/SiteRenderer.js';
import { buildLicensedMediaQueries } from '../../server/services/media/queryBuilder.js';
import { blueprint, context } from '../fixtures/siteFixture.js';

test('every supported niche has a substantive, distinct About narrative', () => {
  const stories = BUSINESS_CATEGORIES.map(({ id, label }) => {
    const about = buildAboutContent({ ...context, business: { ...context.business, category: label } }, id);
    assert.ok(about.description.split(/\s+/).length >= 65, id);
    assert.equal(about.description.split('\n\n').length, 3);
    assert.ok(about.description.includes(context.business.name));
    if (id !== 'barbershop') assert.doesNotMatch(about.description, /barba|cuidado masculino/);
    return about.title;
  });
  assert.equal(new Set(stories).size, BUSINESS_CATEGORIES.length);
});

test('thin AI output is repaired without changing manual copy or asset selection', () => {
  const input = { ...blueprint, about: { title: 'Sobre', description: 'Belo Horizonte', assetId: 'chosen' } };
  const generated = constrainBlueprint(input, context, true);
  assert.ok(generated.about.description.length > 300);
  assert.equal(generated.about.assetId, 'chosen');
  assert.equal(constrainBlueprint(input, context).about.description, 'Belo Horizonte');
  assert.equal(input.about.description, 'Belo Horizonte');
});

test('both About layouts render paragraphs safely', () => {
  for (const layout of ['editorial-split', 'centered-story'] as const) {
    const html = renderSiteDocument({ ...blueprint, visual: { ...blueprint.visual, about: layout }, about: { title: 'Sobre', description: 'Primeiro parágrafo.\n\n<script>alert(1)</script>' } }, context);
    assert.ok(html.includes('<p>Primeiro parágrafo.</p>'));
    assert.ok(html.includes('<p>&lt;script&gt;alert(1)&lt;/script&gt;</p>'));
  }
});

test('barbershop About imagery targets premium grooming while salons remain distinct', () => {
  const barber = buildLicensedMediaQueries({ niche: 'Barbearia', section: 'about', purpose: '' });
  const salon = buildLicensedMediaQueries({ niche: 'Salão de Beleza / Cabeleireiro', section: 'about', purpose: '' });
  assert.match(barber[0], /premium barbershop/);
  assert.match(salon[0], /hair salon/);
  assert.notEqual(barber[0], salon[0]);
});
