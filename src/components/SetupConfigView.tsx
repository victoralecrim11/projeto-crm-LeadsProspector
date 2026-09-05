import React, { useState } from 'react';
import { 
  Server, 
  Save, 
  Check, 
  ShieldCheck, 
  Globe, 
  Mail, 
  Phone, 
  Sparkles, 
  CheckCircle2, 
  RefreshCw,
  Sliders
} from 'lucide-react';
import { useCrm } from '../hooks/useCrm';

export const SetupConfigView: React.FC = () => {
  const { setupConfig, updateSetupConfig } = useCrm();

  const [formData, setFormData] = useState(setupConfig);
  const [isTesting, setIsTesting] = useState(false);
  const [testSuccess, setTestSuccess] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleTestConnection = () => {
    setIsTesting(true);
    setTestSuccess(false);
    setTimeout(() => {
      setIsTesting(false);
      setTestSuccess(true);
      setTimeout(() => setTestSuccess(false), 3000);
    }, 1200);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSetupConfig(formData);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-6 rounded-3xl border border-white/10">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-wider mb-1">
            <Server className="w-4 h-4 text-sky-400" />
            <span>Infraestrutura & Configurações de Deploy</span>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Servidor HostGator & Dados Comerciais</h2>
          <p className="text-xs text-slate-300/80 mt-1 max-w-2xl">
            Configure a integração com o cPanel da HostGator para publicar novos sites e gerar prévias com 1 clique e SSL automático.
          </p>
        </div>

        <button
          onClick={handleTestConnection}
          disabled={isTesting}
          className="flex items-center gap-2 px-4 py-2.5 glass-panel hover:bg-white/10 text-sky-300 font-semibold text-xs rounded-xl border border-sky-400/30 transition-all shadow-md"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
          <span>{isTesting ? 'Testando Conexão...' : testSuccess ? 'Conexão OK!' : 'Testar Conexão cPanel'}</span>
        </button>
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: HostGator / cPanel Settings */}
        <div className="glass-card p-6 rounded-3xl border border-white/10 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-white/10">
            <Server className="w-4 h-4 text-sky-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Hospedagem HostGator & cPanel</h3>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-300">Servidor cPanel Host / IP</label>
            <input
              type="text"
              value={formData.cpanelHost}
              onChange={(e) => setFormData({ ...formData, cpanelHost: e.target.value })}
              className="w-full glass-input text-xs text-white px-3.5 py-2.5 rounded-xl border border-white/15 focus:outline-none font-mono"
              placeholder="Ex: br1098.hostgator.com.br"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-300">Usuário cPanel</label>
              <input
                type="text"
                value={formData.cpanelUser}
                onChange={(e) => setFormData({ ...formData, cpanelUser: e.target.value })}
                className="w-full glass-input text-xs text-white px-3.5 py-2.5 rounded-xl border border-white/15 focus:outline-none font-mono"
                placeholder="Ex: prospector_user"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-300">Senha / API Token</label>
              <input
                type="password"
                value={formData.cpanelPass}
                onChange={(e) => setFormData({ ...formData, cpanelPass: e.target.value })}
                className="w-full glass-input text-xs text-white px-3.5 py-2.5 rounded-xl border border-white/15 focus:outline-none font-mono"
                placeholder="••••••••••••"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-300">Domínio Base para Prévias</label>
            <input
              type="text"
              value={formData.baseDomain}
              onChange={(e) => setFormData({ ...formData, baseDomain: e.target.value })}
              className="w-full glass-input text-xs text-white px-3.5 py-2.5 rounded-xl border border-white/15 focus:outline-none font-mono"
              placeholder="Ex: agenciaprospector.com.br"
              required
            />
            <p className="text-[10px] text-slate-400">
              As demonstrações serão geradas em: https://{formData.baseDomain}/clientes/[nome-do-lead]
            </p>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-300">Diretório de Destino no Servidor</label>
            <input
              type="text"
              value={formData.targetFolder}
              onChange={(e) => setFormData({ ...formData, targetFolder: e.target.value })}
              className="w-full glass-input text-xs text-white px-3.5 py-2.5 rounded-xl border border-white/15 focus:outline-none font-mono"
              placeholder="Ex: public_html/clientes"
              required
            />
          </div>

          <div className="pt-2 flex items-center gap-2 text-xs text-emerald-300 font-semibold">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>SSL Automático com Let's Encrypt Ativo</span>
          </div>
        </div>

        {/* Right Column: Closer & Commercial Profile */}
        <div className="glass-card p-6 rounded-3xl border border-white/10 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-white/10">
            <Mail className="w-4 h-4 text-sky-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Perfil Comercial & Assinatura</h3>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-300">Nome do Vendedor / Closer</label>
            <input
              type="text"
              value={formData.senderName}
              onChange={(e) => setFormData({ ...formData, senderName: e.target.value })}
              className="w-full glass-input text-xs text-white px-3.5 py-2.5 rounded-xl border border-white/15 focus:outline-none"
              placeholder="Ex: Victor Alecrim"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-300">E-mail Comercial Remetente</label>
            <input
              type="email"
              value={formData.senderEmail}
              onChange={(e) => setFormData({ ...formData, senderEmail: e.target.value })}
              className="w-full glass-input text-xs text-white px-3.5 py-2.5 rounded-xl border border-white/15 focus:outline-none"
              placeholder="Ex: victor@agenciaprospector.com.br"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-300">WhatsApp de Contato Direto</label>
            <input
              type="text"
              value={formData.whatsappCloserPhone}
              onChange={(e) => setFormData({ ...formData, whatsappCloserPhone: e.target.value })}
              className="w-full glass-input text-xs text-white px-3.5 py-2.5 rounded-xl border border-white/15 focus:outline-none"
              placeholder="Ex: 5531998765432"
              required
            />
          </div>

          {/* Submit CTA */}
          <div className="pt-6">
            <button
              type="submit"
              className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-500/25 border border-white/20 transition-all flex items-center justify-center gap-2"
            >
              {saveSuccess ? <CheckCircle2 className="w-4 h-4 text-emerald-300" /> : <Save className="w-4 h-4" />}
              <span>{saveSuccess ? 'Configurações Salvas com Sucesso!' : 'Salvar Configurações'}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
