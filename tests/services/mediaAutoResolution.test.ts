import test from 'node:test';
import assert from 'node:assert/strict';
import { autoResolveEligibleMedia } from '../../src/site-builder/media/autoResolveService.js';
import type { MediaPlan, MediaCandidate, MediaManifest } from '../../src/site-builder/contracts/media.js';
const plan: MediaPlan = { version: 1, items: ['hero','about'].map(section => ({ id: `media-${section}`, section: section as 'hero' | 'about', purpose: 'Illustration', sourcePreference: 'licensed', aspectRatio: '16:9', decorative: false, alt: 'Illustration' })) };
const candidates = ['a', 'b', 'c'].map(id => ({ candidateId: id, provider: 'pexels', providerAssetId: id, confidence: 0.9 } as MediaCandidate));
test('automatic photos vary across projects and never repeat within a site', async () => {
  const selected: string[] = [];
  const result = await autoResolveEligibleMedia(plan, {
    searchMedia: async () => candidates,
    selectCandidate: async (_item, candidate) => { selected.push(candidate.providerAssetId); return candidate.candidateId; },
  }, undefined, { projectId: 'new', manifests: [{ projectId: 'old', entries: [{ provider: 'pexels', providerAssetId: 'a', reviewStatus: 'selected' }] } as MediaManifest] });
  assert.equal(result.resolved, 2);
  assert.deepEqual(new Set(selected), new Set(['b', 'c']));
});
test('already used photos are skipped and irrelevant alternatives are not favored', async () => {
  const selected: string[] = [];
  await autoResolveEligibleMedia(plan, {
    searchMedia: async () => [...candidates, { ...candidates[0], providerAssetId: 'low', confidence: 0.1 }],
    selectCandidate: async (_item, candidate) => { selected.push(candidate.providerAssetId); return candidate.candidateId; },
  }, undefined, { projectId: 'same', manifests: [{ projectId: 'same', entries: [{ provider: 'pexels', providerAssetId: 'a', reviewStatus: 'selected' }] } as MediaManifest] });
  assert.deepEqual(new Set(selected), new Set(['b', 'c']));
});
test('a single shared photo is not duplicated across sections', async () => {
  const result = await autoResolveEligibleMedia(plan, {
    searchMedia: async () => [candidates[0]], selectCandidate: async () => 'asset',
  });
  assert.deepEqual(result, { resolved: 1, failed: 0, skipped: 1 });
});
test('auto resolution uses returned candidates, not captured React state', async () => {
  const selected: string[] = [];
  const result = await autoResolveEligibleMedia(plan, {
    searchMedia: async item => [{ candidateId: item.id, confidence: 0.8 } as MediaCandidate],
    selectCandidate: async (item, candidate) => { assert.equal(item.id, candidate.candidateId); selected.push(item.id); return item.id; },
  });
  assert.deepEqual(result, { resolved: 2, failed: 0, skipped: 0 });
  assert.equal(selected.length, 2);
});
test('unsuccessful acquisition is never counted as a selected image', async () => {
  const result = await autoResolveEligibleMedia(plan, {
    searchMedia: async () => [{ confidence: 0.8 } as MediaCandidate], selectCandidate: async () => undefined,
  });
  assert.deepEqual(result, { resolved: 0, failed: 2, skipped: 0 });
});
