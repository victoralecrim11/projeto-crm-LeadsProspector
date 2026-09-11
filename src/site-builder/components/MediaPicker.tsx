import React, { useState, useEffect } from 'react';
import type { MediaPlan } from '../contracts';
import type { MediaCandidate, MediaManifestEntry, StoredMediaAsset } from '../contracts/media';
import { X, Search, Check, Loader2, Image as ImageIcon, HardDrive, RefreshCw } from 'lucide-react';

export interface MediaPickerProps {
  open: boolean;
  onClose: () => void;
  item: MediaPlan['items'][number];
  currentEntry?: MediaManifestEntry | null;
  candidates: MediaCandidate[];
  loading: boolean;
  error?: string | null;
  onSearch: (item: MediaPlan['items'][number], query?: string, provider?: string) => void;
  onSelect: (item: MediaPlan['items'][number], candidate: MediaCandidate) => void;
  getProjectAssets: () => Promise<StoredMediaAsset[]>;
  getAssetUrl: (assetId: string) => Promise<string | null>;
  onSelectProjectAsset: (item: MediaPlan['items'][number], asset: StoredMediaAsset) => void;
  searchMedia: (item: MediaPlan['items'][number]) => void;
}

export function MediaPicker({
  open,
  onClose,
  item,
  currentEntry,
  candidates,
  loading,
  error,
  onSearch,
  onSelect,
  getProjectAssets,
  getAssetUrl,
  onSelectProjectAsset,
}: MediaPickerProps) {
  const [tab, setTab] = useState<'banco' | 'projeto'>('banco');
  const [query, setQuery] = useState('');
  const [provider, setProvider] = useState<'all' | 'pexels' | 'pixabay'>('all');
  
  const [projectAssets, setProjectAssets] = useState<StoredMediaAsset[]>([]);
  const [projectUrls, setProjectUrls] = useState<Record<string, string>>({});
  const [loadingAssets, setLoadingAssets] = useState(false);

  useEffect(() => {
    if (open) {
      setQuery('');
      if (tab === 'banco' && candidates.length === 0 && !loading) {
        onSearch(item, '', provider);
      } else if (tab === 'projeto') {
        loadProjectAssets();
      }
    }
  }, [open, tab]);

  const loadProjectAssets = async () => {
    setLoadingAssets(true);
    try {
      const assets = await getProjectAssets();
      setProjectAssets(assets);
      const urls: Record<string, string> = {};
      for (const asset of assets) {
        const url = await getAssetUrl(asset.assetId);
        if (url) urls[asset.assetId] = url;
      }
      setProjectUrls(urls);
    } catch (err) {
      console.error('Failed to load project assets', err);
    } finally {
      setLoadingAssets(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 flex h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl bg-slate-900 border border-slate-700 shadow-2xl">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 p-4">
          <h3 className="text-base font-bold text-white">Media Library — {item.section}</h3>
          <button aria-label="Fechar" onClick={onClose} className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-800 px-4 pt-2 gap-4">
          <button
            onClick={() => setTab('banco')}
            className={`flex items-center gap-2 border-b-2 px-1 pb-3 text-sm font-medium transition-colors ${
              tab === 'banco' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-slate-300'
            }`}
          >
            <ImageIcon className="w-4 h-4" /> Banco de Imagens
          </button>
          <button
            onClick={() => setTab('projeto')}
            className={`flex items-center gap-2 border-b-2 px-1 pb-3 text-sm font-medium transition-colors ${
              tab === 'projeto' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-slate-300'
            }`}
          >
            <HardDrive className="w-4 h-4" /> Mídia do Projeto
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          {tab === 'banco' && (
            <div className="flex flex-col gap-4 h-full">
              {/* Search Bar */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex-1 min-w-[200px]">
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={`Buscar imagens para ${item.section} (${item.purpose.slice(0, 40)}...)`}
                    className="w-full rounded-lg px-3 py-2 bg-slate-950 border border-slate-700 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') onSearch(item, query, provider);
                    }}
                  />
                </div>
                
                <select
                  value={provider}
                  onChange={(e) => setProvider(e.target.value as any)}
                  className="rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-indigo-500"
                >
                  <option value="all">Todos os provedores</option>
                  <option value="pexels">Pexels</option>
                  <option value="pixabay">Pixabay</option>
                </select>

                <button
                  onClick={() => onSearch(item, query, provider)}
                  disabled={loading}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />} 
                  Buscar
                </button>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span>Proporção exigida: <strong className="text-slate-300">{item.aspectRatio}</strong></span>
              </div>

              {/* Error and Loading States */}
              {error && <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-3 text-sm text-amber-400">{error}</div>}
              
              {!loading && candidates.length === 0 && !error && (
                <div className="flex flex-col items-center justify-center flex-1 text-slate-500 space-y-2 mt-8">
                  <ImageIcon className="w-12 h-12 opacity-20" />
                  <p>Nenhuma imagem encontrada. Tente termos diferentes.</p>
                </div>
              )}

              {/* Grid */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 mt-2">
                {candidates.map((cand) => (
                  <div key={cand.candidateId} className="group relative flex flex-col overflow-hidden rounded-lg border border-slate-700 bg-slate-800 transition-all hover:border-indigo-500 hover:shadow-lg hover:shadow-indigo-500/10">
                    <div className="relative aspect-video w-full bg-slate-900">
                      <img src={cand.previewUrl} alt={cand.creator || 'Foto'} className="h-full w-full object-cover" loading="lazy" />
                      <div className="absolute top-2 right-2 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white backdrop-blur-md capitalize">
                        {cand.provider}
                      </div>
                    </div>
                    <div className="p-2.5 flex flex-col gap-2">
                      <div className="text-[11px] text-slate-400 truncate" title={cand.creator}>{cand.creator || 'Fotógrafo'}</div>
                      <button
                        onClick={() => onSelect(item, cand)}
                        disabled={loading}
                        className="w-full flex justify-center items-center gap-1.5 rounded-md bg-indigo-600/90 hover:bg-indigo-500 px-2 py-1.5 text-xs font-semibold text-white transition-colors"
                      >
                        <Check className="w-3.5 h-3.5" /> Selecionar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'projeto' && (
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-slate-400">
                  Mídias já baixadas e armazenadas no projeto.
                </p>
                <button
                  onClick={loadProjectAssets}
                  disabled={loadingAssets}
                  className="flex items-center gap-2 text-xs text-indigo-400 hover:text-indigo-300"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingAssets ? 'animate-spin' : ''}`} /> Atualizar
                </button>
              </div>

              {loadingAssets ? (
                <div className="flex flex-col items-center justify-center flex-1 text-slate-400 space-y-3">
                  <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                  <p className="text-sm">Carregando mídias...</p>
                </div>
              ) : projectAssets.length === 0 ? (
                <div className="flex flex-col items-center justify-center flex-1 text-slate-500 space-y-2 mt-8">
                  <HardDrive className="w-12 h-12 opacity-20" />
                  <p>A biblioteca do projeto está vazia.</p>
                  <p className="text-xs">As imagens adquiridas no Banco de Imagens aparecerão aqui.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                  {projectAssets.map((asset) => (
                    <div key={asset.assetId} className="group relative flex flex-col overflow-hidden rounded-lg border border-slate-700 bg-slate-800 transition-all hover:border-indigo-500 hover:shadow-lg hover:shadow-indigo-500/10">
                      <div className="relative aspect-video w-full bg-slate-900 flex items-center justify-center text-slate-600">
                        {projectUrls[asset.assetId] ? (
                          <img src={projectUrls[asset.assetId]} alt="Mídia do projeto" className="h-full w-full object-cover" loading="lazy" />
                        ) : (
                          <ImageIcon className="w-6 h-6 opacity-50" />
                        )}
                        <div className="absolute top-2 right-2 flex flex-col items-end gap-1">
                           <div className="rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white backdrop-blur-md uppercase">
                             {asset.mimeType.split('/')[1] || 'IMG'}
                           </div>
                        </div>
                      </div>
                      <div className="p-2.5 flex flex-col gap-2">
                        <div className="text-[10px] text-slate-400 font-mono truncate" title={asset.assetId}>
                          {asset.assetId.split('_')[1] || asset.assetId}
                        </div>
                        <button
                          onClick={() => onSelectProjectAsset(item, asset)}
                          className="w-full flex justify-center items-center gap-1.5 rounded-md bg-slate-700 hover:bg-slate-600 px-2 py-1.5 text-xs font-semibold text-white transition-colors"
                        >
                          <Check className="w-3.5 h-3.5" /> Reutilizar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

export default MediaPicker;
