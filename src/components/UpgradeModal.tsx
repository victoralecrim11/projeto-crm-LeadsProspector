import React, { useState } from 'react';
import { 
  X, 
  Check, 
  Zap, 
  Sparkles, 
  Crown
} from 'lucide-react';
import { useCrm } from '../hooks/useCrm';

export const UpgradeModal: React.FC = () => {
  const { isUpgradeModalOpen, setIsUpgradeModalOpen } = useCrm();
  const [successPlan, setSuccessPlan] = useState<string | null>(null);

  if (!isUpgradeModalOpen) return null;

  const handleSelectPlan = (planName: string) => {
    setSuccessPlan(planName);
    setTimeout(() => {
      setSuccessPlan(null);
      setIsUpgradeModalOpen(false);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="glass-panel border border-white/20 rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10 bg-white/[0.04]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 shadow-md">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Planos & Upgrades LeadSite</h3>
              <p className="text-xs text-slate-300/80">Multiplique sua capacidade de prospecção e faturamento</p>
            </div>
          </div>

          <button 
            onClick={() => setIsUpgradeModalOpen(false)}
            className="text-slate-400 hover:text-white text-sm p-1.5 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success Banner if activated */}
        {successPlan && (
          <div className="mx-6 mt-4 p-3.5 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-bold flex items-center justify-center gap-2 animate-in fade-in">
            <Check className="w-4 h-4" />
            {successPlan} ativado com sucesso em sua conta!
          </div>
        )}

        {/* Plans Grid */}
        <div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Plan 1: Gratuito */}
          <div className="p-5 glass-card border border-white/10 rounded-2xl flex flex-col justify-between space-y-5">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-bold text-slate-200 text-base">Plano Gratuito</h4>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-white/10 text-slate-300 rounded-md border border-white/10">Atual</span>
              </div>
              <p className="text-xs text-slate-400">Para quem está dando os primeiros passos na prospecção.</p>
              
              <div className="mt-4 mb-5">
                <span className="text-3xl font-extrabold text-white">R$ 0</span>
                <span className="text-xs text-slate-400">/mês</span>
              </div>

              <ul className="space-y-2.5 text-xs text-slate-300">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>40 leads por mês</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>5 categorias disponíveis</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Funil de Vendas CRM</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Exportação CSV básica</span>
                </li>
              </ul>
            </div>

            <button
              disabled
              className="w-full py-2 px-4 rounded-xl bg-white/5 border border-white/10 text-slate-400 font-semibold text-xs cursor-default"
            >
              Plano Ativo
            </button>
          </div>

          {/* Plan 2: Pro (Featured) */}
          <div className="p-6 glass-panel border-2 border-indigo-500/80 rounded-2xl flex flex-col justify-between space-y-5 shadow-2xl relative bg-indigo-500/10">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-bold text-[11px] rounded-full shadow-lg border border-white/20">
              MAIS POPULAR
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-bold text-white text-base">Plano Pro</h4>
                <Crown className="w-4 h-4 text-amber-300" />
              </div>
              <p className="text-xs text-slate-300">Para profissionais autônomos e closers que buscam alta escala.</p>
              
              <div className="mt-4 mb-5">
                <span className="text-3xl font-black text-white">R$ 97</span>
                <span className="text-xs text-slate-300">/mês</span>
              </div>

              <ul className="space-y-2.5 text-xs text-slate-200">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-sky-300 shrink-0" />
                  <span><strong>500 leads</strong> por mês</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-sky-300 shrink-0" />
                  <span>Todas as 56 categorias de negócios</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-sky-300 shrink-0" />
                  <span>Scripts de WhatsApp com IA</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-sky-300 shrink-0" />
                  <span>Gerador de sites ilimitado</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => handleSelectPlan('Plano Pro')}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-bold text-xs shadow-lg shadow-indigo-500/30 border border-white/20 transition-all active:scale-95"
            >
              Assinar Plano Pro
            </button>
          </div>

          {/* Plan 3: Agência */}
          <div className="p-5 glass-card border border-white/10 rounded-2xl flex flex-col justify-between space-y-5">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-bold text-slate-200 text-base">Plano Agência</h4>
                <Sparkles className="w-4 h-4 text-purple-300" />
              </div>
              <p className="text-xs text-slate-400">Para agências de marketing e equipes de pré-vendas (SDRs).</p>
              
              <div className="mt-4 mb-5">
                <span className="text-3xl font-extrabold text-white">R$ 247</span>
                <span className="text-xs text-slate-400">/mês</span>
              </div>

              <ul className="space-y-2.5 text-xs text-slate-300">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-purple-400 shrink-0" />
                  <span><strong>Leads Ilimitados</strong></span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-purple-400 shrink-0" />
                  <span>Busca no exterior (Portugal, EUA)</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-purple-400 shrink-0" />
                  <span>Multi-usuários & SDRs</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-purple-400 shrink-0" />
                  <span>API de exportação e Webhooks</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => handleSelectPlan('Plano Agência')}
              className="w-full py-2 px-4 rounded-xl glass-card hover:bg-white/10 text-slate-200 font-bold text-xs border border-white/15 transition-all active:scale-95"
            >
              Assinar Agência
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
