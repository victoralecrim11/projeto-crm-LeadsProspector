import React from 'react';
import { 
  Compass, 
  Sparkles, 
  Edit3, 
  FileText, 
  KanbanSquare, 
  Clock, 
  ShieldCheck, 
  Server, 
  ArrowRight, 
  DollarSign, 
  TrendingUp, 
  Users, 
  CheckCircle2, 
  Flame, 
  PhoneCall,
  Calendar,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { useCrm } from '../hooks/useCrm';

export const DashboardView: React.FC = () => {
  const { 
    leads, 
    funnelStats, 
    setActivePage, 
    setCurrentEditingLead, 
    setSelectedLeadForModal 
  } = useCrm();

  const cycleSteps = [
    { num: '1', title: 'Prospectar Maps', desc: 'Buscar negócios sem site ou com nota 5.0', page: 'leads' as const, icon: <Compass className="w-4 h-4" /> },
    { num: '2', title: 'Redesenho IA', desc: 'Gerar comparador Antes e Depois', page: 'redesenhar' as const, icon: <Sparkles className="w-4 h-4" /> },
    { num: '3', title: 'Editor No-Code', desc: 'Ajustar serviços, fotos e WhatsApp', page: 'editor' as const, icon: <Edit3 className="w-4 h-4" /> },
    { num: '4', title: 'Propostas com IA', desc: 'Scripts com rapport e anti-spam', page: 'propostas' as const, icon: <FileText className="w-4 h-4" /> },
    { num: '5', title: 'Pipeline CRM', desc: 'Acompanhar cada oportunidade', page: 'crm' as const, icon: <KanbanSquare className="w-4 h-4" /> },
    { num: '6', title: 'Radar Follow-up', desc: 'Alertas 3+ dias sem resposta', page: 'followup' as const, icon: <Clock className="w-4 h-4" /> },
    { num: '7', title: 'Contratos & MRR', desc: 'Formalizar setup + mensalidade', page: 'contratos' as const, icon: <ShieldCheck className="w-4 h-4" /> },
    { num: '8', title: 'Deploy HostGator', desc: 'Publicar com SSL no cPanel', page: 'setup' as const, icon: <Server className="w-4 h-4" /> },
  ];

  const urgentFollowUps = leads.filter(l => l.daysWithoutResponse && l.daysWithoutResponse >= 3);
  const hotLeads = leads.filter(l => l.temperature === 'quente' && l.crmStage !== 'convertido');

  return (
    <div className="space-y-4 sm:space-y-6 pb-12">
      {/* Top Welcome Hero Banner */}
      <div className="relative overflow-hidden glass-panel p-4 sm:p-8 rounded-2xl sm:rounded-3xl border border-white/10 bg-gradient-to-r from-slate-950 via-indigo-950/40 to-slate-950 shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-sky-300 border border-indigo-400/30 text-[10px] sm:text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Metodologia Prospector de Sites v2.1 Ativa</span>
            </div>
            <h2 className="text-lg sm:text-2xl lg:text-3xl font-extrabold text-white tracking-tight leading-tight">
              Acelere a prospecção e o fechamento de sites para negócios locais.
            </h2>
            <p className="text-[11px] sm:text-sm text-slate-300 leading-relaxed">
              Encontre negócios locais, crie demonstrações instantâneas de alta conversão e transforme oportunidades em contratos recorrentes (MRR).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0 mt-2 sm:mt-0">
            <button
              onClick={() => setActivePage('leads')}
              className="w-full sm:w-auto justify-center px-4 py-2.5 sm:px-5 sm:py-3 bg-gradient-to-r from-indigo-600 via-blue-600 to-sky-500 hover:from-indigo-500 hover:to-sky-400 text-white font-bold text-xs rounded-2xl shadow-xl shadow-indigo-500/25 border border-white/20 transition-all flex items-center gap-2"
            >
              <Compass className="w-4 h-4" />
              <span>Prospectar no Maps</span>
            </button>
          </div>
        </div>
      </div>

      {/* Financial & Performance Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Receita Setup Total */}
        <div className="glass-card p-5 rounded-3xl border border-white/10 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Receita Fechada (Setup)</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white">
            R$ {funnelStats.receitaTotal.toLocaleString('pt-BR')},00
          </div>
          <p className="text-[11px] text-emerald-400 flex items-center gap-1 font-medium">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Ticket Médio: R$ {Math.round(funnelStats.ticketMedio || 1800)},00</span>
          </p>
        </div>

        {/* MRR Mensal Recorrente */}
        <div className="glass-card p-5 rounded-3xl border border-white/10 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">MRR Recorrente (Mensal)</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-indigo-300">
            R$ {funnelStats.mrrTotal.toLocaleString('pt-BR')},00<span className="text-xs font-normal text-slate-400">/mês</span>
          </div>
          <p className="text-[11px] text-slate-400">
            Hospedagem & suporte HostGator
          </p>
        </div>

        {/* Leads em Negociação */}
        <div className="glass-card p-5 rounded-3xl border border-white/10 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Oportunidades em Aberto</span>
            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white">
            {funnelStats.negociando + funnelStats.propostasEnviadas + funnelStats.followUp}
          </div>
          <p className="text-[11px] text-sky-300 font-medium">
            {funnelStats.propostasEnviadas} propostas sob análise
          </p>
        </div>

        {/* Taxa de Conversão */}
        <div className="glass-card p-5 rounded-3xl border border-white/10 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Taxa de Conversão</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white">
            {funnelStats.taxaConversao.toFixed(1)}%
          </div>
          <p className="text-[11px] text-slate-400">
            {funnelStats.convertidos} clientes convertidos
          </p>
        </div>
      </div>

      {/* The 8 Steps Sales Cycle Navigation Bar */}
      <div className="glass-card p-6 rounded-3xl border border-white/10 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">O Ciclo de Fechamento de Sites</h3>
            <p className="text-xs text-slate-400">Clique em qualquer etapa para acessar as ferramentas dedicadas</p>
          </div>
          <span className="text-xs font-bold text-indigo-400">Fluxo Passo a Passo</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8 gap-2.5">
          {cycleSteps.map((step) => (
            <button
              key={step.num}
              onClick={() => setActivePage(step.page)}
              className="group p-3 rounded-2xl glass-panel hover:bg-white/[0.08] border border-white/10 hover:border-indigo-400/40 text-left transition-all space-y-2 flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <span className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-300 font-bold text-xs flex items-center justify-center border border-indigo-400/30">
                  {step.num}
                </span>
                <span className="text-slate-400 group-hover:text-indigo-400 transition-colors">
                  {step.icon}
                </span>
              </div>
              <div>
                <h4 className="font-bold text-xs text-white group-hover:text-sky-300 transition-colors leading-tight">
                  {step.title}
                </h4>
                <p className="text-[10px] text-slate-400 line-clamp-2 mt-0.5">
                  {step.desc}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Priority Action Panels (Two Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Leads Quentes & Em Negociação */}
        <div className="glass-card p-6 rounded-3xl border border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-bold text-white">Leads Quentes com Alto Interesse</h3>
            </div>
            <button 
              onClick={() => setActivePage('crm')}
              className="text-xs text-sky-400 hover:text-sky-300 font-semibold flex items-center gap-1"
            >
              <span>Ver CRM</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {hotLeads.map((lead) => (
              <div 
                key={lead.id}
                onClick={() => {
                  setSelectedLeadForModal(lead);
                }}
                className="p-4 glass-panel hover:bg-white/[0.08] rounded-2xl border border-white/10 transition-all cursor-pointer flex items-center justify-between gap-3"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-xs text-white">{lead.name}</h4>
                    <span className="px-2 py-0.2 text-[9px] font-bold rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      {typeof lead.rating === 'number' ? `★ ${lead.rating}` : 'Avaliação não informada'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">{lead.category} · {lead.city}</p>
                </div>

                <div className="text-right">
                  <span className="text-xs font-extrabold text-emerald-400 block">R$ {lead.dealValue || 1800}</span>
                  <span className="text-[10px] text-indigo-300 font-semibold uppercase">{lead.crmStage}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Radar de Follow-up (3+ dias sem resposta) */}
        <div className="glass-card p-6 rounded-3xl border border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-rose-400" />
              <h3 className="text-sm font-bold text-white">Radar de Follow-up (Aguardando Resposta)</h3>
            </div>
            <button 
              onClick={() => setActivePage('followup')}
              className="text-xs text-sky-400 hover:text-sky-300 font-semibold flex items-center gap-1"
            >
              <span>Disparar Todos</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {urgentFollowUps.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                Nenhum lead pendente de follow-up no momento. Excelente trabalho!
              </div>
            ) : (
              urgentFollowUps.map((lead) => (
                <div 
                  key={lead.id}
                  className="p-4 glass-panel rounded-2xl border border-rose-500/20 bg-rose-500/5 flex items-center justify-between gap-3"
                >
                  <div className="space-y-0.5">
                    <h4 className="font-bold text-xs text-white">{lead.name}</h4>
                    <p className="text-[11px] text-rose-300">{lead.daysWithoutResponse} dias sem contato</p>
                  </div>

                  <button
                    onClick={() => setActivePage('followup')}
                    className="px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5"
                  >
                    <span>Lembrar no WhatsApp</span>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
