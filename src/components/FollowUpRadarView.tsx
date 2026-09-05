import React, { useState } from 'react';
import { 
  Clock, 
  Send, 
  Check, 
  Copy, 
  AlertTriangle, 
  ArrowRight, 
  MessageSquare, 
  Calendar, 
  CheckCircle2,
  Sparkles,
  PhoneCall,
  Flame,
  Mail
} from 'lucide-react';
import { useCrm } from '../hooks/useCrm';

export const FollowUpRadarView: React.FC = () => {
  const { 
    leads, 
    sendFollowUpForLead, 
    setupConfig, 
    setActivePage,
    setEmailModalLead
  } = useCrm();

  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Filter leads that have had contact and are in CRM or needing follow up
  const followUpLeads = leads.filter(l => 
    l.inCrm && (l.crmStage === 'proposta_enviada' || l.crmStage === 'follow_up' || (l.daysWithoutResponse && l.daysWithoutResponse >= 1))
  );

  const getFollowUpMessage = (leadName: string, days: number = 3) => {
    const slug = leadName.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const url = `https://${setupConfig.baseDomain}/clientes/${slug}`;

    if (days >= 4) {
      return `Olá ${leadName}, tudo bem? Imagino que a rotina esteja corrida por aí! Só passando para saber se você conseguiu dar uma olhada na prévia do site novo (${url}). Se preferir, posso te enviar um resumo de 1 minuto em áudio.`;
    }
    return `Olá ${leadName}! Tudo bem? Gostaria de saber o que achou da prévia do site que montei para vocês (${url}). Ficou alguma dúvida?`;
  };

  const handleSendWhatsapp = (leadId: string, phone: string, name: string, days: number = 3) => {
    sendFollowUpForLead(leadId);
    const text = getFollowUpMessage(name, days);
    const cleanPhone = phone.replace(/\D/g, '');
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleCopyText = (leadId: string, name: string, days: number = 3) => {
    const text = getFollowUpMessage(name, days);
    navigator.clipboard.writeText(text);
    setCopiedId(leadId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-6 rounded-3xl border border-white/10">
        <div>
          <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider mb-1">
            <Clock className="w-4 h-4" />
            <span>Ciclo Passo 6 · Radar de Follow-up Inteligente</span>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Oportunidades Aguardando Resposta</h2>
          <p className="text-xs text-slate-300/80 mt-1 max-w-2xl">
            80% dos fechamentos acontecem entre o 2º e o 4º contato. Dispare lembretes amigáveis com 1 clique.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="glass-card px-4 py-2.5 rounded-2xl border border-amber-500/30 bg-amber-500/10 flex items-center gap-2">
            <Flame className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold text-amber-300">{followUpLeads.length} contatos no radar</span>
          </div>
        </div>
      </div>

      {/* Leads List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {followUpLeads.map((lead) => {
          const days = lead.daysWithoutResponse || 2;
          const isUrgent = days >= 3;

          return (
            <div 
              key={lead.id} 
              className={`glass-card p-6 rounded-3xl border transition-all space-y-4 ${
                isUrgent ? 'border-amber-500/40 bg-amber-500/[0.03] shadow-lg shadow-amber-500/5' : 'border-white/10'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-base font-bold text-white truncate">{lead.name}</span>
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md border shrink-0 ${
                      isUrgent ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'bg-sky-500/20 text-sky-300 border-sky-500/30'
                    }`}>
                      {days} dias sem resposta
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5 truncate">{lead.category} · {lead.city}</p>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Valor em Jogo</span>
                  <span className="text-sm font-extrabold text-emerald-400">R$ {lead.dealValue || 1800}</span>
                </div>
              </div>

              {/* Message Draft Preview */}
              <div className="p-4 glass-panel rounded-2xl border border-white/10 space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Sugestão de Mensagem:</span>
                <p className="text-xs sm:text-[13px] text-slate-200 leading-relaxed font-medium whitespace-pre-wrap break-words">
                  {getFollowUpMessage(lead.name, days)}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2.5 pt-1">
                <button
                  onClick={() => handleSendWhatsapp(lead.id, lead.whatsapp || lead.phone, lead.name, days)}
                  className="flex-1 py-2.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/25 border border-white/20 transition-all flex items-center justify-center gap-2"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </button>

                <button
                  onClick={() => setEmailModalLead(lead)}
                  className="py-2.5 px-3.5 glass-panel hover:bg-white/10 text-sky-300 hover:text-white rounded-xl border border-sky-400/30 text-xs font-semibold transition-all flex items-center gap-1.5"
                  title="Enviar Follow-up via E-mail"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>EmailService</span>
                </button>

                <button
                  onClick={() => handleCopyText(lead.id, lead.name, days)}
                  className="py-2.5 px-3 glass-panel hover:bg-white/10 text-slate-300 hover:text-white rounded-xl border border-white/10 text-xs font-semibold transition-all flex items-center gap-1.5"
                >
                  {copiedId === lead.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedId === lead.id ? 'Copiado!' : 'Copiar'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
