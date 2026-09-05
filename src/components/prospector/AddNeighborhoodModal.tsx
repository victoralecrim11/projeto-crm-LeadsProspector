import React from "react";
import { MapPin, X, RefreshCw, Plus } from "lucide-react";

interface AddNeighborhoodModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCity: string;
  newBairroInput: string;
  setNewBairroInput: (val: string) => void;
  isSearchingApi: boolean;
  apiSuggestions: { name: string; type: string; fullAddress?: string }[];
  onAddNeighborhood: (name: string) => void;
}

export const AddNeighborhoodModal: React.FC<AddNeighborhoodModalProps> = ({
  isOpen,
  onClose,
  selectedCity,
  newBairroInput,
  setNewBairroInput,
  isSearchingApi,
  apiSuggestions,
  onAddNeighborhood,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-white/15 rounded-2xl p-5 w-full max-w-md shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-sky-400">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                Adicionar Bairro / Região
              </h3>
              <p className="text-[11px] text-slate-400">
                Cidade: {selectedCity.split(" - ")[0]}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-2">
          <label className="block text-xs font-medium text-slate-300">
            Nome do novo bairro ou setor:
          </label>
          <div className="relative">
            <input
              type="text"
              autoFocus
              placeholder="Ex: Caiçaras, Alto Caiçaras, São Bento..."
              value={newBairroInput}
              onChange={(e) => setNewBairroInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  onAddNeighborhood(newBairroInput);
                }
              }}
              className="w-full px-3.5 py-2.5 text-xs bg-slate-950 border border-white/20 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-sky-400 pr-9"
            />
            {isSearchingApi && (
              <div className="absolute right-3 top-2.5">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-sky-400" />
              </div>
            )}
          </div>

          {/* Dynamic API Live Autocomplete Suggestions */}
          {apiSuggestions.length > 0 && (
            <div className="mt-2 p-2 rounded-xl bg-slate-950/80 border border-white/10 space-y-1.5">
              <div className="flex items-center justify-between text-[10px] text-slate-400 px-1 font-semibold uppercase">
                <span>
                  Sugestões da API ({selectedCity.split(" - ")[0]}):
                </span>
                <span className="text-sky-400 lowercase font-normal">
                  clique para selecionar
                </span>
              </div>
              <div className="max-h-36 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                {apiSuggestions.map((sug, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => onAddNeighborhood(sug.name)}
                    className="w-full text-left p-1.5 rounded-lg bg-white/5 hover:bg-sky-500/20 border border-white/5 hover:border-sky-400/40 transition-all flex items-center justify-between group"
                  >
                    <div className="min-w-0 pr-2">
                      <span className="text-xs font-medium text-white group-hover:text-sky-300 block truncate">
                        📍 {sug.name}
                      </span>
                      {sug.fullAddress && (
                        <span className="text-[10px] text-slate-400 block truncate">
                          {sug.fullAddress}
                        </span>
                      )}
                    </div>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30 shrink-0">
                      {sug.type}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <p className="text-[11px] text-slate-400">
            Bairros adicionados são sincronizados com a API e salvos no seu
            navegador para prospecções e filtros instantâneos.
          </p>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 text-xs font-medium text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-all"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={!newBairroInput.trim()}
            onClick={() => onAddNeighborhood(newBairroInput)}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 disabled:opacity-50 rounded-xl shadow-lg shadow-sky-500/20 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Salvar e Selecionar</span>
          </button>
        </div>
      </div>
    </div>
  );
};
