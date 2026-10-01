import test from 'node:test';
import assert from 'node:assert/strict';
import JSZip from 'jszip';
import { renderSiteDocument } from '../../src/site-builder/renderer/SiteRenderer.js';
import { createSiteZip } from '../../src/site-builder/exportSite.js';
import { InMemoryMediaAssetStore } from '../../src/site-builder/media/assetStore.js';
import { blueprint, context } from '../fixtures/siteFixture.js';
import type { MediaManifestEntry, MediaManifest } from '../../src/site-builder/contracts/media.js';
import type { Project } from '../../src/types.js';

// Synthetic metadata/bytes only; no provider requests or business-media claims.
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
