async (page) => {
  const context = await page.context().browser().newContext();
  const tab = await context.newPage();
  const imagePath = 'tests/fixtures/media-test.png';
  const hash = '47839320dd68a744e7ff9e91d1c5c5899142dc739320089a668a8df52edc53fe';
  let searches = 0, acquires = 0, generates = 0;
  const candidate = (body, generated = false) => ({ version: 1, candidateId: body.requestId, requestId: body.requestId,
    provider: generated ? 'comfyui' : 'pexels', providerAssetId: generated ? 'generated-fixture' : 'stock-fixture', sourceType: generated ? 'generated' : 'licensed',
    previewUrl: generated ? '/api/ai/media/generated/' + 'a'.repeat(64) : 'https://images.pexels.com/fixture.png', width: 1, height: 1,
    aspectRatio: body.aspectRatio, licenseLabel: generated ? 'Generated illustration' : 'Pexels license', attributionRequired: false,
    retrievedAt: new Date().toISOString(), confidence: 0.8, metadata: {} });
  await tab.route('**/api/ai/media/**', async route => {
    const url = route.request().url();
    if (url.endsWith('/providers')) return route.fulfill({ json: { providers: [], imageGeneration: { configured: true } } });
    const body = route.request().postDataJSON();
    if (url.endsWith('/search')) { searches++; return route.fulfill({ json: { provider: 'pexels', candidates: [candidate(body)] } }); }
    if (url.endsWith('/generate')) { generates++; return route.fulfill({ json: candidate(body, true) }); }
    if (url.endsWith('/acquire')) { acquires++; return route.fulfill({ path: imagePath, headers: { 'Content-Type': 'image/png', 'X-Content-Hash': hash } }); }
    return route.abort();
  });
  try {
    await tab.goto('http://localhost:3000');
    await tab.evaluate(async () => {
      const { default: React } = await import('/node_modules/.vite/deps/react.js');
      const { default: { createRoot } } = await import('/node_modules/.vite/deps/react-dom_client.js');
      const { useMediaManager } = await import('/src/site-builder/media/useMediaManager.ts');
      const { MediaPicker } = await import('/src/site-builder/components/MediaPicker.tsx');
      const { autoResolveEligibleMedia } = await import('/src/site-builder/media/autoResolveService.ts');
      const mount = document.createElement('div'); document.body.append(mount);
      const root = createRoot(mount);
      const state = window.__mediaTest = { root, updates: [], autoResolveEligibleMedia, React, createRoot, useMediaManager };
      function Harness() {
        const [open, setOpen] = React.useState(false); state.showPicker = setOpen;
        const manager = state.manager = useMediaManager({ projectId: 'browser-media-test', niche: 'hair-salon', onManifestChange: m => state.updates.push(m) });
        return open ? React.createElement(MediaPicker, { open, onClose: () => setOpen(false), item: state.plan.items[0],
          candidates: manager.candidatesByItem['media-hero'] ?? [], loading: manager.loadingByItem['media-hero'], error: manager.errorByItem['media-hero'],
          onSearch: () => {}, searchMedia: manager.searchMedia, onSelect: manager.selectCandidate, generateMedia: manager.generateMedia,
          getProjectAssets: manager.getProjectAssets, getAssetUrl: manager.getAssetUrl, onSelectProjectAsset: manager.selectProjectAsset }) : null;
      }
      root.render(React.createElement(Harness));
    });
    await tab.waitForFunction(() => window.__mediaTest?.manager?.generationConfigured);
    const result = await tab.evaluate(async () => {
      const t = window.__mediaTest;
      const plan = { version: 1, items: ['hero','about'].map(section => ({ id: 'media-' + section, section, purpose: 'Illustration', sourcePreference: 'licensed', aspectRatio: '16:9', decorative: false, alt: 'Illustration' })) };
      const captured = t.manager;
      const resolved = await t.autoResolveEligibleMedia(plan, captured);
      if (resolved.resolved !== 2 || t.updates.at(-1).entries.length !== 2) throw new Error('Captured manager lost candidates or manifest entries');
      t.plan = plan; t.showPicker(true);
      return resolved;
    });
    await tab.getByRole('button', { name: 'Gerar com IA', exact: true }).click();
    await tab.getByRole('button', { name: 'Gerar Imagem', exact: true }).click();
    await tab.waitForFunction(() => window.__mediaTest.manager.candidatesByItem['media-hero']?.[0]?.sourceType === 'generated');
    await tab.getByRole('button', { name: 'Selecionar', exact: true }).click();
    await tab.waitForFunction(() => window.__mediaTest.updates.at(-1).entries.some(e => e.sourceType === 'generated'));
    const final = await tab.evaluate(async () => {
      const t = window.__mediaTest;
      const generated = t.updates.at(-1).entries.find(e => e.id === 'media-hero');
      if (!generated.aiGenerated || generated.licensed || generated.provider !== 'comfyui') throw new Error('Generated provenance lost');
      t.manager.approveMedia('media-hero'); t.manager.approveMedia('media-about');
      const manifest = t.updates.at(-1);
      const { createSiteZip } = await import('/src/site-builder/exportSite.ts');
      const { IndexedDbMediaAssetStore } = await import('/src/site-builder/media/assetStore.ts');
      const { blueprint, context } = await import('/tests/fixtures/siteFixture.ts');
      const bytes = await createSiteZip({ id: 'browser-media-test', siteBlueprint: blueprint, siteContext: context, contentReviewed: true, siteMediaManifest: manifest, siteOverrides: { content: { hero: { headline: 'BROWSER SAVED OVERRIDE' } } } }, new IndexedDbMediaAssetStore());
      const zip = new TextDecoder().decode(bytes);
      if (!zip.includes('BROWSER SAVED OVERRIDE') || !zip.includes('assets/media-hero-')) throw new Error('ZIP parity failed');
      const fixture = await import('/tests/fixtures/siteFixture.ts');
      localStorage.setItem('leadsite_crm_leads_v2', JSON.stringify([{ ...fixture.lead, dataSource: "manual" }]));
      localStorage.setItem('leadsite_crm_projects_v2', JSON.stringify([{ ...fixture.project, id: 'browser-media-test', siteMediaPlan: { version: 1, items: [] }, siteMediaManifest: manifest, siteOverrides: { content: { hero: { headline: 'BROWSER SAVED OVERRIDE' } } } }]));
      t.root.unmount();
      const el = document.createElement('div'); document.body.append(el); const next = t.createRoot(el);
      function Reloaded() { t.reloaded = t.useMediaManager({ projectId: 'browser-media-test', niche: 'hair-salon', initialManifest: manifest }); return null; }
      next.render(t.React.createElement(Reloaded)); t.next = next;
      return { entries: manifest.entries.length, generated: generated.aiGenerated, zipBytes: bytes.length };
    });
    await tab.waitForFunction(() => Object.keys(window.__mediaTest.reloaded?.objectUrls ?? {}).length >= 3);
    await tab.evaluate(() => window.__mediaTest.next.unmount());
    for (const url of ['/redesenhar', '/editor?project=browser-media-test']) {
      await tab.goto('http://localhost:3000' + url);
      const frame = tab.frameLocator('iframe').first();
      await frame.getByRole('heading', { name: 'BROWSER SAVED OVERRIDE', exact: true }).waitFor();
      await frame.locator('img').first().waitFor();
      await frame.locator('img').first().evaluate(img => { if (!img.complete || !img.naturalWidth) throw new Error('Preview image missing'); });
    }
    return { previews: 'REDESENHO_AND_EDITOR_PASS', result, final, searches, acquires, generates, persistenceReload: 'PASS', externalResponses: 'CONTROLLED_NOT_LIVE' };
  } catch (error) { throw new Error(String(error) + JSON.stringify(await tab.evaluate(() => ({ url: location.href, text: document.body.innerText.slice(-2200), frame: document.querySelector('iframe')?.contentDocument?.body.innerText?.slice(0,800), projects: JSON.parse(localStorage.getItem('leadsite_crm_projects_v2') || '[]').map(p=>({ id: p.id, overrides: p.siteOverrides })) })))); } finally { await context.close(); }
}
