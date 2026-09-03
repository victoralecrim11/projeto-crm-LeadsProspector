import React, { useRef, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Compass, 
  Sparkles, 
  Edit3, 
  FileText, 
  KanbanSquare, 
  Clock, 
  ShieldCheck, 
  Calendar, 
  Globe, 
  CreditCard, 
  Settings, 
  Trophy, 
  Handshake, 
  Zap, 
  Sun, 
  PanelLeftClose,
  PanelLeft,
  Server,
  X
} from 'lucide-react';
import { useCrm } from '../context/CrmContext';
import { ActivePage } from '../types';

export const Sidebar: React.FC = () => {
  const { 
    activePage, 
    setActivePage, 
    sidebarCollapsed, 
    setSidebarCollapsed,
    setIsUpgradeModalOpen,
    isMobileMenuOpen,
    setIsMobileMenuOpen
  } = useCrm();

  const sidebarRef = useRef<HTMLElement>(null);

  // Auto-close mobile drawer when window is resized/expanded to desktop width
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [setIsMobileMenuOpen]);

  // Click outside and Esc key listeners to reliably close mobile drawer
  useEffect(() => {
    if (!isMobileMenuOpen) return;

    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      const target = e.target as HTMLElement;
      if (
        sidebarRef.current && 
        !sidebarRef.current.contains(target) &&
        !target.closest('#btn-mobile-menu-toggle')
      ) {
        setIsMobileMenuOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMobileMenuOpen, setIsMobileMenuOpen]);

  const handleNavClick = (pageId: ActivePage) => {
    setActivePage(pageId);
    setIsMobileMenuOpen(false);
  };

  const primaryCycleNav: { id: ActivePage; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: 'dashboard', label: 'Painel Geral', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'leads', label: '1. Prospectar Maps', icon: <Compass className="w-4 h-4" />, badge: 'MAPS' },
    { id: 'redesenhar', label: '2. Redesenho & Prévia', icon: <Sparkles className="w-4 h-4" />, badge: 'IA' },
    { id: 'editor', label: '3. Editor Visual', icon: <Edit3 className="w-4 h-4" /> },
    { id: 'propostas', label: '4. Propostas & E-mail', icon: <FileText className="w-4 h-4" /> },
    { id: 'crm', label: '5. Pipeline CRM', icon: <KanbanSquare className="w-4 h-4" /> },
    { id: 'followup', label: '6. Radar Follow-up', icon: <Clock className="w-4 h-4" />, badge: '3+ DIAS' },
    { id: 'contratos', label: '7. Minutas & Contratos', icon: <ShieldCheck className="w-4 h-4" /> },
  ];

  const managementNav: { id: ActivePage; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: 'agendamentos', label: 'Agendamentos', icon: <Calendar className="w-4 h-4" /> },
    { id: 'projetos', label: 'Sites Publicados', icon: <Globe className="w-4 h-4" /> },
    { id: 'cobrar', label: 'Financeiro & MRR', icon: <CreditCard className="w-4 h-4" /> },
    { id: 'setup', label: 'Setup HostGator', icon: <Server className="w-4 h-4" /> },
    { id: 'configuracoes', label: 'Configurações CRM', icon: <Settings className="w-4 h-4" /> },
    { id: 'ranking', label: 'Ranking SDRs', icon: <Trophy className="w-4 h-4" /> },
    { id: 'afiliado', label: 'Programa Afiliado', icon: <Handshake className="w-4 h-4" /> },
  ];

  return (
    <>
      {/* Mobile Backdrop Blur Overlay */}
      {isMobileMenuOpen && (
        <div 
          id="sidebar-mobile-backdrop"
          onClick={() => setIsMobileMenuOpen(false)}
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
          aria-hidden="true"
        />
      )}

      <aside 
        ref={sidebarRef}
        id="main-sidebar"
        className={`
          fixed lg:static inset-y-0 left-0 z-50 lg:z-30
          flex flex-col justify-between h-full lg:h-screen
          bg-white/95 dark:bg-slate-950/95 lg:bg-white/85 lg:dark:bg-slate-950/70 backdrop-blur-2xl border-r border-slate-200/80 dark:border-white/10
          transition-all duration-300 shrink-0 select-none shadow-2xl lg:shadow-none
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          w-72 max-w-[85vw]
          ${sidebarCollapsed ? 'lg:w-20' : 'lg:w-64'}
        `}
      >
        {/* Top Header & Brand */}
        <div className="flex flex-col">
          <div className="flex items-center justify-between px-4 py-4 border-b border-slate-200/80 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02]">
            {!sidebarCollapsed ? (
              <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => handleNavClick('dashboard')}>
                <div className="relative flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 via-blue-500 to-sky-400 shadow-lg shadow-indigo-500/30 border border-white/20">
                  <Sparkles className="w-4 h-4 text-white fill-white" />
                </div>
                <div>
                  <div className="flex items-baseline">
                    <span className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-white">PROSPECTOR</span>
                    <span className="text-xs font-bold text-sky-600 dark:text-sky-400 ml-1 px-1.5 py-0.2 rounded bg-sky-500/10 border border-sky-400/20">v2.1</span>
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium leading-none">CRM & Fechamento de Sites</p>
                </div>
              </div>
            ) : (
              <div className="mx-auto cursor-pointer" onClick={() => handleNavClick('dashboard')} title="PROSPECTOR CRM">
                <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 via-blue-500 to-sky-400 shadow-lg shadow-indigo-500/30 border border-white/20">
                  <Sparkles className="w-4 h-4 text-white fill-white" />
                </div>
              </div>
            )}

            {/* Mobile Close Button */}
            <button
              id="btn-close-mobile-sidebar"
              onClick={() => setIsMobileMenuOpen(false)}
              title="Fechar menu"
              className="p-1.5 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-lg hover:bg-slate-200/60 dark:hover:bg-white/10 transition-colors border border-transparent lg:hidden"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Desktop Collapse Button */}
            {!sidebarCollapsed && (
              <button
                id="btn-toggle-sidebar"
                onClick={() => setSidebarCollapsed(true)}
                title="Recolher menu"
                className="hidden lg:flex p-1.5 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-lg hover:bg-slate-200/60 dark:hover:bg-white/10 transition-colors border border-transparent cursor-pointer"
              >
                <PanelLeftClose className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* When collapsed on desktop: centered expand button */}
          {sidebarCollapsed && (
            <div className="hidden lg:flex justify-center py-2 border-b border-slate-200/80 dark:border-white/10 bg-slate-50/40 dark:bg-white/[0.01]">
              <button
                id="btn-expand-sidebar"
                onClick={() => setSidebarCollapsed(false)}
                title="Expandir menu"
                className="p-1.5 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-lg hover:bg-slate-200/60 dark:hover:bg-white/10 transition-colors cursor-pointer"
              >
                <PanelLeft className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Navigation items */}
          <nav className="flex flex-col gap-1 px-3 py-3 overflow-y-auto max-h-[calc(100vh-270px)] scrollbar-thin">
            {/* Section 1: O Ciclo de Vendas */}
            {!sidebarCollapsed && (
              <span className="text-[10px] font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase px-3 pt-2 pb-1 block">
                Ciclo de Fechamento
              </span>
            )}
            {primaryCycleNav.map((item) => {
              const isActive = activePage === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-item-${item.id}`}
                  onClick={() => handleNavClick(item.id)}
                  className={`group flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all duration-150 ${
                    isActive 
                      ? 'bg-gradient-to-r from-indigo-600 to-blue-600 !text-white shadow-lg shadow-indigo-500/25 border border-indigo-400/30 font-semibold' 
                      : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-white/[0.06] border border-transparent'
                  } ${sidebarCollapsed ? 'justify-center px-0 py-2.5' : ''}`}
                  title={sidebarCollapsed ? item.label : undefined}
                >
                  <div className="flex items-center gap-2.5">
                    <span className={`${isActive ? '!text-white' : 'text-slate-500 group-hover:text-slate-800 dark:text-slate-400 dark:group-hover:text-slate-200'}`}>
                      {item.icon}
                    </span>
                    {!sidebarCollapsed && (
                      <span className={`truncate ${isActive ? '!text-white' : ''}`}>{item.label}</span>
                    )}
                  </div>

                  {!sidebarCollapsed && item.badge && (
                    <span className={`px-1.5 py-0.2 text-[9px] font-bold tracking-wider rounded-md border ${
                      item.badge === 'MAPS' ? 'bg-sky-500/10 text-sky-600 dark:bg-sky-500/20 dark:text-sky-300 border-sky-500/30' :
                      item.badge === 'IA' ? 'bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-300 border-indigo-500/30' :
                      'bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-300 border-amber-500/30'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}

            {/* Section 2: Gestão & Painéis */}
            {!sidebarCollapsed && (
              <span className="text-[10px] font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase px-3 pt-4 pb-1 block">
                Gestão & Operação
              </span>
            )}
            {managementNav.map((item) => {
              const isActive = activePage === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-item-${item.id}`}
                  onClick={() => handleNavClick(item.id)}
                  className={`group flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all duration-150 ${
                    isActive 
                      ? 'bg-gradient-to-r from-indigo-600 to-blue-600 !text-white shadow-lg shadow-indigo-500/25 border border-indigo-400/30 font-semibold' 
                      : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-white/[0.06] border border-transparent'
                  } ${sidebarCollapsed ? 'justify-center px-0 py-2.5' : ''}`}
                  title={sidebarCollapsed ? item.label : undefined}
                >
                  <div className="flex items-center gap-2.5">
                    <span className={`${isActive ? '!text-white' : 'text-slate-500 group-hover:text-slate-800 dark:text-slate-400 dark:group-hover:text-slate-200'}`}>
                      {item.icon}
                    </span>
                    {!sidebarCollapsed && (
                      <span className={`truncate ${isActive ? '!text-white' : ''}`}>{item.label}</span>
                    )}
                  </div>

                  {!sidebarCollapsed && item.badge && (
                    <span className="px-1.5 py-0.2 text-[9px] font-bold tracking-wider rounded-md bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-300 border border-amber-500/30">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Footer Actions */}
        <div 
          id="sidebar-footer"
          className="p-3 border-t border-slate-200/80 dark:border-white/10 flex flex-col gap-2.5 bg-slate-50/80 dark:bg-slate-900/60"
        >
          {/* Upgrade Pill Button */}
          <button
            id="btn-upgrade-plan"
            onClick={() => {
              setIsUpgradeModalOpen(true);
              setIsMobileMenuOpen(false);
            }}
            className={`flex items-center justify-center gap-2 w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-indigo-500 via-blue-500 to-sky-400 hover:from-indigo-400 hover:to-sky-300 !text-white font-semibold text-xs shadow-lg shadow-indigo-500/25 border border-white/20 transition-all active:scale-[0.98] ${
              sidebarCollapsed ? 'px-0' : ''
            }`}
            title="Fazer upgrade do Plano"
          >
            <Zap className="w-3.5 h-3.5 fill-white !text-white" />
            {!sidebarCollapsed && <span className="!text-white font-semibold">Acesso Ilimitado Pro</span>}
          </button>

          {/* User Badge & Settings */}
          {!sidebarCollapsed ? (
            <div className="flex items-center justify-between px-1 pt-1 text-xs">
              <div className="flex items-center gap-2.5">
                <div 
                  className="flex items-center justify-center w-7 h-7 rounded-xl bg-gradient-to-tr from-indigo-600 to-sky-500 !text-white font-bold text-xs shadow-md border border-white/20 shrink-0"
                  title="Victor Alecrim - Closer Principal"
                >
                  VA
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-bold text-slate-900 dark:text-white leading-none truncate">Victor Alecrim</span>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">Closer Top #1</span>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button 
                  className="p-1.5 text-slate-600 hover:text-slate-950 hover:bg-slate-200/70 dark:text-slate-400 dark:hover:text-white dark:hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                  title="Setup HostGator & Preferências"
                  onClick={() => handleNavClick('setup')}
                >
                  <Settings className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex justify-center">
              <div 
                className="flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-sky-500 !text-white font-bold text-xs shadow-md border border-white/20 cursor-pointer"
                title="Victor Alecrim"
                onClick={() => handleNavClick('setup')}
              >
                VA
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
