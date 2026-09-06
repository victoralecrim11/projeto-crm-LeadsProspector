import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Bell, 
  Search, 
  Plus, 
  Sparkles, 
  CheckCheck, 
  Calendar, 
  ArrowRight,
  Filter,
  Sun,
  Moon,
  Settings,
  Menu
} from 'lucide-react';
import { useCrm } from '../hooks/useCrm';
import { useUiStore } from '../store/uiStore';

export const Header: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const activePage = location.pathname.substring(1) || 'dashboard';

  const { 
    notifications, 
    markNotificationAsRead, 
    markAllNotificationsAsRead, 
    leads,
  } = useCrm();

  const theme = useUiStore(s => s.theme);
  const toggleTheme = useUiStore(s => s.toggleTheme);
  const toggleMobileMenu = useUiStore(s => s.toggleMobileMenu);
  const setIsCreateSiteModalOpen = useUiStore(s => s.setIsCreateSiteModalOpen);
  const setIsCommandPaletteOpen = useUiStore(s => s.setIsCommandPaletteOpen);
  const setSelectedLeadForModal = useUiStore(s => s.setSelectedLeadForModal);

  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getPageTitle = () => {
    switch (activePage) {
      case 'dashboard':
        return { title: 'Dashboard', subtitle: 'Visão geral da sua operação comercial' };
      case 'leads':
        return { title: 'Radar Google Maps & Leads', subtitle: 'Encontre negócios locais por raio, nicho e diagnóstico de site' };
      case 'redesenhar':
        return { title: 'Redesenho & Prévia IA', subtitle: 'Comparador interativo Antes vs Depois pronto para conversão' };
      case 'editor':
        return { title: 'Editor Visual de Sites', subtitle: 'Personalize títulos, fotos, cores e botões de WhatsApp' };
      case 'propostas':
        return { title: 'Propostas Comerciais & EmailService', subtitle: 'Envie templates persuasivos com link de demonstração' };
      case 'crm':
        return { title: 'Pipeline CRM & Funil de Vendas', subtitle: 'Acompanhe suas oportunidades em cada etapa comercial' };
      case 'followup':
        return { title: 'Radar de Follow-up Inteligente', subtitle: 'Alertas de SLA para reaquecer leads parados há 3+ dias' };
      case 'contratos':
        return { title: 'Minutas & Contratos Digitais', subtitle: 'Gere contratos com valor de setup e mensalidade MRR' };
      case 'agendamentos':
        return { title: 'Agendamentos', subtitle: 'Controle de reuniões, visitas e chamadas com clientes' };
      case 'projetos':
        return { title: 'Sites Publicados & Clientes', subtitle: 'Sites e landing pages entregues com apontamento de domínio' };
      case 'cobrar':
        return { title: 'Financeiro & MRR Recorrente', subtitle: 'Faturamento de setup e mensalidades de hospedagem' };
      case 'setup':
        return { title: 'Setup HostGator & cPanel', subtitle: 'Conexão com servidor para sincronização automática via FTP' };
      case 'configuracoes':
        return { title: 'Configurações do CRM', subtitle: 'Perfil do Closer, Google Maps API, EmailService e Regras Comerciais' };
      case 'ranking':
        return { title: 'Ranking de Vendas SDR', subtitle: 'Desempenho e gamificação da equipe comercial' };
      case 'templates':
        return { title: 'Templates de Sites', subtitle: 'Modelos de alta conversão para cada nicho local' };
      case 'afiliado':
        return { title: 'Programa de Afiliados', subtitle: 'Indique o PROSPECTOR e ganhe 30% recorrente' };
      default:
        return { title: 'PROSPECTOR CRM', subtitle: 'Gestão comercial e fechamento de sites' };
    }
  };

  const { title, subtitle } = getPageTitle();

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3.5 bg-white/80 dark:bg-slate-950/70 backdrop-blur-2xl border-b border-slate-200/80 dark:border-white/10 transition-colors gap-3">
      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
        {/* Mobile Hamburger Menu Toggle Button (only visible on mobile/tablet) */}
        <button
          id="btn-mobile-menu-toggle"
          onClick={toggleMobileMenu}
          aria-label="Abrir menu lateral"
          title="Abrir menu"
          className="flex lg:hidden p-2 text-slate-700 hover:text-slate-950 bg-slate-100 hover:bg-slate-200/80 border border-slate-200 dark:text-slate-200 dark:hover:text-white dark:bg-white/[0.06] dark:hover:bg-white/[0.12] dark:border-white/10 rounded-xl transition-all shadow-sm backdrop-blur-md shrink-0 cursor-pointer"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="min-w-0 flex-1">
          <h1 className="text-base sm:text-lg lg:text-xl font-bold text-slate-900 dark:text-white tracking-tight truncate">{title}</h1>
          <p className="text-[11px] sm:text-xs text-slate-600 dark:text-slate-400 font-medium mt-0.5 truncate hidden md:block">{subtitle}</p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
        {/* Quick Action Button */}
        {activePage === 'crm' && (
          <button
            onClick={() => navigate('/leads')}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 rounded-xl shadow-lg shadow-indigo-500/25 border border-white/15 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Buscar no Maps</span>
          </button>
        )}

        {activePage === 'leads' && (
          <button
            onClick={() => navigate('/crm')}
            className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-100 bg-white/10 hover:bg-white/15 border border-white/15 rounded-xl shadow-sm transition-all"
          >
            <span>Ver Funil CRM</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}

        <button
          onClick={() => setIsCreateSiteModalOpen(true)}
          className="hidden md:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-sky-300 bg-sky-500/15 hover:bg-sky-500/25 border border-sky-400/30 rounded-xl transition-all shadow-sm"
        >
          <Sparkles className="w-3.5 h-3.5 text-sky-400" />
          <span>Gerar Site IA</span>
        </button>

        {/* Global Search / Command Palette (Ctrl+K) Trigger */}
        <button
          id="btn-global-command-palette-trigger"
          onClick={() => setIsCommandPaletteOpen(true)}
          className="flex items-center sm:gap-2 p-2 sm:px-3 sm:py-1.5 text-xs text-slate-500 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 border border-slate-200 dark:text-slate-300 dark:hover:text-white dark:bg-white/[0.06] dark:hover:bg-white/[0.12] dark:border-white/10 rounded-xl transition-all shadow-sm cursor-pointer shrink-0"
          title="Buscar ou navegar rapidamente (Ctrl+K)"
          aria-label="Buscar ou abrir paleta de comandos (Ctrl+K)"
        >
          <Search className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-indigo-500 dark:text-indigo-400" />
          <span className="hidden sm:inline font-medium">Buscar</span>
          <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono font-semibold bg-white dark:bg-white/10 text-slate-600 dark:text-slate-300 rounded border border-slate-200 dark:border-white/15">
            Ctrl K
          </kbd>
        </button>

        {/* Accessible Theme Toggle (Dark / Light Mode) */}
        <button
          id="btn-theme-toggle"
          onClick={toggleTheme}
          aria-label={`Alternar para modo ${theme === 'dark' ? 'claro' : 'escuro'}`}
          title={`Alternar para modo ${theme === 'dark' ? 'claro' : 'escuro'}`}
          className="relative p-2 text-slate-500 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 border border-slate-200 dark:text-slate-200 dark:hover:text-white dark:bg-white/[0.06] dark:hover:bg-white/[0.12] dark:border-white/10 rounded-xl transition-all shadow-sm backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 cursor-pointer shrink-0"
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-300 hover:rotate-45 transition-transform" />
          ) : (
            <Moon className="w-4 h-4 text-indigo-600 hover:-rotate-12 transition-transform" />
          )}
          <span className="sr-only">Alternar tema</span>
        </button>

        {/* Settings Quick Access */}
        <button
          onClick={() => navigate('/configuracoes')}
          aria-label="Configurações do CRM"
          title="Configurações do CRM"
          className="p-2 text-slate-500 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 border border-slate-200 dark:text-slate-200 dark:hover:text-white dark:bg-white/[0.06] dark:hover:bg-white/[0.12] dark:border-white/10 rounded-xl transition-all shadow-sm backdrop-blur-md cursor-pointer shrink-0"
        >
          <Settings className="w-4 h-4" />
        </button>

        {/* Notification Bell with Badge */}
        <div className="relative shrink-0" ref={notifRef}>
          <button
            id="btn-notifications-bell"
            onClick={() => setIsNotifOpen(prev => !prev)}
            aria-label={`Notificações: ${unreadCount} não lidas`}
            className="relative p-2 text-slate-500 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 border border-slate-200 dark:text-slate-200 dark:hover:text-white dark:bg-white/[0.06] dark:hover:bg-white/[0.12] dark:border-white/10 rounded-xl transition-all shadow-sm backdrop-blur-md cursor-pointer"
            title="Notificações"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-4 h-4 px-1 text-[10px] font-bold text-white bg-indigo-600 dark:bg-indigo-500 rounded-full border border-white dark:border-slate-900 animate-pulse shadow-md shadow-indigo-500/50">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {isNotifOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 glass-panel border border-white/15 rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-white/[0.04]">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-sky-400" />
                  <span className="font-semibold text-sm text-white">Notificações</span>
                  {unreadCount > 0 && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-indigo-500/30 text-indigo-300 border border-indigo-400/30">
                      {unreadCount} novas
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllNotificationsAsRead}
                    className="text-xs text-slate-400 hover:text-sky-300 transition-colors flex items-center gap-1"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    Marcar lidas
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-white/5">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400">
                    Nenhuma notificação no momento.
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => {
                        markNotificationAsRead(n.id);
                        if (n.leadId) {
                          const found = leads.find(l => l.id === n.leadId);
                          if (found) {
                            setSelectedLeadForModal(found);
                          }
                        }
                      }}
                      className={`p-3.5 transition-colors cursor-pointer hover:bg-white/[0.08] ${
                        !n.read ? 'bg-indigo-500/10' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className={`text-xs font-semibold ${!n.read ? 'text-white' : 'text-slate-300'}`}>
                          {n.title}
                        </span>
                        <span className="text-[10px] text-slate-400 shrink-0">{n.timestamp}</span>
                      </div>
                      <p className="text-xs text-slate-300/80 mt-1 leading-relaxed">{n.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
