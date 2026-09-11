import test from "node:test";
import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import { MediaPanel } from "../../src/site-builder/components/MediaPanel";

const mediaPlan = {
  items: [
    {
      id: "hero",
      section: "hero",
      aspectRatio: "16:9",
      purpose: "Imagem ilustrativa do espaço ou serviço para a seção sobre de restaurante & pizzaria.",
      sourcePreference: "licensed",
    },
  ],
};

const manifest = {
  entries: [
    {
      id: "hero",
      assetId: "hero-asset",
      creator: "Por Willians Huerta",
      provider: "pexels",
      sourcePageUrl: "https://example.com/source",
      alt: "Detalhes do espaço e atendimento de restaurante & pizzaria",
      reviewStatus: "selected",
      localPath: "/tmp/hero.jpg",
    },
  ],
};

const objectUrls = {
  "hero-asset": "https://example.com/hero.jpg",
};

test("media panel usa layout responsivo sem largura fixa em telas menores", () => {
  const html = renderToStaticMarkup(
    <MediaPanel
      mediaPlan={mediaPlan as any}
      manifest={manifest as any}
      objectUrls={objectUrls}
      candidatesByItem={{}}
      loadingByItem={{}}
      errorByItem={{}}
      searchMedia={() => {}}
      selectCandidate={() => {}}
      approveMedia={() => {}}
      rejectMedia={() => {}}
      getProjectAssets={async () => []}
      getAssetUrl={async () => ""}
      selectProjectAsset={async () => {}}
    />,
  );

  assert.match(html, /min-w-0/);
  assert.match(html, /max-w-full/);
  assert.match(html, /overflow-hidden/);
  assert.match(html, /flex-wrap/);
  assert.match(html, /md:flex-row/);
  assert.match(html, /break-words/);
  assert.match(html, /w-full shrink-0/);
  assert.match(html, /md:w-32/);
});
