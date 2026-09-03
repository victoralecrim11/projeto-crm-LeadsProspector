import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Search, 
  Sparkles, 
  Building2, 
  MapPin, 
  LayoutDashboard, 
  Compass, 
  Palette, 
  Edit3, 
  FileText, 
  KanbanSquare, 
  Clock, 
  ScrollText, 
  Calendar, 
  Globe, 
  DollarSign, 
  Server, 
  Settings, 
  Trophy, 
  Sun, 
  Moon, 
  ExternalLink, 
  X,
  CornerDownLeft,
  ArrowUpDown,
  Download,
  Phone,
  Star
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import { ActivePage, Lead } from '../../types';

interface PaletteItem {
  id: string;
  title: string;
  subtitle: string;
  category: 'lead' | 'page' | 'action';
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  badge?: string;
  badgeColor?: string;
  action: () => void;
}

export const GlobalCommandPalette: React.FC = () => {
  const {
    isCommandPaletteOpen,
    setIsCommandPaletteOpen,
    setActivePage,
    setSelectedLeadForModal,
    setIsCreateSiteModalOpen,
    toggleTheme,
    theme,
    exportLeadsCsv,
    leads
  } = useCrm();

  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<'all' | 'lead' | 'page' | 'action'>('all');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Focus input on open & reset state
  useEffect(() => {
    if (isCommandPaletteOpen) {
      setQuery('');
      setSelectedIndex(0);
      setActiveCategory('all');
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isCommandPaletteOpen]);

  // Build Pages List
  const pageItems: PaletteItem[] = useMemo(() => [
    {
      id: 'page-dashboard',
      title: 'Dashboard Comercial',
      subtitle: 'Métricas gerais, faturamento e resumo de fechamentos',
      category: 'page',
      icon: LayoutDashboard,
      iconColor: 'text-indigo-400',
      action: () => {
        setActivePage('dashboard');
        setIsCommandPaletteOpen(false);
      }
    },
    {
      id: 'page-leads',
      title: 'Radar Google Maps & Leads',
      subtitle: 'Prospecção geográfica, bairros e filtro de oportunidades',
      category: 'page',
      icon: Compass,
      iconColor: 'text-sky-400',
      badge: 'Principal',
      badgeColor: 'bg-sky-500/20 text-sky-300 border-sky-400/30',
      action: () => {
        setActivePage('leads');
        setIsCommandPaletteOpen(false);
      }
    },
    {
      id: 'page-redesenhar',
      title: 'Redesenho & Prévia IA',
      subtitle: 'Comparador interativo Antes vs Depois pronto para pitch',
      category: 'page',
      icon: Palette,
      iconColor: 'text-purple-400',
      action: () => {
        setActivePage('redesenhar');
        setIsCommandPaletteOpen(false);
      }
    },
    {
      id: 'page-editor',
      title: 'Editor Visual de Sites',
      subtitle: 'Personalize títulos, fotos, cores e botões de WhatsApp',
      category: 'page',
      icon: Edit3,
      iconColor: 'text-amber-400',
      action: () => {
        setActivePage('editor');
        setIsCommandPaletteOpen(false);
      }
    },
    {
      id: 'page-propostas',
      title: 'Gerador de Propostas Comerciais',
      subtitle: 'Templates de fechamento, e-mails de pitch e scripts WhatsApp',
      category: 'page',
      icon: FileText,
      iconColor: 'text-emerald-400',
      badge: 'Auto-save',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30',
      action: () => {
        setActivePage('propostas');
        setIsCommandPaletteOpen(false);
      }
    },
    {
      id: 'page-crm',
      title: 'Pipeline CRM & Kanban',
      subtitle: 'Acompanhe as etapas de negociação e fechamentos',
      category: 'page',
      icon: KanbanSquare,
      iconColor: 'text-blue-400',
      action: () => {
        setActivePage('crm');
        setIsCommandPaletteOpen(false);
      }
    },
    {
      id: 'page-followup',
      title: 'Radar de Follow-up SLA',
      subtitle: 'Alertas para leads parados há 3+ dias sem resposta',
      category: 'page',
      icon: Clock,
      iconColor: 'text-rose-400',
      action: () => {
        setActivePage('followup');
        setIsCommandPaletteOpen(false);
      }
    },
    {
      id: 'page-contratos',
      title: 'Minutas & Contratos Digitais',
      subtitle: 'Contratos jurídicos com setup e MRR mensal',
      category: 'page',
      icon: ScrollText,
      iconColor: 'text-teal-400',
      action: () => {
        setActivePage('contratos');
        setIsCommandPaletteOpen(false);
      }
    },
    {
      id: 'page-agendamentos',
      title: 'Agendamentos & Reuniões',
      subtitle: 'Controle de chamadas de vídeo e visitas presenciais',
      category: 'page',
      icon: Calendar,
      iconColor: 'text-violet-400',
      action: () => {
        setActivePage('agendamentos');
        setIsCommandPaletteOpen(false);
      }
    },
    {
      id: 'page-projetos',
      title: 'Sites Publicados & Clientes',
      subtitle: 'Projetos entregues com apontamento de domínio',
      category: 'page',
      icon: Globe,
      iconColor: 'text-cyan-400',
      action: () => {
        setActivePage('projetos');
        setIsCommandPaletteOpen(false);
      }
    },
    {
      id: 'page-cobrar',
      title: 'Financeiro & MRR Recorrente',
      subtitle: 'Faturamento de setup e mensalidades de hospedagem',
      category: 'page',
      icon: DollarSign,
      iconColor: 'text-emerald-400',
      action: () => {
        setActivePage('cobrar');
        setIsCommandPaletteOpen(false);
      }
    },
    {
      id: 'page-setup',
      title: 'Setup HostGator & cPanel',
      subtitle: 'Conexão e publicação automática com SSL',
      category: 'page',
      icon: Server,
      iconColor: 'text-amber-400',
      action: () => {
        setActivePage('setup');
        setIsCommandPaletteOpen(false);
      }
    },
    {
      id: 'page-configuracoes',
      title: 'Configurações do CRM',
      subtitle: 'Chaves de API do Google Maps, IA e perfil comercial',
      category: 'page',
      icon: Settings,
      iconColor: 'text-slate-400',
      action: () => {
        setActivePage('configuracoes');
        setIsCommandPaletteOpen(false);
      }
    },
    {
      id: 'page-ranking',
      title: 'Ranking de Vendas SDR',
      subtitle: 'Desempenho e gamificação da equipe',
      category: 'page',
      icon: Trophy,
      iconColor: 'text-yellow-400',
      action: () => {
        setActivePage('ranking');
        setIsCommandPaletteOpen(false);
      }
    }
  ], [setActivePage, setIsCommandPaletteOpen]);

  // Build Action Items
  const actionItems: PaletteItem[] = useMemo(() => [
    {
      id: 'act-create-site',
      title: 'Gerar Novo Site com IA',
      subtitle: 'Criar landing page para prospecção imediata',
      category: 'action',
      icon: Sparkles,
      iconColor: 'text-sky-400',
      badge: 'IA',
      badgeColor: 'bg-sky-500/20 text-sky-300 border-sky-400/30',
      action: () => {
        setIsCreateSiteModalOpen(true);
        setIsCommandPaletteOpen(false);
      }
    },
    {
      id: 'act-toggle-theme',
      title: theme === 'dark' ? 'Mudar para Modo Claro' : 'Mudar para Modo Escuro',
      subtitle: `Alternar interface para tema ${theme === 'dark' ? 'claro (Clean)' : 'escuro (Dark Luxury)'}`,
      category: 'action',
      icon: theme === 'dark' ? Sun : Moon,
      iconColor: theme === 'dark' ? 'text-amber-300' : 'text-indigo-400',
      badge: 'Tema',
      badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-400/30',
      action: () => {
        toggleTheme();
        setIsCommandPaletteOpen(false);
      }
    },
    {
      id: 'act-export-csv',
      title: 'Exportar Base de Leads para CSV',
      subtitle: 'Download da planilha completa com telefones e status',
      category: 'action',
      icon: Download,
      iconColor: 'text-emerald-400',
      badge: 'CSV',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30',
      action: () => {
        exportLeadsCsv();
        setIsCommandPaletteOpen(false);
      }
    }
  ], [theme, toggleTheme, exportLeadsCsv, setIsCreateSiteModalOpen, setIsCommandPaletteOpen]);

  // Build Lead Items
  const leadItems: PaletteItem[] = useMemo(() => {
    return leads.map((lead: Lead) => ({
      id: `lead-${lead.id}`,
      title: lead.name,
      subtitle: `${lead.category} • ${lead.neighborhood || lead.city} • ${lead.rating} ⭐ (${lead.reviewsCount} avaliações) • ${lead.hasWebsite ? 'Possui Site' : 'SEM SITE'}`,
      category: 'lead' as const,
      icon: Building2,
      iconColor: lead.hasWebsite ? 'text-slate-400' : 'text-amber-400',
      badge: lead.hasWebsite ? 'Com Site' : 'Sem Site',
      badgeColor: lead.hasWebsite 
        ? 'bg-slate-500/20 text-slate-300 border-slate-400/20' 
        : 'bg-amber-500/20 text-amber-300 border-amber-400/30 font-bold',
      action: () => {
        setSelectedLeadForModal(lead);
        setIsCommandPaletteOpen(false);
      }
    }));
  }, [leads, setSelectedLeadForModal, setIsCommandPaletteOpen]);

  // Filter items based on query & category
  const filteredItems = useMemo(() => {
    let pool: PaletteItem[] = [];
    if (activeCategory === 'all') {
      pool = [...actionItems, ...pageItems, ...leadItems];
    } else if (activeCategory === 'lead') {
      pool = leadItems;
    } else if (activeCategory === 'page') {
      pool = pageItems;
    } else if (activeCategory === 'action') {
      pool = actionItems;
    }

    if (!query.trim()) {
      return pool;
    }

    const cleanQuery = query.toLowerCase().trim();
    return pool.filter(item => 
      item.title.toLowerCase().includes(cleanQuery) ||
      item.subtitle.toLowerCase().includes(cleanQuery) ||
      (item.badge && item.badge.toLowerCase().includes(cleanQuery))
    );
  }, [activeCategory, query, actionItems, pageItems, leadItems]);

  // Keep selected index in bounds
  useEffect(() => {
    if (selectedIndex >= filteredItems.length) {
      setSelectedIndex(0);
    }
  }, [filteredItems.length, selectedIndex]);

  // Keyboard navigation within the palette
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % Math.max(1, filteredItems.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + filteredItems.length) % Math.max(1, filteredItems.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredItems[selectedIndex]) {
        filteredItems[selectedIndex].action();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsCommandPaletteOpen(false);
    }
  };

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current) {
      const activeEl = listRef.current.children[selectedIndex] as HTMLElement | undefined;
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  if (!isCommandPaletteOpen) return null;

  return (
    <div 
      id="global-command-palette-backdrop"
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-3 sm:px-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-150"
      onClick={() => setIsCommandPaletteOpen(false)}
    >
      <div 
        id="global-command-palette-container"
        className="w-full max-w-2xl glass-panel bg-slate-900/95 dark:bg-slate-950/95 border border-white/20 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[82vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Top Input Header */}
        <div className="flex items-center gap-3 px-4 sm:px-5 py-3.5 border-b border-white/10 bg-white/[0.03]">
          <Search className="w-5 h-5 text-indigo-400 shrink-0 animate-pulse" />
          <input
            ref={inputRef}
            type="text"
            id="input-command-palette-search"
            value={query}
            onChange={(e) => {
              let val = e.target.value;
              const isNumericInput = /^[\d\s\-\(\)\+]*$/.test(val);
              const digits = val.replace(/\D/g, '');
              
              if (isNumericInput && val.length > query.length && digits.length >= 2 && digits.length <= 11 && !val.startsWith('0800') && !val.startsWith('0300')) {
                if (digits.length <= 2) {
                  val = `(${digits}`;
                } else if (digits.length <= 6) {
                  val = `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
                } else if (digits.length <= 10) {
                  val = `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
                } else {
                  val = `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
                }
              }

              setQuery(val);
              setSelectedIndex(0);
            }}
            placeholder="Buscar empresa, bairro, página do CRM ou comando rápido..."
            className="flex-1 bg-transparent text-sm sm:text-base text-white placeholder:text-slate-400 focus:outline-none"
            autoComplete="off"
            spellCheck="false"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors"
              title="Limpar busca"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-flex items-center px-2 py-0.5 text-[10px] font-mono font-bold bg-white/10 text-slate-300 rounded-md border border-white/15">
            ESC para fechar
          </kbd>
        </div>

        {/* Category Filter Tabs */}
        <div className="flex items-center gap-1.5 px-4 py-2 border-b border-white/10 bg-white/[0.02] overflow-x-auto scrollbar-none text-xs">
          <button
            onClick={() => { setActiveCategory('all'); setSelectedIndex(0); }}
            className={`px-3 py-1 rounded-xl font-medium transition-all ${
              activeCategory === 'all' 
                ? 'bg-indigo-600 text-white font-bold shadow-sm' 
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            Todos ({actionItems.length + pageItems.length + leadItems.length})
          </button>
          <button
            onClick={() => { setActiveCategory('lead'); setSelectedIndex(0); }}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-xl font-medium transition-all ${
              activeCategory === 'lead' 
                ? 'bg-indigo-600 text-white font-bold shadow-sm' 
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Building2 className="w-3.5 h-3.5 text-amber-400" />
            <span>Empresas ({leadItems.length})</span>
          </button>
          <button
            onClick={() => { setActiveCategory('page'); setSelectedIndex(0); }}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-xl font-medium transition-all ${
              activeCategory === 'page' 
                ? 'bg-indigo-600 text-white font-bold shadow-sm' 
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Compass className="w-3.5 h-3.5 text-sky-400" />
            <span>Páginas ({pageItems.length})</span>
          </button>
          <button
            onClick={() => { setActiveCategory('action'); setSelectedIndex(0); }}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-xl font-medium transition-all ${
              activeCategory === 'action' 
                ? 'bg-indigo-600 text-white font-bold shadow-sm' 
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>Ações ({actionItems.length})</span>
          </button>
        </div>

        {/* Results List */}
        <div 
          ref={listRef}
          className="flex-1 overflow-y-auto p-2 divide-y divide-white/5 max-h-[50vh] scrollbar-thin"
        >
          {filteredItems.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <Search className="w-8 h-8 text-slate-500 mx-auto" />
              <p className="text-sm font-medium">Nenhum resultado encontrado para "{query}"</p>
              <p className="text-xs text-slate-500">Tente buscar por nome de empresa, nicho, rua ou página do CRM.</p>
            </div>
          ) : (
            filteredItems.map((item, index) => {
              const isSelected = index === selectedIndex;
              const IconComp = item.icon;
              return (
                <div
                  key={item.id}
                  onClick={() => item.action()}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl cursor-pointer transition-all ${
                    isSelected 
                      ? 'bg-indigo-600/30 border border-indigo-500/50 shadow-md' 
                      : 'hover:bg-white/[0.04] border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className={`p-2 rounded-xl bg-white/[0.06] ${item.iconColor} shrink-0`}>
                      <IconComp className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs sm:text-sm font-semibold truncate ${isSelected ? 'text-white font-bold' : 'text-slate-200'}`}>
                          {item.title}
                        </span>
                        {item.badge && (
                          <span className={`px-2 py-0.5 text-[10px] rounded-md border shrink-0 ${item.badgeColor}`}>
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">
                        {item.subtitle}
                      </p>
                    </div>
                  </div>

                  {isSelected && (
                    <div className="hidden sm:flex items-center gap-1 text-[11px] font-semibold text-indigo-300 shrink-0">
                      <span>Enter</span>
                      <CornerDownLeft className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer Shortcut Hints */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-white/[0.02] border-t border-white/10 text-[11px] text-slate-400">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-white/10 rounded border border-white/15">↑</kbd>
              <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-white/10 rounded border border-white/15">↓</kbd>
              <span>Navegar</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-white/10 rounded border border-white/15">↵</kbd>
              <span>Abrir</span>
            </span>
          </div>
          <span className="text-slate-500">
            {filteredItems.length} resultado{filteredItems.length === 1 ? '' : 's'}
          </span>
        </div>
      </div>
    </div>
  );
};
