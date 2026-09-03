import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { 
  Lead, 
  LeadStatus, 
  FunnelStats, 
  Appointment, 
  Project, 
  SalesRankUser, 
  AppNotification, 
  ActivePage,
  HostGatorSetupConfig,
  SiteCustomization,
  ThemeMode,
  CrmSettingsConfig
} from '../types';
import { 
  INITIAL_LEADS, 
  INITIAL_APPOINTMENTS, 
  INITIAL_PROJECTS, 
  INITIAL_RANKING, 
  INITIAL_NOTIFICATIONS,
  INITIAL_SETUP_CONFIG,
  INITIAL_CRM_SETTINGS
} from '../data/mockData';

interface CrmContextType {
  activePage: ActivePage;
  setActivePage: (page: ActivePage) => void;
  theme: ThemeMode;
  toggleTheme: () => void;
  setTheme: (theme: ThemeMode) => void;
  crmSettings: CrmSettingsConfig;
  updateCrmSettings: (newSettings: Partial<CrmSettingsConfig>) => void;
  leads: Lead[];
  crmLeads: Lead[];
  funnelStats: FunnelStats;
  monthlyLeadsUsed: number;
  monthlyLeadsLimit: number;
  setupConfig: HostGatorSetupConfig;
  updateSetupConfig: (newConfig: Partial<HostGatorSetupConfig>) => void;
  addLeadToCrm: (leadId: string, stage?: LeadStatus, value?: number) => void;
  batchAddLeadsToCrm: (leadIds: string[]) => void;
  removeLeadFromCrm: (leadId: string) => void;
  updateLeadStage: (leadId: string, newStage: LeadStatus) => void;
  updateLeadDetails: (updatedLead: Lead) => void;
  addCustomLead: (newLead: Omit<Lead, 'id' | 'createdAt'>) => void;
  exportLeadsCsv: (leadsToExport?: Lead[]) => void;
  // Lifecycle actions from Prospector
  runAuditOnLead: (leadId: string) => void;
  redesignLeadSite: (leadId: string) => void;
  updateLeadCustomization: (leadId: string, customization: Partial<SiteCustomization>) => void;
  generateProposalForLead: (leadId: string) => void;
  generateContractForLead: (leadId: string) => void;
  signContractForLead: (leadId: string) => void;
  sendFollowUpForLead: (leadId: string) => void;
  publishSiteToHostGator: (leadId: string) => void;
  // Appointments
  appointments: Appointment[];
  addAppointment: (appointment: Omit<Appointment, 'id'>) => void;
  updateAppointmentStatus: (id: string, status: Appointment['status']) => void;
  // Projects
  projects: Project[];
  addProject: (project: Omit<Project, 'id' | 'createdAt'>) => void;
  // Ranking
  ranking: SalesRankUser[];
  // Notifications
  notifications: AppNotification[];
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  // Modals & UI states
  selectedLeadForModal: Lead | null;
  setSelectedLeadForModal: (lead: Lead | null) => void;
  emailModalLead: Lead | null;
  setEmailModalLead: (lead: Lead | null) => void;
  currentEditingLead: Lead | null;
  setCurrentEditingLead: (lead: Lead | null) => void;
  isUpgradeModalOpen: boolean;
  setIsUpgradeModalOpen: (open: boolean) => void;
  isCreateSiteModalOpen: boolean;
  setIsCreateSiteModalOpen: (open: boolean) => void;
  siteGeneratorLead: Lead | null;
  setSiteGeneratorLead: (lead: Lead | null) => void;
  isCommandPaletteOpen: boolean;
  setIsCommandPaletteOpen: (open: boolean | ((prev: boolean) => boolean)) => void;
  closeAllModals: () => void;
  language: 'pt' | 'en';
  setLanguage: (lang: 'pt' | 'en') => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean | ((prev: boolean) => boolean)) => void;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean | ((prev: boolean) => boolean)) => void;
  toggleMobileMenu: () => void;
}

const CrmContext = createContext<CrmContextType | undefined>(undefined);

// Safe storage utilities with fallback to sessionStorage and error suppression
export const safeStorage = {
  getItem: (key: string): string | null => {
    try {
      const val = localStorage.getItem(key);
      if (val !== null) return val;
    } catch {
      // localStorage may be blocked in some iframe contexts
    }
    try {
      return sessionStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem: (key: string, value: string): void => {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      console.warn('localStorage setItem failed:', e);
    }
    try {
      sessionStorage.setItem(key, value);
    } catch (e) {
      console.warn('sessionStorage setItem failed:', e);
    }
  }
};

const STORAGE_KEYS = {
  LEADS: 'leadsite_crm_leads_v2',
  APPOINTMENTS: 'leadsite_crm_appointments_v2',
  PROJECTS: 'leadsite_crm_projects_v2',
  NOTIFICATIONS: 'leadsite_crm_notifications_v2',
  SETUP_CONFIG: 'leadsite_setup_config_v2',
  CRM_SETTINGS: 'leadsite_crm_general_settings_v2',
  THEME: 'leadsite_crm_theme_mode_v2',
  ACTIVE_PAGE: 'leadsite_crm_active_page_v2',
  GOOGLE_MAPS_API_KEY: 'leadsite_google_maps_api_key_v2',
  GOOGLE_MAPS_MAP_ID: 'leadsite_google_maps_map_id_v2',
  AI_PROVIDERS: 'leadsite_ai_providers_v2',
  AI_SYSTEM_PROMPT: 'leadsite_ai_system_prompt_v2',
  GEMINI_API_KEY: 'leadsite_gemini_api_key_v2',
};

export const CrmProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialize Active Page with persistence so refresh does not kick user back to dashboard
  const [activePage, setActivePage] = useState<ActivePage>(() => {
    try {
      const savedPage = safeStorage.getItem(STORAGE_KEYS.ACTIVE_PAGE);
      const validPages: ActivePage[] = [
        'dashboard', 'leads', 'redesenhar', 'editor', 'propostas',
        'crm', 'followup', 'contratos', 'agendamentos', 'projetos',
        'cobrar', 'setup', 'configuracoes', 'ranking', 'templates', 'afiliado'
      ];
      if (savedPage && validPages.includes(savedPage as ActivePage)) {
        return savedPage as ActivePage;
      }
    } catch {
      // fallback
    }
    return 'dashboard';
  });

  useEffect(() => {
    try {
      safeStorage.setItem(STORAGE_KEYS.ACTIVE_PAGE, activePage);
    } catch {
      // ignore
    }
  }, [activePage]);

  const [language, setLanguage] = useState<'pt' | 'en'>('pt');
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const toggleMobileMenu = () => setIsMobileMenuOpen(prev => !prev);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState<boolean>(false);
  const [isCreateSiteModalOpen, setIsCreateSiteModalOpen] = useState<boolean>(false);
  const [selectedLeadForModal, setSelectedLeadForModal] = useState<Lead | null>(null);
  const [emailModalLead, setEmailModalLead] = useState<Lead | null>(null);
  const [siteGeneratorLead, setSiteGeneratorLead] = useState<Lead | null>(null);
  const [currentEditingLead, setCurrentEditingLead] = useState<Lead | null>(null);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState<boolean>(false);

  const closeAllModals = () => {
    setIsCommandPaletteOpen(false);
    setSelectedLeadForModal(null);
    setEmailModalLead(null);
    setIsCreateSiteModalOpen(false);
    setIsUpgradeModalOpen(false);
    setIsMobileMenuOpen(false);
  };

  // Global Keyboard Shortcuts (Ctrl+K / Cmd+K for Command Palette & Esc for closing modals)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 1. Ctrl+K or Cmd+K: Open / Toggle Command Palette
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
        return;
      }

      // 2. Escape: Close topmost active modal or command palette
      if (e.key === 'Escape') {
        // If Command Palette is open, close it
        setIsCommandPaletteOpen(prev => {
          if (prev) return false;
          return prev;
        });

        // Close any open modals
        setSelectedLeadForModal(prev => (prev ? null : prev));
        setEmailModalLead(prev => (prev ? null : prev));
        setIsCreateSiteModalOpen(prev => (prev ? false : prev));
        setIsUpgradeModalOpen(prev => (prev ? false : prev));
        setIsMobileMenuOpen(prev => (prev ? false : prev));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const [monthlyLeadsUsed] = useState<number>(20);
  const monthlyLeadsLimit = 500;

  // Initialize Theme (Default Dark)
  const [theme, setTheme] = useState<ThemeMode>(() => {
    const saved = safeStorage.getItem(STORAGE_KEYS.THEME);
    if (saved === 'light' || saved === 'dark') return saved;
    return 'dark';
  });

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  useEffect(() => {
    safeStorage.setItem(STORAGE_KEYS.THEME, theme);
    const root = document.documentElement;
    if (theme === 'light') {
      root.classList.add('light');
      root.classList.remove('dark');
    } else {
      root.classList.add('dark');
      root.classList.remove('light');
    }
  }, [theme]);

  // Auto-close mobile drawer when window is resized/expanded to desktop width
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Initialize CRM Settings with multi-layer fallback & dedicated API key preservation
  const [crmSettings, setCrmSettings] = useState<CrmSettingsConfig>(() => {
    let settings: CrmSettingsConfig = { ...INITIAL_CRM_SETTINGS };
    
    // 1. Try loading general settings bundle
    try {
      const saved = safeStorage.getItem(STORAGE_KEYS.CRM_SETTINGS);
      if (saved) {
        settings = { ...settings, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.error('Error loading crm settings bundle', e);
    }

    // 2. Multi-layer fallback: check dedicated API keys storage so keys are NEVER lost
    try {
      const savedMapsKey = safeStorage.getItem(STORAGE_KEYS.GOOGLE_MAPS_API_KEY);
      if (savedMapsKey !== null && savedMapsKey !== undefined && savedMapsKey !== '') {
        settings.googleMapsApiKey = savedMapsKey;
      }
      const savedMapId = safeStorage.getItem(STORAGE_KEYS.GOOGLE_MAPS_MAP_ID);
      if (savedMapId) {
        settings.googleMapsMapId = savedMapId;
      }
      const savedAiProviders = safeStorage.getItem(STORAGE_KEYS.AI_PROVIDERS);
      if (savedAiProviders) {
        const parsed = JSON.parse(savedAiProviders);
        if (Array.isArray(parsed) && parsed.length > 0) {
          settings.aiProviders = parsed;
        }
      }
      const savedGeminiKey = safeStorage.getItem(STORAGE_KEYS.GEMINI_API_KEY);
      if (savedGeminiKey) {
        settings.geminiApiKey = savedGeminiKey;
        settings.aiApiKey = savedGeminiKey;
      }
      const savedPrompt = safeStorage.getItem(STORAGE_KEYS.AI_SYSTEM_PROMPT);
      if (savedPrompt) {
        settings.aiSystemPrompt = savedPrompt;
      }
    } catch (e) {
      console.error('Error recovering dedicated API keys', e);
    }

    return settings;
  });

  // Keep settings and dedicated API keys synced continuously
  useEffect(() => {
    try {
      safeStorage.setItem(STORAGE_KEYS.CRM_SETTINGS, JSON.stringify(crmSettings));
      if (crmSettings.googleMapsApiKey !== undefined) {
        safeStorage.setItem(STORAGE_KEYS.GOOGLE_MAPS_API_KEY, crmSettings.googleMapsApiKey);
      }
      if (crmSettings.googleMapsMapId !== undefined) {
        safeStorage.setItem(STORAGE_KEYS.GOOGLE_MAPS_MAP_ID, crmSettings.googleMapsMapId);
      }
      if (crmSettings.aiProviders !== undefined) {
        safeStorage.setItem(STORAGE_KEYS.AI_PROVIDERS, JSON.stringify(crmSettings.aiProviders));
      }
      if (crmSettings.geminiApiKey !== undefined) {
        safeStorage.setItem(STORAGE_KEYS.GEMINI_API_KEY, crmSettings.geminiApiKey);
      }
      if (crmSettings.aiSystemPrompt !== undefined) {
        safeStorage.setItem(STORAGE_KEYS.AI_SYSTEM_PROMPT, crmSettings.aiSystemPrompt);
      }
    } catch (e) {
      console.error('Error persisting crm settings effect', e);
    }
  }, [crmSettings]);

  // Synchronous immediate update function to prevent data loss on instant reload
  const updateCrmSettings = (newSettings: Partial<CrmSettingsConfig>) => {
    setCrmSettings(prev => {
      const updated = { ...prev, ...newSettings };
      try {
        safeStorage.setItem(STORAGE_KEYS.CRM_SETTINGS, JSON.stringify(updated));
        if (updated.googleMapsApiKey !== undefined) {
          safeStorage.setItem(STORAGE_KEYS.GOOGLE_MAPS_API_KEY, updated.googleMapsApiKey);
        }
        if (updated.googleMapsMapId !== undefined) {
          safeStorage.setItem(STORAGE_KEYS.GOOGLE_MAPS_MAP_ID, updated.googleMapsMapId);
        }
        if (updated.aiProviders !== undefined) {
          safeStorage.setItem(STORAGE_KEYS.AI_PROVIDERS, JSON.stringify(updated.aiProviders));
        }
        if (updated.geminiApiKey !== undefined) {
          safeStorage.setItem(STORAGE_KEYS.GEMINI_API_KEY, updated.geminiApiKey);
        }
        if (updated.aiSystemPrompt !== undefined) {
          safeStorage.setItem(STORAGE_KEYS.AI_SYSTEM_PROMPT, updated.aiSystemPrompt);
        }
      } catch (e) {
        console.error('Immediate write to safeStorage failed', e);
      }
      return updated;
    });

    const notif: AppNotification = {
      id: 'notif-' + Date.now(),
      title: 'Configurações do CRM Salvas',
      message: 'Chaves de API, perfil e parâmetros foram gravados com sucesso.',
      timestamp: 'Agora mesmo',
      read: false,
      type: 'system'
    };
    setNotifications(prev => [notif, ...prev]);
  };

  // Initialize Setup Config
  const [setupConfig, setSetupConfig] = useState<HostGatorSetupConfig>(() => {
    const saved = safeStorage.getItem(STORAGE_KEYS.SETUP_CONFIG);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error loading setup config', e);
      }
    }
    return INITIAL_SETUP_CONFIG;
  });

  // Initialize leads
  const [leads, setLeads] = useState<Lead[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.LEADS);
    if (saved) {
      try {
        const parsedLeads = JSON.parse(saved) as Lead[];
        const idSet = new Set<string>();
        const mapped = parsedLeads.map(lead => {
          let id = lead.id;
          while (idSet.has(id)) {
            id = id + '-' + Math.random().toString(36).substring(2, 7);
          }
          idSet.add(id);
          return { ...lead, id };
        });
        // Check if new default leads (such as lead-15 and lead-16 in Caiçaras/Alto Caiçaras) are missing and append them
        const existingIds = new Set(mapped.map(l => l.id));
        const missingDefaults = INITIAL_LEADS.filter(l => !existingIds.has(l.id));
        return missingDefaults.length > 0 ? [...mapped, ...missingDefaults] : mapped;
      } catch (e) {
        console.error('Error loading saved leads', e);
      }
    }
    return INITIAL_LEADS;
  });

  const [appointments, setAppointments] = useState<Appointment[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.APPOINTMENTS);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error loading appointments', e);
      }
    }
    return INITIAL_APPOINTMENTS;
  });

  const [projects, setProjects] = useState<Project[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PROJECTS);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error loading projects', e);
      }
    }
    return INITIAL_PROJECTS;
  });

  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error loading notifications', e);
      }
    }
    return INITIAL_NOTIFICATIONS;
  });

  const [ranking] = useState<SalesRankUser[]>(INITIAL_RANKING);

  // Sync state to local storage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.LEADS, JSON.stringify(leads));
  }, [leads]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(appointments));
  }, [appointments]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
  }, [projects]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SETUP_CONFIG, JSON.stringify(setupConfig));
  }, [setupConfig]);

  // Derived CRM leads
  const crmLeads = useMemo(() => leads.filter(l => l.inCrm), [leads]);

  // Calculate Funnel & Financial Stats
  const funnelStats = useMemo<FunnelStats>(() => {
    const total = leads.length;
    const auditados = leads.filter(l => l.crmStage === 'auditado').length;
    const redesenhados = leads.filter(l => l.crmStage === 'redesenhado').length;
    const propostasEnviadas = leads.filter(l => l.crmStage === 'proposta_enviada').length;
    const followUp = leads.filter(l => l.crmStage === 'follow_up').length;
    const negociando = leads.filter(l => l.crmStage === 'negociacao').length;
    const convertidosLeads = leads.filter(l => l.crmStage === 'convertido');
    const convertidos = convertidosLeads.length;
    const perdidos = leads.filter(l => l.crmStage === 'perdido').length;

    const taxaConversao = total > 0 ? (convertidos / total) * 100 : 0;
    const taxaProposta = total > 0 ? (propostasEnviadas / total) * 100 : 0;
    const taxaAgendamento = total > 0 ? ((negociando + convertidos) / total) * 100 : 0;

    const mrrTotal = convertidosLeads.reduce((acc, curr) => acc + (curr.mrrValue || 197), 0);
    const receitaTotal = convertidosLeads.reduce((acc, curr) => acc + (curr.dealValue || 1800), 0);
    const ticketMedio = convertidos > 0 ? receitaTotal / convertidos : 0;

    return {
      total,
      auditados,
      redesenhados,
      propostasEnviadas,
      followUp,
      negociando,
      convertidos,
      perdidos,
      taxaConversao,
      taxaProposta,
      taxaAgendamento,
      mrrTotal,
      receitaTotal,
      ticketMedio
    };
  }, [leads]);

  const updateSetupConfig = (newConfig: Partial<HostGatorSetupConfig>) => {
    setSetupConfig(prev => ({ ...prev, ...newConfig }));
    const notif: AppNotification = {
      id: 'notif-' + Date.now(),
      title: 'Configurações de Deploy Atualizadas',
      message: 'Dados de cPanel/HostGator e assinatura foram salvos com sucesso.',
      timestamp: 'Agora mesmo',
      read: false,
      type: 'system'
    };
    setNotifications(prev => [notif, ...prev]);
  };

  const addLeadToCrm = (leadId: string, stage: LeadStatus = 'novo', value: number = 1800) => {
    setLeads(prev => prev.map(lead => {
      if (lead.id === leadId) {
        return {
          ...lead,
          inCrm: true,
          crmStage: lead.crmStage || stage,
          dealValue: lead.dealValue || value,
          mrrValue: lead.mrrValue || 197,
          assignedTo: lead.assignedTo || 'Victor Alecrim',
        };
      }
      return lead;
    }));

    const targetLead = leads.find(l => l.id === leadId);
    if (targetLead) {
      const newNotif: AppNotification = {
        id: 'notif-' + Date.now(),
        title: 'Lead enviado para o CRM',
        message: `${targetLead.name} foi adicionado ao seu funil comercial.`,
        timestamp: 'Agora mesmo',
        read: false,
        type: 'lead',
        leadId: targetLead.id,
      };
      setNotifications(prev => [newNotif, ...prev]);
    }
  };

  const batchAddLeadsToCrm = (leadIds: string[]) => {
    setLeads(prev => prev.map(lead => {
      if (leadIds.includes(lead.id)) {
        return {
          ...lead,
          inCrm: true,
          crmStage: lead.crmStage || 'novo',
          dealValue: lead.dealValue || 1800,
          mrrValue: lead.mrrValue || 197,
          assignedTo: lead.assignedTo || 'Victor Alecrim',
        };
      }
      return lead;
    }));

    const count = leadIds.length;
    const newNotif: AppNotification = {
      id: 'notif-' + Date.now(),
      title: `${count} leads enviados ao CRM`,
      message: `${count} contatos foram adicionados à primeira etapa do seu funil.`,
      timestamp: 'Agora mesmo',
      read: false,
      type: 'lead',
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  const removeLeadFromCrm = (leadId: string) => {
    setLeads(prev => prev.map(lead => {
      if (lead.id === leadId) {
        return {
          ...lead,
          inCrm: false,
          crmStage: undefined,
        };
      }
      return lead;
    }));
  };

  const updateLeadStage = (leadId: string, newStage: LeadStatus) => {
    setLeads(prev => prev.map(lead => {
      if (lead.id === leadId) {
        if (newStage === 'convertido' && lead.crmStage !== 'convertido') {
          try {
            confetti({
              particleCount: 100,
              spread: 80,
              origin: { y: 0.6 }
            });
          } catch {
            // ignore
          }
        }
        return {
          ...lead,
          crmStage: newStage,
          lastContactDate: new Date().toISOString(),
        };
      }
      return lead;
    }));
  };

  const updateLeadDetails = (updatedLead: Lead) => {
    setLeads(prev => prev.map(lead => lead.id === updatedLead.id ? updatedLead : lead));
    if (selectedLeadForModal?.id === updatedLead.id) {
      setSelectedLeadForModal(updatedLead);
    }
    if (currentEditingLead?.id === updatedLead.id) {
      setCurrentEditingLead(updatedLead);
    }
  };

  const addCustomLead = (newLeadData: Omit<Lead, 'id' | 'createdAt'>) => {
    const uniqueId = 'lead-custom-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9);
    const newLead: Lead = {
      ...newLeadData,
      id: uniqueId,
      createdAt: new Date().toISOString(),
      audit: {
        speedScore: 30,
        loadingTimeSeconds: 6.0,
        mobileFriendly: false,
        hasSsl: false,
        hasWhatsappButton: false,
        seoScore: 45,
        issues: ['Site não responsivo para celular', 'Sem certificado SSL', 'Sem botão WhatsApp'],
        opportunities: ['Redesenho com agendamento direto']
      }
    };
    setLeads(prev => [newLead, ...prev]);
  };

  const exportLeadsCsv = (leadsToExport?: Lead[]) => {
    const dataToExport = leadsToExport || leads;
    const headers = ['Nome', 'Categoria', 'Nicho', 'Temperatura', 'Score', 'Telefone', 'Cidade', 'Estado', 'Bairro', 'Endereco', 'Tem Site', 'No CRM', 'Etapa CRM', 'Valor Setup (R$)', 'MRR (R$)'];
    const rows = dataToExport.map(l => [
      `"${l.name.replace(/"/g, '""')}"`,
      `"${l.category}"`,
      `"${l.niche}"`,
      `"${l.temperature}"`,
      l.score,
      `"${l.phone}"`,
      `"${l.city}"`,
      `"${l.state}"`,
      `"${l.neighborhood || ''}"`,
      `"${l.address.replace(/"/g, '""')}"`,
      l.hasWebsite ? 'Sim' : 'Nao',
      l.inCrm ? 'Sim' : 'Nao',
      l.crmStage || '',
      l.dealValue || 1800,
      l.mrrValue || 197,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `leads_prospector_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Lifecycle Methods from Prospector de Sites
  const runAuditOnLead = (leadId: string) => {
    setLeads(prev => prev.map(lead => {
      if (lead.id === leadId) {
        return {
          ...lead,
          crmStage: lead.crmStage === 'novo' ? 'auditado' : lead.crmStage,
          audit: lead.audit || {
            speedScore: 28,
            loadingTimeSeconds: 6.2,
            mobileFriendly: false,
            hasSsl: false,
            hasWhatsappButton: false,
            seoScore: 40,
            issues: ['Sem versão mobile', 'Sem botão WhatsApp', 'Tempo de carregamento lento (6.2s)'],
            opportunities: ['Página rápida com agendamento instantâneo']
          }
        };
      }
      return lead;
    }));
  };

  const redesignLeadSite = (leadId: string) => {
    setLeads(prev => prev.map(lead => {
      if (lead.id === leadId) {
        const slug = lead.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
        return {
          ...lead,
          crmStage: 'redesenhado',
          customization: lead.customization || {
            heroTitle: `O melhor atendimento de ${lead.category} em ${lead.city}`,
            heroSubtitle: `Atendimento exclusivo com agendamento online rápido sem esperas. Reserve seu horário no WhatsApp.`,
            ctaText: 'Agendar Horário no WhatsApp',
            primaryColor: '#4f46e5',
            accentColor: '#0ea5e9',
            workingHours: 'Segunda a Sábado das 09h às 19h',
            services: [
              { title: 'Atendimento Completo VIP', price: 'R$ 80,00', description: 'Serviço personalizado com profissionais experientes.' },
              { title: 'Procedimento Especializado', price: 'R$ 150,00', description: 'Tecnologia moderna e foco na sua satisfação total.' }
            ],
            testimonials: [
              { author: 'Cliente Satisfeito', role: 'Google Maps', text: 'Excelente experiência, recomendo demais!', rating: 5 }
            ]
          },
          proposal: lead.proposal || {
            title: `Proposta Comercial - ${lead.name}`,
            emailSubject: `Ideia para acelerar agendamentos de ${lead.name}`,
            emailBody: `Olá equipe ${lead.name}!\n\nCriamos uma prévia de um site moderno e ultra rápido para vocês atraírem mais clientes: https://${setupConfig.baseDomain}/clientes/${slug}`,
            whatsappMessage: `Olá ${lead.name}! Criamos uma prévia gratuita de um site novo ultra rápido para vocês: https://${setupConfig.baseDomain}/clientes/${slug}`,
            proposalSlug: slug,
            dealValue: lead.dealValue || 1800,
            mrrValue: lead.mrrValue || 197,
            viewsCount: 1,
            sentAt: new Date().toISOString()
          }
        };
      }
      return lead;
    }));
  };

  const updateLeadCustomization = (leadId: string, customization: Partial<SiteCustomization>) => {
    setLeads(prev => prev.map(lead => {
      if (lead.id === leadId) {
        return {
          ...lead,
          customization: {
            heroTitle: customization.heroTitle ?? lead.customization?.heroTitle ?? '',
            heroSubtitle: customization.heroSubtitle ?? lead.customization?.heroSubtitle ?? '',
            ctaText: customization.ctaText ?? lead.customization?.ctaText ?? 'Agendar no WhatsApp',
            primaryColor: customization.primaryColor ?? lead.customization?.primaryColor ?? '#4f46e5',
            accentColor: customization.accentColor ?? lead.customization?.accentColor ?? '#0ea5e9',
            logoUrl: customization.logoUrl ?? lead.customization?.logoUrl,
            services: customization.services ?? lead.customization?.services ?? [],
            testimonials: customization.testimonials ?? lead.customization?.testimonials ?? [],
            workingHours: customization.workingHours ?? lead.customization?.workingHours ?? 'Segunda a Sexta'
          }
        };
      }
      return lead;
    }));
  };

  const generateProposalForLead = (leadId: string) => {
    setLeads(prev => prev.map(lead => {
      if (lead.id === leadId) {
        const slug = lead.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
        return {
          ...lead,
          crmStage: 'proposta_enviada',
          proposal: {
            title: `Proposta de Transformação Digital - ${lead.name}`,
            emailSubject: `Oportunidade para dobrar os clientes de ${lead.name}`,
            emailBody: `Olá!\n\nIdentificamos que seu negócio tem nota ${lead.rating} no Google, mas o site atual pode estar perdendo visitantes mobile.\n\nPreparamos uma página interativa com comparador Antes e Depois para você avaliar sem compromisso:\nhttps://${setupConfig.baseDomain}/clientes/${slug}`,
            whatsappMessage: `Olá ${lead.name}! Criei uma proposta visual com comparador Antes/Depois para seu novo site. Veja aqui: https://${setupConfig.baseDomain}/clientes/${slug}`,
            proposalSlug: slug,
            dealValue: lead.dealValue || 1800,
            mrrValue: lead.mrrValue || 197,
            viewsCount: 1,
            sentAt: new Date().toISOString()
          }
        };
      }
      return lead;
    }));
  };

  const generateContractForLead = (leadId: string) => {
    setLeads(prev => prev.map(lead => {
      if (lead.id === leadId) {
        const num = 'CTR-2026-' + Math.floor(1000 + Math.random() * 9000);
        return {
          ...lead,
          crmStage: lead.crmStage === 'proposta_enviada' || lead.crmStage === 'follow_up' ? 'negociacao' : lead.crmStage,
          contract: {
            contractNumber: num,
            clientName: lead.name,
            clientDoc: '12.345.678/0001-90',
            setupFee: lead.dealValue || 1800,
            mrrMonthlyFee: lead.mrrValue || 197,
            contractStatus: 'enviado',
            paymentTerms: '50% de entrada + 50% na ativação do domínio',
            pdfGenerated: true
          }
        };
      }
      return lead;
    }));
  };

  const signContractForLead = (leadId: string) => {
    setLeads(prev => prev.map(lead => {
      if (lead.id === leadId) {
        try {
          confetti({
            particleCount: 120,
            spread: 90,
            origin: { y: 0.5 }
          });
        } catch {
          // ignore
        }
        return {
          ...lead,
          crmStage: 'convertido',
          contract: {
            contractNumber: lead.contract?.contractNumber || 'CTR-2026-9999',
            clientName: lead.name,
            clientDoc: lead.contract?.clientDoc || '12.345.678/0001-90',
            setupFee: lead.dealValue || 1800,
            mrrMonthlyFee: lead.mrrValue || 197,
            contractStatus: 'assinado',
            paymentTerms: 'Assinado eletronicamente e faturado',
            signedAt: new Date().toISOString(),
            pdfGenerated: true
          }
        };
      }
      return lead;
    }));
  };

  const sendFollowUpForLead = (leadId: string) => {
    setLeads(prev => prev.map(lead => {
      if (lead.id === leadId) {
        return {
          ...lead,
          crmStage: 'follow_up',
          lastContactDate: new Date().toISOString(),
          daysWithoutResponse: 0,
        };
      }
      return lead;
    }));
  };

  const publishSiteToHostGator = (leadId: string) => {
    const targetLead = leads.find(l => l.id === leadId);
    if (!targetLead) return;

    const slug = targetLead.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const existingProject = projects.find(p => p.slug === slug);
    if (!existingProject) {
      const newProj: Project = {
        id: 'proj-' + Date.now(),
        leadId: targetLead.id,
        clientName: targetLead.name,
        title: `Site ${targetLead.category} ${targetLead.name}`,
        category: targetLead.category,
        type: 'Landing Page',
        status: 'publicado',
        previewUrl: `https://${setupConfig.baseDomain}/clientes/${slug}`,
        monthlyRevenue: targetLead.mrrValue || 197,
        createdAt: new Date().toISOString().slice(0, 10),
        slug: slug,
        isHostGatorSynced: true
      };
      setProjects(prev => [newProj, ...prev]);
    }

    const notif: AppNotification = {
      id: 'notif-' + Date.now(),
      title: 'Site Publicado na HostGator!',
      message: `O site de ${targetLead.name} foi sincronizado com sucesso via cPanel com SSL ativo.`,
      timestamp: 'Agora mesmo',
      read: false,
      type: 'system',
      leadId: targetLead.id
    };
    setNotifications(prev => [notif, ...prev]);
  };

  const addAppointment = (aptData: Omit<Appointment, 'id'>) => {
    const newApt: Appointment = {
      ...aptData,
      id: 'apt-' + Date.now(),
    };
    setAppointments(prev => [newApt, ...prev]);

    if (aptData.leadId) {
      updateLeadStage(aptData.leadId, 'negociacao');
    }

    const notif: AppNotification = {
      id: 'notif-' + Date.now(),
      title: 'Novo agendamento marcado',
      message: `${aptData.title} com ${aptData.leadName} às ${aptData.time} do dia ${aptData.date}.`,
      timestamp: 'Agora mesmo',
      read: false,
      type: 'agenda',
      leadId: aptData.leadId,
    };
    setNotifications(prev => [notif, ...prev]);
  };

  const updateAppointmentStatus = (id: string, status: Appointment['status']) => {
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, status } : a));
  };

  const addProject = (projData: Omit<Project, 'id' | 'createdAt'>) => {
    const newProj: Project = {
      ...projData,
      id: 'proj-' + Date.now(),
      createdAt: new Date().toISOString().slice(0, 10),
    };
    setProjects(prev => [newProj, ...prev]);
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllNotificationsAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  return (
    <CrmContext.Provider
      value={{
        activePage,
        setActivePage,
        theme,
        toggleTheme,
        setTheme,
        crmSettings,
        updateCrmSettings,
        leads,
        crmLeads,
        funnelStats,
        monthlyLeadsUsed,
        monthlyLeadsLimit,
        setupConfig,
        updateSetupConfig,
        addLeadToCrm,
        batchAddLeadsToCrm,
        removeLeadFromCrm,
        updateLeadStage,
        updateLeadDetails,
        addCustomLead,
        exportLeadsCsv,
        runAuditOnLead,
        redesignLeadSite,
        updateLeadCustomization,
        generateProposalForLead,
        generateContractForLead,
        signContractForLead,
        sendFollowUpForLead,
        publishSiteToHostGator,
        appointments,
        addAppointment,
        updateAppointmentStatus,
        projects,
        addProject,
        ranking,
        notifications,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        selectedLeadForModal,
        setSelectedLeadForModal,
        emailModalLead,
        setEmailModalLead,
        currentEditingLead,
        setCurrentEditingLead,
        isUpgradeModalOpen,
        setIsUpgradeModalOpen,
        isCreateSiteModalOpen,
        setIsCreateSiteModalOpen,
        siteGeneratorLead,
        setSiteGeneratorLead,
        isCommandPaletteOpen,
        setIsCommandPaletteOpen,
        closeAllModals,
        language,
        setLanguage,
        sidebarCollapsed,
        setSidebarCollapsed,
        isMobileMenuOpen,
        setIsMobileMenuOpen,
        toggleMobileMenu,
      }}
    >
      {children}
    </CrmContext.Provider>
  );
};

export const useCrm = () => {
  const context = useContext(CrmContext);
  if (!context) {
    throw new Error('useCrm must be used within a CrmProvider');
  }
  return context;
};
