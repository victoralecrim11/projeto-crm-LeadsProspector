import React, { useState, useRef, useCallback, useEffect } from 'react';
import { 
  Sparkles, 
  ArrowRight, 
  Smartphone, 
  Monitor, 
  Check, 
  ExternalLink, 
  Share2, 
  Eye, 
  Zap, 
  ShieldAlert, 
  ShieldCheck, 
  Edit3,
  FileText,
  Copy,
  Server
} from 'lucide-react';
import { useCrm } from '../hooks/useCrm';
import { ResponsiveSelect } from './common/ResponsiveSelect';

export const RedesenhoView: React.FC = () => {
  const { 
    leads, 
    setupConfig, 
    setActivePage, 
    setCurrentEditingLead, 
    redesignLeadSite, 
    publishSiteToHostGator,
    generateProposalForLead
  } = useCrm();

  const [selectedLeadId, setSelectedLeadId] = useState<string>(leads[0]?.id || '');
  const [sliderPosition, setSliderPosition] = useState<number>(50);
  const [devicePreview, setDevicePreview] = useState<'desktop' | 'mobile'>('desktop');
  const [copiedLink, setCopiedLink] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    if (rect.width <= 0) return;
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(Math.round(percentage));
  }, []);

  useEffect(() => {
    if (!isDragging) return;

    const onPointerMove = (e: PointerEvent) => {
      handleMove(e.clientX);
    };

    const onPointerUp = () => {
      setIsDragging(false);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);

    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
    };
  }, [isDragging, handleMove]);

  const currentLead = leads.find(l => l.id === selectedLeadId) || leads[0];

  if (!leads || leads.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center space-y-5 animate-in fade-in duration-300">
        <div className="w-20 h-20 rounded-3xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20 shadow-inner">
          <Sparkles className="w-10 h-10" />
        </div>
        <div className="max-w-md space-y-2">
          <h2 className="text-2xl font-bold text-white tracking-tight">Nenhum Lead Encontrado</h2>
          <p className="text-slate-400 text-sm leading-relaxed">
            Adicione ou prospecte leads no CRM para começar a visualizar e editar os comparadores interativos de sites.
          </p>
        </div>
        <button 
          onClick={() => setActivePage('dashboard')} 
          className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-600/20 border border-white/10"
        >
          Voltar ao Painel
        </button>
      </div>
    );
  }

  const handleCopyLink = () => {
    if (!currentLead) return;
    const slug = currentLead.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const url = `https://${setupConfig.baseDomain}/clientes/${slug}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handlePublishNow = () => {
    if (!currentLead) return;
    setIsPublishing(true);
    setTimeout(() => {
      publishSiteToHostGator(currentLead.id);
      setIsPublishing(false);
    }, 1200);
  };

  const handleOpenEditor = () => {
    if (!currentLead) return;
    if (!currentLead.customization) {
      redesignLeadSite(currentLead.id);
    }
    setCurrentEditingLead(currentLead);
    setActivePage('editor');
  };

  const handleOpenProposal = () => {
    if (!currentLead) return;
    generateProposalForLead(currentLead.id);
    setActivePage('propostas');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header & Intro */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 glass-panel p-6 rounded-3xl border border-white/10">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4 text-sky-400 shrink-0" />
            <span className="truncate">Ciclo Passo 2 · Redesenho IA & Comparador Antes/Depois</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight truncate">Comparador Interativo de Sites</h2>
          <p className="text-xs text-slate-300/80 mt-1 max-w-2xl truncate xl:whitespace-normal">
            Apresente o contraste chocante entre o site antigo (lento, sem SSL, sem WhatsApp) e a nova versão premium de alta conversão.
          </p>
        </div>

        {/* Lead Selector */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 w-full xl:w-auto shrink-0">
          <ResponsiveSelect
            value={selectedLeadId}
            onChange={(val) => setSelectedLeadId(val)}
            options={leads.map(lead => ({
              value: lead.id,
              label: `${lead.name} (${lead.category})`
            }))}
            className="w-full sm:w-auto min-w-0 sm:min-w-[260px] lg:min-w-[340px]"
            buttonClassName="py-2.5 font-semibold"
          />

          <button
            onClick={handleOpenEditor}
            className="w-full sm:w-auto justify-center flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-indigo-500/25 border border-white/15 transition-all shrink-0"
          >
            <Edit3 className="w-4 h-4 shrink-0" />
            <span className="truncate">Abrir no Editor</span>
          </button>
        </div>
      </div>

      {/* Main Comparison Stage */}
      {currentLead && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Diagnostics & Problems Checklist */}
          <div className="space-y-5">
            {/* Technical Diagnosis Card */}
            <div className="glass-card p-5 rounded-3xl border border-white/10 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Diagnóstico Técnico</span>
                <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-lg border ${
                  currentLead.hasWebsite ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                }`}>
                  {currentLead.hasWebsite ? 'Site Precário' : 'Sem Site Próprio'}
                </span>
              </div>

              {/* Speed & SSL Scores */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 glass-panel rounded-2xl border border-white/10 text-center">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Site Antigo</span>
                  <div className="text-xl font-extrabold text-rose-400 mt-0.5">
                    {currentLead.audit?.speedScore || 28}/100
                  </div>
                  <span className="text-[10px] text-slate-400">Tempo: {currentLead.audit?.loadingTimeSeconds || 6.2}s</span>
                </div>

                <div className="p-3 glass-panel rounded-2xl border border-emerald-500/30 bg-emerald-500/10 text-center">
                  <span className="text-[10px] font-bold text-emerald-300 block uppercase">Nova Versão IA</span>
                  <div className="text-xl font-extrabold text-emerald-400 mt-0.5">
                    98/100
                  </div>
                  <span className="text-[10px] text-emerald-300">Tempo: 0.7s (Instantâneo)</span>
                </div>
              </div>

              {/* List of Detected Issues */}
              <div className="space-y-2 pt-2">
                <span className="text-[11px] font-bold text-rose-300 flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                  Problemas no site atual do cliente:
                </span>
                <ul className="space-y-1.5 text-xs text-slate-300">
                  {(currentLead.audit?.issues || [
                    'Não adaptado para smartphones',
                    'Falta de certificado HTTPS/SSL',
                    'Sem botão de WhatsApp para conversão direta',
                    'Carregamento lento perde até 60% do tráfego'
                  ]).map((issue, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-rose-200/90 text-[11px]">
                      <span className="text-rose-400 font-bold shrink-0">✕</span>
                      <span>{issue}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Solved by Prospector */}
              <div className="space-y-2 pt-2 border-t border-white/10">
                <span className="text-[11px] font-bold text-emerald-300 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  Soluções entregues na nova versão:
                </span>
                <ul className="space-y-1.5 text-xs text-slate-300">
                  <li className="flex items-center gap-2 text-emerald-200/90 text-[11px]">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Design 100% responsivo para iPhone e Android</span>
                  </li>
                  <li className="flex items-center gap-2 text-emerald-200/90 text-[11px]">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Botão Flutuante de Agendamento no WhatsApp</span>
                  </li>
                  <li className="flex items-center gap-2 text-emerald-200/90 text-[11px]">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Certificado SSL Seguro com HTTPS HostGator</span>
                  </li>
                  <li className="flex items-center gap-2 text-emerald-200/90 text-[11px]">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Depoimentos 5.0 estrelas do Google Maps</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Quick Actions Panel */}
            <div className="glass-card p-5 rounded-3xl border border-white/10 space-y-3">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">Ações do Ciclo</span>

              <button
                onClick={handlePublishNow}
                disabled={isPublishing}
                className="w-full py-2.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/25 border border-white/20 transition-all flex items-center justify-center gap-2"
              >
                <Server className="w-4 h-4" />
                <span>{isPublishing ? 'Sincronizando com HostGator...' : 'Publicar na HostGator com SSL'}</span>
              </button>

              <button
                onClick={handleOpenProposal}
                className="w-full py-2.5 px-4 glass-panel hover:bg-white/10 text-white font-semibold text-xs rounded-xl border border-white/15 transition-all flex items-center justify-center gap-2"
              >
                <FileText className="w-4 h-4 text-sky-400" />
                <span>Gerar Proposta Comercial com IA</span>
              </button>

              <button
                onClick={handleCopyLink}
                className="w-full py-2 px-4 glass-card hover:bg-white/10 text-slate-300 hover:text-white font-medium text-xs rounded-xl border border-white/10 transition-all flex items-center justify-center gap-2"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'Link do Comparador Copiado!' : 'Copiar Link da Apresentação'}</span>
              </button>
            </div>
          </div>

          {/* Right Column (2 cols): Interactive Before / After Canvas */}
          <div className="lg:col-span-2 space-y-4">
            {/* Control Bar: Slider & Device Switch */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 glass-card p-3 rounded-2xl border border-white/10">
              <div className="flex items-center justify-between sm:justify-start gap-2">
                <span className="text-xs font-semibold text-slate-300">Visualização:</span>
                <div className="flex items-center glass-panel p-1 rounded-xl border border-white/10">
                  <button
                    onClick={() => setDevicePreview('desktop')}
                    className={`p-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                      devicePreview === 'desktop' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Monitor className="w-3.5 h-3.5" />
                    <span>Desktop</span>
                  </button>
                  <button
                    onClick={() => setDevicePreview('mobile')}
                    className={`p-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                      devicePreview === 'mobile' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>Mobile</span>
                  </button>
                </div>
              </div>

              {/* Slider Controller */}
              <div className="flex items-center justify-between sm:justify-end gap-3 pt-1 sm:pt-0 border-t sm:border-t-0 border-white/5">
                <span className="text-xs font-bold text-rose-300">Antes</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={sliderPosition}
                  onChange={(e) => setSliderPosition(Number(e.target.value))}
                  className="flex-1 sm:w-44 accent-indigo-500 cursor-pointer"
                />
                <span className="text-xs font-bold text-emerald-300">Depois</span>
              </div>
            </div>

            {/* Visual Canvas */}
            <div className="glass-panel p-2 sm:p-4 rounded-2xl sm:rounded-3xl border border-white/15 overflow-hidden flex justify-center bg-slate-950/80 min-h-[480px] sm:min-h-[560px]">
              <div className={`w-full transition-all duration-300 ${
                devicePreview === 'mobile' ? 'max-w-sm rounded-[28px] sm:rounded-[36px] border-4 sm:border-8 border-slate-800 shadow-2xl' : 'max-w-full rounded-2xl border border-white/10 shadow-2xl'
              } overflow-hidden flex flex-col bg-slate-900`}>
                {/* Browser URL Bar */}
                <div className="px-3 sm:px-4 py-2 bg-slate-950 border-b border-white/10 flex items-center justify-between text-[11px] gap-2">
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80"></span>
                  </div>
                  <div className="glass-card px-2 sm:px-3 py-0.5 rounded-md text-slate-300 font-mono text-[10px] border border-white/10 truncate flex-1 text-center min-w-0">
                    https://{setupConfig.baseDomain}/clientes/{currentLead.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}/proposta
                  </div>
                  {devicePreview !== 'mobile' && (
                    <span className="text-emerald-400 font-semibold text-[10px] shrink-0 hidden sm:block">● SSL Ativo</span>
                  )}
                </div>

                {/* Split / Slider Interactive Screen */}
                <div 
                  ref={containerRef}
                  className={`relative flex-1 bg-slate-950 overflow-hidden min-h-[400px] ${
                    isDragging ? 'select-none cursor-ew-resize' : ''
                  }`}
                  onPointerDown={(e) => {
                    if ((e.target as HTMLElement).closest('a, button, input, select, textarea')) {
                      return;
                    }
                    setIsDragging(true);
                    handleMove(e.clientX);
                  }}
                >
                  
                  {/* AFTER LAYER (New Modern UI) */}
                  <div className="absolute inset-0 overflow-y-auto text-slate-100 p-4 sm:p-6 md:p-8 space-y-6 scrollbar-thin">
                    {/* Hero Header */}
                    <div className="flex items-center justify-between gap-2 pb-4 border-b border-white/10">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-sky-500 flex items-center justify-center font-bold text-white text-sm shadow-md shrink-0">
                          {currentLead.name.charAt(0)}
                        </div>
                        <span className="font-extrabold text-white text-xs sm:text-sm tracking-tight truncate min-w-0 block">{currentLead.name}</span>
                      </div>

                      <a
                        href={`https://wa.me/${currentLead.whatsapp || currentLead.phone.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 sm:px-3.5 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-[11px] sm:text-xs rounded-xl shadow-md border border-white/20 flex items-center gap-1 shrink-0 whitespace-nowrap"
                      >
                        <Zap className="w-3.5 h-3.5" />
                        <span>Agendar</span>
                      </a>
                    </div>

                    {/* Main Hero Banner */}
                    <div className="text-center space-y-3 max-w-xl mx-auto py-4">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-sky-300 border border-indigo-400/30 text-xs font-semibold">
                        <span>★ {currentLead.rating} no Google Maps · {currentLead.reviewsCount}+ Clientes</span>
                      </div>
                      <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight">
                        {currentLead.customization?.heroTitle || `O melhor atendimento de ${currentLead.category} em ${currentLead.city}`}
                      </h3>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        {currentLead.customization?.heroSubtitle || 'Experiência exclusiva, profissionais qualificados e agendamento instantâneo no WhatsApp.'}
                      </p>

                      <div className="pt-2 flex flex-wrap justify-center gap-3">
                        <button className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-500/30 border border-white/20 active:scale-95 transition-all">
                          {currentLead.customization?.ctaText || 'Agendar Meu Horário'}
                        </button>
                      </div>
                    </div>

                    {/* Services Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t border-white/10">
                      {(currentLead.customization?.services || [
                        { title: 'Serviço Premium', price: 'R$ 80,00', description: 'Atendimento personalizado com os melhores profissionais.' },
                        { title: 'Procedimento Especializado', price: 'R$ 150,00', description: 'Tecnologia moderna e garantia de satisfação.' }
                      ]).map((svc, i) => (
                        <div key={i} className="p-3.5 glass-card rounded-2xl border border-white/10 space-y-1">
                          <div className="flex items-center justify-between">
                            <h4 className="font-bold text-xs text-white">{svc.title}</h4>
                            <span className="text-xs font-extrabold text-emerald-400">{svc.price}</span>
                          </div>
                          <p className="text-[11px] text-slate-300">{svc.description}</p>
                        </div>
                      ))}
                    </div>

                    {/* Location & Contact Bar */}
                    <div className="p-3.5 glass-card rounded-2xl border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
                      <span className="text-slate-300">📍 {currentLead.address}</span>
                      <span className="text-sky-300 font-semibold">{currentLead.phone}</span>
                    </div>
                  </div>

                  {/* BEFORE LAYER (Old bad UI) */}
                  <div 
                    className="absolute inset-0 overflow-y-auto bg-slate-50 text-slate-900 p-4 sm:p-6 md:p-8 select-none pointer-events-none z-10"
                    style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
                  >
                    <div className="border-b-2 border-slate-300 pb-2 mb-6 flex items-center justify-between gap-2">
                      <h1 className="text-sm sm:text-xl font-serif text-blue-900 underline truncate min-w-0 flex-1">{currentLead.name.toUpperCase()}</h1>
                      <span className="text-[10px] sm:text-xs text-slate-600 font-sans shrink-0 whitespace-nowrap">Contato: {currentLead.phone}</span>
                    </div>

                    <div className="max-w-2xl mx-auto border-4 border-dashed border-slate-300 p-4 sm:p-6 bg-white">
                      <h2 className="text-base sm:text-lg font-bold text-red-600 mb-4 font-serif text-center">BEM VINDOS AO NOSSO SITE!</h2>
                      <p className="text-xs sm:text-sm text-slate-700 font-sans leading-loose mb-6 text-center">
                        Somos a melhor empresa de {currentLead.category} na região de {currentLead.city}.<br/><br/>
                        Venha conferir nossos serviços!
                      </p>
                      <div className="text-center">
                        <button className="bg-blue-600 text-white font-bold text-xs py-1.5 px-4 border-2 border-blue-800 shadow-[2px_2px_0px_#000]">
                          CLIQUE AQUI PARA AGENDAR
                        </button>
                      </div>
                    </div>

                    <div className="mt-8">
                      <h3 className="font-bold mb-2 font-serif text-sm">Nossos Serviços:</h3>
                      <ul className="list-disc pl-5 text-[11px] sm:text-xs space-y-2 font-sans text-slate-700">
                        {(currentLead.customization?.services || [
                          { title: 'Serviço Premium', price: 'R$ 80,00', description: 'Atendimento personalizado com os melhores profissionais.' },
                          { title: 'Procedimento Especializado', price: 'R$ 150,00', description: 'Tecnologia moderna e garantia de satisfação.' }
                        ]).map((svc: any, i: number) => (
                          <li key={i}><strong>{svc.title}</strong> - {svc.price} <br/> <span>{svc.description}</span></li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Slider Divider Line & Draggable Handle */}
                  <div 
                    id="before-after-divider"
                    className="absolute top-0 bottom-0 z-30 touch-none flex items-center justify-center cursor-ew-resize select-none group"
                    style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)', width: '48px' }}
                    onPointerDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsDragging(true);
                      handleMove(e.clientX);
                    }}
                    role="slider"
                    aria-valuenow={sliderPosition}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label="Divisor Antes e Depois"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'ArrowLeft') {
                        setSliderPosition(prev => Math.max(0, prev - 5));
                      } else if (e.key === 'ArrowRight') {
                        setSliderPosition(prev => Math.min(100, prev + 5));
                      }
                    }}
                  >
                    {/* Visible Vertical Line */}
                    <div className={`w-1 h-full transition-colors duration-150 ${
                      isDragging 
                        ? 'bg-sky-400 shadow-[0_0_20px_rgba(56,189,248,0.95)]' 
                        : 'bg-indigo-500 group-hover:bg-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.8)]'
                    }`} />

                    {/* Central Draggable Handle */}
                    <div 
                      className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center border-2 border-white shadow-xl transition-all duration-150 cursor-ew-resize ${
                        isDragging 
                          ? 'bg-gradient-to-r from-sky-500 to-indigo-600 scale-115 shadow-sky-500/60 ring-4 ring-sky-400/30' 
                          : 'bg-gradient-to-r from-indigo-600 to-sky-500 group-hover:scale-105 shadow-indigo-500/60'
                      }`}
                      title="Arraste para comparar Antes e Depois"
                    >
                      <div className="flex items-center justify-center gap-0.5 text-white pointer-events-none">
                        <div className="w-0.5 h-3.5 bg-white rounded-full"></div>
                        <div className="w-0.5 h-3.5 bg-white rounded-full"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
