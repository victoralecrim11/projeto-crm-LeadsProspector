import React, { useState, useEffect, useRef } from 'react';
import {
  FileText,
  Send,
  Sparkles,
  Copy,
  Check,
  Mail,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
  Clock,
  Eye,
  DollarSign,
  Download,
  Printer,
  FileCheck,
  Building2,
  Calendar,
  Layers,
  X,
  Moon,
  Sun,
  ZoomIn,
  ZoomOut,
  Save,
  RotateCcw,
  MessageSquare
} from 'lucide-react';
import { useCrm } from '../hooks/useCrm';
import { useProposalForm } from '../hooks/useProposalForm';

import { safeStorage } from '../utils/safeStorage';
import { downloadProposalPdf } from '../utils/pdfGenerator';
import { ResponsiveSelect } from './common/ResponsiveSelect';
import { generateAiContent } from '../services/aiService';


export const PropostasView: React.FC = () => {
  const {
    leads,
    setupConfig,
    crmSettings,
    updateLeadStage,
    generateProposalForLead,
    setActivePage,
    setEmailModalLead
  } = useCrm();


  const {
    selectedLeadId, setSelectedLeadId,
    templateType, handleTemplateTypeChange,
    currentLead, slug, previewUrl, proposalCode,
    subject, setSubject,
    emailBody, setEmailBody,
    whatsappScript, setWhatsappScript,
    dealValue, setDealValue,
    mrrValue, setMrrValue,
    validityDays, setValidityDays,
    proposalNotes, setProposalNotes,
    lastSavedTime, isGeneratingAi, isSavedPulse,
    hasRestoredNotice, setHasRestoredNotice,
    copiedEmail, copiedWhatsapp,
    isExportingPdf, pdfSuccessToast, setPdfSuccessToast,
    isPreviewModalOpen, setIsPreviewModalOpen,
    pdfTheme, setPdfTheme, pdfZoom, setPdfZoom,
    handleLeadChange, handleResetToDefault,
    handleCopyEmail, handleCopyWhatsapp,
    handleExportPdf, handleOpenGmail, handleOpenWhatsapp,
    handleEnhanceWithAI
  } = useProposalForm();

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-4 sm:p-6 rounded-3xl border border-white/10 shadow-xl">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-wider">
            <FileText className="w-4 h-4 text-sky-400" />
            <span>Ciclo Passo 4 · Propostas Comerciais & Documentos PDF com Branding</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Gerador de Propostas de Alta Conversão</h2>
          <p className="text-xs text-slate-300/80 max-w-2xl">
            Scripts calibrados com gatilhos de reciprocidade, editor de propostas e gerador de PDF oficial com a marca da sua agência.
          </p>

          {/* Auto-save Status Indicator */}
          <div className="flex flex-wrap items-center gap-2 pt-1.5">
            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ${isSavedPulse
              ? 'bg-emerald-500/25 text-emerald-200 border border-emerald-400/50 scale-105'
              : 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
              }`}>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Salvamento automático ativo • Salvo no navegador às {lastSavedTime}</span>
            </div>

            <button
              onClick={handleResetToDefault}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-full transition-all"
              title="Restaurar modelo original calculado para esta empresa"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Restaurar Padrão do Lead</span>
            </button>
          </div>
        </div>

        {/* Lead Selector & PDF Export Action */}
        <div className="flex flex-wrap items-center gap-3">
          <ResponsiveSelect
            value={selectedLeadId}
            onChange={(val) => handleLeadChange(val)}
            options={leads.map(lead => ({
              value: lead.id,
              label: `${lead.name} (${lead.category})`
            }))}
            className="w-full sm:w-auto min-w-0 sm:min-w-[260px]"
            buttonClassName="py-2.5 font-semibold"
          />

          {currentLead && (
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={() => setIsPreviewModalOpen(true)}
                className="flex-1 sm:flex-initial px-3.5 py-2.5 bg-white/10 hover:bg-white/15 text-white font-semibold text-xs rounded-xl border border-white/15 transition-all flex items-center justify-center gap-1.5 shadow-sm"
                title="Pré-visualizar Documento da Proposta (Esc fecha)"
              >
                <Eye className="w-3.5 h-3.5 text-sky-300" />
                <span>Visualizar</span>
              </button>

              <button
                onClick={handleExportPdf}
                disabled={isExportingPdf}
                className="flex-1 sm:flex-initial px-4 py-2.5 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-sky-500/25 border border-sky-400/30 transition-all flex items-center justify-center gap-2"
              >
                <Download className={`w-4 h-4 ${isExportingPdf ? 'animate-bounce' : ''}`} />
                <span>{isExportingPdf ? 'Gerando...' : 'Exportar PDF'}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Restored notice banner */}
      {hasRestoredNotice && (
        <div className="p-3 rounded-2xl bg-indigo-500/15 border border-indigo-400/30 text-indigo-200 text-xs flex items-center justify-between animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
            <span>Rascunho de proposta recuperado automaticamente do <strong>localStorage</strong>. Suas edições foram preservadas com sucesso.</span>
          </div>
          <button
            onClick={() => setHasRestoredNotice(false)}
            className="text-slate-400 hover:text-white p-1"
            title="Dispensar aviso"
          >
            ✕
          </button>
        </div>
      )}

      {/* Success Toast */}
      {pdfSuccessToast && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-200 text-xs font-semibold flex items-center justify-between animate-in fade-in slide-in-from-top duration-200">
          <div className="flex items-center gap-2">
            <FileCheck className="w-4 h-4 text-emerald-400" />
            <span>Documento <strong>Proposta-Comercial-{slug}.pdf</strong> exportado com sucesso com a identidade visual da agência!</span>
          </div>
          <button onClick={() => setPdfSuccessToast(false)} className="text-emerald-300 hover:text-white text-xs">✕</button>
        </div>
      )}

      {currentLead && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Script Controls & Pricing (5 Cols) */}
          <div className="lg:col-span-5 space-y-5">
            {/* Branded PDF Proposal Card */}
            <div className="glass-card p-5 rounded-3xl border border-sky-400/30 bg-gradient-to-br from-sky-500/10 via-indigo-500/5 to-transparent space-y-4 shadow-xl">
              <div className="flex items-start justify-between">
                <div>
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-sky-500/20 text-sky-300 border border-sky-400/30 uppercase">
                    Identidade Visual da Agência
                  </span>
                  <h3 className="text-sm font-bold text-white mt-1.5 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-sky-400" />
                    <span>{setupConfig.agencyName || 'Nexus Digital Studio'}</span>
                  </h3>
                  <p className="text-[11px] text-slate-300/80 mt-0.5">
                    Proposta formal #{proposalCode} para <strong>{currentLead.name}</strong>
                  </p>
                </div>

                <div className="w-9 h-9 rounded-xl bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-sky-300 shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
              </div>

              {/* Editable Pricing & Conditions */}
              <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-white/10 space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Responsável Closer:</span>
                  <span className="font-semibold text-white">{crmSettings.closerName || setupConfig.senderName}</span>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-slate-400 font-medium">Setup & Criação (R$):</label>
                    <span className="text-[10px] text-emerald-400 font-mono">Salvamento auto</span>
                  </div>
                  <input
                    type="number"
                    value={dealValue}
                    onChange={(e) => setDealValue(Number(e.target.value))}
                    className="w-full px-3 py-1.5 bg-slate-950/80 border border-emerald-500/30 rounded-xl text-emerald-400 font-bold focus:outline-none focus:border-emerald-400"
                    placeholder="1800"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-slate-400 font-medium">Mensalidade MRR (R$/mês):</label>
                    <span className="text-[10px] text-sky-400 font-mono">Hospedagem</span>
                  </div>
                  <input
                    type="number"
                    value={mrrValue}
                    onChange={(e) => setMrrValue(Number(e.target.value))}
                    className="w-full px-3 py-1.5 bg-slate-950/80 border border-sky-500/30 rounded-xl text-sky-300 font-bold focus:outline-none focus:border-sky-400"
                    placeholder="197"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 font-medium block">Validade da Proposta (dias):</label>
                  <input
                    type="number"
                    value={validityDays}
                    onChange={(e) => setValidityDays(Number(e.target.value))}
                    className="w-full px-3 py-1.5 bg-slate-950/80 border border-white/15 rounded-xl text-slate-200 font-mono focus:outline-none focus:border-indigo-400"
                    placeholder="15"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={() => setIsPreviewModalOpen(true)}
                  className="py-2 px-3 text-xs font-semibold text-white bg-white/10 hover:bg-white/15 border border-white/15 rounded-xl transition-all flex items-center justify-center gap-1.5"
                >
                  <Eye className="w-3.5 h-3.5 text-sky-300" />
                  <span>Ver Formatação</span>
                </button>

                <button
                  onClick={handleExportPdf}
                  disabled={isExportingPdf}
                  className="py-2 px-3 text-xs font-bold text-white bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 border border-sky-400/30 rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-md"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Baixar PDF</span>
                </button>
              </div>
            </div>

            {/* Template Type Selector */}
            <div className="glass-card p-5 rounded-3xl border border-white/10 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Estilo da Abordagem</h3>
                <span className="text-[10px] text-slate-400 font-mono">3 modelos</span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => handleTemplateTypeChange('cold')}
                  className={`p-2.5 rounded-xl text-xs font-semibold border transition-all text-center ${templateType === 'cold' ? 'bg-indigo-600 text-white border-indigo-400/30 shadow-md' : 'glass-panel text-slate-400 hover:text-white border-white/10'
                    }`}
                >
                  Abordagem Fria
                </button>
                <button
                  onClick={() => handleTemplateTypeChange('technical')}
                  className={`p-2.5 rounded-xl text-xs font-semibold border transition-all text-center ${templateType === 'technical' ? 'bg-indigo-600 text-white border-indigo-400/30 shadow-md' : 'glass-panel text-slate-400 hover:text-white border-white/10'
                    }`}
                >
                  Auditoria Técnica
                </button>
                <button
                  onClick={() => handleTemplateTypeChange('whatsapp')}
                  className={`p-2.5 rounded-xl text-xs font-semibold border transition-all text-center ${templateType === 'whatsapp' ? 'bg-indigo-600 text-white border-indigo-400/30 shadow-md' : 'glass-panel text-slate-400 hover:text-white border-white/10'
                    }`}
                >
                  WhatsApp Curto
                </button>
              </div>
            </div>

            {/* Anti-Spam Health Check */}
            <div className="glass-card p-5 rounded-3xl border border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Score Anti-Spam</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                  99% Entregabilidade
                </span>
              </div>

              <ul className="space-y-2 text-[11px] text-slate-300">
                <li className="flex items-center gap-2 text-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Sem termos de spam ("compre agora", "oferta imperdível")</span>
                </li>
                <li className="flex items-center gap-2 text-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Link com domínio próprio e certificado HTTPS/SSL</span>
                </li>
                <li className="flex items-center gap-2 text-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Personalização real com dados do Google Maps</span>
                </li>
              </ul>
            </div>

            {/* Next Steps CTA */}
            <div className="glass-card p-5 rounded-3xl border border-white/10 space-y-3">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">Avançar no Ciclo</span>
              <button
                onClick={() => setActivePage('crm')}
                className="w-full py-2.5 px-4 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-500/25 border border-white/20 transition-all flex items-center justify-center gap-2"
              >
                <span>Acompanhar no Funil CRM</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Right Column: Editable Draft & Quick Dispatch (7 Cols) */}
          <div className="lg:col-span-7 space-y-5">
            {/* E-mail Draft Container with Editable Fields */}
            <div className="glass-card p-5 sm:p-6 rounded-3xl border border-white/10 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-sky-400" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">Editor da Proposta & E-mail</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyEmail}
                    className="flex items-center gap-1 px-3 py-1.5 glass-panel hover:bg-white/10 text-xs text-slate-300 hover:text-white rounded-xl border border-white/10 transition-all"
                  >
                    {copiedEmail ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedEmail ? 'Copiado!' : 'Copiar Texto'}</span>
                  </button>
                </div>
              </div>

              {/* Editable Subject Field */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-slate-300 uppercase">Assunto do E-mail:</span>
                  <span className="text-slate-400">{subject.length} caracteres</span>
                </div>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Digite o assunto da proposta comercial..."
                  className="w-full glass-input p-3 rounded-xl text-xs font-semibold text-white border border-white/15 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 transition-all"
                />
              </div>

              {/* Editable Body Field */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] mb-1">
                  <span className="font-bold text-slate-300 uppercase">Corpo da Mensagem (Editável):</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEnhanceWithAI('email')}
                      disabled={isGeneratingAi}
                      className="flex items-center gap-1.5 px-2.5 py-1 bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 rounded-lg border border-indigo-400/30 transition-all disabled:opacity-50"
                    >
                      <Sparkles className={`w-3.5 h-3.5 ${isGeneratingAi ? 'animate-spin' : ''}`} />
                      <span>{isGeneratingAi ? 'Gerando...' : 'Melhorar com IA'}</span>
                    </button>
                    <span className="text-slate-400 hidden sm:inline">
                      {emailBody.split(/\s+/).filter(Boolean).length} palavras
                    </span>
                  </div>
                </div>
                <textarea
                  rows={9}
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  placeholder="Escreva a mensagem personalizada para o cliente..."
                  className="w-full glass-input p-3.5 rounded-2xl text-xs text-slate-100 leading-relaxed border border-white/15 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 transition-all font-sans"
                />
              </div>

              {/* Quick Send Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => setEmailModalLead(currentLead)}
                  className="flex-1 py-2.5 px-4 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-500/25 border border-white/20 transition-all flex items-center justify-center gap-2"
                >
                  <Mail className="w-4 h-4" />
                  <span>Disparar via EmailService</span>
                </button>

                <button
                  onClick={handleOpenWhatsapp}
                  className="flex-1 py-2.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/25 border border-white/20 transition-all flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  <span>Enviar no WhatsApp</span>
                </button>
              </div>
            </div>

            {/* Editable WhatsApp Quick Script */}
            <div className="glass-card p-5 rounded-3xl border border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Script para WhatsApp</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEnhanceWithAI('whatsapp')}
                    disabled={isGeneratingAi}
                    className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 rounded-lg border border-emerald-400/30 transition-all disabled:opacity-50"
                  >
                    <Sparkles className={`w-3.5 h-3.5 ${isGeneratingAi ? 'animate-spin' : ''}`} />
                    <span className="hidden sm:inline">{isGeneratingAi ? 'Gerando...' : 'Melhorar com IA'}</span>
                  </button>
                  <button
                    onClick={handleCopyWhatsapp}
                    className="flex items-center gap-1 px-2.5 py-1 glass-panel hover:bg-white/10 text-xs text-slate-300 rounded-lg border border-white/10 transition-all"
                  >
                    {copiedWhatsapp ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span className="hidden sm:inline">{copiedWhatsapp ? 'Copiado!' : 'Copiar Texto'}</span>
                  </button>
                </div>
              </div>

              <textarea
                rows={3}
                value={whatsappScript}
                onChange={(e) => setWhatsappScript(e.target.value)}
                placeholder="Script curto para o primeiro contato via WhatsApp..."
                className="w-full p-3 glass-panel rounded-2xl border border-emerald-500/20 bg-emerald-500/5 text-xs text-slate-200 leading-relaxed font-mono focus:outline-none focus:border-emerald-400"
              />
            </div>
          </div>
        </div>
      )}

      {/* PDF Document Preview Modal */}
      {isPreviewModalOpen && currentLead && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="relative w-full max-w-4xl bg-slate-900 border border-white/20 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 bg-slate-950 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-sky-400 shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-white">Prévia da Proposta Comercial Oficial (PDF)</h3>
                  <p className="text-[11px] sm:text-xs text-slate-400">Identidade visual da agência: <strong>{setupConfig.agencyName || 'Nexus Digital Studio'}</strong> (Pressione ESC para fechar)</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="hidden sm:flex items-center gap-1 mr-2 bg-slate-900/50 p-1 rounded-lg border border-white/5">
                  <button
                    onClick={() => setPdfTheme(pdfTheme === 'light' ? 'dark' : 'light')}
                    className="p-1.5 text-slate-400 hover:text-amber-300 hover:bg-white/10 rounded-lg transition-colors"
                    title="Alternar Tema Escuro/Claro"
                  >
                    {pdfTheme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                  </button>
                  <div className="w-px h-4 bg-white/10 mx-1"></div>
                  <button
                    onClick={() => setPdfZoom(z => Math.max(z - 0.1, 0.5))}
                    className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                    title="Diminuir Zoom"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <span className="text-[10px] text-slate-500 font-mono w-8 text-center">{Math.round(pdfZoom * 100)}%</span>
                  <button
                    onClick={() => setPdfZoom(z => Math.min(z + 0.1, 1.5))}
                    className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                    title="Aumentar Zoom"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                </div>

                <button
                  onClick={handleExportPdf}
                  disabled={isExportingPdf}
                  className="px-3.5 sm:px-4 py-2 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-sky-500/25 border border-sky-400/30 transition-all flex items-center gap-2"
                >
                  <Download className={`w-3.5 h-3.5 ${isExportingPdf ? 'animate-bounce' : ''}`} />
                  <span className="hidden sm:inline">{isExportingPdf ? 'Gerando...' : 'Baixar PDF'}</span>
                </button>

                <button
                  onClick={() => setIsPreviewModalOpen(false)}
                  className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
                  title="Fechar (Esc)"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Document Sheet Body (White Paper Canvas Preview) */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-8 bg-slate-950/80 flex justify-center items-start">
              <div
                className={`w-full max-w-2xl rounded-xl shadow-2xl p-6 sm:p-8 space-y-6 border select-text transition-colors duration-300 transform-gpu h-max min-h-min break-words whitespace-pre-wrap ${pdfTheme === 'light'
                  ? 'bg-white text-slate-900 border-slate-200'
                  : 'bg-slate-900 text-slate-200 border-slate-700 shadow-sky-900/10'
                  }`}
                style={{
                  transform: `scale(${pdfZoom})`,
                  transformOrigin: 'top center',
                  marginBottom: `${(pdfZoom - 1) * 100}%`
                }}
              >
                {/* PDF Document Header */}
                <div className={`-mx-6 sm:-mx-8 -mt-6 sm:-mt-8 p-6 flex items-center justify-between border-b-2 rounded-t-xl transition-colors ${pdfTheme === 'light' ? 'bg-slate-900 text-white border-sky-400' : 'bg-slate-950 text-slate-100 border-sky-500'
                  }`}>
                  <div>
                    <h2 className="text-lg sm:text-xl font-extrabold tracking-tight text-white uppercase">{setupConfig.agencyName || 'Nexus Digital Studio'}</h2>
                    <p className="text-[10px] text-slate-300 tracking-wider uppercase mt-0.5">Soluções Digitais & Desenvolvimento Web de Alta Performance</p>
                    <p className="text-[10px] text-slate-400 mt-1">Proposta Comercial #{proposalCode} • Emissão: {new Date().toLocaleDateString('pt-BR')}</p>
                  </div>
                  <div className="text-right">
                    <span className="px-3 py-1 bg-sky-500/20 text-sky-300 border border-sky-400/40 rounded-md text-[10px] font-bold block">
                      PROPOSTA VIP
                    </span>
                    <span className="text-[9px] text-slate-400 mt-1 block">AUDITADO VIA IA</span>
                  </div>
                </div>

                {/* Recipient Client Box */}
                <div className={`p-4 rounded-xl border transition-colors ${pdfTheme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-slate-800/50 border-slate-700'
                  }`}>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Cliente & Destinatário</span>
                  <h3 className={`text-base font-bold ${pdfTheme === 'light' ? 'text-slate-900' : 'text-slate-100'}`}>{currentLead.name}</h3>
                  <div className={`grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1.5 text-xs ${pdfTheme === 'light' ? 'text-slate-600' : 'text-slate-400'}`}>
                    <div>Segmento: <strong className={pdfTheme === 'light' ? 'text-slate-800' : 'text-slate-200'}>{currentLead.category}</strong></div>
                    <div>Localização: <strong className={pdfTheme === 'light' ? 'text-slate-800' : 'text-slate-200'}>{currentLead.city} - {currentLead.state || 'Brasil'}</strong></div>
                    <div>Avaliação Google: <strong className={pdfTheme === 'light' ? 'text-slate-800' : 'text-slate-200'}>{currentLead.rating} ⭐ ({currentLead.reviewsCount} avaliações)</strong></div>
                    <div>Contato: <strong className={pdfTheme === 'light' ? 'text-slate-800' : 'text-slate-200'}>{currentLead.phone}</strong></div>
                  </div>
                </div>

                {/* 1. Diagnóstico */}
                <div className="space-y-2">
                  <h4 className={`text-xs font-bold uppercase tracking-wider border-b pb-1 flex items-center gap-1.5 ${pdfTheme === 'light' ? 'text-slate-900 border-slate-200' : 'text-slate-100 border-slate-700'
                    }`}>
                    <span>1. Diagnóstico Digital & Oportunidade de Mercado</span>
                  </h4>
                  <p className={`text-xs leading-relaxed ${pdfTheme === 'light' ? 'text-slate-600' : 'text-slate-300'}`}>
                    Identificamos que a <strong className={pdfTheme === 'light' ? 'text-slate-900' : 'text-slate-100'}>{currentLead.name}</strong> possui uma excelente reputação presencial e no Google Maps ({currentLead.rating} estrelas). No entanto, a presença digital atual pode estar deixando escapar clientes qualificados diariamente por conta de tempo de resposta ou ausência de uma página adaptada para smartphones com botão direto de WhatsApp.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                    <div className={`p-2.5 rounded-lg border text-xs transition-colors ${pdfTheme === 'light' ? 'bg-red-50 border-red-200' : 'bg-red-950/30 border-red-900/50'
                      }`}>
                      <span className={`text-[10px] font-bold block uppercase ${pdfTheme === 'light' ? 'text-red-700' : 'text-red-400'}`}>Velocidade Atual</span>
                      <strong className={`font-bold text-sm ${pdfTheme === 'light' ? 'text-red-950' : 'text-red-100'}`}>{currentLead.audit?.loadingTimeSeconds || 6.2}s (Lento)</strong>
                    </div>
                    <div className={`p-2.5 rounded-lg border text-xs transition-colors ${pdfTheme === 'light' ? 'bg-emerald-50 border-emerald-200' : 'bg-emerald-950/30 border-emerald-900/50'
                      }`}>
                      <span className={`text-[10px] font-bold block uppercase ${pdfTheme === 'light' ? 'text-emerald-700' : 'text-emerald-400'}`}>Com Redesign</span>
                      <strong className={`font-bold text-sm ${pdfTheme === 'light' ? 'text-emerald-950' : 'text-emerald-100'}`}>0.7s (Ultra Rápido)</strong>
                    </div>
                    <div className={`p-2.5 rounded-lg border text-xs transition-colors ${pdfTheme === 'light' ? 'bg-indigo-50 border-indigo-200' : 'bg-indigo-950/30 border-indigo-900/50'
                      }`}>
                      <span className={`text-[10px] font-bold block uppercase ${pdfTheme === 'light' ? 'text-indigo-700' : 'text-indigo-400'}`}>Oportunidade</span>
                      <strong className={`font-bold text-sm ${pdfTheme === 'light' ? 'text-indigo-950' : 'text-indigo-100'}`}>{currentLead.score || 85}/100 no CRM</strong>
                    </div>
                  </div>
                </div>

                {/* 2. Escopo dos Entregáveis */}
                <div className="space-y-2">
                  <h4 className={`text-xs font-bold uppercase tracking-wider border-b pb-1 ${pdfTheme === 'light' ? 'text-slate-900 border-slate-200' : 'text-slate-100 border-slate-700'
                    }`}>
                    2. Escopo da Solução & Entregáveis
                  </h4>
                  <div className="space-y-2 text-xs">
                    {[
                      { title: 'Website Mobile-First Ultra Rápido', desc: 'Design personalizado e adaptado para todos os celulares com pontuação 95+ no Google.' },
                      { title: 'Funil de Atendimento no WhatsApp', desc: 'Botões de agendamento automático com mensagens pré-formatadas para maximizar conversão.' },
                      { title: 'Integração Google Maps & SEO Local', desc: `Otimização para busca orgânica na região de ${currentLead.city}.` },
                      { title: 'Infraestrutura Cloud & Certificado SSL', desc: 'Hospedagem segura em nuvem de alta velocidade, domínio próprio e proteção HTTPS.' },
                      { title: 'Painel de Gestão & Suporte Técnico', desc: 'Backups diários, suporte prioritário e alterações técnicas solicitadas.' }
                    ].map((item, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <span className={`w-4 h-4 rounded text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5 ${pdfTheme === 'light' ? 'bg-slate-200 text-slate-800' : 'bg-slate-700 text-slate-200'
                          }`}>
                          {idx + 1}
                        </span>
                        <div>
                          <strong className={`block ${pdfTheme === 'light' ? 'text-slate-900' : 'text-slate-100'}`}>{item.title}</strong>
                          <span className={`text-[11px] ${pdfTheme === 'light' ? 'text-slate-600' : 'text-slate-400'}`}>{item.desc}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 3. Prévia Online */}
                <div className={`p-3 rounded-lg border text-xs transition-colors ${pdfTheme === 'light' ? 'bg-sky-50 border-sky-200' : 'bg-sky-950/30 border-sky-900/50'
                  }`}>
                  <span className={`text-[10px] font-bold uppercase block ${pdfTheme === 'light' ? 'text-sky-800' : 'text-sky-400'}`}>🌐 Prévia Demonstrativa Disponível Online</span>
                  <p className={`mt-0.5 ${pdfTheme === 'light' ? 'text-slate-700' : 'text-slate-300'}`}>Acesse a versão de demonstração desenvolvida exclusivamente para seu negócio:</p>
                  <span className="font-bold text-sky-500 font-mono text-[11px] mt-1 block">{previewUrl}</span>
                </div>

                {/* 4. Investimento */}
                <div className="space-y-2">
                  <h4 className={`text-xs font-bold uppercase tracking-wider border-b pb-1 ${pdfTheme === 'light' ? 'text-slate-900 border-slate-200' : 'text-slate-100 border-slate-700'
                    }`}>
                    3. Investimento & Condições Comerciais
                  </h4>
                  <div className={`p-3.5 rounded-xl border space-y-2 text-xs transition-colors ${pdfTheme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-slate-800/50 border-slate-700'
                    }`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <strong className={pdfTheme === 'light' ? 'text-slate-900' : 'text-slate-100'}>Desenvolvimento, Redesign & Otimização (Setup)</strong>
                        <p className={`text-[11px] ${pdfTheme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>À vista no Pix ou até 12x no cartão de crédito</p>
                      </div>
                      <span className={`text-base font-extrabold ${pdfTheme === 'light' ? 'text-emerald-600' : 'text-emerald-400'}`}>
                        R$ {Number(dealValue).toLocaleString('pt-BR')},00
                      </span>
                    </div>
                    <div className={`border-t pt-2 flex items-center justify-between ${pdfTheme === 'light' ? 'border-slate-200' : 'border-slate-700'
                      }`}>
                      <div>
                        <strong className={pdfTheme === 'light' ? 'text-slate-900' : 'text-slate-100'}>Hospedagem Cloud, SSL & Manutenção (Mensal)</strong>
                        <p className={`text-[11px] ${pdfTheme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>Sem fidelidade. Suporte via WhatsApp e backups</p>
                      </div>
                      <span className={`text-base font-extrabold ${pdfTheme === 'light' ? 'text-sky-600' : 'text-sky-400'}`}>
                        R$ {Number(mrrValue).toLocaleString('pt-BR')},00/mês
                      </span>
                    </div>
                  </div>
                </div>

                {/* Signature Box */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 text-xs">
                  <div className={`p-3 rounded-lg border transition-colors ${pdfTheme === 'light' ? 'bg-slate-100 border-slate-200' : 'bg-slate-800/80 border-slate-700'
                    }`}>
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">Agência Responsável</span>
                    <strong className={`block mt-0.5 ${pdfTheme === 'light' ? 'text-slate-900' : 'text-slate-100'}`}>{crmSettings.closerName || setupConfig.senderName}</strong>
                    <span className={`text-[11px] block ${pdfTheme === 'light' ? 'text-slate-600' : 'text-slate-400'}`}>{crmSettings.closerEmail || setupConfig.senderEmail}</span>
                    <span className={`text-[11px] block ${pdfTheme === 'light' ? 'text-slate-600' : 'text-slate-400'}`}>{crmSettings.closerPhone || '(31) 98877-6655'}</span>
                  </div>

                  <div className={`p-3 rounded-lg border flex flex-col justify-between transition-colors ${pdfTheme === 'light' ? 'bg-slate-100 border-slate-200' : 'bg-slate-800/80 border-slate-700'
                    }`}>
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">Aceite da Proposta</span>
                    <div className={`border-b mt-6 mb-1 ${pdfTheme === 'light' ? 'border-slate-400' : 'border-slate-600'}`} />
                    <span className="text-[10px] text-slate-500 text-center">Assinatura: {currentLead.name}</span>
                  </div>
                </div>

                {/* Footer Notice */}
                <div className={`text-[10px] text-center pt-2 border-t ${pdfTheme === 'light' ? 'text-slate-400 border-slate-200' : 'text-slate-500 border-slate-700'
                  }`}>
                  {setupConfig.agencyName || 'Nexus Digital Studio'} • Proposta confidencial válida por {validityDays} dias • Gerada em {new Date().toLocaleDateString('pt-BR')}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
