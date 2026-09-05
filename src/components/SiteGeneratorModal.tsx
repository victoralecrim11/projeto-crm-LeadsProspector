import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  Globe, 
  Smartphone, 
  Monitor, 
  ExternalLink, 
  Check, 
  Share2, 
  Copy,
  Scissors,
  Calendar,
  Phone,
  Star,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { useCrm } from '../hooks/useCrm';
import { ResponsiveSelect } from './common/ResponsiveSelect';

export const SiteGeneratorModal: React.FC = () => {
  const { 
    isCreateSiteModalOpen, 
    setIsCreateSiteModalOpen, 
    siteGeneratorLead, 
    setSiteGeneratorLead,
    leads,
    addProject,
    setActivePage
  } = useCrm();

  const [deviceMode, setDeviceMode] = useState<'desktop' | 'mobile'>('desktop');
  const [selectedLeadId, setSelectedLeadId] = useState<string>(siteGeneratorLead?.id || (leads[0]?.id || ''));
  const [isSaved, setIsSaved] = useState(false);
  const [isGeneratingCopy, setIsGeneratingCopy] = useState(false);
  const [aiCustomCopy, setAiCustomCopy] = useState<any>(null);

  if (!isCreateSiteModalOpen) return null;

  const currentLead = leads.find(l => l.id === selectedLeadId) || siteGeneratorLead || leads[0];

  const handleGenerateAiCopy = () => {
    setIsGeneratingCopy(true);
    setTimeout(() => {
      setAiCustomCopy({
        title: `Transformamos a presença do ${currentLead.name}`,
        subtitle: `O método definitivo para atrair clientes em ${currentLead.city} usando a internet a favor do seu negócio.`,
        cta: `Agendar Avaliação Gratuita`
      });
      setIsGeneratingCopy(false);
    }, 2000);
  };

  const handleSaveToProjects = () => {
    if (!currentLead) return;
    addProject({
      leadId: currentLead.id,
      clientName: currentLead.name,
      title: `Landing Page & Agendamento - ${currentLead.name}`,
      category: currentLead.category,
      type: 'Landing Page',
      status: 'publicado',
      previewUrl: `https://${currentLead.name.toLowerCase().replace(/[^a-z0-9]/g, '')}.leadsite.app`,
      domain: `${currentLead.name.toLowerCase().replace(/[^a-z0-9]/g, '')}.com.br`,
      monthlyRevenue: 250,
      slug: currentLead.name.toLowerCase().replace(/[^a-z0-9]/g, '-')
    });
    setIsSaved(true);
    setTimeout(() => {
      setIsCreateSiteModalOpen(false);
      setActivePage('projetos');
    }, 1000);
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="glass-panel border border-white/20 rounded-3xl w-full max-w-5xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-150 flex flex-col h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-white/[0.04] gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2.5 rounded-2xl bg-sky-500/20 text-sky-300 border border-sky-400/30 shadow-md shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-white text-base truncate">Gerador de Prévia de Site Comercial</h3>
              <p className="text-xs text-slate-300/80 truncate hidden sm:block">Demonstre valor instantâneo com um site de alta conversão pronto para o cliente</p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {/* Device Toggle */}
            <div className="flex items-center glass-card p-1 rounded-xl border border-white/10">
              <button
                onClick={() => setDeviceMode('desktop')}
                className={`p-1.5 rounded-lg transition-all ${deviceMode === 'desktop' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
                title="Versão Desktop"
              >
                <Monitor className="w-4 h-4" />
              </button>
              <button
                onClick={() => setDeviceMode('mobile')}
                className={`p-1.5 rounded-lg transition-all ${deviceMode === 'mobile' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
                title="Versão Mobile"
              >
                <Smartphone className="w-4 h-4" />
              </button>
            </div>

            <button 
              onClick={() => {
                setIsCreateSiteModalOpen(false);
                setSiteGeneratorLead(null);
              }}
              className="text-slate-400 hover:text-white text-sm p-1.5 rounded-lg hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Lead Selector Bar */}
        <div className="px-4 sm:px-5 py-3 glass-card border-b border-white/10 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full sm:w-auto min-w-0 flex-1">
            <span className="text-xs font-semibold text-slate-300 shrink-0">Gerando site para:</span>
            <div className="w-full sm:w-auto min-w-0 sm:min-w-[260px] max-w-full">
              <ResponsiveSelect
                value={selectedLeadId}
                onChange={(val) => setSelectedLeadId(val)}
                options={leads.map(lead => ({
                  value: lead.id,
                  label: `${lead.name} (${lead.category} - ${lead.city})`
                }))}
                buttonClassName="py-1.5 font-bold text-sky-300"
              />
            </div>
            
            <button
              type="button"
              disabled={isGeneratingCopy}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl shadow-md transition-all shrink-0 ml-auto sm:ml-2 ${
                isGeneratingCopy ? 'bg-sky-400/50 text-slate-800 cursor-not-allowed' : 'text-slate-900 bg-sky-400 hover:bg-sky-300 shadow-sky-500/20'
              }`}
              onClick={handleGenerateAiCopy}
            >
              <Sparkles className={`w-3.5 h-3.5 ${isGeneratingCopy ? 'animate-pulse' : ''}`} />
              <span>{isGeneratingCopy ? 'Gerando Copy...' : 'Reescrever com IA'}</span>
            </button>
          </div>

          <button
            onClick={handleSaveToProjects}
            className="w-full sm:w-auto justify-center flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-500/25 border border-white/20 transition-all"
          >
            {isSaved ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Salvo em Meus Projetos!</span>
              </>
            ) : (
              <>
                <Globe className="w-3.5 h-3.5" />
                <span>Publicar & Adicionar a Projetos</span>
              </>
            )}
          </button>
        </div>

        {/* Interactive Site Preview Area */}
        <div className="flex-1 overflow-y-auto bg-slate-950/70 p-4 sm:p-8 flex justify-center items-start">
          <div className={`transition-all duration-300 w-full ${
            deviceMode === 'mobile' ? 'max-w-sm rounded-[36px] border-8 border-slate-800/90 shadow-2xl overflow-hidden' : 'max-w-4xl rounded-3xl border border-white/15 shadow-2xl'
          } glass-panel text-slate-100 overflow-hidden`}>
            {/* Mockup Browser Bar (Desktop only) */}
            {deviceMode === 'desktop' && (
              <div className="flex items-center justify-between px-4 py-2.5 bg-white/[0.04] border-b border-white/10 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-yellow-500"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-green-500"></span>
                </div>
                <div className="glass-card px-6 py-1 rounded-lg text-slate-300 font-mono text-[11px] border border-white/10">
                  https://{currentLead?.name.toLowerCase().replace(/[^a-z0-9]/g, '')}.leadsite.app
                </div>
                <span className="text-[10px] text-emerald-300 font-semibold">● SSL Seguro</span>
              </div>
            )}

            {/* Generated Website Content */}
            <div className="p-6 md:p-10 space-y-10">
              {/* Navbar */}
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center font-bold text-white shadow-md border border-white/20">
                    {currentLead?.name.charAt(0)}
                  </div>
                  <span className="font-extrabold text-base tracking-tight text-white">{currentLead?.name}</span>
                </div>

                <a
                  href={`https://wa.me/${currentLead?.whatsapp || currentLead?.phone.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/25 border border-white/20 transition-all flex items-center gap-1.5"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Agendar Agora</span>
                </a>
              </div>

              {/* Hero Section */}
              <div className="text-center space-y-4 max-w-2xl mx-auto pt-4 relative">
                {/* Visual loading overlay for the text area */}
                {isGeneratingCopy && (
                  <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm z-10 rounded-2xl flex items-center justify-center">
                    <div className="animate-pulse flex items-center gap-2 text-sky-400 font-semibold text-xs">
                      <Sparkles className="w-4 h-4" />
                      <span>Gerando copy com Inteligência Artificial...</span>
                    </div>
                  </div>
                )}
                
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-sky-300 border border-indigo-400/30 text-xs font-semibold">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span>{currentLead?.rating} estrelas no Google · {currentLead?.reviewsCount}+ Clientes Satisfeitos</span>
                </div>

                <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
                  {aiCustomCopy ? (
                    aiCustomCopy.title
                  ) : (
                    <>O melhor serviço de <span className="text-sky-300">{currentLead?.category}</span> em {currentLead?.city}</>
                  )}
                </h1>

                <p className="text-sm text-slate-200 leading-relaxed">
                  {aiCustomCopy ? (
                    aiCustomCopy.subtitle
                  ) : (
                    <>Experiência exclusiva, atendimento pontual e profissionais especializados. Reserve seu horário em menos de 1 minuto diretamente pelo nosso WhatsApp.</>
                  )}
                </p>

                <div className="pt-3 flex flex-wrap items-center justify-center gap-3">
                  <button className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-500/30 border border-white/20 active:scale-95 transition-all">
                    {aiCustomCopy ? aiCustomCopy.cta : 'Quero Agendar Meu Horário'}
                  </button>
                  <button className="px-5 py-3 glass-card text-slate-200 hover:text-white font-semibold text-xs rounded-xl border border-white/15 transition-all">
                    Ver Tabela de Serviços
                  </button>
                </div>
              </div>

              {/* Badges Highlights */}
              <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-3 pt-6 border-t border-white/10 text-center">
                <div className="flex-1 min-w-[140px] p-4 glass-card rounded-2xl border border-white/10">
                  <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-sky-300 mx-auto flex items-center justify-center mb-2 border border-indigo-400/30">
                    <Star className="w-4 h-4 fill-sky-300" />
                  </div>
                  <h4 className="font-bold text-xs text-white">Excelência Comprovada</h4>
                  <p className="text-[11px] text-slate-300 mt-1">{currentLead?.rating} de 5 no Google Maps</p>
                </div>

                <div className="flex-1 min-w-[140px] p-4 glass-card rounded-2xl border border-white/10">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-300 mx-auto flex items-center justify-center mb-2 border border-emerald-400/30">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <h4 className="font-bold text-xs text-white">Agendamento Fácil</h4>
                  <p className="text-[11px] text-slate-300 mt-1">Sem filas e sem espera</p>
                </div>

                <div className="flex-1 min-w-[140px] p-4 glass-card rounded-2xl border border-white/10">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-300 mx-auto flex items-center justify-center mb-2 border border-amber-400/30">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <h4 className="font-bold text-xs text-white">Localização Privilegiada</h4>
                  <p className="text-[11px] text-slate-300 mt-1">{currentLead?.neighborhood || currentLead?.city}</p>
                </div>
              </div>

              {/* Address Footer */}
              <div className="p-4 glass-card rounded-2xl border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block">Nosso Endereço:</span>
                  <span className="font-semibold text-white">{currentLead?.address}</span>
                </div>
                <span className="text-sky-300 font-semibold">{currentLead?.phone}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
