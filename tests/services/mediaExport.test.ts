import test from 'node:test';
import assert from 'node:assert/strict';
import JSZip from 'jszip';
import { renderSiteDocument } from '../../src/site-builder/renderer/SiteRenderer.js';
import { createSiteZip } from '../../src/site-builder/exportSite.js';
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

test('exportSite: ZIP estático inclui assets binários, manifest e caminhos relativos', async () => {
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

  // 3. index.html tem caminhos relativos e nunca URLs temporárias
  const indexHtml = await zip.file('index.html')!.async('string');
  assert.ok(indexHtml.includes('src="./assets/media-hero-555.jpg"'));
  assert.equal(indexHtml.includes('blob:'), false, 'Nenhuma blob URL permitida no ZIP');
  assert.equal(indexHtml.includes('localhost'), false, 'Nenhuma URL localhost permitida no ZIP');
  assert.equal(indexHtml.includes('media_asset_'), false, 'Nenhuma storage key interna no HTML');

  // 4. Créditos de imagem preservados
  assert.ok(indexHtml.includes('Photo by Chef Lucas on Pexels'));
});
