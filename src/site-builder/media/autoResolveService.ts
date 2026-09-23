import type { MediaPlan } from '../contracts/index.js';
import type { MediaManagerState } from './useMediaManager';
import { isLicensedAutoResolveEligible } from './mediaPlanBuilder';

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
): Promise<{ resolved: number; failed: number; skipped: number }> {
  const eligible = mediaPlan.items.filter(isLicensedAutoResolveEligible);
  const total = eligible.length;
  let resolved = 0;
  let failed = 0;
  let skipped = 0;

  for (const item of eligible) {
    try {
      const candidates = await manager.searchMedia(item);
      if (candidates && candidates.length > 0) {
        // Select the highest-confidence candidate
        const best = [...candidates].sort((a, b) => b.confidence - a.confidence)[0];
        const assetId = await manager.selectCandidate(item, best);
        if (assetId) resolved++;
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
