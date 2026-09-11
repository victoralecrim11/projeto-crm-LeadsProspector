import React, { useState } from 'react';
import type { MediaPlan } from '../contracts';
import type { MediaManifest, MediaCandidate } from '../contracts/media';
import { ImageIcon, Search, Check, RefreshCw, Trash2, ExternalLink, ShieldCheck } from 'lucide-react';
import MediaPicker from './MediaPicker';

export interface MediaPanelProps {
  mediaPlan?: MediaPlan;
  manifest: MediaManifest;
  objectUrls: Record<string, string>;
  candidatesByItem: Record<string, MediaCandidate[]>;
  loadingByItem: Record<string, boolean>;
  errorByItem: Record<string, string | null>;
  searchMedia: (item: MediaPlan['items'][number], query?: string, provider?: string) => void;
  selectCandidate: (item: MediaPlan['items'][number], candidate: MediaCandidate) => void;
  approveMedia: (itemId: string) => void;
  rejectMedia: (itemId: string) => void;
  autoResolveStatus?: 'idle' | 'resolving' | 'done' | 'not-configured';
  autoResolveMessage?: string;
  getProjectAssets: () => Promise<any[]>;
  getAssetUrl: (assetId: string) => Promise<string>;
  selectProjectAsset: (item: MediaPlan['items'][number], asset: any) => Promise<void>;
}

/**
 * Pure display component for the media pipeline.
 * Receives all state from the parent VisualEditor via props.
 * Source of truth is project.siteMediaPlan — NOT hardcoded defaults.
 */
export function MediaPanel({
  mediaPlan,
  manifest,
  objectUrls,
  candidatesByItem,
  loadingByItem,
  errorByItem,
  searchMedia,
  selectCandidate,
  approveMedia,
  rejectMedia,
  autoResolveStatus,
  autoResolveMessage,
  getProjectAssets,
  getAssetUrl,
  selectProjectAsset,
}: MediaPanelProps) {
  const items = mediaPlan?.items ?? [];
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerItem, setPickerItem] = useState<MediaPlan['items'][number] | null>(null);

  const openPicker = (item: MediaPlan['items'][number]) => {
    setPickerItem(item);
    setPickerOpen(true);
    searchMedia(item);
  };

  const closePicker = () => {
    setPickerOpen(false);
    setPickerItem(null);
  };

  if (items.length === 0) {
    return (
      <div className="flex flex-col gap-3 p-4 bg-slate-900/50 rounded-xl border border-slate-800 text-slate-100">
        <div className="flex items-center gap-2">
          <ImageIcon className="w-5 h-5 text-slate-500" />
          <h3 className="font-semibold text-base text-slate-400">Mídia do Site</h3>
        </div>
        <p className="text-xs text-slate-500">
          Nenhuma mídia planejada para este projeto. Gere o site novamente para criar um plano de mídia.
        </p>
      </div>
    );
  }

  return (
    <div className="flex max-w-full flex-col gap-6 overflow-hidden rounded-xl border border-slate-800 bg-slate-900/50 p-4 text-slate-100">
      <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <ImageIcon className="w-5 h-5 text-indigo-400" />
          <h3 className="font-semibold text-base">Banco de Imagens Licenciadas</h3>
        </div>
        <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5" /> Pexels / Pixabay
        </span>
      </div>

      {autoResolveStatus && autoResolveMessage && (
        <p className={`text-xs px-3 py-2 rounded-lg border ${
          autoResolveStatus === 'resolving'
            ? 'bg-blue-500/10 text-blue-300 border-blue-500/20'
            : autoResolveStatus === 'not-configured'
              ? 'bg-amber-500/10 text-amber-300 border-amber-500/20'
              : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
        }`}>
          {autoResolveMessage}
        </p>
      )}

      <p className="text-xs text-slate-400 leading-relaxed">
        Busque e selecione fotografias profissionais para compor o site. As imagens são adquiridas com segurança,
        salvas no seu navegador e incluídas no pacote de exportação com créditos automáticos.
      </p>

      <div className="flex flex-col gap-5">
        {items.map((item) => {
          const entry = manifest.entries.find((e) => e.id === item.id);
          const candidates = candidatesByItem[item.id] || [];
          const isLoading = loadingByItem[item.id];
          const error = errorByItem[item.id];
          const previewUrl = entry ? objectUrls[entry.assetId] || objectUrls[entry.id] : undefined;

          return (
            <div
              key={item.id}
              className="flex min-w-0 max-w-full flex-col gap-3 overflow-hidden rounded-lg border border-slate-700/60 bg-slate-800/40 p-4"
            >
              <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs uppercase tracking-wider font-semibold px-2 py-0.5 rounded bg-slate-700 text-slate-300">
                      {item.section}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">Aspect: {item.aspectRatio}</span>
                    {item.sourcePreference !== 'licensed' && (
                      <span className="text-xs px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                        {item.sourcePreference === 'business' ? 'Mídia do negócio' : item.sourcePreference}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 break-words text-sm font-medium leading-relaxed text-slate-200">{item.purpose}</p>
                </div>

                {entry && (
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap self-start ${
                      entry.reviewStatus === 'exportable'
                        ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
                        : 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
                    }`}
                  >
                    {entry.reviewStatus === 'exportable'
                      ? 'Aprovada para Exportação'
                      : entry.reviewStatus === 'selected'
                        ? 'Selecionada (Revisar)'
                        : 'Pendente'}
                  </span>
                )}
              </div>

              {/* Selected image */}
              {entry && previewUrl ? (
                <div className="flex min-w-0 max-w-full flex-col gap-4 overflow-hidden rounded-md border border-slate-800 bg-slate-900/60 p-3 md:flex-row md:items-start">
                  <img
                    src={previewUrl}
                    alt={entry.alt}
                    className="h-28 w-full max-w-full shrink-0 rounded border border-slate-700 object-cover shadow-sm md:h-24 md:w-32 md:max-w-none"
                  />
                  <div className="flex min-w-0 max-w-full flex-1 flex-col gap-1 text-xs">
                    <div className="flex flex-wrap items-center gap-1.5 text-slate-300">
                      <span className="font-semibold">{entry.creator ? `Por ${entry.creator}` : 'Foto Licenciada'}</span>
                      <span className="text-slate-500">·</span>
                      <span className="capitalize text-slate-400">{entry.provider}</span>
                    </div>
                    {entry.sourcePageUrl && (
                      <a
                        href={entry.sourcePageUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-indigo-400 hover:text-indigo-300"
                      >
                        Ver página de origem <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                    <p className="mt-1 break-words text-slate-400 leading-relaxed line-clamp-2">Alt: &quot;{entry.alt}&quot;</p>

                    <div className="mt-2 flex flex-wrap items-center gap-2 border-t border-slate-800 pt-2">
                      {entry.reviewStatus !== 'exportable' && (
                        <button
                          type="button"
                          onClick={() => approveMedia(item.id)}
                          className="flex items-center gap-1 rounded bg-emerald-600 px-2.5 py-1 font-medium text-white transition-colors hover:bg-emerald-500"
                        >
                          <Check className="w-3.5 h-3.5" /> Aprovar
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => openPicker(item)}
                        disabled={isLoading}
                        className="flex items-center gap-1 rounded bg-slate-700 px-2.5 py-1 font-medium text-slate-200 transition-colors hover:bg-slate-600"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} /> Trocar
                      </button>
                      <button
                        type="button"
                        onClick={() => rejectMedia(item.id)}
                        className="ml-auto shrink-0 rounded px-2 py-1 text-red-400 transition-colors hover:bg-red-500/20"
                        title="Remover imagem"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ) : item.sourcePreference === 'licensed' ? (
                /* Search button for licensed slots */
                <div>
                  <button
                    type="button"
                    onClick={() => openPicker(item)}
                    disabled={isLoading}
                    className="w-full py-2 px-3 rounded-lg bg-indigo-600/90 hover:bg-indigo-600 text-white font-medium text-xs flex items-center justify-center gap-2 transition-all shadow-sm"
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Buscando imagens para {item.section}...
                      </>
                    ) : (
                      <>
                        <Search className="w-3.5 h-3.5" /> Buscar fotos ({item.aspectRatio})
                      </>
                    )}
                  </button>
                </div>
              ) : (
                /* Non-licensed slots show explanation */
                <p className="text-xs text-slate-500 italic">
                  Este slot aguarda mídia real do negócio. Não disponível para busca em banco de imagens.
                </p>
              )}

              {error && <p className="text-xs text-amber-400 bg-amber-500/10 p-2 rounded border border-amber-500/20">{error}</p>}

              {/* MediaPicker handled separately to preserve current entry until replacement confirmed */}
            </div>
          );
        })}
      </div>

      {pickerItem && (
        <MediaPicker
          open={pickerOpen}
          onClose={closePicker}
          item={pickerItem}
          currentEntry={manifest.entries.find((e) => e.id === pickerItem.id) ?? null}
          candidates={candidatesByItem[pickerItem.id] || []}
          loading={!!loadingByItem[pickerItem.id]}
          error={errorByItem[pickerItem.id] ?? null}
          onSearch={(itm, q, provider) => {
            searchMedia(itm, q, provider);
          }}
          onSelect={async (itm, cand) => {
            await selectCandidate(itm, cand);
            closePicker();
          }}
          getProjectAssets={getProjectAssets}
          getAssetUrl={getAssetUrl}
          onSelectProjectAsset={async (itm, asset) => {
            await selectProjectAsset(itm, asset);
            closePicker();
          }}
          searchMedia={searchMedia}
        />
      )}

      <div className="p-3 rounded-lg bg-slate-800/20 border border-slate-800 text-[11px] text-slate-500 flex items-center gap-2">
        <span className="text-slate-400">Nota ética:</span> Fotografias licenciadas servem como ilustração conceitual e
        não representam evidência factual das instalações, colaboradores ou serviços específicos do cliente.
      </div>
    </div>
  );
}
