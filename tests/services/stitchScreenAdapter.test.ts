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
