import { CrmSettingsConfig, HostGatorSetupConfig } from '../types';

/** Default application settings only. No leads, projects, appointments or mock data are bundled. */
export const DEFAULT_CRM_SETTINGS: CrmSettingsConfig = {
  closerName: '', closerTitle: '', closerEmail: '', closerPhone: '',
  monthlyRevenueGoal: 0, closerCommissionPercent: 0,
  defaultSetupPrice: 0, defaultMrrPrice: 0, maxDiscountPercent: 0,
  followUpAlertDays: 0, googleMapsApiKey: '', googleMapsMapId: '',
  emailProvider: 'direct', autoEnrichLeads: false, notifyOnLeadStall: false,
};

export const DEFAULT_SETUP_CONFIG: HostGatorSetupConfig = {
  cpanelHost: '', cpanelUser: '', cpanelPass: '', baseDomain: '', targetFolder: '',
  autoSsl: true, senderName: '', senderEmail: '', whatsappCloserPhone: '', preferredNiches: [],
};
