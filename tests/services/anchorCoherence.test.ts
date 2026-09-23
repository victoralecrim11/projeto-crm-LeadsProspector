import assert from 'node:assert/strict';
import test from 'node:test';
import { validateAnchorCoherence } from '../../src/site-builder/anchorCoherence.js';
import type { DesignCandidate } from '../../src/site-builder/contracts/research.js';

const candidate = (overrides: Partial<DesignCandidate> = {}): DesignCandidate => ({
  candidateId: 'screen-mobile',
  source: 'stitch',
  projectId: 'project-1',
  screenId: 'screen-mobile',
  viewport: 'mobile',
  responsivePairId: 'pair-1',
  strategyId: 'strategy-1',
  layoutPatterns: ['single-column', 'stacked'],
  heroPattern: 'split',
  aboutPattern: 'standard',
  servicePattern: 'grid',
  sectionOrder: ['hero', 'services', 'about', 'location', 'contact'],
  typographySignals: ['Oswald', 'Work Sans', '40px'],
  colorSignals: ['#111111', '#f0b45f'],
  spacingSignals: ['40px'],
  imageryDirection: 'Editorial barbershop photography',
  motionSignals: [],
  responsiveSignals: [],
  appearance: {
    version: 1,
    headingFont: 'Oswald',
    bodyFont: 'Work Sans',
    heroSize: 40,
    sectionSpace: 40,
    radius: 4,
    heroLayout: 'split',
    imageryPresent: true,
    limitations: [],
  },
  scores: {
    nicheFit: 1,
    purposeFit: 1,
    researchFit: 1,
    structuralDiversity: 1,
    accessibility: 1,
    performance: 1,
    responsiveQuality: 1,
    total: 1,
  },
  provenance: [],
  ...overrides,
});

test('accepts viewport-specific hero, layout, size and spacing adaptations', () => {
  const mobile = candidate();
  const desktop = candidate({
    candidateId: 'screen-desktop',
    screenId: 'screen-desktop',
    viewport: 'desktop',
    heroPattern: 'full-bleed',
    layoutPatterns: ['two-column', 'wide'],
    typographySignals: ['Oswald', 'Work Sans', '56px'],
    spacingSignals: ['64px'],
    appearance: {
      ...mobile.appearance!,
      heroSize: 56,
      sectionSpace: 64,
      heroLayout: 'full-bleed',
    },
  });

  assert.deepEqual(validateAnchorCoherence(mobile, desktop), { status: 'PAIRED' });
});

test('still rejects identity and semantic drift', () => {
  const mobile = candidate();
  const reason = (result: ReturnType<typeof validateAnchorCoherence>) =>
    result.status === 'INVALID' ? result.reason : '';

  assert.match(
    reason(validateAnchorCoherence(mobile, candidate({ strategyId: 'strategy-2' }))),
    /strategyId/,
  );
  assert.match(
    reason(validateAnchorCoherence(mobile, candidate({ responsivePairId: 'pair-2' }))),
    /responsivePairId/,
  );
  assert.match(
    reason(validateAnchorCoherence(mobile, candidate({ sectionOrder: ['hero', 'about', 'services', 'location', 'contact'] }))),
    /sectionOrder/,
  );
  assert.match(
    reason(validateAnchorCoherence(mobile, candidate({ appearance: { ...mobile.appearance!, headingFont: 'Bodoni Moda' } }))),
    /heading font/,
  );
});
