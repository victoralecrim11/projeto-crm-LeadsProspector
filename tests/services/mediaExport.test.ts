import test from 'node:test';
import assert from 'node:assert/strict';
import JSZip from 'jszip';
import { renderSiteDocument } from '../../src/site-builder/renderer/SiteRenderer.js';
import { createSiteZip } from '../../src/site-builder/exportSite.js';
import { applySiteUserOverrides } from '../../src/site-builder/overridesResolver.js';
import { normalizeForRender } from '../../src/site-builder/sections/registry.js';
import { InMemoryMediaAssetStore } from '../../src/site-builder/media/assetStore.js';
import { blueprint as baseBlueprint, context as baseContext } from '../fixtures/siteFixture.js';
import type { MediaManifest } from '../../src/site-builder/contracts/media.js';
import type { Project } from '../../src/types.js';

const mockManifest: MediaManifest = {
  version: 1,
  projectId: 'proj_zip_test',
  generatedAt: new Date().toISOString(),
  entries: [
    {
      id: 'media_hero_1',
      requestId: 'req_zip',
      section: 'hero',
      sourceType: 'licensed',
      provider: 'pexels',
      providerAssetId: '555',
      sourcePageUrl: 'https://www.pexels.com/photo/555',
      licenseLabel: 'Pexels License',
      attributionText: 'Photo by Chef Lucas on Pexels',
      creator: 'Chef Lucas',
      creatorUrl: 'https://www.pexels.com/@cheflucas',
      retrievedAt: new Date().toISOString(),
      contentHash: 'e'.repeat(64),
      assetId: 'asset_555',
      assetPath: 'media-hero-555.jpg',
      mimeType: 'image/jpeg',
      width: 1920,
      height: 1080,
      byteLength: 4,
      alt: 'Salão refinado do restaurante',
      decorative: false,
      realBusinessMedia: false,
      licensed: true,
      aiGenerated: false,
      reviewStatus: 'exportable',
    },
  ],
};

test('SiteRenderer: renderiza imagem resolvida, alt e créditos de atribuição', () => {
  const assetUrls = { asset_555: './assets/media-hero-555.jpg' };
  const html = renderSiteDocument(baseBlueprint, baseContext, undefined, mockManifest, assetUrls);

  // 1. Imagem no Hero
  assert.ok(html.includes('src="./assets/media-hero-555.jpg"'));
  assert.ok(html.includes('alt="Salão refinado do restaurante"'));
  assert.ok(html.includes('loading="lazy"'));
  assert.ok(html.includes('decoding="async"'));

  // 2. Créditos do fotógrafo / Pexels
  assert.ok(html.includes('class="media-credits"'));
  assert.ok(html.includes('Photo by Chef Lucas on Pexels'));
  assert.ok(html.includes('href="https://www.pexels.com/photo/555"'));
});

test('SiteRenderer: sem manifest ou asset ausente renderiza fallback CSS sem erro', () => {
  // Teste 1: Full-bleed padrão sem imagem
  const htmlFullBleed = renderSiteDocument(baseBlueprint, baseContext, undefined, undefined, undefined);
  assert.equal(htmlFullBleed.includes('src="undefined"'), false);
  assert.equal(htmlFullBleed.includes('src="null"'), false);
  assert.equal(htmlFullBleed.includes('src=""'), false);
  assert.equal(htmlFullBleed.includes('class="hero-full-bleed has-media"'), false);

  // Teste 2: Split hero sem imagem usa monograma
  const splitBlueprint = {
    ...baseBlueprint,
    visual: { ...baseBlueprint.visual, hero: 'split' as const },
  };
  const htmlSplit = renderSiteDocument(splitBlueprint, baseContext, undefined, undefined, undefined);
  assert.ok(htmlSplit.includes('class="hero-monogram"'));
});

test('exportSite: ZIP inclui assets binários e HTML autossuficiente com a imagem aprovada', async () => {
  const store = new InMemoryMediaAssetStore();
  const dummyJpegData = new Uint8Array([0xff, 0xd8, 0xff, 0xe0]); // fake JPEG bytes
  await store.put(
    {
      assetId: 'asset_555',
      requestId: 'req_zip',
      provider: 'pexels',
      storageKey: 'media_asset_555',
      mimeType: 'image/jpeg',
      width: 1920,
      height: 1080,
      byteLength: dummyJpegData.length,
      contentHash: 'e'.repeat(64),
      createdAt: new Date().toISOString(),
    },
    dummyJpegData,
  );

  const project: Project = {
    id: 'proj_zip_test',
    clientName: 'Salão Renova',
    title: 'Site Institucional',
    category: 'Salão',
    type: 'Landing Page',
    status: 'rascunho',
    previewUrl: '',
    createdAt: new Date().toISOString(),
    slug: 'salao-renova',
    siteBlueprint: baseBlueprint,
    siteContext: baseContext,
    siteMediaManifest: mockManifest,
    contentReviewed: true,
  };

  const zipBytes = await createSiteZip(project, store);
  const zip = await JSZip.loadAsync(zipBytes);

  // 1. Arquivo de imagem gravado em assets/
  const assetFile = zip.file('assets/media-hero-555.jpg');
  assert.ok(assetFile, 'Asset media-hero-555.jpg deve existir na pasta assets/');
  const readBytes = await assetFile.async('uint8array');
  assert.deepEqual(readBytes, dummyJpegData);

  // 2. Manifesto gravado em media/
  const manifestFile = zip.file('media/media-manifest.json');
  assert.ok(manifestFile, 'Manifesto media-manifest.json deve existir');
  const manifestContent = await manifestFile.async('string');
  assert.ok(manifestContent.includes('media-hero-555.jpg'));

  // 3. index.html abre com a imagem mesmo sem extrair a pasta assets/
  const indexHtml = await zip.file('index.html')!.async('string');
  const embeddedImage = indexHtml.match(/src="(data:image\/jpeg;base64,[^"]+)"/);
  assert.ok(embeddedImage, 'A imagem do hero deve estar incorporada ao HTML');
  assert.deepEqual(new Uint8Array(Buffer.from(embeddedImage[1].split(',')[1], 'base64')), dummyJpegData);
  assert.equal(indexHtml.includes('blob:'), false, 'Nenhuma blob URL permitida no ZIP');
  assert.equal(indexHtml.includes('localhost'), false, 'Nenhuma URL localhost permitida no ZIP');
  assert.equal(indexHtml.includes('media_asset_'), false, 'Nenhuma storage key interna no HTML');

  // 4. Créditos de imagem preservados
  assert.ok(indexHtml.includes('Photo by Chef Lucas on Pexels'));
});

test('exportSite: não omite imagem visível que ainda aguarda aprovação', async () => {
  const project = { id: 'proj_zip_test', siteBlueprint: baseBlueprint, siteContext: baseContext,
    contentReviewed: true, siteMediaManifest: { ...mockManifest,
      entries: [{ ...mockManifest.entries[0], reviewStatus: 'selected' as const }] } } as Project;
  await assert.rejects(createSiteZip(project, new InMemoryMediaAssetStore()), /Aprove ou remova as imagens selecionadas/);
});


test('export applies saved user overrides and refuses missing approved media', async () => {
  const project = { id: 'proj_zip_test', siteBlueprint: baseBlueprint, siteContext: baseContext, contentReviewed: true,
    siteOverrides: { version: 1, content: { hero: { headline: 'Saved edited headline' } } } } as unknown as Project;
  const zip = await JSZip.loadAsync(await createSiteZip(project));
  assert.match(await zip.file('index.html')!.async('string'), /Saved edited headline/);
  await assert.rejects(createSiteZip({ ...project, siteMediaManifest: mockManifest }), /MEDIA_ASSET_MISSING/);
  await assert.rejects(createSiteZip({ ...project, siteMediaManifest: mockManifest }, new InMemoryMediaAssetStore()), /MEDIA_ASSET_MISSING/);
});


test('export preserves saved section order/visibility and never mutates the baseline', async () => {
  const project = { id: 'proj_zip_test', siteBlueprint: structuredClone(baseBlueprint),
    siteContext: baseContext, contentReviewed: true, siteOverrides: {
      sectionOrder: ['about', 'hero', 'services', 'contact', 'location'],
      sectionVisibility: { about: true, hero: true, services: false, contact: false, location: false },
      content: { hero: { headline: 'Saved parity headline' }, about: { description: 'Saved parity description' } },
    } } as Project;
  const savedBytes = JSON.stringify(project);
  const reloaded = JSON.parse(savedBytes) as Project;
  const effective = normalizeForRender(applySiteUserOverrides(reloaded.siteBlueprint!, reloaded.siteOverrides));
  const expected = renderSiteDocument(effective, baseContext);
  for (let i = 0; i < 2; i++) {
    const zip = await JSZip.loadAsync(await createSiteZip(reloaded));
    const html = await zip.file('index.html')!.async('string');
    assert.equal(html, expected);
    assert.ok(html.includes('id="about"'));
    assert.ok(html.includes('id="hero"'));
    assert.ok(html.indexOf('id="about"') < html.indexOf('id="hero"'));
    assert.match(html, /Saved parity headline/);
    assert.match(html, /Saved parity description/);
    assert.deepEqual(JSON.parse(await zip.file('blueprint.json')!.async('string')), effective);
    assert.equal(JSON.stringify(reloaded), savedBytes);
    assert.equal(html.includes('data-editor-section-id'), false);
  }
  reloaded.siteOverrides!.sectionVisibility!.about = false;
  const hiddenZip = await JSZip.loadAsync(await createSiteZip(reloaded));
  assert.doesNotMatch(await hiddenZip.file('index.html')!.async('string'), /id="about"|Saved parity description/);
  assert.equal(JSON.stringify(project), savedBytes);
});

test('export keeps the explicitly selected approved image after project reload', async () => {
  const store = new InMemoryMediaAssetStore();
  const entries = [mockManifest.entries[0], { ...mockManifest.entries[0],
    id: 'media_hero_2', assetId: 'asset_556', assetPath: 'media-hero-556.jpg',
    providerAssetId: '556', alt: 'Approved alternative image' }];
  const bytes = [new Uint8Array([0xff, 0xd8, 1, 1]), new Uint8Array([0xff, 0xd8, 2, 2])];
  for (const [index, entry] of entries.entries()) {
    await store.put({ assetId: entry.assetId, requestId: entry.requestId, provider: entry.provider,
      storageKey: 'fixture_' + entry.assetId, mimeType: entry.mimeType, width: entry.width,
      height: entry.height, byteLength: bytes[index].length, contentHash: entry.contentHash,
      createdAt: mockManifest.generatedAt }, bytes[index]);
  }
  const project = { id: 'proj_zip_test', siteBlueprint: baseBlueprint, siteContext: baseContext,
    contentReviewed: true, siteMediaManifest: { ...mockManifest, entries },
    siteOverrides: { content: { hero: { assetId: 'asset_556' } } } } as Project;
  const savedBytes = JSON.stringify(project);
  const zip = await JSZip.loadAsync(await createSiteZip(JSON.parse(savedBytes), store));
  const html = await zip.file('index.html')!.async('string');
  assert.match(html, /alt="Approved alternative image"/);
  assert.doesNotMatch(html, /alt="Salão refinado do restaurante"/);
  assert.ok(html.includes('src="data:image/jpeg;base64,' + Buffer.from(bytes[1]).toString('base64') + '"'));
  assert.deepEqual(await zip.file('assets/media-hero-556.jpg')!.async('uint8array'), bytes[1]);
  assert.equal(JSON.stringify(project), savedBytes);
});

test('export respects explicit image removal without deleting approved media', async () => {
  const store = new InMemoryMediaAssetStore();
  const entry = mockManifest.entries[0], bytes = new Uint8Array([0xff, 0xd8, 0xff, 0xe0]);
  await store.put({ assetId: entry.assetId, requestId: entry.requestId, provider: entry.provider,
    storageKey: 'fixture_remove', mimeType: entry.mimeType, width: entry.width, height: entry.height,
    byteLength: bytes.length, contentHash: entry.contentHash, createdAt: mockManifest.generatedAt }, bytes);
  const project = { id: 'proj_zip_test', siteBlueprint: baseBlueprint, siteContext: baseContext,
    contentReviewed: true, siteMediaManifest: mockManifest,
    siteOverrides: { content: { hero: { assetId: '__REMOVE__' } } } } as Project;
  const savedBytes = JSON.stringify(project);
  const zip = await JSZip.loadAsync(await createSiteZip(JSON.parse(savedBytes), store));
  const html = await zip.file('index.html')!.async('string');
  assert.doesNotMatch(html, /alt="Salão refinado do restaurante"|src="data:image/);
  assert.ok(zip.file('assets/media-hero-555.jpg'), 'Removal hides media; it does not delete it.');
  const exportedManifest = JSON.parse(await zip.file('media/media-manifest.json')!.async('string'));
  assert.equal(exportedManifest.entries[0].assetId, entry.assetId);
  assert.deepEqual(await store.getBuffer(entry.assetId), bytes);
  assert.equal(JSON.stringify(project), savedBytes);
});
test('crédito único para foto reutilizada no preview e no ZIP', async () => {
  const shared = mockManifest.entries[0];
  const reused = { ...shared, id: 'media_about_1', section: 'about' as const,
    alt: 'Foto reaproveitada na apresentação' };
  const manifest: MediaManifest = { ...mockManifest, entries: [shared, reused] };
  const snapshot = JSON.stringify(manifest);
  const url = 'data:image/jpeg;base64,/9j/4A==';
  const preview = renderSiteDocument(baseBlueprint, baseContext, undefined, manifest,
    { [shared.assetId]: url });
  assert.match(preview, /alt="Foto reaproveitada na apresentação"/);
  assert.equal(preview.split('Photo by Chef Lucas on Pexels').length - 1, 1);
  assert.equal(preview.split('href="https://www.pexels.com/photo/555"').length - 1, 1);

  const store = new InMemoryMediaAssetStore(), bytes = new Uint8Array([0xff, 0xd8, 0xff, 0xe0]);
  await store.put({ assetId: shared.assetId, requestId: shared.requestId, provider: shared.provider,
    storageKey: 'fixture_reused', mimeType: shared.mimeType, width: shared.width, height: shared.height,
    byteLength: bytes.length, contentHash: shared.contentHash, createdAt: manifest.generatedAt }, bytes);
  const project = { id: manifest.projectId, siteBlueprint: baseBlueprint, siteContext: baseContext,
    siteMediaManifest: manifest, contentReviewed: true } as Project;
  const reloaded = JSON.parse(JSON.stringify(project)) as Project;
  const zip = await JSZip.loadAsync(await createSiteZip(reloaded, store));
  const html = await zip.file('index.html')!.async('string');
  assert.equal(html.split('Photo by Chef Lucas on Pexels').length - 1, 1);
  assert.equal(html.split('href="https://www.pexels.com/photo/555"').length - 1, 1);
  assert.deepEqual(await zip.file('assets/media-hero-555.jpg')!.async('uint8array'), bytes);
  assert.equal(JSON.parse(await zip.file('media/media-manifest.json')!.async('string')).entries.length, 2);
  assert.equal(JSON.stringify(manifest), snapshot);
  assert.deepEqual(await store.getBuffer(shared.assetId), bytes);
});
