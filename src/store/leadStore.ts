import { create } from 'zustand';
import { Lead, LeadStatus, Appointment, Project, AppNotification, SalesRankUser, SiteCustomization } from '../types';
import { SEED_LEADS, SEED_APPOINTMENTS, SEED_PROJECTS, SEED_NOTIFICATIONS, SEED_RANKING, SEED_CRM_SETTINGS } from '../data/seedData';
import { safeStorage } from '../utils/safeStorage';
import confetti from 'canvas-confetti';
import { useCrmConfigStore } from './crmConfigStore';

interface LeadState {
  leads: Lead[];
  setLeads: (leads: Lead[]) => void;
  appointments: Appointment[];
  setAppointments: (appts: Appointment[]) => void;
  projects: Project[];
  setProjects: (projs: Project[]) => void;
  notifications: AppNotification[];
  addNotification: (notif: AppNotification) => void;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  ranking: SalesRankUser[];

  // Actions
  addLeadToCrm: (leadId: string, stage?: LeadStatus, value?: number) => void;
  batchAddLeadsToCrm: (leadIds: string[]) => void;
  removeLeadFromCrm: (leadId: string) => void;
  updateLeadStage: (leadId: string, newStage: LeadStatus) => void;
  updateLeadDetails: (updatedLead: Lead) => void;
  addCustomLead: (newLead: Omit<Lead, 'id' | 'createdAt'>) => void;
  
  // Lifecycle Actions
  runAuditOnLead: (leadId: string) => void;
  redesignLeadSite: (leadId: string) => void;
  updateLeadCustomization: (leadId: string, customization: Partial<SiteCustomization>) => void;
  generateProposalForLead: (leadId: string) => void;
  generateContractForLead: (leadId: string) => void;
  signContractForLead: (leadId: string) => void;
  sendFollowUpForLead: (leadId: string) => void;
  publishSiteToHostGator: (leadId: string) => void;

  addAppointment: (appointment: Omit<Appointment, 'id'>) => void;
  updateAppointmentStatus: (id: string, status: Appointment['status']) => void;
  addProject: (project: Omit<Project, 'id' | 'createdAt'>) => void;
  purgeSeedDemoData: () => void;
}

const STORAGE_KEYS = {
  LEADS: 'leadsite_crm_leads_v2',
  APPOINTMENTS: 'leadsite_crm_appointments_v2',
  PROJECTS: 'leadsite_crm_projects_v2',
  NOTIFICATIONS: 'leadsite_crm_notifications_v2',
  CRM_SETTINGS: 'leadsite_crm_general_settings_v2'
};

function shouldUseSeedDemo(): boolean {
  try {
    const saved = safeStorage.getItem(STORAGE_KEYS.CRM_SETTINGS);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (typeof parsed.useSeedDemo === 'boolean') {
        return parsed.useSeedDemo;
      }
    }
  } catch {}
  return SEED_CRM_SETTINGS.useSeedDemo ?? true;
}

const getInitialLeads = (): Lead[] => {
  const saved = localStorage.getItem(STORAGE_KEYS.LEADS);
  if (saved) {
    try {
      const parsedLeads = JSON.parse(saved) as Lead[];
      const idSet = new Set<string>();
      const nameSet = new Set<string>();
      const mapped: Lead[] = [];

      parsedLeads.forEach(lead => {
        const normName = (lead.name || '').toLowerCase().trim();
        if (nameSet.has(normName)) return;
        nameSet.add(normName);
        let id = lead.id;
        while (idSet.has(id)) id = id + '-' + Math.random().toString(36).substring(2, 7);
        idSet.add(id);
        mapped.push({ ...lead, id });
      });

      if (!shouldUseSeedDemo()) {
        const seedIds = new Set(SEED_LEADS.map(l => l.id));
        const seedNames = new Set(SEED_LEADS.map(l => (l.name || '').toLowerCase().trim()));
        return mapped.filter(l => 
          !seedIds.has(l.id) && 
          !seedNames.has((l.name || '').toLowerCase().trim()) &&
          l.dataSource !== 'synthetic' && 
          !l.placeId?.startsWith('seed/')
        );
      }
      const existingIds = new Set(mapped.map(l => l.id));
      const missingDefaults = SEED_LEADS.filter(l => !existingIds.has(l.id) && !nameSet.has((l.name || '').toLowerCase().trim()));
      return missingDefaults.length > 0 ? [...mapped, ...missingDefaults] : mapped;
    } catch (e) {
      console.error('Error loading saved leads', e);
    }
  }
  return shouldUseSeedDemo() ? SEED_LEADS : [];
};

const getInitialAppointments = (): Appointment[] => {
  const saved = localStorage.getItem(STORAGE_KEYS.APPOINTMENTS);
  if (saved) {
    try {
      const parsed = JSON.parse(saved) as Appointment[];
      if (!shouldUseSeedDemo()) {
        const seedIds = new Set(SEED_APPOINTMENTS.map(a => a.id));
        return parsed.filter(a => !seedIds.has(a.id));
      }
      return parsed;
    } catch(e){}
  }
  return shouldUseSeedDemo() ? SEED_APPOINTMENTS : [];
};

const getInitialProjects = (): Project[] => {
  const saved = localStorage.getItem(STORAGE_KEYS.PROJECTS);
  if (saved) {
    try {
      const parsed = JSON.parse(saved) as Project[];
      if (!shouldUseSeedDemo()) {
        const seedIds = new Set(SEED_PROJECTS.map(p => p.id));
        return parsed.filter(p => !seedIds.has(p.id));
      }
      return parsed;
    } catch(e){}
  }
  return shouldUseSeedDemo() ? SEED_PROJECTS : [];
};

const getInitialNotifications = (): AppNotification[] => {
  const saved = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
  if (saved) {
    try {
      const parsed = JSON.parse(saved) as AppNotification[];
      if (!shouldUseSeedDemo()) {
        const seedIds = new Set(SEED_NOTIFICATIONS.map(n => n.id));
        return parsed.filter(n => !seedIds.has(n.id));
      }
      return parsed;
    } catch(e){}
  }
  return shouldUseSeedDemo() ? SEED_NOTIFICATIONS : [];
};

export const useLeadStore = create<LeadState>((set, get) => ({
  leads: getInitialLeads(),
  setLeads: (leads) => {
    localStorage.setItem(STORAGE_KEYS.LEADS, JSON.stringify(leads));
    set({ leads });
  },
  
  appointments: getInitialAppointments(),
  setAppointments: (appts) => {
    localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(appts));
    set({ appointments: appts });
  },

  projects: getInitialProjects(),
  setProjects: (projs) => {
    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projs));
    set({ projects: projs });
  },

  notifications: getInitialNotifications(),
  addNotification: (notif) => {
    const updated = [notif, ...get().notifications];
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(updated));
    set({ notifications: updated });
  },
  markNotificationAsRead: (id) => {
    const updated = get().notifications.map(n => n.id === id ? { ...n, read: true } : n);
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(updated));
    set({ notifications: updated });
  },
  markAllNotificationsAsRead: () => {
    const updated = get().notifications.map(n => ({ ...n, read: true }));
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(updated));
    set({ notifications: updated });
  },

  ranking: shouldUseSeedDemo() ? SEED_RANKING : [],

  addLeadToCrm: (leadId, stage = 'novo', value = 1800) => {
    const leads = get().leads.map(lead => {
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
    });
    get().setLeads(leads);
    const targetLead = leads.find(l => l.id === leadId);
    if (targetLead) {
      get().addNotification({
        id: 'notif-' + Date.now(),
        title: 'Lead enviado para o CRM',
        message: `${targetLead.name} foi adicionado ao seu funil comercial.`,
        timestamp: 'Agora mesmo',
        read: false,
        type: 'lead',
        leadId: targetLead.id,
      });
    }
  },

  batchAddLeadsToCrm: (leadIds) => {
    const leads = get().leads.map(lead => {
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
    });
    get().setLeads(leads);
    const count = leadIds.length;
    get().addNotification({
      id: 'notif-' + Date.now(),
      title: `${count} leads enviados ao CRM`,
      message: `${count} contatos foram adicionados à primeira etapa do seu funil.`,
      timestamp: 'Agora mesmo',
      read: false,
      type: 'lead',
    });
  },

  removeLeadFromCrm: (leadId) => {
    const leads = get().leads.map(lead => {
      if (lead.id === leadId) {
        return { ...lead, inCrm: false, crmStage: undefined };
      }
      return lead;
    });
    get().setLeads(leads);
  },

  updateLeadStage: (leadId, newStage) => {
    const leads = get().leads.map(lead => {
      if (lead.id === leadId) {
        if (newStage === 'convertido' && lead.crmStage !== 'convertido') {
          try { confetti({ particleCount: 100, spread: 80, origin: { y: 0.6 } }); } catch {}
        }
        return { ...lead, crmStage: newStage, lastContactDate: new Date().toISOString() };
      }
      return lead;
    });
    get().setLeads(leads);
  },

  updateLeadDetails: (updatedLead) => {
    const leads = get().leads.map(lead => lead.id === updatedLead.id ? updatedLead : lead);
    get().setLeads(leads);
  },

  addCustomLead: (newLeadData) => {
    const prev = get().leads;
    const isDuplicate = prev.some(l => {
      const name1 = (l.name || '').toLowerCase().trim();
      const name2 = (newLeadData.name || '').toLowerCase().trim();
      if (name1 === name2) return true;
      const words1 = name1.split(' ');
      const words2 = name2.split(' ');
      if (words1.length >= 3 && words2.length >= 3) {
        if (words1[0] === words2[0] && words1[1] === words2[1] && words1[2] === words2[2]) return true;
      }
      return false;
    });
    if (isDuplicate) return;
    
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
    get().setLeads([newLead, ...prev]);
  },

  runAuditOnLead: (leadId) => {
    const leads = get().leads.map(lead => {
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
    });
    get().setLeads(leads);
  },

  redesignLeadSite: (leadId) => {
    const setupConfig = useCrmConfigStore.getState().setupConfig;
    const leads = get().leads.map(lead => {
      if (lead.id === leadId) {
        const slug = lead.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
        return {
          ...lead,
          crmStage: 'redesenhado' as LeadStatus,
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
            testimonials: [{ author: 'Cliente Satisfeito', role: 'Google Maps', text: 'Excelente experiência, recomendo demais!', rating: 5 }]
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
    });
    get().setLeads(leads);
  },

  updateLeadCustomization: (leadId, customization) => {
    const leads = get().leads.map(lead => {
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
    });
    get().setLeads(leads);
  },

  generateProposalForLead: (leadId) => {
    const setupConfig = useCrmConfigStore.getState().setupConfig;
    const leads = get().leads.map(lead => {
      if (lead.id === leadId) {
        const slug = lead.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
        return {
          ...lead,
          crmStage: 'proposta_enviada' as LeadStatus,
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
    });
    get().setLeads(leads);
  },

  generateContractForLead: (leadId) => {
    const leads = get().leads.map(lead => {
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
            contractStatus: 'enviado' as const,
            paymentTerms: '50% de entrada + 50% na ativação do domínio',
            pdfGenerated: true
          }
        };
      }
      return lead;
    });
    get().setLeads(leads);
  },

  signContractForLead: (leadId) => {
    const leads = get().leads.map(lead => {
      if (lead.id === leadId) {
        try { confetti({ particleCount: 120, spread: 90, origin: { y: 0.5 } }); } catch {}
        return {
          ...lead,
          crmStage: 'convertido' as LeadStatus,
          contract: {
            ...(lead.contract!),
            contractStatus: 'assinado' as const,
            signedAt: new Date().toISOString(),
          }
        };
      }
      return lead;
    });
    get().setLeads(leads);
  },

  sendFollowUpForLead: (leadId) => {
    const leads = get().leads.map(lead => {
      if (lead.id === leadId) {
        return { ...lead, crmStage: 'follow_up' as LeadStatus, lastContactDate: new Date().toISOString() };
      }
      return lead;
    });
    get().setLeads(leads);
  },

  publishSiteToHostGator: (leadId) => {
    const leads = get().leads.map(lead => {
      if (lead.id === leadId) {
        const setupConfig = useCrmConfigStore.getState().setupConfig;
        return {
          ...lead,
          publishedUrl: `https://${setupConfig.baseDomain}/${lead.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`
        };
      }
      return lead;
    });
    get().setLeads(leads);
    get().addNotification({
      id: 'notif-' + Date.now(),
      title: 'Deploy Concluído!',
      message: 'O site foi publicado com sucesso no servidor.',
      timestamp: 'Agora mesmo',
      read: false,
      type: 'system',
      leadId
    });
  },

  addAppointment: (appointment) => {
    const newAppt = { ...appointment, id: 'appt-' + Date.now() };
    get().setAppointments([newAppt, ...get().appointments]);
  },

  updateAppointmentStatus: (id, status) => {
    const appts = get().appointments.map(a => a.id === id ? { ...a, status } : a);
    get().setAppointments(appts);
  },

  addProject: (project) => {
    const newProject = { ...project, id: 'proj-' + Date.now(), createdAt: new Date().toISOString() };
    get().setProjects([newProject, ...get().projects]);
  },

  purgeSeedDemoData: () => {
    const seedIds = new Set(SEED_LEADS.map(l => l.id));
    const seedNames = new Set(SEED_LEADS.map(l => (l.name || '').toLowerCase().trim()));
    const cleanedLeads = get().leads.filter(l => 
      !seedIds.has(l.id) && 
      !seedNames.has((l.name || '').toLowerCase().trim()) &&
      l.dataSource !== 'synthetic' && 
      !l.placeId?.startsWith('seed/')
    );
    const cleanedAppointments = get().appointments.filter(a => !SEED_APPOINTMENTS.some(s => s.id === a.id));
    const cleanedProjects = get().projects.filter(p => !SEED_PROJECTS.some(s => s.id === p.id));
    
    set({
      leads: cleanedLeads,
      appointments: cleanedAppointments,
      projects: cleanedProjects,
    });

    safeStorage.setItem(STORAGE_KEYS.LEADS, JSON.stringify(cleanedLeads));
    safeStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(cleanedAppointments));
    safeStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(cleanedProjects));
  }
}));
