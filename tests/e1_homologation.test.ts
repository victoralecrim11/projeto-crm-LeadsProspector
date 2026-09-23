import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';

// 1. Imports
import { resolveRuntimeResponsiveDesign } from '../server/services/research/siteGenerationResponsiveResolver.js';
import { ArtifactMcpProvider } from '../server/services/research/stitch/providers/artifactMcpProvider.js';
import { getMockResolvedDesign, barbershopVariants, dentistVariants } from './fixtures/stitchProducerFixtures.js';
import { writeArtifact } from '../tools/stitch-producer/artifactWriter.js';
import { mapStitchRawToArtifact } from '../tools/stitch-producer/producerMapper.js';
import { resolveDesignStrategy } from '../server/services/research/designStrategy/designStrategyResolver.js';
import { applySiteUserOverrides } from '../src/site-builder/overridesResolver.js';
import { blueprintFromDesign, resolvePremiumSelection } from '../src/site-builder/designPipeline.js';
import { rankCandidates } from '../server/services/research/stitch/stitchCandidateRanker.js';

const TEST_BASE = path.join(process.cwd(), '.stitch-homologation-test');

test('E.1 Homologation: Responsive Pair / Stitch Live', async () => {
  await fs.rm(TEST_BASE, { recursive: true, force: true });
  const mockDesign = getMockResolvedDesign('barbershop');
  const strategy = resolveDesignStrategy(mockDesign);

  // 1. Generate Mobile Exploration
  const mobileRaw = { status: 'ok' as const, variants: barbershopVariants };
  const mobileArtifact = mapStitchRawToArtifact(mobileRaw, strategy, 'proj-1', 'req-mob', 'MOBILE');
  assert.ok(mobileArtifact, "Mobile artifact creation failed");
  await writeArtifact(mobileArtifact, TEST_BASE);

  // 2. Desktop Companion
  const desktopRaw = { status: 'ok' as const, variants: [dentistVariants[0]] };
  const desktopArtifact = mapStitchRawToArtifact(desktopRaw, strategy, 'proj-1', 'req-desk', 'DESKTOP', 'pair-123');
  assert.ok(desktopArtifact, "Desktop artifact creation failed");
  await writeArtifact(desktopArtifact, TEST_BASE);

  // 4. Inject references properly for Zod
  mockDesign.stitch = {
    selected: mobileArtifact.candidates[0].candidateId,
    alternatives: [mobileArtifact.candidates[0].candidateId, 'dummy-2'],
    review: 'Homologation Test',
    projectUrl: 'https://stitch.withgoogle.com/test',
    viewportAnchors: {
      mobile: { projectId: 'proj-1', requestId: 'req-mob', strategyId: strategy.strategyId, artifactPath: '', source: 'stitch' },
      desktop: { projectId: 'proj-1', requestId: 'req-desk', strategyId: strategy.strategyId, artifactPath: '', source: 'stitch' }
    }
  };

  // 5. Artifact Reading via Provider
  const provider = new ArtifactMcpProvider(path.join(TEST_BASE, '.stitch', 'runtime'));
  const result = await resolveRuntimeResponsiveDesign(mockDesign, mockDesign.stitch!.viewportAnchors!, provider);

  // Assertions
  assert.equal(result.resolution.effectiveCandidate.viewport, 'mobile');
  // It returns PARTIAL because barbershop vs dentist are completely different
  assert.equal(result.resolution.status, 'PARTIAL');
  assert.ok(result.resolution.incoherenceReason);

  await fs.rm(TEST_BASE, { recursive: true, force: true });
});

test('E.1 Homologation: ResolvedDesign Immutability & Editor Flow', () => {
  const mockDesign = getMockResolvedDesign('barbershop');
  const strategy = resolveDesignStrategy(mockDesign);
  const rawCandidate = barbershopVariants[0];
  const candidate: any = {
    ...rawCandidate,
    candidateId: 'cand-1',
    source: 'stitch',
    strategyId: 'str-1',
    provenance: [],
    scores: { total: 0, nicheFit: 0, structural: 0, semantic: 0 },
    structuralHints: { supportsSplit: true, supportsStacked: true, supportsCards: true }
  };
  const premiumDesign = resolvePremiumSelection(mockDesign, {
    selected: 'cand-1', alternatives: ['cand-1', 'cand-2'], review: 'test', projectUrl: 'https://stitch.withgoogle.com/test'
  }, candidate);

  const EDITOR_BASELINE_SITE_DESIGN = JSON.parse(JSON.stringify(premiumDesign));
  const baselineBlueprint = blueprintFromDesign(premiumDesign);

  // Action: Variant Switching (User chooses 'minimal' for about)
  let overrides = {
    visual: { about: 'editorial-split' as const },
    sectionVisibility: {}, sectionOrder: ['hero','about','services','contact','location'] as any,
    presentation: {}
  };
  let effectiveDraft = applySiteUserOverrides(baselineBlueprint, overrides as any);
  assert.equal(effectiveDraft.visual?.about, 'editorial-split');

  // Action: Undo
  overrides.visual = {} as any;
  effectiveDraft = applySiteUserOverrides(baselineBlueprint, overrides as any);
  assert.equal(effectiveDraft.visual?.about, baselineBlueprint.visual?.about);

  // Assert Immutability
  assert.deepStrictEqual(JSON.parse(JSON.stringify(premiumDesign)), EDITOR_BASELINE_SITE_DESIGN);
});
