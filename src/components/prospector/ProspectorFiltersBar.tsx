import React from "react";
import {
  Search,
  Compass,
  Zap,
  RefreshCw,
  Check,
  Plus,
  ShieldCheck,
  DollarSign,
} from "lucide-react";
import { ResponsiveSelect } from "../common/ResponsiveSelect";
import { SearchAutocomplete } from "../common/SearchAutocomplete";

interface ProspectorFiltersBarProps {
  selectedCity: string;
  handleCityChange: (city: string) => void;
  cityCoordinates: Record<string, { lat: number; lng: number }>;

  selectedNeighborhood: string;
  setSelectedNeighborhood: (bairro: string) => void;
  currentCityNeighborhoods: string[];
  isSyncingNeighborhoods: boolean;
  refreshNeighborhoodsFromApi: () => void;

  selectedNiche: string;
  setSelectedNiche: (niche: string) => void;

  searchRadius: number;
  setSearchRadius: (rad: number) => void;

  searchQuery: string;
  setSearchQuery: (q: string) => void;
  searchSuggestions: any[];
  handleSelectSuggestion: (item: any) => void;

  onlyWithoutWebsite: boolean;
  setOnlyWithoutWebsite: (val: boolean) => void;

  onlyHighRating: boolean;
  setOnlyHighRating: (val: boolean) => void;

  onlyRealLeads: boolean;
  setOnlyRealLeads: (val: boolean) => void;

  auditStatusFilter: string;
  setAuditStatusFilter: (val: string) => void;

  priceMin: number;
  setPriceMin: (val: number) => void;
  priceMax: number;
  setPriceMax: (val: number) => void;

  isScanning: boolean;
  handleScan: (overrideQuery?: string | unknown) => Promise<void>;

  filteredCount: number;
  realOsmCount: number;
  demoCount: number;

  onOpenAddBairroModal: () => void;
}

export const ProspectorFiltersBar: React.FC<ProspectorFiltersBarProps> = ({
  selectedCity,
  handleCityChange,
  cityCoordinates,
  selectedNeighborhood,
  setSelectedNeighborhood,
  currentCityNeighborhoods,
  isSyncingNeighborhoods,
  refreshNeighborhoodsFromApi,
  selectedNiche,
  setSelectedNiche,
  searchRadius,
  setSearchRadius,
  searchQuery,
  setSearchQuery,
  searchSuggestions,
  handleSelectSuggestion,
  onlyWithoutWebsite,
  setOnlyWithoutWebsite,
  onlyHighRating,
  setOnlyHighRating,
  onlyRealLeads,
  setOnlyRealLeads,
  auditStatusFilter,
  setAuditStatusFilter,
  priceMin,
  setPriceMin,
  priceMax,
  setPriceMax,
  isScanning,
  handleScan,
  filteredCount,
  realOsmCount,
  demoCount,
  onOpenAddBairroModal,
}) => {
  return (
    <div className="glass-panel p-5 rounded-2xl border border-white/10 space-y-4 relative z-40">
      {/* Top Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-white shadow-lg shadow-sky-500/20 border border-white/20 shrink-0">
            <Compass className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Radar de Prospecção Local
              </h2>
              <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 rounded-full shrink-0">
                OpenStreetMap Real-Time
              </span>
            </div>
            <p className="text-xs text-slate-300 truncate sm:whitespace-normal">
              Busca negócios reais via OpenStreetMap / Overpass na área, sem depender de Google Maps Platform.
            </p>
          </div>
        </div>

        {/* Quick Scan Action */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            id="btn-scan-maps"
            onClick={() => handleScan()}
            disabled={isScanning}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 sm:py-2 text-xs font-semibold text-white bg-gradient-to-r from-sky-500 via-indigo-600 to-blue-600 hover:from-sky-400 hover:to-indigo-500 rounded-xl shadow-lg shadow-sky-500/25 border border-white/20 transition-all active:scale-[0.98]"
          >
            {isScanning ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Escaneando Raio de {searchRadius}km...</span>
              </>
            ) : (
              <>
                <Zap className="w-3.5 h-3.5 fill-white text-white" />
                <span>Escanear Área</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Filter Controls Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 pt-2 border-t border-white/10">
        {/* City Selection */}
        <div className="min-w-0 flex flex-col justify-end">
          <label className="flex items-center justify-between text-[11px] font-semibold text-slate-300 mb-1.5 h-6">
            <span className="truncate">Cidade:</span>
            <span className="text-[10px] text-sky-400 font-normal shrink-0 ml-1">
              Base de Busca
            </span>
          </label>
          <ResponsiveSelect
            value={selectedCity}
            onChange={(val) => handleCityChange(val)}
            options={Object.keys(cityCoordinates).map((city) => ({
              value: city,
              label: city,
            }))}
          />
        </div>

        {/* Neighborhood / Region Selection */}
        <div className="min-w-0 flex flex-col justify-end">
          <div className="flex items-center justify-between mb-1.5 gap-1.5 min-w-0 h-6">
            <label className="text-[11px] font-semibold text-slate-300 flex items-center gap-1 min-w-0 truncate">
              <span className="truncate">📍 Bairro / Região:</span>
              {isSyncingNeighborhoods ? (
                <span className="text-[10px] text-amber-400 font-normal flex items-center gap-0.5 animate-pulse shrink-0 ml-0.5">
                  <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                  <span className="hidden xl:inline">IBGE...</span>
                </span>
              ) : (
                <span
                  className="hidden 2xl:inline-flex text-[10px] text-emerald-400 font-normal items-center gap-0.5 shrink-0 ml-0.5"
                  title="Bairros sincronizados com a API do IBGE"
                >
                  <Check className="w-2.5 h-2.5" />
                  <span>IBGE</span>
                </span>
              )}
            </label>

            <div className="flex items-center gap-1 shrink-0 ml-auto">
              <button
                type="button"
                onClick={refreshNeighborhoodsFromApi}
                disabled={isSyncingNeighborhoods}
                className="p-1 text-slate-400 hover:text-white hover:bg-white/10 rounded-md transition-colors disabled:opacity-50 shrink-0"
                title="Atualizar lista de bairros via API do IBGE"
              >
                <RefreshCw
                  className={`w-3 h-3 ${isSyncingNeighborhoods ? "animate-spin text-amber-400" : ""}`}
                />
              </button>
              <button
                type="button"
                onClick={onOpenAddBairroModal}
                className="group flex items-center gap-1 px-1.5 py-1 text-[10px] font-medium text-sky-400 hover:text-sky-200 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 hover:border-sky-400/60 rounded-lg transition-all active:scale-95 shadow-sm shadow-sky-500/10 shrink-0 whitespace-nowrap leading-none"
                title="Buscar ou cadastrar outro bairro para esta cidade"
              >
                <Plus className="w-3 h-3 text-sky-400 group-hover:rotate-90 transition-transform duration-200" />
                <span>Novo Bairro</span>
              </button>
            </div>
          </div>
          <ResponsiveSelect
            value={selectedNeighborhood}
            onChange={(val) => setSelectedNeighborhood(val)}
            options={[
              { value: "Todos os Bairros", label: "Todos os Bairros" },
              ...currentCityNeighborhoods.map((bairro) => ({
                value: bairro,
                label: bairro,
              })),
            ]}
          />
        </div>

        {/* Niche Selection */}
        <div className="min-w-0 flex flex-col justify-end">
          <label className="flex items-center justify-between text-[11px] font-semibold text-slate-300 mb-1.5 h-6">
            <span className="truncate">Categoria do Negócio:</span>
            <span className="text-[10px] text-indigo-400 font-normal shrink-0 ml-1">
              Nicho
            </span>
          </label>
          <ResponsiveSelect
            value={selectedNiche}
            onChange={(val) => setSelectedNiche(val)}
            options={[
              { value: "Todos os Nichos", label: "Todos os Nichos" },
              { value: "Barbearia", label: "Barbearia & Salão" },
              { value: "Clínica Odontológica", label: "Clínica Odontológica" },
              { value: "Estética & Beleza", label: "Estética & Beleza" },
              { value: "Restaurante & Pizzaria", label: "Restaurante & Pizzaria" },
              { value: "Advocacia", label: "Escritório de Advocacia" },
              { value: "Contabilidade", label: "Contabilidade & Finanças" },
              { value: "Pet Shop & Veterinária", label: "Pet Shop & Veterinária" },
              { value: "Oficina Mecânica", label: "Oficina Mecânica" },
            ]}
          />
        </div>

        {/* Search Radius */}
        <div className="min-w-0 flex flex-col justify-end">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-300 mb-1.5 h-6">
            <span className="truncate">Raio de Prospecção:</span>
            <span className="font-bold text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded border border-sky-400/20 shrink-0 ml-1 leading-none">
              {searchRadius} km
            </span>
          </div>
          <input
            type="range"
            min="1"
            max="50"
            step="1"
            value={searchRadius}
            onChange={(e) => setSearchRadius(Number(e.target.value))}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-400"
          />
          {/* Quick Presets */}
          <div className="flex flex-wrap items-center justify-between gap-1 mt-1 text-[10px] text-slate-400">
            {[5, 10, 15, 20, 30, 50].map((rad) => (
              <button
                key={rad}
                type="button"
                onClick={() => setSearchRadius(rad)}
                className={`px-1.5 py-0.5 rounded transition-all ${
                  searchRadius === rad
                    ? "bg-sky-500 text-white font-bold shadow-sm"
                    : "hover:text-sky-300 hover:bg-white/5"
                }`}
              >
                {rad}km
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Explicit Keyword Search Bar */}
      <div className="pt-2 border-t border-white/10 space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px]">
          <div className="flex items-center gap-1.5 font-bold text-white">
            <Search className="w-3.5 h-3.5 text-sky-400" />
            <span>Buscar por Empresa, Bairro/Região ou Rua:</span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-slate-400">
            <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-slate-300">
              🏢 Nome da Empresa
            </span>
            <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-slate-300">
              📍 Bairro
            </span>
            <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-slate-300">
              🛣️ Logradouro / Rua
            </span>
          </div>
        </div>

        <div className="relative z-50">
          <SearchAutocomplete
            id="input-prospector-search"
            value={searchQuery}
            onChange={setSearchQuery}
            onSelect={handleSelectSuggestion}
            suggestions={searchSuggestions}
            placeholder="Digite o nome da empresa (ex: Boy Barbearia), bairro (ex: Savassi) ou rua..."
            onClear={() => setSearchQuery("")}
          />
        </div>
      </div>

      {/* Checkbox Quick Filters */}
      <div className="flex flex-wrap items-center justify-between gap-4 text-xs pt-1">
        <div className="flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white">
            <input
              type="checkbox"
              checked={onlyWithoutWebsite}
              onChange={(e) => setOnlyWithoutWebsite(e.target.checked)}
              className="rounded bg-slate-800 border-white/20 text-sky-500 focus:ring-sky-400 w-4 h-4"
            />
            <span>
              Apenas <strong>SEM WEBSITE</strong> (Alta Oportunidade)
            </span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white">
            <input
              type="checkbox"
              checked={onlyHighRating}
              onChange={(e) => setOnlyHighRating(e.target.checked)}
              className="rounded bg-slate-800 border-white/20 text-sky-500 focus:ring-sky-400 w-4 h-4"
            />
            <span>
              Apenas notas <strong>4.8+ ⭐</strong>
            </span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer text-emerald-300 hover:text-emerald-200">
            <input
              type="checkbox"
              checked={onlyRealLeads}
              onChange={(e) => setOnlyRealLeads(e.target.checked)}
              className="rounded bg-slate-800 border-emerald-500/40 text-emerald-500 focus:ring-emerald-400 w-4 h-4"
            />
            <span className="font-semibold">
              ✓ Apenas Dados Reais (OSM)
            </span>
          </label>
        </div>

        <div className="text-xs text-slate-300 flex items-center gap-2">
          <span>Resultados:</span>
          <span className="font-bold text-sky-300 bg-sky-500/20 px-2 py-0.5 rounded-full border border-sky-400/30">
            {filteredCount} alvos ({realOsmCount} OSM • {demoCount} Demo)
          </span>
        </div>
      </div>

      {/* Advanced Filters: Audit Status & Estimated Price Range */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3.5 pt-2 border-t border-white/10">
        {/* Audit Status Filter */}
        <div className="lg:col-span-4 min-w-0 flex flex-col justify-end">
          <label className="flex items-center justify-between text-[11px] font-semibold text-slate-300 mb-1.5 h-6">
            <span className="truncate flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              Status de Auditoria:
            </span>
            <span className="text-[10px] text-emerald-400 font-normal shrink-0 ml-1">
              Avançado
            </span>
          </label>
          <ResponsiveSelect
            value={auditStatusFilter}
            onChange={(val) => setAuditStatusFilter(val)}
            options={[
              { value: "Todos", label: "🔍 Todos os Status" },
              { value: "Auditados", label: "✅ Auditados (com diagnóstico)" },
              { value: "NaoAuditados", label: "⚠️ Não Auditados" },
              { value: "NoCRM", label: "🎯 Já no CRM/Funil" },
              { value: "ForaCRM", label: "📤 Fora do CRM" },
            ]}
          />
        </div>

        {/* Estimated Price Range - Slider Min/Max */}
        <div className="lg:col-span-8 min-w-0 flex flex-col justify-end">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-300 mb-1.5 h-6">
            <span className="truncate flex items-center gap-1">
              <DollarSign className="w-3 h-3 text-emerald-400" />
              Faixa de Preço Estimada (Setup R$):
            </span>
            <span className="font-bold text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-400/30 shrink-0 ml-1 leading-none">
              R$ {priceMin.toLocaleString("pt-BR")} – R${" "}
              {priceMax.toLocaleString("pt-BR")}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-400 font-semibold shrink-0">
                Mín
              </span>
              <input
                type="range"
                min="0"
                max="5000"
                step="100"
                value={priceMin}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  setPriceMin(Math.min(v, priceMax));
                }}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-400 font-semibold shrink-0">
                Máx
              </span>
              <input
                type="range"
                min="0"
                max="5000"
                step="100"
                value={priceMax}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  setPriceMax(Math.max(v, priceMin));
                }}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
              />
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-1 mt-1 text-[10px] text-slate-400">
            {[
              { label: "Econômico", min: 0, max: 1500 },
              { label: "Padrão", min: 1500, max: 2500 },
              { label: "Premium", min: 2500, max: 5000 },
            ].map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => {
                  setPriceMin(preset.min);
                  setPriceMax(preset.max);
                }}
                className={`px-1.5 py-0.5 rounded transition-all ${
                  priceMin === preset.min && priceMax === preset.max
                    ? "bg-emerald-500 text-white font-bold shadow-sm"
                    : "hover:text-emerald-300 hover:bg-white/5"
                }`}
              >
                {preset.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => {
                setPriceMin(0);
                setPriceMax(5000);
              }}
              className="px-1.5 py-0.5 rounded text-slate-500 hover:text-white hover:bg-white/5 transition-all"
            >
              ↻ Reset
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
