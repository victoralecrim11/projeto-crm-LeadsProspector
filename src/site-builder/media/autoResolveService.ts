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
  manager: Pick<MediaManagerState, 'searchMedia' | 'selectCandidate' | 'candidatesByItem'>,
  onProgress?: (resolved: number, total: number) => void,
): Promise<{ resolved: number; failed: number; skipped: number }> {
  const eligible = mediaPlan.items.filter(isLicensedAutoResolveEligible);
  const total = eligible.length;
  let resolved = 0;
  let failed = 0;
  let skipped = 0;

  for (const item of eligible) {
    try {
      await manager.searchMedia(item);

      // After search, check candidates (they're set in state asynchronously)
      // We need a small delay to let React state settle
      await new Promise((r) => setTimeout(r, 100));

      const candidates = manager.candidatesByItem[item.id];
      if (candidates && candidates.length > 0) {
        // Select the highest-confidence candidate
        const best = [...candidates].sort((a, b) => b.confidence - a.confidence)[0];
        await manager.selectCandidate(item, best);
        resolved++;
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
