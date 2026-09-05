import React, { useMemo, useState } from 'react';
import {
  KanbanSquare,
  Plus,
  Sparkles,
  ArrowRight,
  Phone,
  DollarSign,
  Calendar,
  ChevronRight,
  CheckCircle2,
  Flame,
  Clock,
  ShieldCheck,
  Send,
  MoreVertical,
  AlertCircle,
  Bell
} from 'lucide-react';
import { useCrm } from '../hooks/useCrm';
import { Lead, LeadStatus } from '../types';

export const CrmPipelineView: React.FC = () => {
  const {
    crmLeads,
    updateLeadStage,
    setSelectedLeadForModal,
    setActivePage,
    setCurrentEditingLead,
    redesignLeadSite,
    crmSettings
  } = useCrm();

  const stages: { id: LeadStatus; title: string; color: string }[] = [
    { id: 'novo', title: '1. Novo Lead', color: 'border-slate-500/40 text-slate-300' },
    { id: 'auditado', title: '2. Auditado', color: 'border-sky-500/40 text-sky-300' },
    { id: 'redesenhado', title: '3. Redesenhado', color: 'border-indigo-500/40 text-indigo-300' },
    { id: 'proposta_enviada', title: '4. Proposta Enviada', color: 'border-purple-500/40 text-purple-300' },
    { id: 'follow_up', title: '5. Follow-up Ativo', color: 'border-amber-500/40 text-amber-300' },
    { id: 'negociacao', title: '6. Em Negociação', color: 'border-blue-500/40 text-blue-300' },
    { id: 'convertido', title: '7. Fechado / Ganho', color: 'border-emerald-500/40 text-emerald-300' },
  ];

  const followUpAlertDays = crmSettings?.followUpAlertDays ?? 3;
  const today = new Date();

  // Determina se um lead precisa de atenção imediata (follow-up pendente / sem contato há X dias)
  const needsAttention = (lead: Lead): boolean => {
    if (lead.crmStage === 'convertido' || lead.crmStage === 'perdido') return false;
    if (lead.nextFollowUpDate) {
      const nextDate = new Date(lead.nextFollowUpDate);
      const diffDays = Math.ceil((nextDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays <= 0) return true; // follow-up vencido
    }
    if (lead.daysWithoutResponse && lead.daysWithoutResponse >= followUpAlertDays) {
      return true;
    }
    return false;
  };

  // Contagem de leads que precisam de atenção por etapa
  const stageAttentionCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    stages.forEach(s => counts[s.id] = 0);
    crmLeads.forEach(lead => {
      const stage = lead.crmStage || 'novo';
      if (needsAttention(lead)) {
        counts[stage] = (counts[stage] || 0) + 1;
      }
    });
    return counts;
  }, [crmLeads, followUpAlertDays]);

  const handleDragStart = (e: React.DragEvent, leadId: string) => {
    e.dataTransfer.setData('leadId', leadId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetStage: LeadStatus) => {
    e.preventDefault();
    const leadId = e.dataTransfer.getData('leadId');
    if (leadId) {
      updateLeadStage(leadId, targetStage);
    }
  };

  const handleOpenComparison = (lead: Lead) => {
    if (!lead.customization) {
      redesignLeadSite(lead.id);
    }
    setCurrentEditingLead(lead);
    setActivePage('redesenhar');
  };

  return (
    <div className="space-y-4 sm:space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-white/10">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-wider mb-1">
            <KanbanSquare className="w-4 h-4 text-sky-400" />
            <span>Ciclo Passo 5 · Pipeline Comercial & Funil de Vendas</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Kanban de Fechamento de Sites</h2>
          <p className="text-xs text-slate-300/80 mt-1 max-w-2xl">
            Arraste os cards para mover o negócio pelas etapas ou clique nas ações rápidas para disparar WhatsApp e propostas.
          </p>
        </div>

        <button
          onClick={() => setActivePage('leads')}
          className="w-full sm:w-auto justify-center flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-500/25 border border-white/20 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Buscar Novos Leads</span>
        </button>
      </div>

      {/* Horizontal Scrollable Kanban Columns */}
      <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-6 scrollbar-thin snap-x snap-mandatory sm:snap-none -mx-1 sm:mx-0 px-1 sm:px-0">
        {stages.map((stage) => {
          const leadsInStage = crmLeads.filter(l => (l.crmStage || 'novo') === stage.id);
          const stageTotal = leadsInStage.reduce((acc, curr) => acc + (curr.dealValue || 1800), 0);
          const attentionCount = stageAttentionCounts[stage.id] || 0;

          return (
            <div
              key={stage.id}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, stage.id)}
              className="w-[82vw] max-w-[320px] sm:w-80 shrink-0 snap-center glass-panel rounded-2xl sm:rounded-3xl border border-white/10 p-3.5 sm:p-4 flex flex-col justify-between min-h-[520px] sm:min-h-[580px] bg-slate-950/60"
            >
              <div className="space-y-3">
                {/* Stage Header */}
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-extrabold uppercase tracking-wider ${stage.color}`}>
                      {stage.title}
                    </span>
                    <span className="w-5 h-5 rounded-full bg-white/10 text-white text-[11px] font-bold flex items-center justify-center">
                      {leadsInStage.length}
                    </span>
                    {attentionCount > 0 && (
                      <span
                        className="relative inline-flex items-center justify-center w-5 h-5 rounded-full bg-rose-500 text-white text-[11px] font-extrabold shadow-md shadow-rose-500/30"
                        title={`${attentionCount} lead(s) precisando de atenção imediata`}
                      >
                        {attentionCount > 9 ? '9+' : attentionCount}
                        <span className="absolute inline-flex w-full h-full rounded-full bg-rose-400 opacity-60 animate-ping" />
                      </span>
                    )}
                  </div>

                  <span className="text-[11px] font-bold text-emerald-400">
                    R$ {stageTotal.toLocaleString('pt-BR')}
                  </span>
                </div>

                {/* Cards List in Stage */}
                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                  {leadsInStage.length === 0 ? (
                    <div className="p-8 text-center border-2 border-dashed border-white/5 rounded-2xl text-[11px] text-slate-500">
                      Arraste um lead para esta etapa
                    </div>
                  ) : (
leadsInStage.map((lead) => {
                      const urgent = needsAttention(lead);
                      return (
                        <div
                          key={lead.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, lead.id)}
                          className={`glass-card p-4 rounded-2xl border transition-all cursor-grab active:cursor-grabbing space-y-3 select-none relative ${
                            urgent
                              ? 'border-rose-400/60 hover:border-rose-400/90 ring-1 ring-rose-400/30 shadow-lg shadow-rose-500/10'
                              : 'border-white/10 hover:border-indigo-400/40'
                          }`}
                        >
                          {urgent && (
                            <div className="absolute -top-2 -right-2 flex items-center justify-center w-6 h-6 rounded-full bg-rose-500 border-2 border-slate-950 shadow-lg shadow-rose-500/40 z-10">
                              <Bell className="w-3 h-3 text-white animate-pulse" />
                            </div>
                          )}
                          {/* Header: Name & Rating */}
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <h4
                                onClick={() => setSelectedLeadForModal(lead)}
                                className="font-bold text-xs text-white hover:text-sky-300 transition-colors cursor-pointer truncate"
                                title={lead.name}
                              >
                                {lead.name}
                              </h4>
                              <span className="text-[10px] text-slate-400 truncate block">{lead.category}</span>
                            </div>

                            <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-bold shrink-0">
                              ★ {lead.rating}
                            </span>
                          </div>

                          {urgent && (
                            <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-rose-500/15 border border-rose-400/30 text-[10px] text-rose-300 font-semibold">
                              <AlertCircle className="w-3 h-3 shrink-0" />
                              <span className="truncate">
                                {lead.nextFollowUpDate && new Date(lead.nextFollowUpDate) <= today
                                  ? 'Follow-up vencido'
                                  : `Sem resposta há ${lead.daysWithoutResponse || 0} dia(s)`}
                              </span>
                            </div>
                          )}

                          {/* Value & MRR Pill */}
                          <div className="p-2 glass-panel rounded-xl border border-white/5 flex items-center justify-between gap-2 text-[11px]">
                            <span className="text-slate-400 truncate">Setup: <strong className="text-white">R$ {lead.dealValue || 1800}</strong></span>
                            <span className="text-emerald-400 font-bold shrink-0">MRR: R$ {lead.mrrValue || 197}/m</span>
                          </div>

                          {/* Quick Action Buttons on Card */}
                          <div className="flex items-center gap-1.5 pt-1">
                            <button
                              onClick={() => handleOpenComparison(lead)}
                              className="flex-1 py-1.5 px-2 glass-panel hover:bg-white/10 text-[10px] font-semibold text-sky-300 rounded-lg border border-sky-400/30 transition-all flex items-center justify-center gap-1"
                            >
                              <Sparkles className="w-3 h-3" />
                              <span>Antes/Depois</span>
                            </button>

                            <a
                              href={`https://wa.me/${lead.whatsapp || lead.phone.replace(/\D/g, '')}`}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 rounded-lg border border-emerald-500/30 transition-all"
                              title="Conversar no WhatsApp"
                            >
                              <Send className="w-3 h-3" />
                            </a>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
