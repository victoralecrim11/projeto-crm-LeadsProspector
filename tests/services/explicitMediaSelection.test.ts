import test from 'node:test';
import assert from 'node:assert/strict';
import JSZip from 'jszip';
import { renderSiteDocument } from '../../src/site-builder/renderer/SiteRenderer.js';
import { createSiteZip } from '../../src/site-builder/exportSite.js';
import { InMemoryMediaAssetStore } from '../../src/site-builder/media/assetStore.js';
import { blueprint, context } from '../fixtures/siteFixture.js';
import type { MediaManifestEntry, MediaManifest } from '../../src/site-builder/contracts/media.js';
import type { Project } from '../../src/types.js';

// Apenas metadados/bytes sintéticos; sem chamadas a provedores ou alegações de mídia real.
function entry(id: string, reviewStatus: MediaManifestEntry['reviewStatus']): MediaManifestEntry {
  return { id, requestId: 'fixture-request', section: 'hero', sourceType: 'licensed',
    provider: 'pexels', providerAssetId: id, licenseLabel: 'Fixture license',
    retrievedAt: '2026-09-30T00:00:00.000Z', contentHash: 'e'.repeat(64),
    assetId: id, assetPath: id + '.jpg', mimeType: 'image/jpeg', width: 10, height: 10,
    byteLength: 4, alt: id, decorative: false, realBusinessMedia: false,
    licensed: true, aiGenerated: false, reviewStatus };
}
function manifest(entries: MediaManifestEntry[]): MediaManifest {
  return { version: 1, projectId: 'explicit-media-fixture',
    generatedAt: '2026-09-30T00:00:00.000Z', entries };
}
function selectedBlueprint(assetId: string) {
  return { ...blueprint, hero: { ...blueprint.hero, assetId } };
}
test('explicit media cannot render candidate or rejected images in preview', () => {
  for (const status of ['candidate', 'rejected'] as const) {
    const data = manifest([entry('approved-fixture', 'exportable'), entry('chosen-fixture', status)]);
    const before = JSON.stringify(data);
    const html = renderSiteDocument(selectedBlueprint('chosen-fixture'), context, undefined, data, {
      'approved-fixture': 'data:image/jpeg;base64,AQIDBA==',
      'chosen-fixture': 'data:image/jpeg;base64,BQYHCA==',
    });
    assert.doesNotMatch(html, /alt="chosen-fixture"/);
    assert.doesNotMatch(html, /alt="approved-fixture"/, 'An explicit choice must not silently select a different image.');
    assert.equal(JSON.stringify(data), before);
  }
});

test('missing explicit media has the same empty state in preview and exported ZIP', async () => {
  const data = manifest([entry('approved-fixture', 'exportable')]);
  const selected = selectedBlueprint('missing-fixture');
  const preview = renderSiteDocument(selected, context, undefined, data, {
    'approved-fixture': 'data:image/jpeg;base64,AQIDBA==',
  });
  assert.doesNotMatch(preview, /alt="approved-fixture"/);
  const store = new InMemoryMediaAssetStore();
  const media = data.entries[0], bytes = new Uint8Array([1, 2, 3, 4]);
  await store.put({ assetId: media.assetId, requestId: media.requestId, provider: media.provider,
    storageKey: 'fixture-storage', mimeType: media.mimeType, width: media.width, height: media.height,
    byteLength: bytes.length, contentHash: media.contentHash, createdAt: data.generatedAt }, bytes);
  const project = { id: data.projectId, siteBlueprint: selected, siteContext: context,
    contentReviewed: true, siteMediaManifest: data } as Project;
  const before = JSON.stringify(project);
  const zip = await JSZip.loadAsync(await createSiteZip(project, store));
  assert.doesNotMatch(await zip.file('index.html')!.async('string'), /alt="approved-fixture"/);
  assert.ok(zip.file('assets/approved-fixture.jpg'), 'An unavailable choice does not delete other assets.');
  assert.deepEqual(await store.getBuffer(media.assetId), bytes);
  assert.equal(JSON.stringify(project), before);
});

test('valid explicit choices and automatic media retain their existing behavior', () => {
  for (const status of ['selected', 'reviewed', 'exportable'] as const) {
    const data = manifest([entry('approved-fixture', 'exportable'), entry('chosen-fixture', status)]);
    const urls = { 'approved-fixture': 'data:image/jpeg;base64,AQIDBA==',
      'chosen-fixture': 'data:image/jpeg;base64,BQYHCA==' };
    const html = renderSiteDocument(selectedBlueprint('chosen-fixture'), context, undefined, data, urls);
    assert.match(html, /alt="chosen-fixture"/);
    assert.doesNotMatch(html, /alt="approved-fixture"/);
    const automatic = renderSiteDocument(blueprint, context, undefined, data, urls);
    assert.match(automatic, /alt="approved-fixture"/);
    const removed = renderSiteDocument(selectedBlueprint('__REMOVE__'), context, undefined, data, urls);
    assert.doesNotMatch(removed, /alt="approved-fixture"|alt="chosen-fixture"/);
  }
});

test('mídia reutilizada preserva alt e intenção decorativa de cada seção', () => {
  const about = { ...entry('shared-fixture', 'exportable'), id: 'about-slot',
    section: 'about' as const, decorative: true, alt: '' };
  const hero = { ...entry('shared-fixture', 'exportable'), id: 'hero-slot',
    alt: 'Descrição informativa da abertura' };
  const data = manifest([about, hero]);
  const before = JSON.stringify(data);
  const chosen = { ...selectedBlueprint('shared-fixture'),
    about: { ...blueprint.about, assetId: 'shared-fixture' } };
  for (const entries of [[about, hero], [hero, about]]) {
    const html = renderSiteDocument(chosen, context, undefined, { ...data, entries },
      { 'shared-fixture': 'data:image/jpeg;base64,AQIDBA==' });
    assert.match(html, /alt="Descrição informativa da abertura"/);
    assert.match(html, /alt=""/);
  }
  assert.equal(JSON.stringify(data), before);
});

test('aprovação de outra seção não revive a seleção explicitamente rejeitada', async () => {
  const about = { ...entry('shared-fixture', 'exportable'), id: 'about-slot', section: 'about' as const };
  for (const status of ['candidate', 'rejected'] as const) {
    const hero = { ...entry('shared-fixture', status), id: 'hero-slot' };
    const html = renderSiteDocument(selectedBlueprint('shared-fixture'), context, undefined,
      manifest([about, hero]), { 'shared-fixture': 'data:image/jpeg;base64,AQIDBA==' });
    assert.doesNotMatch(html, /hero-full-bleed has-media/);
    const store = new InMemoryMediaAssetStore(), bytes = new Uint8Array([1, 2, 3, 4]);
    const data = manifest([about, hero]);
    await store.put({ assetId: about.assetId, requestId: about.requestId, provider: about.provider,
      storageKey: 'fixture-rejected', mimeType: about.mimeType, width: about.width, height: about.height,
      byteLength: bytes.length, contentHash: about.contentHash, createdAt: data.generatedAt }, bytes);
    const project = { id: data.projectId, siteBlueprint: selectedBlueprint('shared-fixture'),
      siteContext: context, contentReviewed: true, siteMediaManifest: data } as Project;
    const zip = await JSZip.loadAsync(await createSiteZip(JSON.parse(JSON.stringify(project)), store));
    assert.doesNotMatch(await zip.file('index.html')!.async('string'), /hero-full-bleed has-media/);
    const exported = JSON.parse(await zip.file('media/media-manifest.json')!.async('string'));
    assert.deepEqual(exported.entries.map((e: MediaManifestEntry) => e.id), ['about-slot']);
    assert.deepEqual(await store.getBuffer(about.assetId), bytes);
  }
});

test('ZIP após reload mantém metadados por seção ao reutilizar os mesmos bytes', async () => {
  const about = { ...entry('shared-fixture', 'exportable'), id: 'about-slot',
    section: 'about' as const, alt: 'Descrição da seção sobre' };
  const hero = { ...entry('shared-fixture', 'exportable'), id: 'hero-slot', alt: 'Descrição da abertura' };
  const data = manifest([about, hero]), bytes = new Uint8Array([1, 2, 3, 4]);
  const store = new InMemoryMediaAssetStore();
  await store.put({ assetId: hero.assetId, requestId: hero.requestId, provider: hero.provider,
    storageKey: 'fixture-shared', mimeType: hero.mimeType, width: hero.width, height: hero.height,
    byteLength: bytes.length, contentHash: hero.contentHash, createdAt: data.generatedAt }, bytes);
  const chosen = { ...selectedBlueprint('shared-fixture'),
    about: { ...blueprint.about, assetId: 'shared-fixture' } };
  const project = { id: data.projectId, siteBlueprint: chosen, siteContext: context,
    contentReviewed: true, siteMediaManifest: data } as Project;
  const saved = JSON.stringify(project), reloaded = JSON.parse(saved) as Project;
  for (let iteration = 0; iteration < 2; iteration++) {
    const zip = await JSZip.loadAsync(await createSiteZip(reloaded, store));
    const html = await zip.file('index.html')!.async('string');
    assert.match(html, /alt="Descrição da abertura"/);
    assert.match(html, /alt="Descrição da seção sobre"/);
    assert.deepEqual(await zip.file('assets/shared-fixture.jpg')!.async('uint8array'), bytes);
    assert.equal(JSON.stringify(reloaded), saved);
  }
  assert.deepEqual(await store.getBuffer(hero.assetId), bytes);
});

test('referência antiga sem entrada da seção continua resolvendo pelo assetId', () => {
  const data = manifest([{ ...entry('legacy-fixture', 'exportable'), section: 'about' }]);
  const html = renderSiteDocument(selectedBlueprint('legacy-fixture'), context, undefined, data,
    { 'legacy-fixture': 'data:image/jpeg;base64,AQIDBA==' });
  assert.match(html, /hero-full-bleed has-media/);
  assert.match(html, /alt="legacy-fixture"/);
});
