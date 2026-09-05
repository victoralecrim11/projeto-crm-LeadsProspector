import { create } from 'zustand';
import { Lead, ThemeMode } from '../types';
import { safeStorage } from '../utils/safeStorage';

interface UiState {
  theme: ThemeMode;
  toggleTheme: () => void;
  setTheme: (theme: ThemeMode) => void;
  
  language: 'pt' | 'en';
  setLanguage: (lang: 'pt' | 'en') => void;
  
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean | ((prev: boolean) => boolean)) => void;
  
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean | ((prev: boolean) => boolean)) => void;
  toggleMobileMenu: () => void;

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
}

const THEME_KEY = 'leadsite_crm_theme_mode_v2';

const getInitialTheme = (): ThemeMode => {
  const saved = safeStorage.getItem(THEME_KEY);
  return (saved === 'light' || saved === 'dark') ? saved : 'dark';
};

const applyThemeToHtml = (theme: ThemeMode) => {
  const root = document.documentElement;
  if (theme === 'light') {
    root.classList.add('light');
    root.classList.remove('dark');
  } else {
    root.classList.add('dark');
    root.classList.remove('light');
  }
};

// Initialize theme on load
applyThemeToHtml(getInitialTheme());

export const useUiStore = create<UiState>((set, get) => ({
  theme: getInitialTheme(),
  setTheme: (theme) => {
    safeStorage.setItem(THEME_KEY, theme);
    applyThemeToHtml(theme);
    set({ theme });
  },
  toggleTheme: () => {
    const newTheme = get().theme === 'dark' ? 'light' : 'dark';
    get().setTheme(newTheme);
  },

  language: 'pt',
  setLanguage: (language) => set({ language }),

  sidebarCollapsed: false,
  setSidebarCollapsed: (val) => set((state) => ({ 
    sidebarCollapsed: typeof val === 'function' ? val(state.sidebarCollapsed) : val 
  })),

  isMobileMenuOpen: false,
  setIsMobileMenuOpen: (val) => set((state) => ({ 
    isMobileMenuOpen: typeof val === 'function' ? val(state.isMobileMenuOpen) : val 
  })),
  toggleMobileMenu: () => set((state) => ({ isMobileMenuOpen: !state.isMobileMenuOpen })),

  selectedLeadForModal: null,
  setSelectedLeadForModal: (lead) => set({ selectedLeadForModal: lead }),

  emailModalLead: null,
  setEmailModalLead: (lead) => set({ emailModalLead: lead }),

  currentEditingLead: null,
  setCurrentEditingLead: (lead) => set({ currentEditingLead: lead }),

  isUpgradeModalOpen: false,
  setIsUpgradeModalOpen: (open) => set({ isUpgradeModalOpen: open }),

  isCreateSiteModalOpen: false,
  setIsCreateSiteModalOpen: (open) => set({ isCreateSiteModalOpen: open }),

  siteGeneratorLead: null,
  setSiteGeneratorLead: (lead) => set({ siteGeneratorLead: lead }),

  isCommandPaletteOpen: false,
  setIsCommandPaletteOpen: (val) => set((state) => ({
    isCommandPaletteOpen: typeof val === 'function' ? val(state.isCommandPaletteOpen) : val
  })),

  closeAllModals: () => set({
    isCommandPaletteOpen: false,
    selectedLeadForModal: null,
    emailModalLead: null,
    isCreateSiteModalOpen: false,
    isUpgradeModalOpen: false,
    isMobileMenuOpen: false,
  })
}));
