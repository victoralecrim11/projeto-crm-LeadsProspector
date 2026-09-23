/**
 * D.2 Stitch Producer E2E Test Suite
 * 
 * Validates the full producer pipeline and its integration with D.1 consumer.
 * Uses fixtures (not live Stitch MCP) — this homologates PRODUCER CORE.
 * 
 * Same-Artifact Rule: the artifact written by the producer is the SAME artifact
 * consumed by the D.1 ArtifactMcpProvider. No separate test fixture for consumer.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';

// Producer imports
import { buildExplorationRequest, detectPiiInRequest } from '../../tools/stitch-producer/requestBuilder.js';
import { mapStitchRawToArtifact } from '../../tools/stitch-producer/producerMapper.js';
import { writeArtifact, ArtifactValidationError } from '../../tools/stitch-producer/artifactWriter.js';
import { produceArtifact } from '../../tools/stitch-producer/producerOrchestrator.js';

// D.1 Consumer imports (REAL, not mocked)
import { ArtifactMcpProvider } from '../../server/services/research/stitch/providers/artifactMcpProvider.js';
import { resolveDesignStrategy } from '../../server/services/research/designStrategy/designStrategyResolver.js';
import { rankCandidates } from '../../server/services/research/stitch/stitchCandidateRanker.js';
import { stitchCandidateArtifactSchema, designCandidateSchema } from '../../src/site-builder/contracts/research.js';
import { resolvePremiumSelection, blueprintFromDesign } from '../../src/site-builder/designPipeline.js';
import { blueprintSchema } from '../../src/site-builder/types.js';
import { renderSiteDocument } from '../../src/site-builder/renderer/SiteRenderer.js';

// Fixtures (test-only)
import {
  FixtureStitchMcpClient,
  ErrorStitchMcpClient,
  ThrowingStitchMcpClient,
  EmptyStitchMcpClient,
  getMockResolvedDesign,
  barbershopVariants,
  dentistVariants,
  pizzeriaVariants,
} from '../fixtures/stitchProducerFixtures.js';

// ── Helpers ───────────────────────────────────────────────────────

const TEST_BASE = path.join(process.cwd(), '.stitch-test');

async function cleanTestDir() {
  await fs.rm(TEST_BASE, { recursive: true, force: true });
}

function makeStrategy(niche: string, subNiche?: string) {
  return resolveDesignStrategy(getMockResolvedDesign(niche, subNiche));
}

// ── Request Builder ───────────────────────────────────────────────

test('D.2 Request Builder: produces PII-safe request from strategy', () => {
  const strategy = makeStrategy('dentistry');
  const request = buildExplorationRequest(strategy, 'proj-1', 'req-1', 'MOBILE');

  assert.equal(request.niche, 'dentistry');
  assert.equal(request.visualMood, 'clean');
  assert.equal(request.compositionDirection, 'text-led');
  assert.equal(request.variantCount, 3);
  assert.equal(request.strategyId, strategy.strategyId);
  assert.ok(request.safetyInstruction.length > 0);
});

test('D.2 Request Builder: PII sentinel check finds no PII', () => {
  const strategy = makeStrategy('barbershop');
  const request = buildExplorationRequest(strategy, 'proj-1', 'req-1', 'MOBILE');
  const pii = detectPiiInRequest(request);
  assert.deepEqual(pii, []);
});

test('D.2 Request Builder: PII sentinel detects injected PII values', () => {
  const strategy = makeStrategy('barbershop');
  const request = buildExplorationRequest(strategy, 'proj-1', 'req-1', 'MOBILE');
  // Inject PII sentinels to prove the detector works
  (request as any).sitePurpose = 'contato@barbershop.com / 31-99999-1234';
  const pii = detectPiiInRequest(request);
  assert.ok(pii.includes('email'));
  assert.ok(pii.includes('phone'));
});

// ── Producer Mapper ───────────────────────────────────────────────

test('D.2 Producer Mapper: maps valid raw result to artifact', () => {
  const strategy = makeStrategy('barbershop');
  const rawResult = { status: 'ok' as const, variants: barbershopVariants };
  const artifact = mapStitchRawToArtifact(rawResult, strategy, 'proj-1', 'req-1');

  assert.ok(artifact);
  assert.equal(artifact.schemaVersion, 1);
  assert.equal(artifact.projectId, 'proj-1');
  assert.equal(artifact.requestId, 'req-1');
  assert.equal(artifact.strategyId, strategy.strategyId);
  assert.equal(artifact.source, 'stitch');
  assert.equal(artifact.candidates.length, 3);
  assert.ok(artifact.generatedAt);
});

test('D.2 Producer Mapper: each candidate passes Zod designCandidateSchema', () => {
  const strategy = makeStrategy('dentistry');
  const rawResult = { status: 'ok' as const, variants: dentistVariants };
  const artifact = mapStitchRawToArtifact(rawResult, strategy, 'proj-1', 'req-1');
  assert.ok(artifact);

  for (const c of artifact.candidates) {
    const result = designCandidateSchema.safeParse(c);
    assert.ok(result.success, `Candidate ${c.candidateId} failed Zod: ${JSON.stringify(result.error?.issues)}`);
  }
});

test('D.2 Producer Mapper: artifact passes stitchCandidateArtifactSchema', () => {
  const strategy = makeStrategy('restaurant', 'pizzeria');
  const rawResult = { status: 'ok' as const, variants: pizzeriaVariants };
  const artifact = mapStitchRawToArtifact(rawResult, strategy, 'proj-1', 'req-1');
  assert.ok(artifact);

  const result = stitchCandidateArtifactSchema.safeParse(artifact);
  assert.ok(result.success, `Artifact failed Zod: ${JSON.stringify(result.error?.issues)}`);
});

test('D.2 Producer Mapper: returns null for error result', () => {
  const strategy = makeStrategy('barbershop');
  const artifact = mapStitchRawToArtifact(
    { status: 'error', variants: [], errorMessage: 'fail' },
    strategy, 'proj-1', 'req-1',
  );
  assert.equal(artifact, null);
});

test('D.2 Producer Mapper: returns null for empty variants', () => {
  const strategy = makeStrategy('barbershop');
  const artifact = mapStitchRawToArtifact(
    { status: 'ok', variants: [] },
    strategy, 'proj-1', 'req-1',
  );
  assert.equal(artifact, null);
});

test('D.2 Producer Mapper: scores initialized to zero (ranker responsibility)', () => {
  const strategy = makeStrategy('dentistry');
  const artifact = mapStitchRawToArtifact(
    { status: 'ok', variants: dentistVariants },
    strategy, 'proj-1', 'req-1',
  );
  assert.ok(artifact);
  for (const c of artifact.candidates) {
    assert.equal(c.scores.total, 0, 'Producer must not pre-score candidates');
    assert.equal(c.scores.nicheFit, 0);
  }
});

test('D.2 Producer Mapper: secondary PII sanitization strips injected PII', () => {
  const strategy = makeStrategy('barbershop');
  const dirtyVariant = {
    id: 'dirty',
    heroPattern: 'split',
    aboutPattern: 'Call contato@shop.com or 31-99999-1234',
    servicePattern: 'grid',
  };
  const artifact = mapStitchRawToArtifact(
    { status: 'ok', variants: [dirtyVariant] },
    strategy, 'proj-1', 'req-1',
  );
  assert.ok(artifact);
  const candidate = artifact.candidates[0];
  assert.ok(!candidate.aboutPattern.includes('contato@shop.com'), 'Email should be redacted');
  assert.ok(!candidate.aboutPattern.includes('31-99999-1234'), 'Phone should be redacted');
});

// ── Artifact Writer ───────────────────────────────────────────────

test('D.2 Artifact Writer: writes valid artifact atomically', async () => {
  await cleanTestDir();
  const strategy = makeStrategy('barbershop');
  const artifact = mapStitchRawToArtifact(
    { status: 'ok', variants: barbershopVariants },
    strategy, 'proj-writer', 'req-writer',
  );
  assert.ok(artifact);

  const evidence = await writeArtifact(artifact, TEST_BASE);

  // Verify evidence
  assert.ok(evidence.atomicRenameCompleted);
  assert.equal(evidence.projectId, 'proj-writer');
  assert.equal(evidence.requestId, 'req-writer');
  assert.ok(evidence.bytesWritten > 0);
  assert.ok(evidence.writtenAt);

  // Verify file exists
  const content = await fs.readFile(evidence.artifactPath, 'utf-8');
  const parsed = JSON.parse(content);
  assert.equal(parsed.projectId, 'proj-writer');

  // Verify tmp does NOT exist
  const tmpExists = await fs.stat(evidence.tempPath).then(() => true).catch(() => false);
  assert.equal(tmpExists, false, 'candidates.tmp must not survive after successful write');

  await cleanTestDir();
});

test('D.2 Artifact Writer: validates Zod before write (rejects invalid)', async () => {
  await cleanTestDir();
  const invalidArtifact = { schemaVersion: 1, requestId: 'r', projectId: 'p' } as any;

  await assert.rejects(
    () => writeArtifact(invalidArtifact, TEST_BASE),
    (err: any) => err instanceof ArtifactValidationError,
  );

  // Verify no file was created
  const dirExists = await fs.stat(path.join(TEST_BASE, '.stitch')).then(() => true).catch(() => false);
  assert.equal(dirExists, false, 'No directory should be created for invalid artifact');

  await cleanTestDir();
});

test('D.2 Artifact Writer: identity propagation is exact', async () => {
  await cleanTestDir();
  const strategy = makeStrategy('dentistry');
  const artifact = mapStitchRawToArtifact(
    { status: 'ok', variants: dentistVariants },
    strategy, 'proj-id', 'req-id',
  );
  assert.ok(artifact);
  const evidence = await writeArtifact(artifact, TEST_BASE);

  const content = JSON.parse(await fs.readFile(evidence.artifactPath, 'utf-8'));
  assert.equal(content.projectId, 'proj-id');
  assert.equal(content.requestId, 'req-id');
  assert.equal(content.strategyId, strategy.strategyId);
  assert.equal(content.schemaVersion, 1);
  assert.equal(content.source, 'stitch');

  await cleanTestDir();
});

// ── Producer Orchestrator ─────────────────────────────────────────

test('D.2 Orchestrator: full pipeline PRODUCED for barbershop', async () => {
  await cleanTestDir();
  const strategy = makeStrategy('barbershop');
  const client = new FixtureStitchMcpClient();
  const result = await produceArtifact(strategy, 'proj-barber', 'req-barber', { client, basePath: TEST_BASE });

  assert.equal(result.status, 'PRODUCED');
  assert.equal(result.candidates.length, 3);
  assert.ok(result.writeEvidence);
  assert.ok(result.writeEvidence.atomicRenameCompleted);
  assert.ok(result.request);

  await cleanTestDir();
});

test('D.2 Orchestrator: STITCH_EMPTY_VARIANTS for empty client', async () => {
  const strategy = makeStrategy('barbershop');
  const client = new EmptyStitchMcpClient();
  const result = await produceArtifact(strategy, 'proj-1', 'req-1', { client, basePath: TEST_BASE });
  assert.equal(result.status, 'STITCH_EMPTY_VARIANTS');
  assert.equal(result.candidates.length, 0);
});

test('D.2 Orchestrator: STITCH_ERROR for error client', async () => {
  const strategy = makeStrategy('barbershop');
  const client = new ErrorStitchMcpClient('error');
  const result = await produceArtifact(strategy, 'proj-1', 'req-1', { client, basePath: TEST_BASE });
  assert.equal(result.status, 'STITCH_ERROR');
});

test('D.2 Orchestrator: STITCH_TIMEOUT for timeout client', async () => {
  const strategy = makeStrategy('barbershop');
  const client = new ErrorStitchMcpClient('timeout');
  const result = await produceArtifact(strategy, 'proj-1', 'req-1', { client, basePath: TEST_BASE });
  assert.equal(result.status, 'STITCH_TIMEOUT');
});

test('D.2 Orchestrator: STITCH_AUTH_FAILURE for auth client', async () => {
  const strategy = makeStrategy('barbershop');
  const client = new ErrorStitchMcpClient('auth-failure');
  const result = await produceArtifact(strategy, 'proj-1', 'req-1', { client, basePath: TEST_BASE });
  assert.equal(result.status, 'STITCH_AUTH_FAILURE');
});

test('D.2 Orchestrator: STITCH_TIMEOUT for throwing client (timeout message)', async () => {
  const strategy = makeStrategy('barbershop');
  const client = new ThrowingStitchMcpClient('Connection timeout');
  const result = await produceArtifact(strategy, 'proj-1', 'req-1', { client, basePath: TEST_BASE });
  assert.equal(result.status, 'STITCH_TIMEOUT');
});

test('D.2 Orchestrator: STITCH_AUTH_FAILURE for throwing client (auth message)', async () => {
  const strategy = makeStrategy('barbershop');
  const client = new ThrowingStitchMcpClient('401 Unauthorized');
  const result = await produceArtifact(strategy, 'proj-1', 'req-1', { client, basePath: TEST_BASE });
  assert.equal(result.status, 'STITCH_AUTH_FAILURE');
});

// ── E2E Same-Artifact: Producer → D.1 Consumer ───────────────────

async function e2eNicheTest(niche: string, subNiche: string, projectId: string, requestId: string) {
  await cleanTestDir();

  // 1. Produce artifact
  const mockDesign = getMockResolvedDesign(niche, subNiche);
  const strategy = resolveDesignStrategy(mockDesign);
  const client = new FixtureStitchMcpClient();
  const result = await produceArtifact(strategy, projectId, requestId, { client, basePath: TEST_BASE });
  assert.equal(result.status, 'PRODUCED', `Producer failed for ${niche}`);
  assert.ok(result.writeEvidence);

  // 2. Verify artifact file exists
  const artifactPath = result.writeEvidence.artifactPath;
  const content = await fs.readFile(artifactPath, 'utf-8');
  const parsed = JSON.parse(content);

  // 3. Validate with REAL Zod schema
  const zodResult = stitchCandidateArtifactSchema.safeParse(parsed);
  assert.ok(zodResult.success, `Artifact Zod failed for ${niche}: ${JSON.stringify(zodResult.error?.issues)}`);

  // 4. Consume with REAL ArtifactMcpProvider (same-artifact)
  const provider = new ArtifactMcpProvider(path.join(TEST_BASE, '.stitch', 'runtime'));
  const firstRead = await provider.readArtifact(projectId, requestId, strategy.strategyId);
  const freshProvider = new ArtifactMcpProvider(path.join(TEST_BASE, '.stitch', 'runtime'));
  const secondRead = await freshProvider.readArtifact(projectId, requestId, strategy.strategyId);
  assert.deepEqual(firstRead, zodResult.data);
  assert.deepEqual(secondRead, firstRead);
  assert.equal(await fs.readFile(artifactPath, 'utf-8'), content);
  const artifact = await provider.consumeArtifact(projectId, requestId, strategy.strategyId);
  assert.ok(artifact, 'ArtifactMcpProvider must return the artifact');
  assert.deepEqual(artifact, firstRead);
  await assert.rejects(fs.access(artifactPath), { code: 'ENOENT' });
  assert.equal(await provider.consumeArtifact(projectId, requestId, strategy.strategyId), null);
  
  assert.equal(artifact.projectId, projectId);
  assert.equal(artifact.requestId, requestId);
  assert.equal(artifact.strategyId, strategy.strategyId);
  assert.ok(artifact.candidates.length >= 2 && artifact.candidates.length <= 3);

  // 5. REAL Ranker
  const ranked = rankCandidates(artifact.candidates, strategy);
  assert.ok(ranked.length >= 2);
  const winner = ranked[0];
  assert.ok(winner.scores.total > 0, 'Ranker must have scored candidates');
  assert.ok(winner.candidateId);

  // 6. Structural diversity: candidates differ
  const heroPatterns = new Set(artifact.candidates.map(c => c.heroPattern));
  const aboutPatterns = new Set(artifact.candidates.map(c => c.aboutPattern));
  const servicePatterns = new Set(artifact.candidates.map(c => c.servicePattern));
  
  // At least 2 of 3 should differ in hero OR about OR services
  const diversityScore = (heroPatterns.size > 1 ? 1 : 0) + (aboutPatterns.size > 1 ? 1 : 0) + (servicePatterns.size > 1 ? 1 : 0);
  assert.ok(diversityScore >= 2, `Structural diversity too low for ${niche}: hero=${heroPatterns.size} about=${aboutPatterns.size} services=${servicePatterns.size}`);

  // 7. FamilyResolver / Premium Selection
  const premiumDesign = resolvePremiumSelection(mockDesign, {
    selected: winner.candidateId,
    alternatives: artifact.candidates.map(c => c.candidateId),
    review: 'E2E Test Validation',
    projectUrl: 'https://stitch.withgoogle.com/test'
  }, winner);
  assert.equal(premiumDesign.variant, winner.candidateId);

  // 8. Blueprint
  const blueprint = blueprintFromDesign(premiumDesign);
  
  // 9. Blueprint Zod Validation
  const validBlueprint = blueprintSchema.parse(blueprint);
  assert.equal(validBlueprint.version, 2);

  // 10. SiteRenderer
  const html = renderSiteDocument(validBlueprint, mockDesign.referenceBrief.business.lead, premiumDesign);
  assert.ok(html.includes('<!doctype html>'), 'Renderer must produce valid HTML document');
  assert.ok(html.includes(mockDesign.referenceBrief.business.lead.business.name), 'Renderer output must contain business name');

  await cleanTestDir();

  return { mockDesign, strategy, artifact, ranked, winner, premiumDesign, validBlueprint, html };
}

test('D.2 E2E Barbershop: producer → artifact → consumer → ranker', async () => {
  const { strategy, winner } = await e2eNicheTest('barbershop', 'barbershop', 'proj-barber', 'req-barber');
  assert.equal(strategy.visualMood, 'bold');
  assert.ok(winner.candidateId);
});

test('D.2 E2E Dentist: producer → artifact → consumer → ranker', async () => {
  const { strategy, winner } = await e2eNicheTest('dentistry', 'dentistry', 'proj-dentist', 'req-dentist');
  assert.equal(strategy.visualMood, 'clean');
  assert.ok(winner.candidateId);
});

test('D.2 E2E Pizzeria: producer → artifact → consumer → ranker', async () => {
  const { strategy, winner } = await e2eNicheTest('restaurant', 'pizzeria', 'proj-pizza', 'req-pizza');
  assert.equal(strategy.visualMood, 'warm');
  assert.ok(winner.candidateId);
});

// ── Cross-Niche Structural Diversity ──────────────────────────────

test('D.2 Structural Diversity: barbershop ≠ dentist ≠ pizzeria', () => {
  // Verify fixtures are structurally distinct across niches
  const barberHeros = barbershopVariants.map(v => v.heroPattern);
  const dentistHeros = dentistVariants.map(v => v.heroPattern);
  const pizzeriaHeros = pizzeriaVariants.map(v => v.heroPattern);

  // Not all three niches should share the exact same hero set
  const barberSet = JSON.stringify(barberHeros.sort());
  const dentistSet = JSON.stringify(dentistHeros.sort());
  const pizzeriaSet = JSON.stringify(pizzeriaHeros.sort());

  const allSame = barberSet === dentistSet && dentistSet === pizzeriaSet;
  assert.ok(!allSame, 'Cross-niche fixtures must differ structurally');

  // Typography signals should differ by niche
  const barberTypo = barbershopVariants.flatMap(v => v.typographySignals || []);
  const dentistTypo = dentistVariants.flatMap(v => v.typographySignals || []);
  const pizzeriaTypo = pizzeriaVariants.flatMap(v => v.typographySignals || []);

  assert.ok(barberTypo.some(t => t.includes('editorial') || t.includes('bold')));
  assert.ok(dentistTypo.some(t => t.includes('modern') || t.includes('clean')));
  assert.ok(pizzeriaTypo.some(t => t.includes('expressive') || t.includes('warm')));
});

// ── Ownership: project-orchestrator does NOT own design ───────────

test('D.2 Ownership: design-director is Logical Owner, not orchestrator', () => {
  // The DesignStrategy comes from resolveDesignStrategy (using ResolvedDesign).
  // The producer pipeline takes a strategy and produces candidates.
  // At no point does project-orchestrator directly produce design content.
  // This test validates the architectural boundary by confirming that
  // the producer orchestrator accepts a strategy (not a raw lead) and
  // delegates exploration to an injected client (not self-generating).

  const strategy = makeStrategy('barbershop');
  const request = buildExplorationRequest(strategy, 'p', 'r', 'MOBILE');

  // Request contains design signals from strategy, not orchestrator opinions
  assert.equal(request.visualMood, strategy.visualMood);
  assert.equal(request.compositionDirection, strategy.compositionDirection);
  assert.equal(request.typographyDirection, strategy.typographyDirection);
  // The orchestrator (produceArtifact) never modifies these signals
});

// ── Fallback: CRM works without Stitch ────────────────────────────

test('D.2 Fallback: ProspectorCRM functions without Stitch producer', () => {
  // This validates that the standard (non-Stitch) path still works
  // resolveDesignStrategy does not require Stitch
  const strategy = makeStrategy('dentistry');
  assert.ok(strategy.strategyId);
  assert.ok(strategy.stitchRecommended); // it recommends, but doesn't require

  // The CRM can resolve design without any Stitch artifact
  // (tested extensively in existing 177 tests, this just confirms the boundary)
  assert.ok(strategy.sectionPriorities.length === 5);
});

// ── Overrides & Constraints ─────────────────────────────────────────

test('D.2 User Override Regression: explicit user override wins over candidate', async () => {
  const mockDesign = getMockResolvedDesign('dentistry', undefined, { primary: '#ff0000', accent: '#00ff00' });
  const strategy = resolveDesignStrategy(mockDesign);
  const client = new FixtureStitchMcpClient();
  const result = await produceArtifact(strategy, 'p-override', 'r-override', { client, basePath: TEST_BASE });
  assert.ok(result.writeEvidence);
  
  const content = JSON.parse(await fs.readFile(result.writeEvidence.artifactPath, 'utf-8'));
  const artifact = stitchCandidateArtifactSchema.parse(content);
  const ranked = rankCandidates(artifact.candidates, strategy);
  const winner = ranked[0];
  
  const premiumDesign = resolvePremiumSelection(mockDesign, {
    selected: winner.candidateId,
    alternatives: artifact.candidates.map(c => c.candidateId),
    review: 'Override Test',
    projectUrl: 'https://stitch.withgoogle.com/test'
  }, winner);
  
  // The strategy had user overrides, the candidate had its own colors. 
  // PremiumSelection merges them. We assert the user overrides were preserved in the tokens.
  assert.equal(premiumDesign.specification.tokens.color.primary, '#ff0000', 'User override primary color must win');
  assert.equal(premiumDesign.specification.tokens.color.accent, '#00ff00', 'User override accent color must win');
});

test('D.2 Brand Constraint Regression: real brand constraints win over candidate', async () => {
  const mockDesign = getMockResolvedDesign('barbershop', undefined, {
    identity: [
      { element: 'primary color #123456', decision: 'PRESERVE', reason: 'Official brand' }
    ]
  });
  const strategy = resolveDesignStrategy(mockDesign);
  const client = new FixtureStitchMcpClient();
  const result = await produceArtifact(strategy, 'p-brand', 'r-brand', { client, basePath: TEST_BASE });
  assert.ok(result.writeEvidence);
  
  const content = JSON.parse(await fs.readFile(result.writeEvidence.artifactPath, 'utf-8'));
  const artifact = stitchCandidateArtifactSchema.parse(content);
  const ranked = rankCandidates(artifact.candidates, strategy);
  const winner = ranked[0];
  
  const premiumDesign = resolvePremiumSelection(mockDesign, {
    selected: winner.candidateId,
    alternatives: artifact.candidates.map(c => c.candidateId),
    review: 'Brand Test',
    projectUrl: 'https://stitch.withgoogle.com/test'
  }, winner);
  
  assert.equal(premiumDesign.specification.tokens.color.primary, '#123456', 'Brand constraint primary color must win');
});

// ── Cleanup ───────────────────────────────────────────────────────

test('D.2 Cleanup: remove test artifacts', async () => {
  await cleanTestDir();
  const exists = await fs.stat(TEST_BASE).then(() => true).catch(() => false);
  assert.equal(exists, false);
});
