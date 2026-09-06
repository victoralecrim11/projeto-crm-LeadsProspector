import React from "react";
import {
  Star,
  Globe,
  AlertTriangle,
  Plus,
  Check,
  Sparkles,
  Mail,
  MapPin,
  Zap,
} from "lucide-react";
import { Lead } from "../../types";

interface ProspectorLeadListProps {
  activeMarkerLead: Lead | null;
  setActiveMarkerLead: (lead: Lead | null) => void;
  filteredLeads: Lead[];
  searchQuery: string;
  selectedNeighborhood: string;
  isScanning: boolean;
  handleScan: (overrideQuery?: string | unknown) => Promise<void>;
  addLeadToCrm: (leadId: string) => void;
  redesignLeadSite: (leadId: string) => void;
  setActivePage: (page: string) => void;
  onSelectLeadForEmail?: (lead: Lead) => void;
  onSelectLeadForModal: (lead: Lead) => void;
}

export const ProspectorLeadList: React.FC<ProspectorLeadListProps> = ({
  activeMarkerLead,
  setActiveMarkerLead,
  filteredLeads,
  searchQuery,
  selectedNeighborhood,
  isScanning,
  handleScan,
  addLeadToCrm,
  redesignLeadSite,
  setActivePage,
  onSelectLeadForEmail,
  onSelectLeadForModal,
}) => {
  return (
    <div className="xl:col-span-4 flex flex-col gap-4">
      {/* Selected Lead Card */}
      {activeMarkerLead ? (
        <div className="glass-panel p-5 rounded-2xl border border-sky-400/40 shadow-2xl space-y-4 animate-in fade-in duration-150">
          <div className="flex items-start justify-between">
            <div>
              <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-sky-500/20 text-sky-300 border border-sky-400/30 uppercase">
                {activeMarkerLead.category}
              </span>
              <h3 className="text-base font-bold text-white mt-1.5 leading-snug">
                {activeMarkerLead.name}
              </h3>
              <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-300">
                {typeof activeMarkerLead.rating === "number" ? <span className="flex items-center text-amber-400 font-bold"><Star className="w-3.5 h-3.5 fill-amber-400 inline mr-0.5" />{activeMarkerLead.rating}</span> : <span>Avaliação não informada</span>}
                {typeof activeMarkerLead.reviewsCount === "number" && <span>({activeMarkerLead.reviewsCount} avaliações)</span>}
              </div>
            </div>

            <button
              onClick={() => setActiveMarkerLead(null)}
              className="text-xs text-slate-400 hover:text-white"
            >
              ✕
            </button>
          </div>

          {/* Diagnosis Badges */}
          <div className="p-3 rounded-xl bg-slate-900/80 border border-white/10 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Presença Web Atual:</span>
              {activeMarkerLead.hasWebsite ? (
                <span className="text-amber-400 font-semibold flex items-center gap-1">
                  <Globe className="w-3.5 h-3.5" /> Site Antigo
                </span>
              ) : (
                <span className="text-rose-400 font-bold flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" /> Sem Website
                </span>
              )}
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400">Bairro / Região:</span>
              <span className="font-semibold text-emerald-300">
                📍 {activeMarkerLead.neighborhood || activeMarkerLead.city}
              </span>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-slate-400">Logradouro / Rua:</span>
              <span className="font-medium text-slate-200 text-[11px] break-words">
                {activeMarkerLead.address}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400">Score de Oportunidade:</span>
              <span className="font-bold text-sky-400">
                {activeMarkerLead.score}/100
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400">Distância do Centro:</span>
              <span className="font-semibold text-sky-300">
                📍 {typeof activeMarkerLead.distanceKm === "number" ? `${activeMarkerLead.distanceKm} km` : "Distância não informada"}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400">Telefone / WhatsApp:</span>
              <span className="font-mono text-white">
                {activeMarkerLead.phone || "Não informado"}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-2">
            {!activeMarkerLead.inCrm ? (
              <button
                onClick={() => {
                  addLeadToCrm(activeMarkerLead.id);
                  setActiveMarkerLead({ ...activeMarkerLead, inCrm: true });
                }}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-semibold text-white bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 rounded-xl shadow-lg shadow-indigo-500/25 border border-white/15 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Adicionar ao Funil CRM (R$ 1.800)</span>
              </button>
            ) : (
              <div className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-semibold flex items-center justify-center gap-2">
                <Check className="w-4 h-4" />
                <span>Lead já está no Funil CRM</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  redesignLeadSite(activeMarkerLead.id);
                  setActivePage("redesenhar");
                }}
                className="flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-medium text-sky-300 bg-sky-500/15 hover:bg-sky-500/25 border border-sky-400/30 rounded-xl transition-all"
              >
                <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                <span>Redesenhar IA</span>
              </button>

              <button
                onClick={() => {
                  if (onSelectLeadForEmail) {
                    onSelectLeadForEmail(activeMarkerLead);
                  } else {
                    onSelectLeadForModal(activeMarkerLead);
                  }
                }}
                className="flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-medium text-white bg-white/10 hover:bg-white/15 border border-white/15 rounded-xl transition-all"
              >
                <Mail className="w-3.5 h-3.5 text-indigo-300" />
                <span>Enviar E-mail</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="glass-panel p-5 rounded-2xl border border-white/10 flex flex-col justify-center items-center text-center py-10 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400">
            <MapPin className="w-6 h-6 text-sky-400" />
          </div>
          <h4 className="font-bold text-sm text-white">
            Nenhuma empresa selecionada
          </h4>
          <p className="text-xs text-slate-400 max-w-xs">
            Clique em qualquer ponto do mapa ou da lista abaixo para auditar os detalhes e iniciar o contato.
          </p>
        </div>
      )}

      {/* Quick List of Top Opportunities */}
      <div className="glass-panel p-4 rounded-2xl border border-white/10 space-y-3 flex-1 overflow-hidden flex flex-col">
        <div className="flex items-center justify-between pb-2 border-b border-white/10">
          <h4 className="text-xs font-bold text-white tracking-tight">
            Oportunidades em Destaque
          </h4>
          <span className="text-[10px] text-sky-400 font-semibold">
            {filteredLeads.length} disponíveis
          </span>
        </div>

        {filteredLeads.length === 0 ? (
          <div className="p-4 rounded-xl bg-slate-900/80 border border-sky-400/20 text-center space-y-2.5 my-auto">
            <AlertTriangle className="w-6 h-6 text-amber-400 mx-auto" />
            <div>
              <h5 className="text-xs font-bold text-white">Nenhum resultado local</h5>
              <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
                Não há negócios salvos para{" "}
                {searchQuery
                  ? `"${searchQuery}"`
                  : selectedNeighborhood !== "Todos os Bairros"
                  ? `"${selectedNeighborhood}"`
                  : "os filtros selecionados"}
                .
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleScan(searchQuery)}
              disabled={isScanning}
              className="w-full py-2 px-3 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 active:scale-[0.98]"
            >
              <Zap className="w-3.5 h-3.5 fill-white" />
              <span>Escanear Área</span>
            </button>
          </div>
        ) : (
          <div className="space-y-2 overflow-y-auto max-h-72 pr-1">
            {filteredLeads.map((lead) => (
              <div
                key={lead.id}
                onClick={() => setActiveMarkerLead(lead)}
                className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                  activeMarkerLead?.id === lead.id
                    ? "bg-sky-500/20 border-sky-400/50 text-white shadow-md"
                    : "bg-white/[0.02] border-white/10 text-slate-300 hover:bg-white/[0.06]"
                }`}
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="font-semibold text-white truncate">
                    {lead.name}
                  </span>
                  <span className="text-amber-400 font-bold shrink-0">
                    {typeof lead.rating === "number" ? `★ ${lead.rating}` : "Avaliação não informada"}
                  </span>
                </div>

                <div className="flex items-center justify-between mt-1 text-[11px] text-slate-400">
                  <span className="truncate">
                    <strong className="text-slate-300">
                      {lead.neighborhood || lead.city}
                    </strong>{" "}
                    • {lead.category}
                  </span>
                  <span
                    className={
                      lead.hasWebsite
                        ? "text-amber-400 font-medium shrink-0"
                        : "text-rose-400 font-bold shrink-0"
                    }
                  >
                    {lead.hasWebsite ? "Possui site" : "🚨 Sem site"}
                  </span>
                </div>

                <div className="mt-1 text-[10px] text-slate-500 truncate flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-sky-400 shrink-0" />
                  <span className="truncate">{lead.address || lead.city || 'Endereço não informado'}</span>
                  <span className="ml-auto font-mono text-slate-400 shrink-0">
                    {typeof lead.distanceKm === "number" ? `(${lead.distanceKm}km)` : "Distância não informada"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
