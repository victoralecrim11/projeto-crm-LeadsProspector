import assert from 'assert';
import { applySiteUserOverrides } from '../src/site-builder/overridesResolver.js';
import { GeneratedSiteBlueprint } from '../src/site-builder/types.js';
import type { SiteUserOverrides } from '../src/site-builder/contracts/overrides.js';
import type { ResolvedDesign } from '../src/site-builder/contracts/research.js';

const baseDesign: any = {
  niche: 'barber',
  designStrategy: {
    strategyId: 'str-1',
    primaryGoal: 'Test',
    brandPersonality: 'Test',
    colorPalette: { primary: '#000', secondary: '#111', background: '#222', surface: '#333', text: '#fff' },
    typography: { heading: 'font', body: 'font', accent: 'font' },
    layoutDirection: 'Test',
    imageryStyle: 'Test'
  },
  siteStructure: {
    hero: { purpose: 'Test', copy: { headline: 'Hero Headline', subheadline: 'Hero Sub', ctaText: 'Hero CTA', ctaLink: '#' }, media: { type: 'image', url: 'hero.jpg', alt: 'hero' } },
    about: { purpose: 'Test', copy: { headline: 'About Headline', body: 'About body' }, media: { type: 'image', url: 'about.jpg', alt: 'about' } },
    services: { purpose: 'Test', copy: { headline: 'Services Headline', body: 'Services body' } }
  },
  stitch: {
    viewportAnchors: {
      mobile: { projectId: 'p1', requestId: 'req1', strategyId: 'str-1', artifactPath: '', source: 'stitch' },
      desktop: { projectId: 'p1', requestId: 'req2', strategyId: 'str-1', artifactPath: '', source: 'stitch' }
    },
    alternatives: ['opt1', 'opt2'],
    selected: 'opt1',
    review: 'ok',
    projectUrl: 'https://stitch.withgoogle.com'
  },
  mediaPlan: { items: [], rationale: '' }
};

// Mock Initial Blueprint
const initialBlueprint = {
  version: 2,
  schemaVersion: '1',
  blueprintId: 'bp-1',
  designFamily: 'editorial',
  visual: {
    hero: 'split',
    about: 'story',
    services: 'horizontal',
    contact: 'split',
    footer: 'minimal'
  },
  theme: {
    colors: { primary: '#000', secondary: '#111', accent: '#222', surface: '#333', background: '#444', text: '#fff', textMuted: '#aaa' },
    typography: { headingFont: 'font', bodyFont: 'font', scale: 'base' },
    spacing: 'comfortable',
    roundness: 'medium'
  },
  hero: { title: 'Base Hero', subtitle: 'Base Sub', ctaPrimary: 'CTA', assetId: 'base-hero-img' },
  about: { title: 'Base About', description: 'Base Content', assetId: 'base-about-img' },
  services: [{ id: 's1', title: 's1', description: 's1' }],
  metadata: {
    niche: 'barber',
    primaryGoal: 'Test',
    language: 'pt-BR',
    title: 'Test',
    description: 'Test'
  },
  sectionOrder: ['hero', 'about', 'services', 'contact', 'footer']
};

console.log("=== BLOCO E - RESOLVEDDESIGN IMMUTABILITY ===");
const editorBaseline = JSON.parse(JSON.stringify(baseDesign));

const overrides: SiteUserOverrides = {
  visual: {
    hero: 'minimal'
  },
  content: {
    hero: { assetId: 'asset-user-123' },
    about: { assetId: '__REMOVE__', title: 'New About Copy' }
  },
  brand: {},
  sectionOrder: ['hero', 'about', 'services', 'contact', 'location']
};

// 1. Variant Reset Test
console.log("\n=== BLOCO A - VARIANT RESET ===");
const resetOverrides = JSON.parse(JSON.stringify(overrides));
delete resetOverrides.visual.hero;
const resolvedReset = applySiteUserOverrides(initialBlueprint as any, resetOverrides);
assert.strictEqual(resolvedReset.visual.hero, 'split', "Variant Reset failed: Hero should return to baseline 'split'");
assert.strictEqual(resolvedReset.hero?.assetId, 'asset-user-123', "Variant Reset failed: Media should be preserved");
assert.strictEqual(resolvedReset.about?.title, 'New About Copy', "Variant Reset failed: Copy should be preserved");
console.log("Variant Reset: PASS");

// 2. Scoped Copy Regen Test (Isolation)
console.log("\n=== BLOCO F - MEDIA / COPY ISOLATION ===");
const regenCopyOverrides = JSON.parse(JSON.stringify(overrides));
regenCopyOverrides.content.about = { ...regenCopyOverrides.content.about, title: 'Regenerated About Copy' };
const resolvedCopyRegen = applySiteUserOverrides(initialBlueprint as any, regenCopyOverrides);
assert.strictEqual(resolvedCopyRegen.about?.title, 'Regenerated About Copy', "Copy Regen failed: Copy not updated");
assert.strictEqual(resolvedCopyRegen.about?.assetId, '__REMOVE__', "Copy Regen failed: Media was not preserved");
assert.strictEqual(resolvedCopyRegen.visual.hero, 'minimal', "Copy Regen failed: Other sections affected");
console.log("Scoped Copy Regen Isolation: PASS");

// 3. Scoped Media Regen Test (Isolation)
const regenMediaOverrides = JSON.parse(JSON.stringify(overrides));
regenMediaOverrides.content.hero = { ...regenMediaOverrides.content.hero, assetId: 'asset-gen-456' };
const resolvedMediaRegen = applySiteUserOverrides(initialBlueprint as any, regenMediaOverrides);
assert.strictEqual(resolvedMediaRegen.hero?.assetId, 'asset-gen-456', "Media Regen failed: Media not updated");
assert.strictEqual(resolvedMediaRegen.about?.title, 'New About Copy', "Media Regen failed: Copy was not preserved");
assert.strictEqual(resolvedMediaRegen.visual.hero, 'minimal', "Media Regen failed: Variant was not preserved");
console.log("Scoped Media Regen Isolation: PASS");

// 4. ResolvedDesign Deep Equal
assert.deepStrictEqual(baseDesign, editorBaseline, "ResolvedDesign mutated!");
console.log("\nResolvedDesign DeepStrictEqual: PASS");

console.log("\nAll Isolation & Immutability Tests Passed!");
