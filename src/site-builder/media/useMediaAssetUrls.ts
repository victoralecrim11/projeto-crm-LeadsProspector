import { useEffect, useState } from 'react';
import type { MediaManifest } from '../contracts/media';
import { IndexedDbMediaAssetStore, type MediaAssetStore } from './assetStore';

/** Read-only preview asset loading. URLs belong to this mounted consumer. */
export function useMediaAssetUrls(manifest?: MediaManifest, assetStore?: MediaAssetStore) {
  const [store] = useState(() => assetStore ?? new IndexedDbMediaAssetStore());
  const [loaded, setLoaded] = useState<{ manifest?: MediaManifest; urls: Record<string, string> }>({ urls: {} });
  useEffect(() => {
    let active = true;
    const urls: Record<string, string> = {};
    void (async () => {
      for (const entry of manifest?.entries ?? []) {
        if (!['selected', 'reviewed', 'exportable'].includes(entry.reviewStatus)) continue;
        const blob = await store.get(entry.assetId).catch(() => null);
        if (!active) break;
        if (blob) {
          const url = URL.createObjectURL(blob);
          urls[entry.assetId] = url;
          urls[entry.id] = url;
        }
      }
      if (active) setLoaded({ manifest, urls });
    })();
    return () => {
      active = false;
      new Set(Object.values(urls)).forEach(url => URL.revokeObjectURL(url));
    };
  }, [manifest, store]);
  return loaded.manifest === manifest ? loaded.urls : {};
}
