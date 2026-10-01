import type { MediaPlan } from '../contracts/index.js';
import type { MediaManagerState } from './useMediaManager';
import { isLicensedAutoResolveEligible } from './mediaPlanBuilder';
import type { MediaCandidate, MediaManifest } from '../contracts/media.js';

type SelectionOptions = { projectId?: string; manifests?: MediaManifest[] };
const mediaKey = (asset: { provider: string; providerAssetId: string }) => `${asset.provider}:${asset.providerAssetId}`;
function stableRank(seed: string): number {
  let hash = 2166136261;
  for (const character of seed) hash = Math.imul(hash ^ character.charCodeAt(0), 16777619);
  return hash >>> 0;
}

/**
 * Auto-resolves eligible media plan items by searching licensed providers
 * and auto-selecting the best candidate.
 *
 * Rules:
 * - Only items with sourcePreference='licensed' are eligible.
 * - Auto-selected items get reviewStatus='selected' (NOT 'exportable').
 * - Human review remains mandatory before export.
 * - Failures fall back to CSS gradient/monogram silently.
 * - Does NOT block UI — runs in background.
 */
export async function autoResolveEligibleMedia(
  mediaPlan: MediaPlan,
  manager: Pick<MediaManagerState, 'searchMedia' | 'selectCandidate'>,
  onProgress?: (resolved: number, total: number) => void,
  options: SelectionOptions = {},
): Promise<{ resolved: number; failed: number; skipped: number }> {
  const eligible = mediaPlan.items.filter(isLicensedAutoResolveEligible);
  const total = eligible.length;
  let resolved = 0;
  let failed = 0;
  let skipped = 0;
  const used = new Set<string>();
  const usage = new Map<string, number>();
  for (const manifest of options.manifests ?? []) {
    for (const entry of manifest.entries) {
      if (entry.reviewStatus === 'rejected') continue;
      const key = mediaKey(entry);
      usage.set(key, (usage.get(key) ?? 0) + 1);
      if (manifest.projectId === options.projectId) used.add(key);
    }
  }
  const keyFor = (candidate: MediaCandidate) => candidate.providerAssetId ? mediaKey(candidate) : candidate.candidateId;

  for (const item of eligible) {
    try {
      const candidates = await manager.searchMedia(item);
      if (candidates && candidates.length > 0) {
        // Preserve relevance, then favor unused photography across saved projects.
        const available = candidates.filter(candidate => !used.has(keyFor(candidate)));
        const confidence = Math.max(...candidates.map(candidate => candidate.confidence));
        const best = available.filter(candidate => candidate.confidence >= confidence - 0.05).sort((a, b) =>
          (usage.get(keyFor(a)) ?? 0) - (usage.get(keyFor(b)) ?? 0) ||
          stableRank(`${options.projectId ?? ''}:${item.id}:${keyFor(a)}`) - stableRank(`${options.projectId ?? ''}:${item.id}:${keyFor(b)}`)
        )[0];
        if (!best) {
          skipped++;
          onProgress?.(resolved + failed + skipped, total);
          continue;
        }
        const assetId = await manager.selectCandidate(item, best);
        if (assetId) {
          resolved++;
          used.add(keyFor(best));
          usage.set(keyFor(best), (usage.get(keyFor(best)) ?? 0) + 1);
        }
        else failed++;
      } else {
        skipped++;
      }
    } catch {
      failed++;
    }

    onProgress?.(resolved + failed + skipped, total);
  }

  return { resolved, failed, skipped };
}
