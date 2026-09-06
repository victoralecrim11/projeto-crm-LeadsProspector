import { create } from 'zustand';
import { HostGatorSetupConfig, CrmSettingsConfig, AppNotification } from '../types';
import { DEFAULT_SETUP_CONFIG, DEFAULT_CRM_SETTINGS } from '../data/defaultConfig';
import { safeStorage } from '../utils/safeStorage';


interface CrmConfigState {
  crmSettings: CrmSettingsConfig;
  updateCrmSettings: (newSettings: Partial<CrmSettingsConfig>) => void;
  
  setupConfig: HostGatorSetupConfig;
  updateSetupConfig: (newConfig: Partial<HostGatorSetupConfig>) => void;
}

const STORAGE_KEYS = {
  SETUP_CONFIG: 'leadsite_setup_config_v2',
  CRM_SETTINGS: 'leadsite_crm_general_settings_v2',
  GOOGLE_MAPS_API_KEY: 'leadsite_google_maps_api_key_v2',
  GOOGLE_MAPS_MAP_ID: 'leadsite_google_maps_map_id_v2',
  AI_PROVIDERS: 'leadsite_ai_providers_v2',
  AI_SYSTEM_PROMPT: 'leadsite_ai_system_prompt_v2',
  GEMINI_API_KEY: 'leadsite_gemini_api_key_v2',
};

const getInitialCrmSettings = (): CrmSettingsConfig => {
  let settings: CrmSettingsConfig = { ...DEFAULT_CRM_SETTINGS };
  try {
    const saved = safeStorage.getItem(STORAGE_KEYS.CRM_SETTINGS);
    if (saved) {
      settings = { ...settings, ...JSON.parse(saved) };
    }
  } catch (e) {
    console.error('Error loading crm settings bundle', e);
  }

  // Fallbacks
  try {
    const savedMapsKey = safeStorage.getItem(STORAGE_KEYS.GOOGLE_MAPS_API_KEY);
    if (savedMapsKey) settings.googleMapsApiKey = savedMapsKey;
    const savedMapId = safeStorage.getItem(STORAGE_KEYS.GOOGLE_MAPS_MAP_ID);
    if (savedMapId) settings.googleMapsMapId = savedMapId;
    const savedAiProviders = safeStorage.getItem(STORAGE_KEYS.AI_PROVIDERS);
    if (savedAiProviders) {
      const parsed = JSON.parse(savedAiProviders);
      if (Array.isArray(parsed) && parsed.length > 0) settings.aiProviders = parsed;
    }
    const savedGeminiKey = safeStorage.getItem(STORAGE_KEYS.GEMINI_API_KEY);
    if (savedGeminiKey) {
      settings.geminiApiKey = savedGeminiKey;
      settings.aiApiKey = savedGeminiKey;
    }
    const savedPrompt = safeStorage.getItem(STORAGE_KEYS.AI_SYSTEM_PROMPT);
    if (savedPrompt) settings.aiSystemPrompt = savedPrompt;
  } catch (e) {
    console.error('Error recovering dedicated API keys', e);
  }
  return settings;
};

const getInitialSetupConfig = (): HostGatorSetupConfig => {
  const saved = safeStorage.getItem(STORAGE_KEYS.SETUP_CONFIG);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error('Error loading setup config', e);
    }
  }
  return DEFAULT_SETUP_CONFIG;
};

export const useCrmConfigStore = create<CrmConfigState>((set, get) => ({
  crmSettings: getInitialCrmSettings(),
  updateCrmSettings: (newSettings) => {
    const updated = { ...get().crmSettings, ...newSettings };
    set({ crmSettings: updated });
    
    try {
      safeStorage.setItem(STORAGE_KEYS.CRM_SETTINGS, JSON.stringify(updated));
      if (updated.googleMapsApiKey !== undefined) safeStorage.setItem(STORAGE_KEYS.GOOGLE_MAPS_API_KEY, updated.googleMapsApiKey);
      if (updated.googleMapsMapId !== undefined) safeStorage.setItem(STORAGE_KEYS.GOOGLE_MAPS_MAP_ID, updated.googleMapsMapId);
      if (updated.aiProviders !== undefined) safeStorage.setItem(STORAGE_KEYS.AI_PROVIDERS, JSON.stringify(updated.aiProviders));
      if (updated.geminiApiKey !== undefined) safeStorage.setItem(STORAGE_KEYS.GEMINI_API_KEY, updated.geminiApiKey);
      if (updated.aiSystemPrompt !== undefined) safeStorage.setItem(STORAGE_KEYS.AI_SYSTEM_PROMPT, updated.aiSystemPrompt);
    } catch (e) {
      console.error('Immediate write to safeStorage failed', e);
    }

    import('./leadStore').then(({ useLeadStore }) => {
      useLeadStore.getState().addNotification({
        id: 'notif-' + Date.now(),
        title: 'Configurações do CRM Salvas',
        message: 'Chaves de API, perfil e parâmetros foram gravados com sucesso.',
        timestamp: 'Agora mesmo',
        read: false,
        type: 'system'
      });
    });
  },

  setupConfig: getInitialSetupConfig(),
  updateSetupConfig: (newConfig) => {
    const updated = { ...get().setupConfig, ...newConfig };
    set({ setupConfig: updated });
    try {
      safeStorage.setItem(STORAGE_KEYS.SETUP_CONFIG, JSON.stringify(updated));
    } catch(e){}

    import('./leadStore').then(({ useLeadStore }) => {
      useLeadStore.getState().addNotification({
        id: 'notif-' + Date.now(),
        title: 'Configurações de Deploy Atualizadas',
        message: 'Dados de cPanel/HostGator e assinatura foram salvos com sucesso.',
        timestamp: 'Agora mesmo',
        read: false,
        type: 'system'
      });
    });
  }
}));
