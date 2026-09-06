import React, { useState } from 'react';
import { 
  Edit3, 
  Save, 
  Sparkles, 
  Smartphone, 
  Monitor, 
  Server, 
  Trash2, 
  Palette,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Plus,
  Star,
  Calendar,
  Eye
} from 'lucide-react';
import { useCrm } from '../hooks/useCrm';
import { ResponsiveSelect } from './common/ResponsiveSelect';

export const VisualEditorView: React.FC = () => {
  const { 
    leads, 
    currentEditingLead, 
    setCurrentEditingLead, 
    updateLeadCustomization,
    publishSiteToHostGator,
    setupConfig,
    setActivePage
  } = useCrm();

  const selectedLead = currentEditingLead || leads[0];

  const [mobileTab, setMobileTab] = useState<'editor' | 'preview'>('preview');

  const [title, setTitle] = useState(selectedLead?.customization?.heroTitle || `O melhor atendimento em ${selectedLead?.city || 'sua região'}`);
  const [subtitle, setSubtitle] = useState(selectedLead?.customization?.heroSubtitle || 'Agendamento rápido e fácil direto no WhatsApp.');
  const [ctaText, setCtaText] = useState(selectedLead?.customization?.ctaText || 'Agendar no WhatsApp');
  const [primaryColor, setPrimaryColor] = useState(selectedLead?.customization?.primaryColor || '#4f46e5');
  const [workingHours, setWorkingHours] = useState(selectedLead?.customization?.workingHours || 'Segunda a Sábado das 09h às 19h');
  const [services, setServices] = useState(selectedLead?.customization?.services || [
    { title: 'Atendimento Principal VIP', price: 'R$ 60,00', description: 'Serviço de alta qualidade com hora marcada.' },
    { title: 'Procedimento Completo', price: 'R$ 120,00', description: 'Experiência premium com garantia de satisfação.' }
  ]);

  const [deviceMode, setDeviceMode] = useState<'desktop' | 'mobile'>('desktop');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);

  if (!leads || leads.length === 0) {
    return (
      <div className="fixed inset-0 z-[100] bg-slate-950 flex flex-col items-center justify-center p-6 animate-in fade-in duration-300">
        <div className="text-center space-y-5 max-w-md bg-slate-900/50 p-8 rounded-3xl border border-white/10 shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto border border-indigo-500/30">
            <Palette className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white mb-2">Nenhum Lead Encontrado</h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              Você precisa prospectar ou adicionar leads ao CRM antes de usar o Editor Visual para formatar o site deles.
            </p>
          </div>
          <button 
            onClick={() => setActivePage('dashboard')} 
            className="w-full px-4 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-600/20"
          >
            Voltar ao Painel
          </button>
        </div>
      </div>
    );
  }

  const colorPalettes = [
    { name: 'Índigo Real', color: '#4f46e5' },
    { name: 'Oceano Sky', color: '#0ea5e9' },
    { name: 'Esmeralda', color: '#059669' },
    { name: 'Rubi Intenso', color: '#e11d48' },
    { name: 'Âmbar Gold', color: '#d97706' },
    { name: 'Violeta Dark', color: '#8b5cf6' },
    { name: 'Preto Luxo', color: '#0f172a' },
  ];

  const handleSelectLead = (leadId: string) => {
    const found = leads.find(l => l.id === leadId);
    if (found) {
      setCurrentEditingLead(found);
      setTitle(found.customization?.heroTitle || `O melhor atendimento em ${found.city}`);
      setSubtitle(found.customization?.heroSubtitle || 'Agendamento rápido e fácil direto no WhatsApp.');
      setCtaText(found.customization?.ctaText || 'Agendar no WhatsApp');
      setPrimaryColor(found.customization?.primaryColor || '#4f46e5');
      setWorkingHours(found.customization?.workingHours || 'Segunda a Sábado das 09h às 19h');
      setServices(found.customization?.services || [
        { title: 'Atendimento Principal VIP', price: 'R$ 60,00', description: 'Serviço de alta qualidade com hora marcada.' },
        { title: 'Procedimento Completo', price: 'R$ 120,00', description: 'Experiência premium com garantia de satisfação.' }
      ]);
    }
  };

  const handleSave = () => {
    if (!selectedLead) return;
    updateLeadCustomization(selectedLead.id, {
      heroTitle: title,
      heroSubtitle: subtitle,
      ctaText,
      primaryColor,
      workingHours,
      services
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleDeployHostGator = () => {
    if (!selectedLead) return;
    handleSave();
    setIsDeploying(true);
    setTimeout(() => {
      publishSiteToHostGator(selectedLead.id);
      setIsDeploying(false);
    }, 1200);
  };

  const handleAddService = () => {
    setServices(prev => [
      ...prev,
      { title: 'Novo Serviço', price: 'R$ 50,00', description: 'Descrição detalhada do atendimento.' }
    ]);
  };

  const handleRemoveService = (index: number) => {
    setServices(prev => prev.filter((_, i) => i !== index));
  };

  const handleServiceChange = (index: number, field: string, value: string) => {
    setServices(prev => prev.map((s, i) => i === index ? { ...s, [field]: value } : s));
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900 flex flex-col overflow-hidden animate-in fade-in duration-300">
      {/* Top Header - Plugin Style */}
      <div className="flex items-center justify-between px-2 sm:px-6 py-2 sm:py-3 bg-slate-950 border-b border-white/10 shrink-0 gap-1 sm:gap-4 overflow-x-auto scrollbar-none">
        <div className="flex items-center gap-1 sm:gap-4 shrink-0">
          <button 
            onClick={() => setActivePage('dashboard')} 
            className="text-slate-400 hover:text-white transition-colors p-1.5 sm:p-2 sm:-ml-2 rounded-lg hover:bg-white/5"
            title="Voltar ao Painel"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="h-6 w-px bg-white/10 hidden sm:block" />
          <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs sm:text-sm uppercase tracking-wider">
            <Edit3 className="w-4 h-4 text-sky-400 hidden sm:block" />
            <span className="hidden sm:inline">Editor Visual PRO (HostGator Plugin)</span>
          </div>
        </div>

        {/* Center: Device Toggles on Desktop & Mode Switcher on Mobile */}
        <div className="hidden md:flex items-center glass-panel p-1 rounded-xl border border-white/10 shadow-inner bg-black/20 shrink-0">
          <button
            onClick={() => setDeviceMode('desktop')}
            className={`p-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              deviceMode === 'desktop' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>Desktop</span>
          </button>
          <button
            onClick={() => setDeviceMode('mobile')}
            className={`p-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              deviceMode === 'mobile' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Mobile</span>
          </button>
        </div>

        {/* Mobile View Switcher: Editor vs Live Preview */}
        <div className="flex md:hidden items-center glass-panel p-0.5 rounded-lg sm:rounded-xl border border-white/10 bg-black/40 shrink-0">
          <button
            onClick={() => setMobileTab('editor')}
            className={`px-1.5 sm:px-2 py-1 rounded-md sm:rounded-lg text-[10px] sm:text-xs font-bold transition-all flex items-center gap-1 ${
              mobileTab === 'editor' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Edit3 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            <span>Editar</span>
          </button>
          <button
            onClick={() => setMobileTab('preview')}
            className={`px-1.5 sm:px-2 py-1 rounded-md sm:rounded-lg text-[10px] sm:text-xs font-bold transition-all flex items-center gap-1 ${
              mobileTab === 'preview' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Eye className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            <span>Prévia</span>
          </button>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          <button
            onClick={handleSave}
            className="hidden sm:flex items-center gap-1.5 px-3 sm:px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl border border-white/10 transition-all"
          >
            {savedSuccess ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Save className="w-4 h-4 text-slate-400" />}
            <span className={savedSuccess ? 'text-emerald-400' : ''}>{savedSuccess ? 'Salvo' : 'Salvar'}</span>
          </button>
          
          <button
            onClick={handleDeployHostGator}
            disabled={isDeploying}
            className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-[10px] sm:text-xs rounded-lg sm:rounded-xl shadow-lg shadow-emerald-500/25 border border-white/20 transition-all"
          >
            <Server className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{isDeploying ? 'Sincronizando...' : 'Publicar HostGator'}</span>
            <span className="sm:hidden">{isDeploying ? 'Sync...' : 'Publicar'}</span>
          </button>
        </div>
      </div>

      {/* Main Workspace */}
      <div className="flex flex-1 overflow-hidden relative">
        
        {/* Left Sidebar (Editor Panel) */}
        <div className={`${mobileTab === 'editor' ? 'flex' : 'hidden md:flex'} w-full md:w-80 lg:w-96 bg-slate-950 border-r border-white/10 flex-col overflow-y-auto shrink-0 z-10 shadow-2xl relative`}>
          
          {/* Client Selector */}
          <div className="p-4 border-b border-white/10 bg-slate-900/50 sticky top-0 z-20 backdrop-blur-md">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Editando Site de:</label>
            <ResponsiveSelect
              value={selectedLead?.id}
              onChange={(val) => handleSelectLead(val)}
              options={leads.map(lead => ({
                value: lead.id,
                label: lead.name
              }))}
              buttonClassName="py-2.5 font-semibold"
            />
          </div>

          <div className="p-4 sm:p-6 space-y-6">
            
            {/* Visual Settings Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sky-400 mb-2">
                <Palette className="w-4 h-4" />
                <h3 className="text-xs font-bold uppercase tracking-wider">Identidade Visual</h3>
              </div>
              
              <div className="space-y-2">
                <label className="text-[11px] font-semibold text-slate-300 block">Cor Principal (Tema)</label>
                <div className="flex flex-wrap gap-2">
                  {colorPalettes.map(p => (
                    <button
                      key={p.color}
                      onClick={() => setPrimaryColor(p.color)}
                      className={`w-8 h-8 rounded-full border-2 transition-transform ${
                        primaryColor === p.color ? 'border-white scale-110 shadow-lg' : 'border-transparent hover:scale-105'
                      }`}
                      style={{ backgroundColor: p.color }}
                      title={p.name}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Content Section */}
            <div className="space-y-4 pt-4 border-t border-white/10">
              <div className="flex items-center gap-2 text-indigo-400 mb-2">
                <Edit3 className="w-4 h-4" />
                <h3 className="text-xs font-bold uppercase tracking-wider">Conteúdo & Textos</h3>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-300">Título de Impacto (Headline)</label>
                <textarea
                  rows={2}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full glass-input text-xs text-white p-3 rounded-xl border border-white/15 focus:outline-none focus:border-indigo-500 bg-black/20"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-300">Subtítulo / Descrição</label>
                <textarea
                  rows={2}
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  className="w-full glass-input text-xs text-white p-3 rounded-xl border border-white/15 focus:outline-none focus:border-indigo-500 bg-black/20"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-300">Texto do Botão (CTA)</label>
                <input
                  type="text"
                  value={ctaText}
                  onChange={(e) => setCtaText(e.target.value)}
                  className="w-full glass-input text-xs text-white px-3 py-2 rounded-xl border border-white/15 focus:outline-none focus:border-indigo-500 bg-black/20"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-300">Horário de Atendimento</label>
                <input
                  type="text"
                  value={workingHours}
                  onChange={(e) => setWorkingHours(e.target.value)}
                  className="w-full glass-input text-xs text-white px-3 py-2 rounded-xl border border-white/15 focus:outline-none focus:border-indigo-500 bg-black/20"
                />
              </div>
            </div>

            {/* Services Section */}
            <div className="space-y-4 pt-4 border-t border-white/10">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-emerald-400">
                  <Sparkles className="w-4 h-4" />
                  <h3 className="text-xs font-bold uppercase tracking-wider">Serviços</h3>
                </div>
                <button 
                  onClick={handleAddService}
                  className="p-1 hover:bg-white/10 rounded-lg text-slate-300 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3">
                {services.map((svc, i) => (
                  <div key={i} className="p-3 bg-white/5 border border-white/10 rounded-xl space-y-2 relative group">
                    <button
                      onClick={() => handleRemoveService(i)}
                      className="absolute top-2 right-2 p-1.5 bg-red-500/20 text-red-400 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 hover:text-white"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    
                    <input
                      type="text"
                      value={svc.title}
                      onChange={(e) => handleServiceChange(i, 'title', e.target.value)}
                      className="w-[85%] bg-transparent text-white font-bold text-xs border-b border-white/10 pb-1 focus:outline-none focus:border-indigo-500"
                      placeholder="Nome do Serviço"
                    />
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={svc.price}
                        onChange={(e) => handleServiceChange(i, 'price', e.target.value)}
                        className="w-1/3 bg-black/20 text-emerald-400 font-bold text-[11px] px-2 py-1 rounded border border-white/5 focus:outline-none"
                        placeholder="R$ 0,00"
                      />
                      <input
                        type="text"
                        value={svc.description}
                        onChange={(e) => handleServiceChange(i, 'description', e.target.value)}
                        className="w-2/3 bg-black/20 text-slate-300 text-[11px] px-2 py-1 rounded border border-white/5 focus:outline-none"
                        placeholder="Descrição curta"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Proceed Action */}
            <div className="pt-6 mt-4 border-t border-white/10 pb-6">
              <button
                onClick={() => setActivePage('propostas')}
                className="w-full py-3 px-4 glass-panel hover:bg-indigo-600/20 text-indigo-300 hover:text-indigo-200 hover:border-indigo-500/50 font-bold text-xs rounded-xl border border-indigo-500/30 transition-all flex items-center justify-center gap-2"
              >
                <span>Avançar para Proposta Comercial</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

          </div>
        </div>
        
        {/* Main Canvas (Live Preview) */}
        <div className={`${mobileTab === 'preview' ? 'flex' : 'hidden md:flex'} flex-1 bg-slate-900 flex-col p-2 sm:p-6 lg:p-8 overflow-y-auto mesh-bg relative min-w-0`}>
          
          <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-10 flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="text-[10px] sm:text-[11px] font-bold text-emerald-400 uppercase tracking-wider bg-slate-950/70 px-2 py-1 rounded-md backdrop-blur-md border border-emerald-500/20">Live Preview Ativo</span>
          </div>

          <div 
            className={`m-auto transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] bg-white/5 backdrop-blur-2xl border border-white/10 shadow-[0_0_80px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden transform-gpu ${
              deviceMode === 'mobile' 
                ? 'w-full max-w-[375px] h-[812px] rounded-[32px] sm:rounded-[40px] border-4 sm:border-[12px] border-slate-950/90 shrink-0' 
                : 'w-full max-w-5xl h-full min-h-[500px] max-h-[850px] rounded-2xl'
            }`}
          >
            {/* Browser/Device Header */}
            <div className="px-4 py-2 bg-slate-950/80 border-b border-white/10 flex items-center justify-between text-[11px] shrink-0">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-slate-700/50"></span>
                <span className="w-3 h-3 rounded-full bg-slate-700/50"></span>
                <span className="w-3 h-3 rounded-full bg-slate-700/50"></span>
              </div>
              <div className="glass-card px-4 py-1 rounded-md text-slate-400 font-mono text-[10px] border border-white/10 flex-1 mx-4 max-w-md text-center truncate bg-black/20">
                https://{setupConfig.baseDomain || 'prospector.app'}/{selectedLead?.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}
              </div>
              <div className="w-[42px]"></div> {/* Spacer to balance */}
            </div>

            {/* Injected Live Site Preview */}
            <div className="flex-1 overflow-y-auto bg-slate-50 text-slate-900 relative">
              
              {/* Site Navbar */}
              <div className={`sticky top-0 z-10 bg-white/90 backdrop-blur-md border-b border-slate-200 py-3 sm:py-4 flex items-center justify-between gap-3 shadow-sm ${deviceMode === 'mobile' ? 'px-4' : 'px-6'}`}>
                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                  <div 
                    className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center font-bold text-white text-base sm:text-lg shadow-md shrink-0"
                    style={{ backgroundColor: primaryColor }}
                  >
                    {selectedLead?.name.charAt(0)}
                  </div>
                  <span className={`font-extrabold text-slate-900 tracking-tight truncate min-w-0 block ${deviceMode === 'mobile' ? 'text-sm sm:text-base' : 'text-base sm:text-lg'}`}>{selectedLead?.name}</span>
                </div>
                <a
                  href={`https://wa.me/${selectedLead?.whatsapp || selectedLead?.phone?.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className={`px-4 py-2 text-white font-bold text-sm rounded-xl shadow-md transition-transform hover:scale-105 shrink-0 ${deviceMode === 'mobile' ? 'hidden' : 'hidden sm:block'}`}
                  style={{ backgroundColor: primaryColor }}
                >
                  {ctaText}
                </a>
              </div>

              {/* Site Hero */}
              <div className={`relative overflow-hidden bg-slate-900 text-white text-center ${deviceMode === 'mobile' ? 'py-12 px-4' : 'py-20 px-6'}`}>
                <div className="absolute inset-0 opacity-10" style={{ backgroundColor: primaryColor, backgroundImage: 'radial-gradient(circle at center, white 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
                <div className="relative z-10 max-w-2xl mx-auto space-y-6">
                  <div className={`inline-flex items-center gap-1.5 rounded-full bg-white/10 border border-white/20 font-bold backdrop-blur-md ${deviceMode === 'mobile' ? 'px-3 py-1 text-[10px]' : 'px-4 py-1.5 text-xs'}`}>
                    <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400 shrink-0" />
                    <span className="truncate">{typeof selectedLead?.rating === 'number' ? `${selectedLead.rating} estrelas${typeof selectedLead.reviewsCount === 'number' ? ` · ${selectedLead.reviewsCount} avaliações` : ''}` : 'Avaliação não informada'}</span>
                  </div>
                  <h1 className={`font-extrabold tracking-tight leading-tight ${deviceMode === 'mobile' ? 'text-3xl px-2' : 'text-4xl sm:text-5xl'}`}>
                    {title}
                  </h1>
                  <p className={`text-slate-300 leading-relaxed max-w-lg mx-auto font-medium ${deviceMode === 'mobile' ? 'text-sm px-2' : 'text-sm sm:text-base'}`}>
                    {subtitle}
                  </p>
                  <div className="pt-4">
                    <button 
                      className={`text-white font-extrabold text-sm rounded-xl shadow-xl hover:scale-105 transition-all flex items-center justify-center gap-2 mx-auto ${deviceMode === 'mobile' ? 'w-full py-3 px-4' : 'w-full sm:w-auto px-8 py-3.5'}`}
                      style={{ backgroundColor: primaryColor, boxShadow: `0 10px 25px -5px ${primaryColor}60` }}
                    >
                      <Smartphone className="w-5 h-5 shrink-0" />
                      <span>{ctaText}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Site Services */}
              <div className={`mx-auto space-y-10 ${deviceMode === 'mobile' ? 'py-12 px-4 max-w-full' : 'py-16 px-6 max-w-4xl'}`}>
                <div className="text-center space-y-2">
                  <h2 className={`font-extrabold text-slate-900 tracking-tight ${deviceMode === 'mobile' ? 'text-2xl' : 'text-3xl'}`}>Nossos Serviços</h2>
                  <p className="text-slate-500 font-medium">Qualidade de excelência com atendimento especializado</p>
                </div>

                <div className={`grid gap-6 ${deviceMode === 'mobile' ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}`}>
                  {services.map((svc, i) => (
                    <div key={i} className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow group">
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <h3 className="font-bold text-lg text-slate-900 group-hover:text-indigo-600 transition-colors">{svc.title}</h3>
                        <span className="px-3 py-1 bg-slate-100 text-slate-800 rounded-lg text-sm font-extrabold shrink-0" style={{ color: primaryColor }}>
                          {svc.price}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 leading-relaxed">{svc.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Site Footer */}
              <div className={`bg-slate-50 border-t border-slate-200 mt-10 ${deviceMode === 'mobile' ? 'py-8 px-4' : 'py-10 px-6'}`}>
                <div className={`max-w-4xl mx-auto flex items-center justify-between gap-6 text-sm ${deviceMode === 'mobile' ? 'flex-col text-center' : 'flex-col sm:flex-row text-center sm:text-right'}`}>
                  <div className="flex items-center gap-3 text-slate-600 font-medium justify-center">
                    <Calendar className="w-5 h-5" style={{ color: primaryColor }} />
                    <span>{workingHours}</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-600 font-medium justify-center">
                    <span className="max-w-xs">{selectedLead?.address}</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
