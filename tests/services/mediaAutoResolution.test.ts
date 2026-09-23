import test from 'node:test';
import assert from 'node:assert/strict';
import { autoResolveEligibleMedia } from '../../src/site-builder/media/autoResolveService.js';
import type { MediaPlan, MediaCandidate } from '../../src/site-builder/contracts/media.js';
const plan: MediaPlan = { version: 1, items: ['hero','about'].map(section => ({ id: `media-${section}`, section: section as 'hero' | 'about', purpose: 'Illustration', sourcePreference: 'licensed', aspectRatio: '16:9', decorative: false, alt: 'Illustration' })) };
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
