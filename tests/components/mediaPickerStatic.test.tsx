import test from 'node:test';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import { MediaPanel } from '../../src/site-builder/components/MediaPanel';
import MediaPicker from '../../src/site-builder/components/MediaPicker';

const mediaPlan = {
  items: [
    {
      id: 'hero',
      section: 'hero',
      aspectRatio: '16:9',
      purpose: 'Imagem ilustrativa',
      sourcePreference: 'licensed',
    },
  ],
};

const manifest = {
  entries: [
    {
      id: 'hero',
      assetId: 'hero-asset',
      creator: 'Autor Teste',
      provider: 'pexels',
      alt: 'Alt texto',
      reviewStatus: 'selected',
    },
  ],
};

test('Trocar button is present and inline candidates are not rendered when an entry exists', () => {
  const html = renderToStaticMarkup(
    <MediaPanel
      mediaPlan={mediaPlan as any}
      manifest={manifest as any}
      objectUrls={{ 'hero-asset': 'https://example.com/hero.jpg' }}
      candidatesByItem={{ hero: [{ candidateId: 'c1', previewUrl: 'x', creator: 'A' }] } as any}
      loadingByItem={{} as any}
      errorByItem={{} as any}
      searchMedia={() => {}}
      selectCandidate={() => {}}
      approveMedia={() => {}}
      rejectMedia={() => {}}
      getProjectAssets={async () => []}
      getAssetUrl={async () => ""}
      selectProjectAsset={async () => {}}
    />,
  );

  // Trocar button should exist
  assert.match(html, /Trocar/);

  // Inline candidates list label should NOT be present (we use MediaPicker modal)
  assert.doesNotMatch(html, /Escolha uma opção/);
});

test('MediaPicker renders search UI and shows aspect ratio', () => {
  const fakeItem = mediaPlan.items[0];
  const html = renderToStaticMarkup(
    <MediaPicker
      open={true}
      onClose={() => {}}
      item={fakeItem as any}
      currentEntry={null}
      candidates={[]}
      loading={false}
      onSearch={() => {}}
      onSelect={() => {}}
      getProjectAssets={async () => []}
      getAssetUrl={async () => null}
      onSelectProjectAsset={() => {}}
      searchMedia={() => {}}
    />,
  );

  assert.match(html, /Buscar/);
  assert.match(html, /Proporção exigida/);
  assert.match(html, /16:9/);
});
