import React, { useState } from 'react';
import { 
  ShieldCheck, 
  FileText, 
  Check, 
  Printer, 
  Sparkles, 
  Download, 
  CheckCircle2, 
  DollarSign, 
  Building2, 
  Calendar,
  Send,
  UserCheck
} from 'lucide-react';
import { useCrm } from '../context/CrmContext';
import { ResponsiveSelect } from './common/ResponsiveSelect';

export const ContratosView: React.FC = () => {
  const { 
    leads, 
    setupConfig, 
    generateContractForLead, 
    signContractForLead, 
    setActivePage 
  } = useCrm();

  const [selectedLeadId, setSelectedLeadId] = useState<string>(leads[0]?.id || '');
  const [signedDoc, setSignedDoc] = useState(false);

  const currentLead = leads.find(l => l.id === selectedLeadId) || leads[0];

  const handleSign = () => {
    if (!currentLead) return;
    signContractForLead(currentLead.id);
    setSignedDoc(true);
    setTimeout(() => setSignedDoc(false), 3000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-6 rounded-3xl border border-white/10">
        <div>
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>Ciclo Passo 7 · Minutas Jurídicas & Contratos MRR</span>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Gerador de Contrato e Prestação de Serviços</h2>
          <p className="text-xs text-slate-300/80 mt-1 max-w-2xl">
            Formalize o desenvolvimento do site com cláusulas de garantia, entrega e faturamento recorrente mensal (MRR).
          </p>
        </div>

        {/* Lead Selector & Print */}
        <div className="flex flex-wrap items-center gap-3">
          <ResponsiveSelect
            value={selectedLeadId}
            onChange={(val) => setSelectedLeadId(val)}
            options={leads.map(lead => ({
              value: lead.id,
              label: `${lead.name} (${lead.category})`
            }))}
            className="w-full sm:w-auto min-w-0 sm:min-w-[260px]"
            buttonClassName="py-2.5 font-semibold"
          />

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-2.5 glass-panel hover:bg-white/10 text-slate-200 hover:text-white font-semibold text-xs rounded-xl border border-white/15 transition-all"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir / PDF</span>
          </button>
        </div>
      </div>

      {currentLead && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Details & Financial Terms (4 cols) */}
          <div className="lg:col-span-4 space-y-5">
            {/* Status Card */}
            <div className="glass-card p-5 rounded-3xl border border-white/10 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Status do Contrato</span>
                <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full border ${
                  currentLead.contract?.contractStatus === 'assinado' 
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' 
                    : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                }`}>
                  {currentLead.contract?.contractStatus === 'assinado' ? '✓ Assinado e Ativo' : 'Aguardando Assinatura'}
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-slate-300">
                  <span>Número do Contrato:</span>
                  <span className="font-mono text-white font-bold">{currentLead.contract?.contractNumber || 'CTR-2026-0881'}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Taxa de Setup / Criação:</span>
                  <span className="font-bold text-white">R$ {currentLead.dealValue || 1800},00</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Manutenção Mensal (MRR):</span>
                  <span className="font-extrabold text-emerald-400">R$ {currentLead.mrrValue || 197},00/mês</span>
                </div>
              </div>
            </div>

            {/* Signature Actions */}
            <div className="glass-card p-5 rounded-3xl border border-white/10 space-y-3">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">Assinatura Eletrônica</span>

              {currentLead.contract?.contractStatus !== 'assinado' ? (
                <button
                  onClick={handleSign}
                  className="w-full py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/25 border border-white/20 transition-all flex items-center justify-center gap-2"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>Confirmar Assinatura do Cliente</span>
                </button>
              ) : (
                <div className="p-3 glass-panel rounded-2xl border border-emerald-500/30 bg-emerald-500/10 text-center space-y-1">
                  <span className="text-xs font-bold text-emerald-300 flex items-center justify-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    Contrato Formalizado e Ativo!
                  </span>
                  <p className="text-[10px] text-emerald-200/80">Recorrência mensal de R$ {currentLead.mrrValue || 197}/mês contabilizada.</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Document Preview (8 cols) */}
          <div className="lg:col-span-8">
            <div className="glass-card p-8 md:p-10 rounded-3xl border border-white/15 bg-slate-900/90 shadow-2xl space-y-6 text-slate-200 text-xs leading-relaxed print:bg-white print:text-black print:p-4">
              {/* Document Header */}
              <div className="text-center space-y-1 pb-6 border-b border-white/10">
                <h3 className="text-lg font-bold text-white uppercase tracking-wider">
                  Contrato de Prestação de Serviços de Desenvolvimento Web & Manutenção Digital
                </h3>
                <p className="text-[11px] text-slate-400 font-mono">
                  Documento Ref: {currentLead.contract?.contractNumber || 'CTR-2026-0881'} · Emitido em Belo Horizonte/MG
                </p>
              </div>

              {/* Partes Contratantes */}
              <div className="space-y-3">
                <h4 className="font-bold text-white text-xs uppercase text-indigo-400">1. Das Partes Contratantes</h4>
                <p>
                  <strong>CONTRATADA:</strong> Agência Digital Prospector / {setupConfig.senderName}, com sede em Belo Horizonte/MG, e-mail {setupConfig.senderEmail}.
                </p>
                <p>
                  <strong>CONTRATANTE:</strong> <strong>{currentLead.name}</strong>, estabelecida no endereço {currentLead.address}, {currentLead.city} - {currentLead.state}, telefone {currentLead.phone}.
                </p>
              </div>

              {/* Objeto */}
              <div className="space-y-2">
                <h4 className="font-bold text-white text-xs uppercase text-indigo-400">2. Do Objeto do Contrato</h4>
                <p>
                  O presente instrumento tem por objeto o desenvolvimento de uma Landing Page / Site Institucional de alta conversão, responsivo para dispositivos móveis, integrado com botão direto para agendamento no WhatsApp e hospedagem de alta performance com certificado SSL.
                </p>
              </div>

              {/* Valores e Recorrência */}
              <div className="space-y-2">
                <h4 className="font-bold text-white text-xs uppercase text-indigo-400">3. Dos Valores, Setup e Manutenção Mensal</h4>
                <p>
                  Pela execução do projeto e licenciamento contínuo, a CONTRATANTE pagará à CONTRATADA:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-slate-300">
                  <li>
                    <strong>Valor de Criação e Configuração Inicial (Setup):</strong> R$ {currentLead.dealValue || 1800},00 (um mil e oitocentos reais).
                  </li>
                  <li>
                    <strong>Mensalidade de Hospedagem, Suporte e Servidor HostGator (MRR):</strong> R$ {currentLead.mrrValue || 197},00/mês.
                  </li>
                </ul>
              </div>

              {/* Assinaturas */}
              <div className="pt-8 border-t border-white/10 grid grid-cols-2 gap-8 text-center">
                <div className="space-y-1">
                  <div className="border-b border-white/20 pb-1 font-semibold text-white">
                    {setupConfig.senderName}
                  </div>
                  <span className="text-[10px] text-slate-400">CONTRATADA (Agência Prospector)</span>
                </div>

                <div className="space-y-1">
                  <div className="border-b border-white/20 pb-1 font-semibold text-white">
                    {currentLead.name}
                  </div>
                  <span className="text-[10px] text-slate-400">CONTRATANTE (Representante Legal)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
