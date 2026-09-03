import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  MessageSquare, 
  Phone, 
  MapPin, 
  Globe, 
  Star, 
  DollarSign, 
  Calendar, 
  Copy, 
  Check, 
  Send,
  Plus,
  Trash2
} from 'lucide-react';
import { useCrm } from '../context/CrmContext';
import { Lead, LeadStatus } from '../types';
import { ResponsiveSelect } from './common/ResponsiveSelect';

export const LeadDetailsModal: React.FC = () => {
  const { 
    selectedLeadForModal, 
    setSelectedLeadForModal, 
    updateLeadDetails, 
    updateLeadStage,
    addLeadToCrm,
    setSiteGeneratorLead,
    setIsCreateSiteModalOpen
  } = useCrm();

  const [copiedScript, setCopiedScript] = useState(false);
  const [selectedScriptType, setSelectedScriptType] = useState<'cold' | 'followup' | 'objection'>('cold');
  const [newNote, setNewNote] = useState('');

  if (!selectedLeadForModal) return null;

  const lead = selectedLeadForModal;

  const generatePitchScript = () => {
    switch (selectedScriptType) {
      case 'cold':
        return `Olá ${lead.name}! Meu nome é Victor do LeadSite.\n\nNotei que vocês possuem uma excelente avaliação no Google (${lead.rating} estrelas com ${lead.reviewsCount} clientes em ${lead.city}), porém ${
          !lead.hasWebsite ? 'não possuem um site próprio para receber novos agendamentos automáticos.' : 'o site atual poderia converter muito mais clientes locais direto pelo WhatsApp.'
        }\n\nPreparei uma prévia gratuita de como ficaria a nova página da ${lead.name} para atrair novos clientes da região do ${lead.neighborhood || lead.city}.\n\nPosso enviar o link aqui para você dar uma olhada?`;
      
      case 'followup':
        return `Oi ${lead.name}! Passando rápido para ver se você conseguiu dar uma olhada na proposta da nova página e sistema de captação de clientes que conversamos.\n\nConseguimos colocar a plataforma no ar ainda esta semana para acelerar os agendamentos da ${lead.neighborhood || lead.city}. O que achou?`;

      case 'objection':
        return `Entendo perfeitamente que o Instagram de vocês já é muito bom! A grande vantagem do site com agendamento é que quem pesquisa no Google por "${lead.category} em ${lead.city}" quer agendar na hora, sem depender de esperar alguém responder no Direct.\n\nO site atua 24h por dia convertendo buscas em faturamento.`;
      
      default:
        return '';
    }
  };

  const scriptText = generatePitchScript();

  const handleCopyScript = () => {
    navigator.clipboard.writeText(scriptText);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2000);
  };

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    const updated = {
      ...lead,
      notes: [...(lead.notes || []), `${new Date().toLocaleDateString('pt-BR')} - ${newNote.trim()}`],
    };
    updateLeadDetails(updated);
    setNewNote('');
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-end">
      <div className="bg-slate-950/90 backdrop-blur-xl border-l border-white/20 w-full max-w-xl h-full shadow-2xl animate-in slide-in-from-right duration-200 flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10 bg-white/[0.02] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-sky-500 flex items-center justify-center font-bold text-white text-lg shadow-md border border-white/20">
              {lead.name.charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-white text-base sm:text-lg leading-tight truncate">{lead.name}</h3>
                <span className={`px-2.5 py-0.5 text-[11px] font-bold rounded-lg border shrink-0 ${
                  lead.temperature === 'quente' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
                  lead.temperature === 'morno' ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' :
                  'bg-sky-500/20 text-sky-300 border-sky-500/30'
                }`}>
                  Score {lead.score}
                </span>
              </div>
              <p className="text-xs text-slate-300/80 mt-0.5 truncate">{lead.category} · {lead.city}, {lead.state}</p>
            </div>
          </div>

          <button 
            onClick={() => setSelectedLeadForModal(null)}
            className="text-slate-400 hover:text-white text-sm p-1.5 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Quick Stats & CRM State */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-3.5 glass-card rounded-2xl border border-white/10">
              <span className="text-[10px] uppercase font-bold text-slate-300 block mb-1.5">Etapa no Funil</span>
              <ResponsiveSelect
                value={lead.crmStage || 'novo'}
                onChange={(val) => {
                  if (!lead.inCrm) {
                    addLeadToCrm(lead.id, val as LeadStatus);
                  } else {
                    updateLeadStage(lead.id, val as LeadStatus);
                  }
                }}
                options={[
                  { value: 'novo', label: '📥 Novo Lead' },
                  { value: 'abordado', label: '📞 Abordado' },
                  { value: 'agendado', label: '📅 Reunião Agendada' },
                  { value: 'follow_up', label: '💬 Follow Up' },
                  { value: 'negociacao', label: '🤝 Em Negociação' },
                  { value: 'convertido', label: '🏆 Convertido / Ganho' },
                  { value: 'perdido', label: '❌ Perdido' },
                ]}
              />
            </div>

            <div className="p-3.5 glass-card rounded-2xl border border-white/10">
              <span className="text-[10px] uppercase font-bold text-slate-300 block">Valor do Contrato (R$)</span>
              <div className="relative mt-1.5">
                <input
                  type="number"
                  value={lead.dealValue || 1500}
                  onChange={(e) => updateLeadDetails({ ...lead, dealValue: Number(e.target.value) })}
                  className="w-full glass-input rounded-xl px-3 py-1.5 text-xs font-bold text-emerald-300 focus:outline-none"
                />
              </div>
            </div>

            <div className="p-3.5 glass-card rounded-2xl border border-white/10">
              <span className="text-[10px] uppercase font-bold text-slate-300 block">Status de Site</span>
              <div className="mt-2 flex items-center justify-between">
                <span className={`text-xs font-bold ${lead.hasWebsite ? 'text-emerald-300' : 'text-amber-300'}`}>
                  {lead.hasWebsite ? 'Possui site ativo' : 'Sem site (Alta chance)'}
                </span>
                <button
                  onClick={() => {
                    setSiteGeneratorLead(lead);
                    setIsCreateSiteModalOpen(true);
                  }}
                  className="text-[11px] font-semibold text-sky-300 hover:text-sky-200 flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3" />
                  Gerar Prévia
                </button>
              </div>
            </div>
          </div>

          {/* Lead Contact Card */}
          <div className="p-4 glass-card rounded-2xl border border-white/10 space-y-3">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Informações de Contato & Localização</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="flex items-center gap-2 text-slate-300">
                <Phone className="w-4 h-4 text-slate-400" />
                <span className="font-semibold">{lead.phone}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                <span>{lead.rating} estrelas ({lead.reviewsCount} avaliações no Google)</span>
              </div>
              <div className="flex items-start gap-2 text-slate-300 md:col-span-2">
                <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <span>{lead.address}</span>
              </div>
            </div>
          </div>

          {/* AI Sales Outreach Script Generator */}
          <div className="p-4 glass-panel rounded-2xl border border-indigo-400/30 space-y-3 bg-indigo-500/10">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-sky-400" />
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Script Inteligente para WhatsApp</h4>
              </div>
              <div className="flex items-center flex-wrap gap-1 glass-card p-1 rounded-xl border border-white/10">
                <button
                  onClick={() => setSelectedScriptType('cold')}
                  className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-all ${
                    selectedScriptType === 'cold' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  Abordagem Fria
                </button>
                <button
                  onClick={() => setSelectedScriptType('followup')}
                  className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-all ${
                    selectedScriptType === 'followup' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  Follow Up
                </button>
                <button
                  onClick={() => setSelectedScriptType('objection')}
                  className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-all ${
                    selectedScriptType === 'objection' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  Objeção Instagram
                </button>
              </div>
            </div>

            <div className="p-3.5 glass-card rounded-2xl border border-white/10 text-xs text-slate-200 whitespace-pre-wrap font-sans leading-relaxed">
              {scriptText}
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                onClick={handleCopyScript}
                className="flex items-center gap-1.5 px-3 py-1.5 glass-card hover:bg-white/10 text-slate-200 text-xs font-semibold rounded-xl border border-white/15 transition-colors"
              >
                {copiedScript ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-300" />
                    <span>Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-400" />
                    <span>Copiar Script</span>
                  </>
                )}
              </button>

              <a
                href={`https://wa.me/${lead.whatsapp || lead.phone.replace(/\D/g, '')}?text=${encodeURIComponent(scriptText)}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-500/25 border border-white/20 transition-all"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Abrir WhatsApp</span>
              </a>
            </div>
          </div>

          {/* Notes & History */}
          <div className="p-4 glass-card rounded-2xl border border-white/10 space-y-3">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Anotações do Lead</h4>

            <div className="space-y-2 max-h-36 overflow-y-auto">
              {(!lead.notes || lead.notes.length === 0) ? (
                <p className="text-xs text-slate-400">Nenhuma anotação registrada ainda.</p>
              ) : (
                lead.notes.map((note, idx) => (
                  <div key={idx} className="p-2.5 glass-panel rounded-xl border border-white/10 text-xs text-slate-200">
                    {note}
                  </div>
                ))
              )}
            </div>

            <form onSubmit={handleAddNote} className="flex gap-2 pt-2">
              <input
                type="text"
                placeholder="Adicionar nota comercial..."
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                className="flex-1 glass-input rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
              />
              <button
                type="submit"
                className="px-4 py-2 glass-card hover:bg-white/10 text-xs font-semibold text-slate-200 rounded-xl transition-colors border border-white/15"
              >
                Salvar
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
