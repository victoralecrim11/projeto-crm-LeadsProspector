import { getSiteAiAuthHeaders } from '../../services/siteAiAuth';
import { useState, useEffect, useCallback, useRef } from 'react';
import { mediaCandidateSchema, mediaManifestSchema, type MediaCandidate, type MediaManifest, type MediaManifestEntry } from '../contracts/media';
import type { MediaPlan } from '../contracts';
import { IndexedDbMediaAssetStore, type MediaAssetStore } from './assetStore';
import { useMediaAssetUrls } from './useMediaAssetUrls';
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
  generationConfigured: boolean;
  manifest: MediaManifest;
  objectUrls: Record<string, string>;
  candidatesByItem: Record<string, MediaCandidate[]>;
  loadingByItem: Record<string, boolean>;
  errorByItem: Record<string, string | null>;
  searchMedia: (item: MediaPlan['items'][number], overrideQuery?: string, providerFilter?: string) => Promise<MediaCandidate[]>;
  generateMedia: (item: MediaPlan['items'][number], provider?: string) => Promise<void>;
  selectCandidate: (item: MediaPlan['items'][number], candidate: MediaCandidate) => Promise<string | void>;
  approveMedia: (itemId: string) => void;
  rejectMedia: (itemId: string) => Promise<void>;
  reloadAssets: () => Promise<void>;
  getProjectAssets: () => Promise<import('../contracts/media').StoredMediaAsset[]>;
  getAssetUrl: (assetId: string) => Promise<string | null>;
  selectProjectAsset: (item: MediaPlan['items'][number], asset: import('../contracts/media').StoredMediaAsset) => Promise<string | void>;
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
    () => (initialManifest?.projectId === projectId ? initialManifest : undefined) ?? { version: 1, projectId, generatedAt: new Date().toISOString(), entries: [] },
  );
  const [generationConfigured, setGenerationConfigured] = useState(false);
  useEffect(() => {
    let active = true;
    fetch('/api/ai/media/providers', { headers: getSiteAiAuthHeaders(), signal: AbortSignal.timeout(10000) })
      .then(res => res.ok ? res.json() : null)
      .then(data => { if (active) setGenerationConfigured(data?.imageGeneration?.configured === true); })
      .catch(() => { if (active) setGenerationConfigured(false); });
    return () => { active = false; };
  }, []);
  const [candidatesByItem, setCandidatesByItem] = useState<Record<string, MediaCandidate[]>>({});
  const [loadingByItem, setLoadingByItem] = useState<Record<string, boolean>>({});
  const [errorByItem, setErrorByItem] = useState<Record<string, string | null>>({});
  const manifestRef = useRef(manifest);
  const onChangeRef = useRef(onManifestChange);
  onChangeRef.current = onManifestChange;
  const mounted = useRef(true);
  const galleryUrls = useRef(new Set<string>());
  useEffect(() => { mounted.current = true; return () => {
    mounted.current = false;
    galleryUrls.current.forEach(url => URL.revokeObjectURL(url));
  }; }, []);
  const commitEntries = useCallback((update: (entries: MediaManifestEntry[]) => MediaManifestEntry[]) => {
    if (!mounted.current) return;
    const next = mediaManifestSchema.parse({ ...manifestRef.current, generatedAt: new Date().toISOString(), entries: update(manifestRef.current.entries) });
    manifestRef.current = next;
    setManifest(next);
    onChangeRef.current?.(next);
  }, []);
  useEffect(() => {
    if (initialManifest?.projectId === projectId && initialManifest !== manifestRef.current) {
      manifestRef.current = initialManifest;
      setManifest(initialManifest);
    }
  }, [initialManifest, projectId]);
  const objectUrls = useMediaAssetUrls(manifest, store);

  const searchMedia = useCallback(
    async (item: MediaPlan['items'][number], overrideQuery?: string, providerFilter?: string) => {
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
          purpose: overrideQuery || item.purpose,
          aspectRatio: item.aspectRatio,
          provider: providerFilter !== 'all' ? providerFilter : undefined,
          imageryDirection,
        });

        const candidates = data.candidates.map(candidate => mediaCandidateSchema.parse(candidate));
        if (mounted.current) setCandidatesByItem((prev) => ({ ...prev, [item.id]: candidates }));
        if (data.candidates.length === 0 && data.error) {
          setErrorByItem((prev) => ({ ...prev, [item.id]: data.error || 'Nenhum resultado encontrado.' }));
        }
        return candidates;
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

  const generateMedia = useCallback(async (item: MediaPlan['items'][number], provider?: string) => {
    setLoadingByItem(prev => ({ ...prev, [item.id]: true }));
    setErrorByItem(prev => ({ ...prev, [item.id]: null }));
    try {
      const result = await authorizedJsonFetch<MediaCandidate>('/api/ai/media/generate', {
        requestId: `${projectId}_${item.id}`, niche, subNiche, section: item.section,
        purpose: item.purpose, aspectRatio: item.aspectRatio, imageryDirection, provider,
      }, AbortSignal.timeout(210000));
      const candidate = mediaCandidateSchema.parse(result);
      if (mounted.current) setCandidatesByItem(prev => ({ ...prev, [item.id]: [candidate] }));
    } catch {
      if (mounted.current) setErrorByItem(prev => ({ ...prev, [item.id]: 'Não foi possível gerar a imagem. Verifique a configuração do provedor de imagens.' }));
    } finally {
      if (mounted.current) setLoadingByItem(prev => ({ ...prev, [item.id]: false }));
    }
  }, [projectId, niche, subNiche, imageryDirection]);

  const selectCandidate = useCallback(
    async (item: MediaPlan['items'][number], candidate: MediaCandidate): Promise<string | void> => {
      setLoadingByItem((prev) => ({ ...prev, [item.id]: true }));
      setErrorByItem((prev) => ({ ...prev, [item.id]: null }));

      try {
        const res = await authorizedBinaryFetch('/api/ai/media/acquire', { candidate });

        const mimeType = (res.headers.get('Content-Type') as 'image/jpeg' | 'image/png' | 'image/webp') || 'image/jpeg';
        const contentHash = res.headers.get('X-Content-Hash') || '';
        if (!/^[a-f0-9]{64}$/.test(contentHash)) throw new Error('Resposta de imagem inválida.');
        const assetId = `${projectId}_${contentHash.slice(0, 16)}`;
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
          sourceType: candidate.sourceType,
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
          licensed: candidate.sourceType === 'licensed',
          aiGenerated: candidate.sourceType === 'generated',
          reviewStatus: 'selected',
        };

        commitEntries(entries => entries.filter(e => e.id !== item.id).concat(newEntry));
        
        return assetId;
      } catch (err: unknown) {
        setErrorByItem((prev) => ({
          ...prev,
          [item.id]: err instanceof Error ? err.message : 'Erro ao processar imagem.',
        }));
      } finally {
        setLoadingByItem((prev) => ({ ...prev, [item.id]: false }));
      }
    },
    [store, projectId, commitEntries],
  );

  const approveMedia = useCallback((itemId: string) => {
    commitEntries(entries => entries.map(e => e.id === itemId ? { ...e, reviewStatus: 'exportable' } : e));
  }, [commitEntries]);
  const rejectMedia = useCallback(async (itemId: string) => {
    // Unlink only: another project or section may still reference these bytes.
    commitEntries(entries => entries.filter(e => e.id !== itemId));
  }, [commitEntries]);
  const reloadAssets = useCallback(async () => { commitEntries(entries => [...entries]); }, [commitEntries]);
  const getProjectAssets = useCallback(async () => {
    const ids = new Set(manifestRef.current.entries.map(e => e.assetId));
    return (await store.list()).filter(asset => ids.has(asset.assetId));
  }, [store]);
  const getAssetUrl = useCallback(async (assetId: string) => {
    if (!manifestRef.current.entries.some(e => e.assetId === assetId)) return null;
    const blob = await store.get(assetId);
    if (!blob || !mounted.current) return null;
    const url = URL.createObjectURL(blob);
    galleryUrls.current.add(url);
    return url;
  }, [store]);
  const selectProjectAsset = useCallback(async (item: MediaPlan['items'][number], asset: import('../contracts/media').StoredMediaAsset) => {
    const existing = manifestRef.current.entries.find(e => e.assetId === asset.assetId);
    if (!existing) return;
    const entry: MediaManifestEntry = { ...existing, id: item.id, section: item.section,
      alt: item.decorative ? '' : item.alt, decorative: item.decorative, reviewStatus: 'selected' };
    commitEntries(entries => entries.filter(e => e.id !== item.id).concat(entry));
    return asset.assetId;
  }, [commitEntries]);

  return {
    generationConfigured,
    manifest,
    objectUrls,
    candidatesByItem,
    loadingByItem,
    errorByItem,
    searchMedia,
    generateMedia,
    selectCandidate,
    approveMedia,
    rejectMedia,
    reloadAssets,
    getProjectAssets,
    getAssetUrl,
    selectProjectAsset,
  };
}
