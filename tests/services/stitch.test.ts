import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { ArtifactMcpProvider } from '../../server/services/research/stitch/providers/artifactMcpProvider.js';
import { resolveDesignStrategy } from '../../server/services/research/designStrategy/designStrategyResolver.js';
import { selectDesignSkills } from '../../server/services/research/designStrategy/designSkillSelector.js';
import { rankCandidates } from '../../server/services/research/stitch/stitchCandidateRanker.js';
import { mapStitchCandidate } from '../../server/services/research/stitch/stitchCandidateMapper.js';
import { type StitchCandidateArtifact } from '../../src/site-builder/contracts/research.js';

const getMockResolvedDesign = (niche: string, subNiche: string = niche) => ({
  referenceBrief: {
    business: { derivedNiche: niche, source: { niche: subNiche }, businessType: 'local-business' }
  },
  conversionStrategy: 'lead generation',
  composition: ['hero', 'about', 'services', 'contact'],
  imageryDirection: 'test'
} as any);

test('DesignStrategy Resolver handles niches properly', () => {
  const dentist = resolveDesignStrategy(getMockResolvedDesign('dentistry'));
  assert.equal(dentist.visualMood, 'clean');
  assert.equal(dentist.motionLevel, 'none');
  assert.ok(dentist.skillProfile.includes('accessibility-strong'));

  const barbershop = resolveDesignStrategy(getMockResolvedDesign('barbershop'));
  assert.equal(barbershop.visualMood, 'bold');
  assert.ok(dentist.skillProfile.includes('clinical-layout'));

  const pizzeria = resolveDesignStrategy(getMockResolvedDesign('pizzeria', 'pizzeria'));
  assert.equal(pizzeria.visualMood, 'warm');
  assert.ok(pizzeria.skillProfile.includes('food-centric-layout'));
  
  const hairSalon = resolveDesignStrategy(getMockResolvedDesign('hair-salon', 'hair salon'));
  assert.equal(hairSalon.visualMood, 'refined');
  assert.ok(hairSalon.skillProfile.includes('beauty-editorial'));
});

test('ArtifactMcpProvider Boundary validations', async (t) => {
  const provider = new ArtifactMcpProvider();
  const projectId = 'test-proj';
  const requestId = 'test-req';
  const strategyId = 'test-strat';
  const artifactDir = path.join(process.cwd(), '.stitch', 'runtime', projectId, requestId);
  const artifactPath = path.join(artifactDir, 'candidates.json');
  const tmpPath = path.join(artifactDir, 'candidates.tmp');

  await fs.mkdir(artifactDir, { recursive: true }).catch(() => {});

  // 1. Missing
  await fs.rm(artifactDir, { recursive: true, force: true });
  await fs.mkdir(artifactDir, { recursive: true }).catch(() => {});
  let res = await provider.probe(projectId, requestId, strategyId);
  assert.equal(res.status, 'STITCH_WAITING_ARTIFACT');

  // 2. Temp file only
  await fs.writeFile(tmpPath, '{}');
  res = await provider.probe(projectId, requestId, strategyId);
  assert.equal(res.status, 'STITCH_WAITING_ARTIFACT');
  await fs.unlink(tmpPath);

  // 3. Invalid JSON
  await fs.writeFile(artifactPath, '{ invalid');
  res = await provider.probe(projectId, requestId, strategyId);
  assert.equal(res.status, 'STITCH_ARTIFACT_INVALID');

  // 4. Invalid Schema (missing required fields)
  await fs.writeFile(artifactPath, JSON.stringify({ hello: 'world' }));
  res = await provider.probe(projectId, requestId, strategyId);
  assert.equal(res.status, 'STITCH_ARTIFACT_INVALID');

  // 5. Valid schema but Mismatch
  const validArtifact: StitchCandidateArtifact = {
    schemaVersion: 1,
    requestId: 'wrong-req',
    projectId: 'test-proj',
    strategyId: 'test-strat',
    generatedAt: new Date().toISOString(),
    source: 'stitch',
    candidates: []
  };
  await fs.writeFile(artifactPath, JSON.stringify(validArtifact));
  res = await provider.probe(projectId, requestId, strategyId);
  assert.equal(res.status, 'STITCH_ARTIFACT_MISMATCH');

  // 6. Stale Artifact
  validArtifact.requestId = requestId;
  validArtifact.generatedAt = new Date(Date.now() - 61 * 60 * 1000).toISOString(); // Exceeds the aligned 60-minute TTL
  await fs.writeFile(artifactPath, JSON.stringify(validArtifact));
  res = await provider.probe(projectId, requestId, strategyId);
  assert.equal(res.status, 'STITCH_ARTIFACT_STALE');

  // 7. Valid
  validArtifact.generatedAt = new Date().toISOString();
  await fs.writeFile(artifactPath, JSON.stringify(validArtifact));
  res = await provider.probe(projectId, requestId, strategyId);
  assert.equal(res.status, 'STITCH_ARTIFACT_AVAILABLE');

  const exploreRes = await provider.explore(projectId, requestId, strategyId);
  assert.ok(exploreRes);
  assert.equal(exploreRes.requestId, requestId);

  // Cleans up after explore
  const hasFile = await fs.stat(artifactPath).then(() => true).catch(() => false);
  assert.equal(hasFile, false);

  await fs.rm(path.join(process.cwd(), '.stitch', 'runtime', projectId), { recursive: true, force: true });
});

test('StitchCandidateRanker structural diversity', () => {
  const fakeStrategy = { strategyId: '1', compositionDirection: 'image-led' } as any;

  const candidate1 = mapStitchCandidate({ heroPattern: 'split', aboutPattern: 'standard', servicePattern: 'grid', layoutPatterns: ['image-led'] }, fakeStrategy);
  const candidate2 = mapStitchCandidate({ heroPattern: 'full-bleed', aboutPattern: 'image-right', servicePattern: 'cards', layoutPatterns: ['image-led'] }, fakeStrategy);
  
  candidate1.responsiveSignals = ['mobile-first'];
  candidate2.responsiveSignals = ['mobile-first'];
  
  const ranked = rankCandidates([candidate1, candidate2], fakeStrategy);
  // candidate 2 has better structural diversity (full-bleed, image-right vs generic split, standard)
  assert.equal(ranked[0].candidateId, candidate2.candidateId);
});

test('StitchCandidateRanker niche fit vs diversity', () => {
  const fakeStrategy = { strategyId: '1', compositionDirection: 'text-led' } as any; // Dentist

  // Generic but fits niche
  const candidate1 = mapStitchCandidate({ heroPattern: 'split', aboutPattern: 'standard', servicePattern: 'grid', layoutPatterns: ['text-led'] }, fakeStrategy);
  // Extremely diverse but WRONG niche fit (image-led for text-led strategy)
  const candidate2 = mapStitchCandidate({ heroPattern: 'full-bleed', aboutPattern: 'image-right', servicePattern: 'cards', layoutPatterns: ['image-led'] }, fakeStrategy);
  
  candidate1.responsiveSignals = ['mobile-first'];
  candidate2.responsiveSignals = ['mobile-first'];
  
  const ranked = rankCandidates([candidate1, candidate2], fakeStrategy);
  // candidate 1 should win because niche fit (text-led vs image-led) is more important than diversity
  assert.equal(ranked[0].candidateId, candidate1.candidateId);
});

test('StitchCandidateRanker mobile penalization', () => {
  const fakeStrategy = { strategyId: '1', compositionDirection: 'image-led' } as any;

  const candidate1 = mapStitchCandidate({ heroPattern: 'split', layoutPatterns: ['image-led'] }, fakeStrategy);
  candidate1.responsiveSignals = ['desktop-only']; // penalized

  const candidate2 = mapStitchCandidate({ heroPattern: 'split', layoutPatterns: ['image-led'] }, fakeStrategy);
  candidate2.responsiveSignals = ['mobile-first']; 

  const ranked = rankCandidates([candidate1, candidate2], fakeStrategy);
  assert.equal(ranked[0].candidateId, candidate2.candidateId);
});

