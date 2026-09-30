import { stitchAppearanceCss } from '../../src/site-builder/renderer/SiteRenderer.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import { extractStitchScreen, extractStitchColors, readStitchColors, extractStitchVisuals } from '../../tools/stitch-producer/clients/stitchScreenAdapter.js';
import { applyStitchVisualEvidence } from '../../src/site-builder/stitchVisualEvidence.js';
import type { DesignCandidate, ResolvedDesign } from '../../src/site-builder/contracts/research.js';

test('SDK projection preserves real screen identity and rejects a mobile screen as desktop', () => {
  const response = { outputComponents: [{ design: { screens: [{ name: 'projects/123/screens/abc', deviceType: 'MOBILE', screenshot: { downloadUrl: 'https://example.com/image' }, htmlCode: { downloadUrl: 'https://example.com/html' } }] } }] };
  const result = extractStitchScreen(response, '123', 'MOBILE');
  assert.equal(result.screenId, 'abc');
  assert.equal(result.screenshotUrl, 'https://example.com/image');
  assert.throws(() => extractStitchScreen(response, '123', 'DESKTOP'), /IDENTITY_INVALID/);
  assert.throws(() => extractStitchScreen(response, '456', 'MOBILE'), /IDENTITY_INVALID/);
  assert.throws(() => extractStitchScreen({}, '123', 'MOBILE'), /IDENTITY_INVALID/);
});

test('literal Stitch colors survive visual resolution without importing executable code', () => {
  const signals = extractStitchColors(`<script>tailwind.config={theme:{extend:{"colors":{"background":"#131315","primary":"#ffb873","on-surface":"#e5e1e4","bad":"url(javascript:alert(1))"}}}}</script>`);
  assert.deepEqual(signals, ['background:#131315', 'primary:#ffb873', 'on-surface:#e5e1e4']);
  const design = { specification: { tokens: { color: { background: '#ffffff', primary: '#000000', text: '#000000' } }, presentation: { theme: 'light' } } } as ResolvedDesign;
  applyStitchVisualEvidence(design, { colorSignals: signals } as DesignCandidate);
  assert.equal(design.specification.tokens.color.background, '#131315');
  assert.equal(design.specification.tokens.color.primary, '#ffb873');
  assert.equal(design.specification.presentation.theme, 'dark');
  assert.deepEqual(extractStitchColors('colors:{"primary":execute()}'), []);
});

test('provider HTML download rejects arbitrary hosts before fetching', async () => {
  await assert.rejects(readStitchColors('http://127.0.0.1/private'), /REFERENCE_INVALID/);
  await assert.rejects(readStitchColors('https://evil.example/design'), /REFERENCE_INVALID/);
});


test('literal font, scale, spacing and layout evidence survives projection and CSS rendering', () => {
  const raw = extractStitchVisuals(`<script>tailwind.config={theme:{extend:{
    "fontFamily":{"display":["Bodoni Moda"],"body":["Hanken Grotesk"]},
    "fontSize":{"display":["38px",{"lineHeight":"42px"}]},
    "spacing":{"section":"2.5rem"},"borderRadius":{"DEFAULT":"0.25rem"}
  }}};</script><section class="text-center"><h1 class="font-display text-display">Sample</h1></section><section class="py-section">About</section>`);
  assert.equal(raw.appearance?.headingFont, 'Bodoni Moda');
  assert.equal(raw.appearance?.bodyFont, 'Hanken Grotesk');
  assert.equal(raw.appearance?.sectionSpace, 40);
  assert.equal(raw.appearance?.radius, 4);
  assert.equal(raw.heroPattern, 'minimal');
  const roundTrip = JSON.parse(JSON.stringify(raw.appearance));
  const css = stitchAppearanceCss(roundTrip);
  assert.match(css, /Bodoni Moda/);
  assert.match(css, /38px/);
  assert.match(css, /padding-block:40px/);
  const malicious = extractStitchVisuals(`<script>"fontFamily":{"display":["bad</style><script>alert(1)</script>"]}</script>`);
  assert.equal(malicious.appearance?.headingFont, undefined);
  assert.throws(() => stitchAppearanceCss({ ...roundTrip, headingFont: "bad';url(evil)" }));
});

test('desktop booking section is recognized as contact in the semantic sequence', () => {
  const html = '<section id="hero"><h1>Barbearia</h1></section>' +
    '<section id="servicos"></section><section id="sobre"></section>' +
    '<section id="agendamento"><h2>Agendamento Direto</h2></section>' +
    '<section id="localizacao"></section>';
  assert.deepEqual(extractStitchVisuals(html).sectionOrder, ['hero', 'services', 'about', 'contact', 'location']);
});

test('cartões técnicos e suaves do Stitch atravessam o contrato visual sem importar HTML bruto', () => {
  const technical = extractStitchVisuals('<section id="services"><article class="border-2 shadow-[6px_6px_0_black]">R$ 85</article></section>');
  const soft = extractStitchVisuals('<section id="servicos"><article class="rounded-2xl">Serviço</article></section>');
  assert.equal(technical.appearance?.serviceCardStyle, 'technical');
  assert.equal(soft.appearance?.serviceCardStyle, 'soft');
  assert.match(stitchAppearanceCss(technical.appearance!), /box-shadow:6px 6px/);
  assert.match(stitchAppearanceCss(soft.appearance!), /border-radius:18px/);
  assert.doesNotMatch(stitchAppearanceCss(technical.appearance!), /<article/);
});

test('overlay absoluto sobre foto editorial não transforma hero em full-bleed', () => {
  const editorial = extractStitchVisuals('<section class="relative"><div class="relative"><img src="https://example.com/photo.jpg"/><div class="absolute inset-0 bg-gradient-to-t"></div></div><h1>Barbearia</h1></section>');
  assert.equal(editorial.appearance?.heroLayout, undefined);
  const split = extractStitchVisuals('<section class="lg:grid-cols-[1fr_1fr]"><div><h1>Barbearia</h1></div><img src="https://example.com/photo.jpg"/></section>');
  assert.equal(split.appearance?.heroLayout, 'split');
  const fullBleed = extractStitchVisuals('<section><img class="absolute inset-0 w-full h-full" src="https://example.com/photo.jpg"/><h1>Barbearia</h1></section>');
  assert.equal(fullBleed.appearance?.heroLayout, 'full-bleed');
});
