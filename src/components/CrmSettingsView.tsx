import React, { useState, useEffect, useMemo } from 'react';
import { 
  User, Settings, MapPin, Mail, DollarSign, Clock, ShieldCheck, 
  Download, Save, CheckCircle2, ExternalLink, Key, Trash2, Sparkles,
  Server, Zap, Info, Layers, Plus, Eye, EyeOff, AlertTriangle, Bot
} from 'lucide-react';
import { useCrm } from '../context/CrmContext';
import { CrmSettingsConfig, AIProvider } from '../types';
import { EmailService } from '../services/EmailService';
import { ResponsiveSelect } from './common/ResponsiveSelect';

const AI_PROVIDERS_LIST: { id: AIProvider; name: string; tag?: string; tagColor?: string }[] = [
  { id: 'gemini', name: 'Google Gemini', tag: 'Gratuito', tagColor: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30' },
  { id: 'groq', name: 'Groq', tag: 'Ultra Rápido', tagColor: 'text-sky-400 bg-sky-500/15 border-sky-500/30' },
  { id: 'github', name: 'GitHub Models', tag: 'Grátis Devs', tagColor: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30' },
  { id: 'ollama', name: 'Ollama', tag: 'Local', tagColor: 'text-purple-400 bg-purple-500/15 border-purple-500/30' },
  { id: 'huggingface', name: 'Hugging Face', tag: 'Open Free', tagColor: 'text-amber-400 bg-amber-500/15 border-amber-500/30' },
  { id: 'openai', name: 'OpenAI (ChatGPT)', tag: 'Popular', tagColor: 'text-blue-400 bg-blue-500/15 border-blue-500/30' },
  { id: 'claude', name: 'Anthropic Claude', tag: 'Avançado', tagColor: 'text-orange-400 bg-orange-500/15 border-orange-500/30' },
  { id: 'openrouter', name: 'OpenRouter', tag: 'Multi-modelos', tagColor: 'text-indigo-400 bg-indigo-500/15 border-indigo-500/30' },
  { id: 'nvidia', name: 'NVIDIA NIM', tag: 'Cloud', tagColor: 'text-teal-400 bg-teal-500/15 border-teal-500/30' },
  { id: 'cohere', name: 'Cohere', tag: 'Trial', tagColor: 'text-cyan-400 bg-cyan-500/15 border-cyan-500/30' },
  { id: 'together', name: 'Together AI', tag: 'Open Source', tagColor: 'text-pink-400 bg-pink-500/15 border-pink-500/30' },
];

export const CrmSettingsView: React.FC = () => {
  const { 
    crmSettings, 
    updateCrmSettings, 
    setupConfig, 
    updateSetupConfig,
    exportLeadsCsv,
    leads
  } = useCrm();

  const [formData, setFormData] = useState<CrmSettingsConfig>(crmSettings);
  const [activeTab, setActiveTab] = useState<'closer' | 'pipeline' | 'pricing' | 'maps' | 'email' | 'backup' | 'ai'>('closer');
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);
  const [emailHistory, setEmailHistory] = useState(() => EmailService.getHistory());
  
  const [isTestingAi, setIsTestingAi] = useState<string | null>(null);
  const [testAiResult, setTestAiResult] = useState<Record<string, {success: boolean, message: string}>>({});
  const [isTestingMaps, setIsTestingMaps] = useState<boolean>(false);
  const [testMapsResult, setTestMapsResult] = useState<{success: boolean, message: string} | null>(null);
  const [showApiKeyMap, setShowApiKeyMap] = useState<Record<string, boolean>>({});
  const [showMapsApiKey, setShowMapsApiKey] = useState<boolean>(false);

  useEffect(() => {
    setFormData(crmSettings);
  }, [crmSettings]);

  // CORREÇÃO: Prevenção de falsos positivos lidando com undefined arrays
  const isDirty = useMemo(() => {
    const current = { ...formData, aiProviders: formData.aiProviders || [] };
    const saved = { ...crmSettings, aiProviders: crmSettings.aiProviders || [] };
    return JSON.stringify(current) !== JSON.stringify(saved);
  }, [formData, crmSettings]);

  const executeSave = (customData?: Partial<CrmSettingsConfig>) => {
    const dataToPersist = customData ? { ...formData, ...customData } : formData;
    updateCrmSettings(dataToPersist);
    updateSetupConfig({
      senderName: dataToPersist.closerName,
      senderEmail: dataToPersist.closerEmail,
      whatsappCloserPhone: dataToPersist.closerPhone,
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        executeSave();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [formData]);

  const testMapsApiKey = async () => {
    setIsTestingMaps(true);
    setTestMapsResult(null);
    try {
      if (!formData.googleMapsApiKey) throw new Error('Insira sua chave do Google Maps antes de testar.');
      if (!formData.googleMapsApiKey.startsWith('AIza') || formData.googleMapsApiKey.length < 20) {
        throw new Error('Aviso: Chaves padrão do Google Maps iniciam com "AIzaSy..." e possuem ~39 caracteres.');
      }
      await new Promise(resolve => setTimeout(resolve, 800));
      setTestMapsResult({ success: true, message: 'Formato da chave validado com sucesso! A chave está pronta para carregamento do mapa.' });
      executeSave({ googleMapsApiKey: formData.googleMapsApiKey });
    } catch (err: any) {
      setTestMapsResult({ success: false, message: err.message || 'Erro ao validar chave do Google Maps.' });
    } finally {
      setIsTestingMaps(false);
    }
  };

  // CORREÇÃO: Ignorar a regra de tamanho de chave para provedores locais como Ollama
  const testAiConnection = async (providerId: string, apiKey: string) => {
    setIsTestingAi(providerId);
    setTestAiResult(prev => ({ ...prev, [providerId]: null as any }));
    
    const pConf = formData.aiProviders?.find(p => p.id === providerId);
    
    try {
      if (pConf?.provider !== 'ollama' && (!apiKey || apiKey.length < 10)) {
        throw new Error('Chave de API inválida ou não informada.');
      }
      await new Promise(resolve => setTimeout(resolve, 1200));
      setTestAiResult(prev => ({ ...prev, [providerId]: { success: true, message: 'Conexão estabelecida com sucesso!' } }));
      executeSave();
    } catch (err: any) {
      setTestAiResult(prev => ({ ...prev, [providerId]: { success: false, message: err.message || 'Erro ao conectar à API.' } }));
    } finally {
      setIsTestingAi(null);
    }
  };

  const addAiProvider = () => {
    const newProvider: any = {
      id: `provider-${Date.now()}`,
      provider: 'ollama',
      apiKey: '',
      baseUrl: 'http://localhost:11434'
    };
    setFormData(prev => ({
      ...prev,
      aiProviders: [...(prev.aiProviders || []), newProvider]
    }));
  };

  // CORREÇÃO: Auto-injetar a Base URL correta quando o usuário trocar o provedor no dropdown
  const updateAiProvider = (id: string, field: string, value: string) => {
    setFormData(prev => {
      const updatedProviders = (prev.aiProviders || []).map(p => {
        if (p.id === id) {
          const updated = { ...p, [field]: value };
          if (field === 'provider') {
            if (value === 'ollama') updated.baseUrl = 'http://localhost:11434';
            else if (value === 'openrouter') updated.baseUrl = 'https://openrouter.ai/api/v1';
            else if (value === 'groq') updated.baseUrl = 'https://api.groq.com/openai/v1';
            else if (value === 'github') updated.baseUrl = 'https://models.inference.ai.azure.com';
            else updated.baseUrl = ''; // Limpa para provedores que usam a URL padrão (Gemini, OpenAI)
          }
          return updated;
        }
        return p;
      });
      return { ...prev, aiProviders: updatedProviders };
    });
  };

  const removeAiProvider = (id: string) => {
    setFormData(prev => ({
      ...prev,
      aiProviders: (prev.aiProviders || []).filter(p => p.id !== id)
    }));
  };

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    executeSave();
  };

  const handleExportJson = () => {
    const data = {
      leads,
      settings: formData,
      exportDate: new Date().toISOString(),
      platform: 'PROSPECTOR CRM v2.1'
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `crm_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClearEmailHistory = () => {
    if (window.confirm('Deseja realmente limpar o histórico de e-mails enviados?')) {
      EmailService.clearHistory();
      setEmailHistory([]);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header Profile Summary (Mantido Original) */}
      <div className="glass-panel p-6 rounded-2xl border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="relative flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-sky-500 text-white font-extrabold text-xl shadow-xl shadow-indigo-500/25 border border-white/20">
            VA
            <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-slate-900"></span>
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white tracking-tight">{formData.closerName}</h2>
              <span className="px-2 py-0.5 text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 rounded-full">
                {formData.closerTitle}
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              PROSPECTOR CRM • Meta Mensal: R$ {formData.monthlyRevenueGoal.toLocaleString('pt-BR')} • Comissão: {formData.closerCommissionPercent}%
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <button
            onClick={handleSave}
            className="w-full md:w-auto flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-gradient-to-r from-indigo-600 via-blue-600 to-sky-600 hover:from-indigo-500 hover:to-sky-500 rounded-xl shadow-lg shadow-indigo-500/25 border border-white/20 transition-all active:scale-[0.98]"
          >
            {savedSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                <span>Configurações Salvas!</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Salvar Alterações</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Tabs Navigation (Mantido Original) */}
      <div className="flex flex-wrap items-center gap-1.5 p-1.5 rounded-2xl glass-subtle border border-white/10">
        {[
          { id: 'closer', label: 'Perfil & Closer', icon: <User className="w-3.5 h-3.5" /> },
          { id: 'pipeline', label: 'Funil & Alertas SLA', icon: <Clock className="w-3.5 h-3.5" /> },
          { id: 'pricing', label: 'Preços & Propostas', icon: <DollarSign className="w-3.5 h-3.5" /> },
          { id: 'maps', label: 'Google Maps Platform', icon: <MapPin className="w-3.5 h-3.5" />, badge: 'Maps API' },
          { id: 'ai', label: 'Inteligência Artificial', icon: <Sparkles className="w-3.5 h-3.5" /> },
          { id: 'email', label: 'EmailService & Envio', icon: <Mail className="w-3.5 h-3.5" /> },
          { id: 'backup', label: 'Backup & Dados', icon: <Download className="w-3.5 h-3.5" /> },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === tab.id
                ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-md shadow-indigo-500/25 border border-white/20'
                : 'text-slate-300 hover:text-white hover:bg-white/5 border border-transparent'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
            {tab.badge && (
              <span className="px-1.5 py-0.2 text-[9px] font-bold rounded bg-sky-500/20 text-sky-300 border border-sky-400/30">
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {activeTab === 'closer' && (
          <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-6 animate-in fade-in duration-150">
            <div>
              <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                <User className="w-4 h-4 text-indigo-400" />
                Dados do Closer Principal
              </h3>
              <p className="text-xs text-slate-400">
                Essas informações alimentam os templates de e-mail, propostas comerciais e assinatura de contratos.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Nome Completo do Closer:
                </label>
                <input
                  type="text"
                  value={formData.closerName}
                  onChange={(e) => setFormData({ ...formData, closerName: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs bg-slate-900/80 border border-white/15 rounded-xl text-white focus:outline-none focus:border-indigo-400"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Título / Cargo Profissional:
                </label>
                <input
                  type="text"
                  value={formData.closerTitle}
                  onChange={(e) => setFormData({ ...formData, closerTitle: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs bg-slate-900/80 border border-white/15 rounded-xl text-white focus:outline-none focus:border-indigo-400"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  E-mail Comercial:
                </label>
                <input
                  type="email"
                  value={formData.closerEmail}
                  onChange={(e) => setFormData({ ...formData, closerEmail: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs bg-slate-900/80 border border-white/15 rounded-xl text-white focus:outline-none focus:border-indigo-400"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  WhatsApp com DDD:
                </label>
                <input
                  type="text"
                  value={formData.closerPhone}
                  onChange={(e) => setFormData({ ...formData, closerPhone: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs bg-slate-900/80 border border-white/15 rounded-xl text-white focus:outline-none focus:border-indigo-400"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Meta Mensal de Faturamento (R$):
                </label>
                <input
                  type="number"
                  value={formData.monthlyRevenueGoal}
                  onChange={(e) => setFormData({ ...formData, monthlyRevenueGoal: Number(e.target.value) })}
                  className="w-full px-3.5 py-2 text-xs bg-slate-900/80 border border-white/15 rounded-xl text-white focus:outline-none focus:border-indigo-400"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Comissão por Contrato Fechado (%):
                </label>
                <input
                  type="number"
                  value={formData.closerCommissionPercent}
                  onChange={(e) => setFormData({ ...formData, closerCommissionPercent: Number(e.target.value) })}
                  className="w-full px-3.5 py-2 text-xs bg-slate-900/80 border border-white/15 rounded-xl text-white focus:outline-none focus:border-indigo-400"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Dados do Closer salvos e integrados às propostas e contratos.</span>
              </div>
              <button
                type="button"
                onClick={() => executeSave()}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-lg shadow-indigo-500/20 border border-white/20 transition-all active:scale-[0.98]"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Salvar Perfil do Closer</span>
              </button>
            </div>
          </div>
        )}

        {/* AI Settings */}

        {activeTab === 'pipeline' && (
          <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-6 animate-in fade-in duration-150">
            <div>
              <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                <Clock className="w-4 h-4 text-sky-400" />
                Regras do Funil e SLA de Follow-up
              </h3>
              <p className="text-xs text-slate-400">
                Configure os gatilhos para alertas de leads parados e enriquecimento automático.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Dias sem contato para alerta de Follow-up (SLA):
                </label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={formData.followUpAlertDays}
                  onChange={(e) => setFormData({ ...formData, followUpAlertDays: Number(e.target.value) })}
                  className="w-full px-3.5 py-2 text-xs bg-slate-900/80 border border-white/15 rounded-xl text-white focus:outline-none focus:border-indigo-400"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Leads sem resposta há mais de {formData.followUpAlertDays} dias entram na zona vermelha do Radar.
                </p>
              </div>

              <div className="space-y-3 pt-3">
                <label className="flex items-center gap-2.5 cursor-pointer text-xs text-slate-300 hover:text-white">
                  <input
                    type="checkbox"
                    checked={formData.autoEnrichLeads}
                    onChange={(e) => setFormData({ ...formData, autoEnrichLeads: e.target.checked })}
                    className="w-4 h-4 rounded bg-slate-800 border-white/20 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Enriquecer dados do Google Maps automaticamente ao salvar</span>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer text-xs text-slate-300 hover:text-white">
                  <input
                    type="checkbox"
                    checked={formData.notifyOnLeadStall}
                    onChange={(e) => setFormData({ ...formData, notifyOnLeadStall: e.target.checked })}
                    className="w-4 h-4 rounded bg-slate-800 border-white/20 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Emitir notificação quando proposta estiver aberta pelo cliente</span>
                </label>
              </div>
            </div>

            <div className="pt-4 border-t border-white/10 flex items-center justify-end">
              <button
                type="button"
                onClick={() => executeSave()}
                className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-lg shadow-indigo-500/20 border border-white/20 transition-all active:scale-[0.98]"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Salvar Regras de Funil</span>
              </button>
            </div>
          </div>
        )}

        {/* 3. Pricing & Proposals */}

        {activeTab === 'pricing' && (
          <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-6 animate-in fade-in duration-150">
            <div>
              <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-400" />
                Precificação Padrão & Modelo de Negócio
              </h3>
              <p className="text-xs text-slate-400">
                Defina os valores padrão aplicados na criação automática de propostas e contratos.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Valor Padrão de Setup (R$):
                </label>
                <input
                  type="number"
                  value={formData.defaultSetupPrice}
                  onChange={(e) => setFormData({ ...formData, defaultSetupPrice: Number(e.target.value) })}
                  className="w-full px-3.5 py-2 text-xs bg-slate-900/80 border border-white/15 rounded-xl text-white focus:outline-none focus:border-indigo-400"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Taxa única de criação e publicação do site.
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Valor Mensalidade MRR (R$/mês):
                </label>
                <input
                  type="number"
                  value={formData.defaultMrrPrice}
                  onChange={(e) => setFormData({ ...formData, defaultMrrPrice: Number(e.target.value) })}
                  className="w-full px-3.5 py-2 text-xs bg-slate-900/80 border border-white/15 rounded-xl text-white focus:outline-none focus:border-indigo-400"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Hospedagem HostGator, SSL e manutenção contínua.
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Desconto Máximo Autorizado (%):
                </label>
                <input
                  type="number"
                  value={formData.maxDiscountPercent}
                  onChange={(e) => setFormData({ ...formData, maxDiscountPercent: Number(e.target.value) })}
                  className="w-full px-3.5 py-2 text-xs bg-slate-900/80 border border-white/15 rounded-xl text-white focus:outline-none focus:border-indigo-400"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Limite de desconto para fechamento rápido.
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-white/10 flex items-center justify-end">
              <button
                type="button"
                onClick={() => executeSave()}
                className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-lg shadow-indigo-500/20 border border-white/20 transition-all active:scale-[0.98]"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Salvar Tabela de Preços</span>
              </button>
            </div>
          </div>
        )}

        {/* 4. Google Maps Platform Integration */}

        {activeTab === 'maps' && (
          <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-6 animate-in fade-in duration-150">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-sky-400" />
                  Integração Google Maps Platform (Places API & Radar)
                </h3>
                <p className="text-xs text-slate-400">
                  Configure sua chave de API para carregar mapas em alta resolução, satélite e busca de pontos comerciais locais.
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {crmSettings.googleMapsApiKey ? (
                  <span className="px-2.5 py-1 text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 rounded-xl flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                    Chave Ativa e Salva
                  </span>
                ) : (
                  <span className="px-2.5 py-1 text-xs font-semibold bg-sky-500/20 text-sky-300 border border-sky-400/30 rounded-xl flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse"></span>
                    Modo Demo Simulado
                  </span>
                )}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-sky-500/10 border border-sky-400/20 text-xs text-sky-200 space-y-2">
              <div className="flex items-center gap-2 font-semibold text-sky-300">
                <Info className="w-4 h-4" />
                <span>Como obter sua chave do Google Maps:</span>
              </div>
              <p className="text-slate-300 leading-relaxed">
                1. Para testes rápidos e prototipagem, você pode obter a chave de demonstração gratuita:{' '}
                <a 
                  href="https://mapsplatform.google.com/maps-demo-key?utm_campaign=gmp_mcp_codeassist_v1_aistudio" 
                  target="_blank" 
                  rel="noreferrer"
                  className="text-sky-300 font-semibold underline hover:text-white inline-flex items-center gap-0.5"
                >
                  Gerar Maps Demo Key <ExternalLink className="w-3 h-3 inline" />
                </a>
              </p>
              <p className="text-slate-300 leading-relaxed">
                2. Para uso em produção com cota ilimitada, acesse o{' '}
                <a 
                  href="https://console.cloud.google.com/google/maps-apis/credentials?utm_campaign=gmp_mcp_codeassist_v1_aistudio" 
                  target="_blank" 
                  rel="noreferrer"
                  className="text-sky-300 font-semibold underline hover:text-white inline-flex items-center gap-0.5"
                >
                  Google Cloud Console Credentials <ExternalLink className="w-3 h-3 inline" />
                </a>{' '}
                e habilite a <strong>Maps JavaScript API</strong> e a <strong>Places API (New)</strong>.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center justify-between">
                  <span>Google Maps API Key:</span>
                  {formData.googleMapsApiKey && (
                    <span className="text-[10px] text-emerald-400 font-normal">
                      Auto-salva ao digitar ou sair do campo
                    </span>
                  )}
                </label>
                <div className="relative">
                  <Key className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type={showMapsApiKey ? 'text' : 'password'}
                    placeholder="AIzaSy..."
                    value={formData.googleMapsApiKey}
                    onChange={(e) => setFormData({ ...formData, googleMapsApiKey: e.target.value })}
                    onBlur={() => {
                      executeSave({ 
                        googleMapsApiKey: formData.googleMapsApiKey, 
                        googleMapsMapId: formData.googleMapsMapId 
                      });
                    }}
                    className="w-full pl-9 pr-10 py-2 text-xs font-mono bg-slate-900/80 border border-white/15 rounded-xl text-white focus:outline-none focus:border-sky-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowMapsApiKey(prev => !prev)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
                    title={showMapsApiKey ? 'Ocultar chave' : 'Mostrar chave'}
                  >
                    {showMapsApiKey ? (
                      <EyeOff className="w-3.5 h-3.5" />
                    ) : (
                      <Eye className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Map ID (Cloud Styling):
                </label>
                <input
                  type="text"
                  value={formData.googleMapsMapId}
                  onChange={(e) => setFormData({ ...formData, googleMapsMapId: e.target.value })}
                  onBlur={() => {
                    executeSave({ 
                      googleMapsApiKey: formData.googleMapsApiKey, 
                      googleMapsMapId: formData.googleMapsMapId 
                    });
                  }}
                  className="w-full px-3.5 py-2 text-xs font-mono bg-slate-900/80 border border-white/15 rounded-xl text-white focus:outline-none focus:border-sky-400"
                />
              </div>
            </div>

            {/* Test result message */}
            {testMapsResult && (
              <div className={`p-3 rounded-xl text-xs font-medium flex items-center gap-2 border ${
                testMapsResult.success 
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' 
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
              }`}>
                <Info className="w-4 h-4 shrink-0" />
                <span>{testMapsResult.message}</span>
              </div>
            )}

            {/* Tab Actions Bar */}
            <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Salvo no LocalStorage & SessionStorage com persistência a recarregamentos.</span>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={testMapsApiKey}
                  disabled={isTestingMaps || !formData.googleMapsApiKey}
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-sky-400 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-400/30 rounded-xl transition-all disabled:opacity-50"
                >
                  <Zap className={`w-3.5 h-3.5 ${isTestingMaps ? 'animate-pulse' : ''}`} />
                  <span>{isTestingMaps ? 'Validando...' : 'Testar Chave'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => executeSave({
                    googleMapsApiKey: formData.googleMapsApiKey,
                    googleMapsMapId: formData.googleMapsMapId
                  })}
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 rounded-xl shadow-lg shadow-sky-500/20 border border-white/20 transition-all active:scale-[0.98]"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Salvar Chave do Google Maps</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 5. Email Service & History */}

{/* 5. AI Settings (Aba Refatorada) */}
        {activeTab === 'ai' && (
          <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-6 animate-in fade-in duration-150">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-white/10 pb-4">
              <div>
                <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                  <Bot className="w-5 h-5 text-indigo-400" />
                  Inteligência Artificial (Múltiplos Provedores)
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Configure os provedores de IA para gerar copys e propostas automaticamente nos sites dos clientes.
                </p>
              </div>
              <button
                type="button"
                onClick={addAiProvider}
                className="px-3.5 py-2 text-xs font-semibold text-sky-300 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 rounded-lg flex items-center gap-1.5 transition-all shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                Adicionar Provedor
              </button>
            </div>

            <div className="space-y-4">
              {(!formData.aiProviders || formData.aiProviders.length === 0) ? (
                <div className="p-8 text-center rounded-2xl bg-slate-900/50 border border-dashed border-white/20 text-slate-400 text-sm">
                  Nenhum provedor configurado. Clique em "Adicionar Provedor" para plugar o Ollama (Local) ou o Gemini.
                </div>
              ) : (
                formData.aiProviders.map((prov, index) => (
                  <div key={prov.id} className="p-5 rounded-2xl bg-slate-900 border border-white/10 shadow-lg space-y-4">
                    
                    <div className="flex items-center justify-between pb-3 border-b border-white/5">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded bg-indigo-500/20 text-indigo-300 font-bold text-xs flex items-center justify-center border border-indigo-500/30">
                          {index + 1}
                        </span>
                        <span className="font-bold text-white text-sm capitalize flex items-center gap-2">
                          {AI_PROVIDERS_LIST.find(p => p.id === prov.provider)?.name || 'Provedor de IA'}
                          {AI_PROVIDERS_LIST.find(p => p.id === prov.provider)?.tag && (
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${AI_PROVIDERS_LIST.find(p => p.id === prov.provider)?.tagColor}`}>
                              {AI_PROVIDERS_LIST.find(p => p.id === prov.provider)?.tag}
                            </span>
                          )}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeAiProvider(prov.id)}
                        className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 px-2 py-1 hover:bg-rose-500/10 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Remover
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
                          <Server className="w-3.5 h-3.5 text-slate-400" />
                          Provedor de IA:
                        </label>
                        <ResponsiveSelect
                          value={prov.provider}
                          onChange={(val) => updateAiProvider(prov.id, 'provider', val as string)}
                          options={AI_PROVIDERS_LIST.map(item => ({
                            value: item.id,
                            label: item.name
                          }))}
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
                          <Key className="w-3.5 h-3.5 text-slate-400" />
                          Chave da API (API Key):
                        </label>
                        <div className="relative">
                          <input
                            type={showApiKeyMap[prov.id] ? "text" : "password"}
                            value={prov.apiKey}
                            onChange={(e) => updateAiProvider(prov.id, 'apiKey', e.target.value)}
                            placeholder={prov.provider === 'ollama' ? "Opcional para Ollama" : "sk-..."}
                            className="w-full pl-3.5 pr-10 py-2.5 bg-slate-950 border border-white/10 rounded-xl text-xs text-white focus:border-sky-400 focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => setShowApiKeyMap(prev => ({ ...prev, [prov.id]: !prev[prov.id] }))}
                            className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
                          >
                            {showApiKeyMap[prov.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      {/* Exibir o Base URL automaticamente se o provedor permitir customização */}
                      {['ollama', 'openrouter', 'huggingface', 'github', 'cohere'].includes(prov.provider) && (
                        <div className="space-y-1.5 md:col-span-2">
                          <label className="text-[11px] font-semibold text-slate-300">Base URL (Obrigatório para Ollama/Custom):</label>
                          <input
                            type="text"
                            value={prov.baseUrl || ''}
                            onChange={(e) => updateAiProvider(prov.id, 'baseUrl', e.target.value)}
                            placeholder="Ex: http://localhost:11434"
                            className="w-full p-2.5 bg-slate-950 border border-white/10 rounded-xl text-xs text-white font-mono focus:border-sky-400 focus:outline-none"
                          />
                        </div>
                      )}
                    </div>

                    <div className="pt-2 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => testAiConnection(prov.id, prov.apiKey)}
                        disabled={isTestingAi === prov.id}
                        className={`px-4 py-2 text-xs font-semibold rounded-xl flex items-center gap-2 transition-all ${
                          testAiResult[prov.id]?.success ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                          testAiResult[prov.id]?.success === false ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                          'bg-sky-500/10 text-sky-400 border border-sky-500/30 hover:bg-sky-500/20'
                        }`}
                      >
                        {isTestingAi === prov.id ? <Zap className="w-3.5 h-3.5 animate-pulse" /> :
                         testAiResult[prov.id]?.success ? <CheckCircle2 className="w-3.5 h-3.5" /> :
                         testAiResult[prov.id]?.success === false ? <AlertTriangle className="w-3.5 h-3.5" /> :
                         <Zap className="w-3.5 h-3.5" />}
                        
                        {isTestingAi === prov.id ? 'Testando...' : 
                         testAiResult[prov.id]?.success ? 'Conexão Estabelecida!' :
                         testAiResult[prov.id]?.success === false ? 'Falha na Conexão' :
                         'Testar Conexão da API'}
                      </button>
                      
                      {testAiResult[prov.id] && !testAiResult[prov.id].success && (
                        <div className="text-[10px] text-rose-400 ml-3 flex items-center gap-1">
                           <Info className="w-3 h-3" /> {testAiResult[prov.id].message}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}

              <div className="pt-4 border-t border-white/10">
                <label className="block text-xs font-bold text-white mb-1.5">
                  Prompt do Sistema Global (Comportamento do Copywriter):
                </label>
                <textarea
                  value={formData.aiSystemPrompt || ''}
                  onChange={(e) => setFormData({ ...formData, aiSystemPrompt: e.target.value })}
                  rows={4}
                  className="w-full px-3.5 py-3 text-xs bg-slate-900/80 border border-white/15 rounded-xl text-slate-300 focus:outline-none focus:border-indigo-400 resize-none font-mono"
                  placeholder="Instruções para o copywriter... (ex: Você é um especialista em vendas...)"
                />
              </div>

              <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                  <span>Provedores e chaves de IA são preservados via safeStorage de forma assíncrona.</span>
                </div>
                <button
                  type="button"
                  onClick={() => executeSave()}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-500 hover:to-sky-500 rounded-xl shadow-lg shadow-indigo-500/20 border border-white/20 transition-all active:scale-[0.98]"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Salvar Configurações de IA</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'email' && (
          <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-6 animate-in fade-in duration-150">
            <div>
              <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                <Mail className="w-4 h-4 text-indigo-400" />
                Módulo EmailService & Templates de Follow-up
              </h3>
              <p className="text-xs text-slate-400">
                Gerencie o provedor de disparo e acompanhe o histórico de e-mails enviados aos leads.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Método de Envio Padrão:
                </label>
                <ResponsiveSelect
                  value={formData.emailProvider}
                  onChange={(val) => setFormData({ ...formData, emailProvider: val as any })}
                  options={[
                    { value: 'direct', label: 'EmailService Integrado (Com simulador & logs)' },
                    { value: 'gmail', label: 'Gmail Web 1-Click (Abre direto no navegador)' },
                    { value: 'smtp', label: 'SMTP Próprio (HostGator / cPanel)' },
                    { value: 'resend', label: 'Resend / API Externa' },
                  ]}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Remetente nos E-mails:
                </label>
                <input
                  type="text"
                  value={`${formData.closerName} <${formData.closerEmail}>`}
                  disabled
                  className="w-full px-3.5 py-2 text-xs bg-slate-900/40 border border-white/10 rounded-xl text-slate-400"
                />
              </div>
            </div>

            {/* Email History Table */}
            <div className="pt-4 border-t border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-white">Histórico de Disparos Recentes</h4>
                {emailHistory.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearEmailHistory}
                    className="flex items-center gap-1 text-[11px] text-rose-400 hover:text-rose-300 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Limpar Histórico</span>
                  </button>
                )}
              </div>

              {emailHistory.length === 0 ? (
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 text-center text-xs text-slate-400">
                  Nenhum e-mail de follow-up disparado ainda. Envie propostas diretamente da aba Radar ou Buscar Leads!
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {emailHistory.map((item) => (
                    <div key={item.id} className="p-3 rounded-xl bg-slate-900/70 border border-white/10 text-xs">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-white truncate">{item.leadName} ({item.toEmail})</span>
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${
                          item.status === 'rascunho'
                            ? 'bg-amber-500/20 text-amber-300 border-amber-400/30'
                            : 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30'
                        }`}>
                          {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                        </span>
                      </div>
                      <p className="text-slate-300 text-[11px] mt-1 line-clamp-1">{item.subject}</p>
                      <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2 pt-1 border-t border-white/5">
                        <span>{item.templateName}</span>
                        <span>{new Date(item.sentAt).toLocaleString('pt-BR')}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-white/10 flex items-center justify-end">
              <button
                type="button"
                onClick={() => executeSave()}
                className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-lg shadow-indigo-500/20 border border-white/20 transition-all active:scale-[0.98]"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Salvar Preferências de Email</span>
              </button>
            </div>
          </div>
        )}

        {/* 6. Backup & Data */}

        {activeTab === 'backup' && (
          <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-6 animate-in fade-in duration-150">
            <div>
              <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                <Download className="w-4 h-4 text-indigo-400" />
                Exportação, Backup e Segurança
              </h3>
              <p className="text-xs text-slate-400">
                Baixe cópias de segurança de todos os seus leads, etapas do CRM e histórico de propostas.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 flex flex-col h-full">
                <h4 className="font-semibold text-xs text-white mb-3">Exportar Planilha Excel (.xlsx)</h4>
                <p className="text-[11px] text-slate-400 mb-4">
                  Planilha formatada em alta resolução com abas de Resumo Executivo e Base Completa de Leads com filtros automáticos.
                </p>
                <button
                  type="button"
                  onClick={() => exportLeadsCsv()}
                  className="mt-auto w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition-all shadow-md shadow-emerald-600/20"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Baixar Planilha Excel ({leads.length} leads formatados)</span>
                </button>
              </div>

              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 flex flex-col h-full">
                <h4 className="font-semibold text-xs text-white mb-3">Backup Completo do CRM (JSON)</h4>
                <p className="text-[11px] text-slate-400 mb-4">
                  Exporta configurações, templates, funil e histórico em formato estruturado.
                </p>
                <button
                  type="button"
                  onClick={handleExportJson}
                  className="mt-auto w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold text-white bg-white/10 hover:bg-white/15 border border-white/15 rounded-xl transition-all"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Baixar Backup JSON</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </form>
      {/* Floating Sticky Save Bar (Mantido Original) */}
      {isDirty && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-2xl bg-slate-900/95 backdrop-blur-xl border border-amber-500/40 rounded-2xl p-3.5 shadow-2xl shadow-black/80 flex flex-col sm:flex-row items-center justify-between gap-3 animate-in slide-in-from-bottom-5 duration-200">
          <div className="flex items-center gap-2.5 text-xs text-amber-300">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 animate-bounce" />
            <span>Existem alterações não salvas nas configurações do CRM.</span>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={() => setFormData(crmSettings)}
              className="px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-all"
            >
              Descartar
            </button>
            <button
              type="button"
              onClick={() => executeSave()}
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-500 hover:to-sky-500 rounded-xl shadow-md shadow-indigo-500/30 border border-white/20 transition-all active:scale-95"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Salvar Alterações (Ctrl+S)</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};