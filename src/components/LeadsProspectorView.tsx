import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, 
  Compass, 
  Sparkles, 
  MapPin, 
  Star, 
  Phone, 
  Plus, 
  Check, 
  Download, 
  Zap, 
  Map as MapIcon, 
  LayoutGrid, 
  Mail,
  RefreshCw,
  SlidersHorizontal,
  Building2,
  Layers,
  X
} from 'lucide-react';
import { useCrm } from '../hooks/useCrm';
import { Lead } from '../types';
import { GoogleMapsProspector } from './GoogleMapsProspector';
import { ManualLeadModal } from './ManualLeadModal';
import { ResponsiveSelect } from './common/ResponsiveSelect';
import { SearchAutocomplete, AutocompleteSuggestion } from './common/SearchAutocomplete';
import { useCityNeighborhoods } from '../services/neighborhoodService';
import { 
  NICHE_OPTIONS, 
  matchesNiche, 
  generateRealisticLeadsForLocation, 
  normalizeStr 
} from '../services/leadGeneratorService';

const AVAILABLE_CITIES = [
  'Belo Horizonte - MG',
  'São Paulo - SP',
  'Rio de Janeiro - RJ',
  'Curitiba - PR',
  'Porto Alegre - RS',
  'Salvador - BA',
  'Brasília - DF',
  'Goiânia - GO',
  'Campinas - SP',
  'Recife - PE'
];

export type QuickFilterId = 'sem_site' | 'site_lento' | 'nota_alta' | 'fora_crm' | 'apenas_reais';

const QUICK_FILTERS: { id: QuickFilterId; label: string }[] = [
  { id: 'sem_site', label: '🚨 Sem Site Próprio' },
  { id: 'site_lento', label: '⚡ Site Lento' },
  { id: 'nota_alta', label: '★ Nota Google ≥ 4.8' },
  { id: 'fora_crm', label: '📋 Fora do CRM' },
  { id: 'apenas_reais', label: '✓ Apenas Dados Reais' },
];

export const LeadsProspectorView: React.FC = () => {
  const { 
    leads, 
    addLeadToCrm, 
    batchAddLeadsToCrm, 
    exportLeadsExcel, 
    setSelectedLeadForModal,
    redesignLeadSite,
    setCurrentEditingLead,
    setActivePage,
    setEmailModalLead,
    addCustomLead
  } = useCrm();

  const [viewMode, setViewMode] = useState<'map' | 'grid'>('grid');
  const [showManualLeadModal, setShowManualLeadModal] = useState(false);
  const [selectedCity, setSelectedCity] = useState<string>('Belo Horizonte - MG');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<string>('Todos os Bairros');
  const [selectedNiche, setSelectedNiche] = useState<string>('todos');
  const [selectedQuickFilters, setSelectedQuickFilters] = useState<QuickFilterId[]>([]);
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
  const [isScanning, setIsScanning] = useState<boolean>(false);

  // Dynamic hook to fetch and keep neighborhoods synchronized with selected city
  const { neighborhoods, isSyncing } = useCityNeighborhoods(selectedCity, leads);

  const handleCityChange = (newCity: string) => {
    setSelectedCity(newCity);
    setSelectedNeighborhood('Todos os Bairros');
  };

  // Toggle multi-select quick filters
  const handleToggleQuickFilter = (filterId: QuickFilterId) => {
    setSelectedQuickFilters(prev => 
      prev.includes(filterId)
        ? prev.filter(id => id !== filterId)
        : [...prev, filterId]
    );
  };

  // Complete filter reset logic: clears quick filters, search term, neighborhood, niche, and selection
  const handleResetAllFilters = () => {
    setSelectedQuickFilters([]);
    setSelectedNeighborhood('Todos os Bairros');
    setSelectedNiche('todos');
    setSearchTerm('');
    setSelectedLeadIds([]);
  };

  const handleClearQuickFilters = handleResetAllFilters;

  const hasActiveFilters = 
    selectedQuickFilters.length > 0 || 
    searchTerm.trim() !== '' || 
    selectedNeighborhood !== 'Todos os Bairros' || 
    selectedNiche !== 'todos';

  const activeFiltersCount = 
    selectedQuickFilters.length + 
    (searchTerm.trim() ? 1 : 0) + 
    (selectedNeighborhood !== 'Todos os Bairros' ? 1 : 0) + 
    (selectedNiche !== 'todos' ? 1 : 0);

  // Dynamic autocomplete suggestions for search input
  const searchSuggestions: AutocompleteSuggestion[] = useMemo(() => {
    const list: AutocompleteSuggestion[] = [];

    // 1. Lead names
    leads.forEach(lead => {
      list.push({
        id: `lead-${lead.id}`,
        title: lead.name,
        subtitle: `${lead.category} • ${lead.neighborhood || lead.city}`,
        category: 'empresa',
        badge: lead.inCrm ? 'No Funil' : 'Lead',
        payload: { type: 'lead', id: lead.id, name: lead.name }
      });
    });

    // 2. Neighborhoods
    neighborhoods.forEach(nb => {
      if (nb !== 'Todos os Bairros') {
        list.push({
          id: `nb-${nb}`,
          title: nb,
          subtitle: `Bairro em ${selectedCity}`,
          category: 'bairro',
          badge: 'Bairro',
          payload: { type: 'neighborhood', name: nb }
        });
      }
    });

    // 3. Niches
    NICHE_OPTIONS.forEach(n => {
      if (n.id !== 'todos') {
        list.push({
          id: `niche-${n.id}`,
          title: n.label,
          subtitle: 'Filtrar por nicho / categoria',
          category: 'nicho',
          badge: 'Nicho',
          payload: { type: 'niche', nicheId: n.id, label: n.label }
        });
      }
    });

    // 4. Addresses
    const seenAddresses = new Set<string>();
    leads.forEach(lead => {
      if (lead.address && !seenAddresses.has(lead.address)) {
        seenAddresses.add(lead.address);
        list.push({
          id: `addr-${lead.id}`,
          title: lead.address,
          subtitle: `Localização de ${lead.name}`,
          category: 'endereco',
          badge: 'Endereço',
          payload: { type: 'address', address: lead.address }
        });
      }
    });

    return list;
  }, [leads, neighborhoods, selectedCity]);

  const handleSelectSuggestion = (item: AutocompleteSuggestion) => {
    if (item.payload?.type === 'neighborhood') {
      setSelectedNeighborhood(item.payload.name);
      setSearchTerm('');
    } else if (item.payload?.type === 'niche') {
      setSelectedNiche(item.payload.nicheId);
      setSearchTerm('');
    } else {
      setSearchTerm(item.title);
    }
  };

  // Instant radar scanner to generate leads for selected location & niche
  const handleInstantScan = (overrideNeighborhood?: string, overrideNiche?: string) => {
    setIsScanning(true);
    const targetNeighborhood = overrideNeighborhood || (selectedNeighborhood !== 'Todos os Bairros' ? selectedNeighborhood : 'Centro');
    const targetNiche = overrideNiche || (selectedNiche !== 'todos' ? selectedNiche : 'Barbearia');

    setTimeout(() => {
      const generated = generateRealisticLeadsForLocation({
        city: selectedCity,
        neighborhood: targetNeighborhood,
        niche: targetNiche,
        count: 3,
        query: searchTerm
      });

      generated.forEach(leadData => {
        addCustomLead(leadData);
      });

      setIsScanning(false);
    }, 700);
  };

  // Multi-dimensional resilient filtering logic
  const filteredLeads = useMemo(() => {
    return leads.filter(lead => {
      // 1. City Filter (soft filter when searching globally)
      if (selectedCity) {
        const cityName = normalizeStr(selectedCity.split(' - ')[0]);
        const leadCity = normalizeStr(lead.city || '');
        if (leadCity && cityName && !leadCity.includes(cityName) && !cityName.includes(leadCity)) {
          if (!searchTerm.trim()) {
            return false;
          }
        }
      }

      // 2. Dynamic Neighborhood Filter (matches neighborhood or address)
      if (selectedNeighborhood !== 'Todos os Bairros') {
        const targetNorm = normalizeStr(selectedNeighborhood);
        const leadBairro = normalizeStr(lead.neighborhood || '');
        const leadAddr = normalizeStr(lead.address || '');
        if (!leadBairro.includes(targetNorm) && !leadAddr.includes(targetNorm)) {
          return false;
        }
      }

      // 3. Flexible Niche Filter
      if (selectedNiche !== 'todos' && selectedNiche !== 'Todos os Nichos') {
        const matchLeadNiche = matchesNiche(lead.niche || '', selectedNiche);
        const matchLeadCat = matchesNiche(lead.category || '', selectedNiche);
        if (!matchLeadNiche && !matchLeadCat) {
          return false;
        }
      }

      // 4. Multi-Select Quick Filters (AND logic, with intelligent web opportunity matching)
      if (selectedQuickFilters.length > 0) {
        const hasSemSite = selectedQuickFilters.includes('sem_site');
        const hasSiteLento = selectedQuickFilters.includes('site_lento');
        const hasNotaAlta = selectedQuickFilters.includes('nota_alta');
        const hasForaCrm = selectedQuickFilters.includes('fora_crm');
        const hasApenasReais = selectedQuickFilters.includes('apenas_reais');

        // Combined web opportunity: if user selects both "Sem Site" and "Site Lento",
        // match companies that either don't have a website OR have a slow website (< 50)
        if (hasSemSite && hasSiteLento) {
          const isSlow = lead.hasWebsite && typeof lead.audit?.speedScore === 'number' && lead.audit.speedScore < 50;
          const isWithout = !lead.hasWebsite;
          if (!isSlow && !isWithout) return false;
        } else if (hasSemSite) {
          if (lead.hasWebsite) return false;
        } else if (hasSiteLento) {
          if (!lead.hasWebsite || typeof lead.audit?.speedScore !== 'number' || lead.audit.speedScore >= 50) return false;
        }

        // High Google rating (>= 4.8)
        if (hasNotaAlta) {
          if (typeof lead.rating !== 'number' || lead.rating < 4.8) return false;
        }

        // Outside of CRM (lead.inCrm === false)
        if (hasForaCrm) {
          if (lead.inCrm) return false;
        }

        // Real Data Only
        if (hasApenasReais) {
          if (lead.dataSource === 'synthetic') return false;
        }
      }

      // 5. Multi-token Search Term Filter
      if (debouncedSearchTerm.trim()) {
        const tokens = normalizeStr(debouncedSearchTerm).split(/\s+/).filter(Boolean);
        const corpus = normalizeStr([
          lead.name,
          lead.category,
          lead.niche,
          lead.neighborhood,
          lead.address,
          lead.city,
          lead.phone,
          lead.whatsapp
        ].join(' '));

        const matchesAll = tokens.every(token => corpus.includes(token));
        if (!matchesAll) return false;
      }

      return true;
    });
  }, [leads, selectedCity, selectedNeighborhood, selectedNiche, selectedQuickFilters, debouncedSearchTerm]);

  const handleToggleSelectLead = (id: string) => {
    setSelectedLeadIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleBatchAddToCrm = () => {
    if (selectedLeadIds.length === 0) return;
    batchAddLeadsToCrm(selectedLeadIds);
    setSelectedLeadIds([]);
  };

  const handleRedesignAndCompare = (lead: Lead) => {
    if (!lead.customization) {
      redesignLeadSite(lead.id);
    }
    setCurrentEditingLead(lead);
    setActivePage('redesenhar');
  };

  const selectedNicheLabel = useMemo(() => {
    const found = NICHE_OPTIONS.find(n => n.id === selectedNiche);
    return found ? found.label : selectedNiche;
  }, [selectedNiche]);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header & Switcher */}
      <div className="glass-panel p-4 sm:p-6 rounded-3xl border border-white/10 space-y-4 shadow-xl relative z-40">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 sm:gap-4">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2 text-indigo-400 font-bold text-[10px] sm:text-[11px] uppercase tracking-wider">
              <Compass className="w-3.5 h-3.5 text-sky-400 shrink-0" />
              <span>Ciclo Passo 1 · Radar de Prospecção Local</span>
            </div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-lg sm:text-2xl font-black text-white tracking-tight">
                Prospecção Geográfica de Leads
              </h1>
              {viewMode !== 'map' && (
                <span className="text-[10px] sm:text-xs font-bold px-2 sm:px-2.5 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-400/30 shrink-0">
                  {filteredLeads.length} {filteredLeads.length === 1 ? 'negócio' : 'negócios'}
                </span>
              )}
            </div>
            <p className="text-[11px] sm:text-xs text-slate-300 max-w-2xl leading-relaxed">
              Filtre por cidade, bairro e nicho para identificar empresas locais e oportunidades de presença digital.
            </p>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 sm:gap-2.5 shrink-0">
            {/* View Mode Toggle: Map vs Grid */}
            <div className="p-1 rounded-xl glass-subtle border border-white/10 flex items-center gap-1 shrink-0">
              <button
                onClick={() => setViewMode('grid')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  viewMode === 'grid'
                    ? 'bg-gradient-to-r from-sky-600 to-indigo-600 text-white shadow-md'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Grade {viewMode === 'grid' && `(${filteredLeads.length})`}</span>
              </button>
              <button
                onClick={() => setViewMode('map')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  viewMode === 'map'
                    ? 'bg-gradient-to-r from-sky-600 to-indigo-600 text-white shadow-md'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <MapIcon className="w-3.5 h-3.5" />
                <span>Radar Maps</span>
              </button>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {/* Instant Scan Button */}
              <button
                onClick={() => handleInstantScan()}
                disabled={isScanning}
                className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-sky-500 via-indigo-600 to-blue-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-sky-500/20 border border-white/20 transition-all active:scale-95 disabled:opacity-50 shrink-0"
                title="Iniciar varredura agora para encontrar leads neste bairro e nicho"
              >
                {isScanning ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Varrendo Maps...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-3.5 h-3.5 fill-white text-white" />
                    <span>Escanear no Maps</span>
                  </>
                )}
              </button>

              {/* Novo Lead Manual */}
              <button
                onClick={() => setShowManualLeadModal(true)}
                className="flex items-center justify-center gap-1.5 px-3.5 py-2 glass-panel hover:bg-sky-500/10 text-slate-200 hover:text-sky-300 font-semibold text-xs rounded-xl border border-white/15 hover:border-sky-500/30 transition-all shrink-0 shadow-sm"
                title="Adicionar um novo negócio manualmente ao CRM"
              >
                <Plus className="w-3.5 h-3.5 text-sky-400" />
                <span className="hidden sm:inline">Novo Lead</span>
                <span className="sm:hidden">Novo</span>
              </button>

              {/* Excel Spreadsheet Export */}
              <button
                onClick={() => exportLeadsExcel(filteredLeads)}
                className="flex items-center justify-center gap-1.5 px-3.5 py-2 glass-panel hover:bg-emerald-500/10 text-slate-200 hover:text-emerald-300 font-semibold text-xs rounded-xl border border-white/15 hover:border-emerald-500/30 transition-all shrink-0 shadow-sm"
                title="Exportar planilha formatada em Microsoft Excel (.xlsx) com aba de Resumo e Base Completa"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">Exportar Excel (.xlsx)</span>
                <span className="sm:hidden">Excel</span>
              </button>
            </div>
          </div>
        </div>

        {/* Dynamic Multi-Dimensional Search & Filters */}
        {viewMode !== 'map' && (
          <div className="space-y-3 pt-3 border-t border-white/10">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-3.5">
            {/* 1. Cidade no Maps */}
            <div className="min-w-0 flex flex-col justify-end">
              <label className="text-[11px] font-semibold text-slate-300 mb-1.5 flex items-center justify-between h-6">
                <span className="truncate">🌆 Cidade no Maps:</span>
                <span className="text-[10px] text-sky-400 font-normal shrink-0 ml-1">Base</span>
              </label>
              <ResponsiveSelect
                value={selectedCity}
                onChange={handleCityChange}
                options={AVAILABLE_CITIES.map(c => ({ value: c, label: c }))}
                className="w-full"
                buttonClassName="py-2.5 font-semibold text-xs"
              />
            </div>

            {/* 2. Bairro / Região */}
            <div className="min-w-0 flex flex-col justify-end">
              <label className="text-[11px] font-semibold text-slate-300 mb-1.5 flex items-center justify-between h-6">
                <span className="truncate">📍 Bairro / Região:</span>
                {isSyncing ? (
                  <span className="text-[10px] text-amber-400 font-normal animate-pulse shrink-0 ml-1 leading-none">IBGE...</span>
                ) : (
                  <span className="text-[10px] text-indigo-400 font-normal shrink-0 ml-1 leading-none">{neighborhoods.length} locais</span>
                )}
              </label>
              <ResponsiveSelect
                value={selectedNeighborhood}
                onChange={(val) => setSelectedNeighborhood(val)}
                options={[
                  { value: 'Todos os Bairros', label: '📍 Todos os Bairros' },
                  ...neighborhoods.map(b => ({ value: b, label: b }))
                ]}
                className="w-full"
                buttonClassName="py-2.5 font-semibold text-xs"
              />
            </div>

            {/* 3. Nicho de Mercado */}
            <div className="min-w-0 flex flex-col justify-end">
              <label className="text-[11px] font-semibold text-slate-300 mb-1.5 flex items-center justify-between h-6">
                <span className="truncate">💼 Nicho de Mercado:</span>
                <span className="text-[10px] text-indigo-400 font-normal shrink-0 ml-1">Categoria</span>
              </label>
              <ResponsiveSelect
                value={selectedNiche}
                onChange={(val) => setSelectedNiche(val)}
                options={NICHE_OPTIONS.map(n => ({ value: n.id, label: n.label }))}
                className="w-full"
                buttonClassName="py-2.5 font-semibold text-xs"
              />
            </div>

            {/* 4. Busca Textual por Nome ou Rua */}
            <div className="min-w-0 relative z-50 flex flex-col justify-end">
              <label className="text-[11px] font-semibold text-slate-300 mb-1.5 flex items-center justify-between h-6">
                <span className="truncate">🔍 Buscar por Nome ou Rua:</span>
                <span className="text-[10px] text-slate-400 font-normal shrink-0 ml-1">Filtro Livre</span>
              </label>
              <SearchAutocomplete
                value={searchTerm}
                onChange={setSearchTerm}
                onSelect={handleSelectSuggestion}
                suggestions={searchSuggestions}
                placeholder="Ex: Nome da empresa, rua, telefone..."
                onClear={() => setSearchTerm('')}
              />
            </div>
          </div>

          {/* Quick Filter Pills (Multi-Select) */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 pt-2.5 border-t border-white/10">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase shrink-0">
              <SlidersHorizontal className="w-3 h-3 text-indigo-400 shrink-0" />
              <span>Filtros Rápidos:</span>
              {selectedQuickFilters.length > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-bold border border-indigo-400/30">
                  {selectedQuickFilters.length} {selectedQuickFilters.length === 1 ? 'ativo' : 'ativos'}
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              {/* "Todos" button (active when no specific filter is selected) */}
              <button
                type="button"
                onClick={handleClearQuickFilters}
                className={`px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl text-xs font-semibold border whitespace-nowrap transition-all ${
                  selectedQuickFilters.length === 0
                    ? 'bg-indigo-600 text-white border-indigo-400/40 shadow-md ring-1 ring-indigo-400/30'
                    : 'glass-card text-slate-300 hover:text-white border-white/10'
                }`}
                title="Mostrar todos os leads sem filtros adicionais"
              >
                Todos
              </button>

              {/* Individual Multi-selectable Filters */}
              {QUICK_FILTERS.map(f => {
                const isSelected = selectedQuickFilters.includes(f.id);
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => handleToggleQuickFilter(f.id)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl text-xs font-semibold border whitespace-nowrap transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-gradient-to-r from-indigo-600 to-sky-600 text-white border-sky-400/40 shadow-md ring-1 ring-sky-400/30'
                        : 'glass-card text-slate-300 hover:text-white hover:border-white/20 border-white/10'
                    }`}
                    title={isSelected ? 'Clique para desmarcar este filtro' : 'Clique para combinar este filtro'}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5 text-sky-200 stroke-[3]" />}
                    <span>{f.label}</span>
                  </button>
                );
              })}

              {/* Quick Reset when multiple are selected */}
              {selectedQuickFilters.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearQuickFilters}
                  className="px-2 py-1 text-[11px] font-medium text-slate-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition-colors ml-auto sm:ml-0"
                  title="Limpar todos os filtros rápidos"
                >
                  ✕ Desmarcar todos
                </button>
              )}
            </div>
          </div>
        </div>
        )}
      </div>

      {/* Main View Mode: local prospecting radar vs grid cards */}
      {viewMode === 'map' ? (
        <GoogleMapsProspector />
      ) : (
        <>
          {/* Bulk Action Bar (when multiple leads are selected) */}
          {selectedLeadIds.length > 0 && (
            <div className="glass-panel p-3.5 rounded-2xl border border-indigo-500/30 bg-indigo-500/10 flex items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="flex items-center gap-2 text-xs font-bold text-indigo-300">
                <span>{selectedLeadIds.length} leads selecionados</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleBatchAddToCrm}
                  className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-bold text-xs rounded-xl shadow-md border border-white/20 transition-all flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Enviar Selecionados ao CRM</span>
                </button>
              </div>
            </div>
          )}

          {/* Empty State with Instant Radar Scan */}
          {filteredLeads.length === 0 ? (
            <div className="glass-panel p-8 sm:p-12 rounded-3xl border border-white/10 text-center space-y-5 max-w-xl mx-auto shadow-2xl animate-in fade-in zoom-in-95 duration-200">
              <div className="relative mx-auto w-20 h-20 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full bg-sky-500/10 border border-sky-400/30 animate-ping opacity-75" />
                <div className="absolute inset-2 rounded-full bg-indigo-500/15 border border-indigo-400/40" />
                <div className="relative flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-white shadow-lg shadow-sky-500/25">
                  <Compass className={`w-6 h-6 ${isScanning ? 'animate-spin' : ''}`} />
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                  Nenhum lead encontrado com estes filtros
                </h3>
                <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
                  Não há empresas salvas para{' '}
                  <strong className="text-sky-300 font-semibold">
                    {selectedNeighborhood !== 'Todos os Bairros' ? selectedNeighborhood : selectedCity}
                  </strong>{' '}
                  {selectedNiche !== 'todos' && (
                    <>no nicho <strong className="text-indigo-300 font-semibold">{selectedNicheLabel}</strong></>
                  )}. Deseja executar uma varredura no OpenStreetMap para encontrar empresas reais?
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => handleInstantScan()}
                  disabled={isScanning}
                  className="px-5 py-3 bg-gradient-to-r from-sky-500 via-indigo-600 to-blue-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-sky-500/25 border border-white/20 transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50"
                >
                  {isScanning ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Buscando estabelecimentos no OpenStreetMap...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 fill-white text-white" />
                      <span>
                        Escanear Área{' '}
                        {selectedNeighborhood !== 'Todos os Bairros' ? `em ${selectedNeighborhood}` : ''}
                      </span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => {
                    setSelectedNeighborhood('Todos os Bairros');
                    setSelectedNiche('todos');
                    setSearchTerm('');
                    setSelectedQuickFilters([]);
                  }}
                  className="px-4 py-3 glass-panel hover:bg-white/10 text-slate-300 hover:text-white font-semibold text-xs rounded-xl border border-white/10 transition-all"
                >
                  Limpar Filtros
                </button>
              </div>
            </div>
          ) : (
            /* Leads Grid Cards */
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
              {filteredLeads.map((lead) => {
                const isSelected = selectedLeadIds.includes(lead.id);

                return (
                  <div
                    key={lead.id}
                    className={`glass-card p-5 rounded-3xl border transition-all space-y-4 relative flex flex-col justify-between ${
                      isSelected ? 'border-indigo-400/60 bg-indigo-500/[0.06] shadow-xl shadow-indigo-500/10' : 'border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className="space-y-3">
                      {/* Header: Name, Select Checkbox, Rating, Category */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2.5">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelectLead(lead.id)}
                            className="mt-1 accent-indigo-500 rounded cursor-pointer"
                          />
                          <div>
                            <h3 
                              onClick={() => setSelectedLeadForModal(lead)}
                              className="font-extrabold text-sm text-white hover:text-sky-300 cursor-pointer transition-colors leading-tight"
                            >
                              {lead.name}
                            </h3>
                            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                              <span className="text-[11px] text-slate-400">{lead.category}</span>
                              {lead.neighborhood && (
                                <>
                                  <span className="text-slate-600 text-[10px]">•</span>
                                  <span className="text-[11px] text-sky-400/90 font-medium">{lead.neighborhood}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-500/15 text-amber-300 border border-amber-500/30 text-xs font-bold shrink-0">
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                          <span>{typeof lead.rating === 'number' ? lead.rating : 'Avaliação não informada'}</span>
                          {typeof lead.reviewsCount === 'number' && <span className="text-[10px] text-amber-400/70 font-normal">({lead.reviewsCount})</span>}
                        </div>
                      </div>

                      {/* Technical Diagnostic Badge */}
                      <div className="p-3 glass-panel rounded-2xl border border-white/10 space-y-1.5 text-[11px]">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Diagnóstico Técnico:</span>
                          <span className={`font-bold ${lead.hasWebsite ? 'text-amber-300' : 'text-rose-400'}`}>
                            {lead.hasWebsite ? (typeof lead.audit?.speedScore === 'number' ? `PageSpeed ${lead.audit.speedScore}/100` : 'Não auditado') : 'Sem Site Próprio'}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-[10px] text-slate-300">
                          <span>Mobile Friendly:</span>
                          <span className={!lead.audit ? 'text-slate-400' : lead.audit.mobileFriendly ? 'text-emerald-400' : 'text-rose-400'}>
                            {!lead.audit ? 'Não auditado' : lead.audit.mobileFriendly ? 'Sim' : 'Não Adaptado'}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-[10px] text-slate-300">
                          <span>Certificado SSL:</span>
                          <span className={!lead.audit ? 'text-slate-400' : lead.audit.hasSsl ? 'text-emerald-400' : 'text-rose-400'}>
                            {!lead.audit ? 'Não auditado' : lead.audit.hasSsl ? 'Ativo (HTTPS)' : 'Inseguro (HTTP)'}
                          </span>
                        </div>
                      </div>

                      {/* Address & Contact */}
                      <div className="space-y-1 text-xs text-slate-300">
                        <p className="flex items-center gap-1.5 text-slate-400 text-[11px] truncate">
                          <MapPin className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                          <span>{lead.address || lead.city || 'Endereço não informado'}</span>
                        </p>
                        <p className="flex items-center gap-1.5 text-sky-300 text-[11px]">
                          <Phone className="w-3.5 h-3.5 shrink-0" />
                          <span>{lead.phone || 'Telefone não informado'}</span>
                        </p>
                      </div>
                    </div>

                    {/* Action Buttons Footer */}
                    <div className="pt-3 border-t border-white/10 flex flex-wrap gap-2">
                      <button
                        onClick={() => handleRedesignAndCompare(lead)}
                        className="flex-1 py-2 px-3 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-bold text-xs rounded-xl shadow-md border border-white/15 transition-all flex items-center justify-center gap-1.5"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Redesenhar IA</span>
                      </button>

                      <button
                        onClick={() => setEmailModalLead(lead)}
                        className="py-2 px-2.5 glass-panel hover:bg-white/15 text-sky-300 hover:text-white font-semibold text-xs rounded-xl border border-sky-400/30 transition-all flex items-center gap-1"
                        title="Enviar E-mail de Follow-up (EmailService)"
                      >
                        <Mail className="w-3.5 h-3.5" />
                      </button>

                      {!lead.inCrm ? (
                        <button
                          onClick={() => addLeadToCrm(lead.id)}
                          className="py-2 px-3 glass-panel hover:bg-white/15 text-slate-200 hover:text-white font-semibold text-xs rounded-xl border border-white/15 transition-all flex items-center gap-1"
                          title="Adicionar ao CRM"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>CRM</span>
                        </button>
                      ) : (
                        <span className="py-2 px-3 glass-panel text-emerald-300 font-semibold text-[11px] rounded-xl border border-emerald-500/30 flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" />
                          <span>No Funil</span>
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
      
      <ManualLeadModal 
        isOpen={showManualLeadModal} 
        onClose={() => setShowManualLeadModal(false)} 
      />
    </div>
  );
};
