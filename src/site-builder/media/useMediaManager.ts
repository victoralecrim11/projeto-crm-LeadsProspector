import { useState, useEffect, useCallback } from 'react';
import type { MediaCandidate, MediaManifest, MediaManifestEntry } from '../contracts/media';
import type { MediaPlan } from '../contracts';
import { IndexedDbMediaAssetStore, type MediaAssetStore } from './assetStore';
import { authorizedJsonFetch, authorizedBinaryFetch } from './siteAiApiClient';

export interface MediaManagerProps {
  projectId: string;
  niche: string;
  subNiche?: string;
  imageryDirection?: string;
  mediaPlan?: MediaPlan;
  initialManifest?: MediaManifest;
  assetStore?: MediaAssetStore;
  onManifestChange?: (manifest: MediaManifest) => void;
}

export interface MediaManagerState {
  manifest: MediaManifest;
  objectUrls: Record<string, string>;
  candidatesByItem: Record<string, MediaCandidate[]>;
  loadingByItem: Record<string, boolean>;
  errorByItem: Record<string, string | null>;
  searchMedia: (item: MediaPlan['items'][number]) => Promise<void>;
  selectCandidate: (item: MediaPlan['items'][number], candidate: MediaCandidate) => Promise<void>;
  approveMedia: (itemId: string) => void;
  rejectMedia: (itemId: string) => Promise<void>;
  reloadAssets: () => Promise<void>;
}

export function useMediaManager({
  projectId,
  niche,
  subNiche,
  imageryDirection,
  mediaPlan,
  initialManifest,
  assetStore,
  onManifestChange,
}: MediaManagerProps): MediaManagerState {
  const [store] = useState<MediaAssetStore>(() => assetStore ?? new IndexedDbMediaAssetStore());
  const [manifest, setManifest] = useState<MediaManifest>(
    () => initialManifest ?? { version: 1, projectId, generatedAt: new Date().toISOString(), entries: [] },
  );
  const [candidatesByItem, setCandidatesByItem] = useState<Record<string, MediaCandidate[]>>({});
  const [loadingByItem, setLoadingByItem] = useState<Record<string, boolean>>({});
  const [errorByItem, setErrorByItem] = useState<Record<string, string | null>>({});
  const [objectUrls, setObjectUrls] = useState<Record<string, string>>({});

  // Load object URLs from store when mounting or when manifest changes
  const loadUrls = useCallback(async (currentManifest: MediaManifest) => {
    const newUrls: Record<string, string> = {};
    const urlsToRevoke: string[] = [];

    for (const entry of currentManifest.entries) {
      if (['selected', 'reviewed', 'exportable'].includes(entry.reviewStatus)) {
        try {
          const blob = await store.get(entry.assetId);
          if (blob) {
            const url = URL.createObjectURL(blob);
            urlsToRevoke.push(url);
            newUrls[entry.assetId] = url;
            newUrls[entry.id] = url;
          }
        } catch {
          // Asset missing from IndexedDB — will show fallback
        }
      }
    }

    return { newUrls, urlsToRevoke };
  }, [store]);

  useEffect(() => {
    let active = true;

    loadUrls(manifest).then(({ newUrls, urlsToRevoke }) => {
      if (active) {
        setObjectUrls(prev => {
          // Revoke URLs from previous state that are no longer needed
          Object.values(prev).forEach(url => {
            if (!Object.values(newUrls).includes(url)) {
              setTimeout(() => URL.revokeObjectURL(url), 1000); // Delay revocation
            }
          });
          return newUrls;
        });
      } else {
        urlsToRevoke.forEach((url) => URL.revokeObjectURL(url));
      }
    });

    return () => {
      active = false;
      // We no longer revoke immediately on effect cleanup (manifest change)
      // to prevent the iframe from breaking before the new URLs are loaded.
    };
  }, [manifest, loadUrls]);

  // Sync initial manifest when project changes
  useEffect(() => {
    if (initialManifest) {
      setManifest(initialManifest);
    }
  }, [initialManifest]);

  const searchMedia = useCallback(
    async (item: MediaPlan['items'][number]) => {
      setLoadingByItem((prev) => ({ ...prev, [item.id]: true }));
      setErrorByItem((prev) => ({ ...prev, [item.id]: null }));

      try {
        const data = await authorizedJsonFetch<{
          provider: string;
          candidates: MediaCandidate[];
          error?: string;
        }>('/api/ai/media/search', {
          requestId: `${projectId}_${item.id}`,
          niche,
          subNiche,
          section: item.section,
          purpose: item.purpose,
          aspectRatio: item.aspectRatio,
          imageryDirection,
        });

        setCandidatesByItem((prev) => ({ ...prev, [item.id]: data.candidates || [] }));
        if (data.candidates.length === 0 && data.error) {
          setErrorByItem((prev) => ({ ...prev, [item.id]: data.error || 'Nenhum resultado encontrado.' }));
        }
      } catch (err: unknown) {
        setErrorByItem((prev) => ({
          ...prev,
          [item.id]: err instanceof Error ? err.message : 'Falha ao buscar candidatos de mídia.',
        }));
      } finally {
        setLoadingByItem((prev) => ({ ...prev, [item.id]: false }));
      }
    },
    [projectId, niche, subNiche, imageryDirection],
  );

  const selectCandidate = useCallback(
    async (item: MediaPlan['items'][number], candidate: MediaCandidate) => {
      setLoadingByItem((prev) => ({ ...prev, [item.id]: true }));
      setErrorByItem((prev) => ({ ...prev, [item.id]: null }));

      try {
        const res = await authorizedBinaryFetch('/api/ai/media/acquire', { candidate });

        const mimeType = (res.headers.get('Content-Type') as 'image/jpeg' | 'image/png' | 'image/webp') || 'image/jpeg';
        const contentHash = res.headers.get('X-Content-Hash') || 'hash_' + Date.now();
        const assetId = `asset_${contentHash.slice(0, 16)}`;
        const ext = mimeType === 'image/jpeg' ? 'jpg' : mimeType === 'image/png' ? 'png' : 'webp';
        const assetPath = `media-${item.section}-${contentHash.slice(0, 8)}.${ext}`;

        const blob = await res.blob();

        await store.put(
          {
            assetId,
            requestId: candidate.requestId,
            provider: candidate.provider,
            storageKey: `key_${assetId}`,
            mimeType,
            width: candidate.width,
            height: candidate.height,
            byteLength: blob.size,
            contentHash,
            createdAt: new Date().toISOString(),
          },
          blob,
        );

        const newEntry: MediaManifestEntry = {
          id: item.id,
          requestId: candidate.requestId,
          section: item.section,
          sourceType: 'licensed',
          provider: candidate.provider,
          providerAssetId: candidate.providerAssetId,
          sourcePageUrl: candidate.sourcePageUrl,
          licenseLabel: candidate.licenseLabel,
          licenseUrl: candidate.licenseUrl,
          attributionText: candidate.attributionText,
          creator: candidate.creator,
          creatorUrl: candidate.creatorUrl,
          retrievedAt: new Date().toISOString(),
          contentHash,
          assetId,
          assetPath,
          mimeType,
          width: candidate.width,
          height: candidate.height,
          byteLength: blob.size,
          alt: item.decorative ? '' : item.alt || item.purpose,
          decorative: item.decorative,
          realBusinessMedia: false,
          licensed: true,
          aiGenerated: false,
          reviewStatus: 'selected',
        };

        const updatedEntries = manifest.entries.filter((e) => e.id !== item.id).concat(newEntry);
        const updatedManifest: MediaManifest = {
          ...manifest,
          generatedAt: new Date().toISOString(),
          entries: updatedEntries,
        };

        setManifest(updatedManifest);
        onManifestChange?.(updatedManifest);
      } catch (err: unknown) {
        setErrorByItem((prev) => ({
          ...prev,
          [item.id]: err instanceof Error ? err.message : 'Erro ao processar imagem.',
        }));
      } finally {
        setLoadingByItem((prev) => ({ ...prev, [item.id]: false }));
      }
    },
    [manifest, store, onManifestChange],
  );

  const approveMedia = useCallback(
    (itemId: string) => {
      const updatedEntries = manifest.entries.map((e) =>
        e.id === itemId ? { ...e, reviewStatus: 'exportable' as const } : e,
      );
      const updatedManifest: MediaManifest = {
        ...manifest,
        generatedAt: new Date().toISOString(),
        entries: updatedEntries,
      };
      setManifest(updatedManifest);
      onManifestChange?.(updatedManifest);
    },
    [manifest, onManifestChange],
  );

  const rejectMedia = useCallback(
    async (itemId: string) => {
      const entry = manifest.entries.find((e) => e.id === itemId);
      if (entry) {
        await store.remove(entry.assetId).catch(() => {});
      }
      const updatedEntries = manifest.entries.filter((e) => e.id !== itemId);
      const updatedManifest: MediaManifest = {
        ...manifest,
        generatedAt: new Date().toISOString(),
        entries: updatedEntries,
      };
      setManifest(updatedManifest);
      onManifestChange?.(updatedManifest);
    },
    [manifest, store, onManifestChange],
  );

  const reloadAssets = useCallback(async () => {
    const { newUrls } = await loadUrls(manifest);
    setObjectUrls(newUrls);
  }, [manifest, loadUrls]);

  return {
    manifest,
    objectUrls,
    candidatesByItem,
    loadingByItem,
    errorByItem,
    searchMedia,
    selectCandidate,
    approveMedia,
    rejectMedia,
    reloadAssets,
  };
}
