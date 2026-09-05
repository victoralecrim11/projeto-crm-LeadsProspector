import React, { useState, useEffect } from 'react';
import { 
  X, 
  Mail, 
  Send, 
  Sparkles, 
  ExternalLink, 
  CheckCircle2, 
  Clock, 
  Copy, 
  Check, 
  FileText,
  User,
  Building2,
  AlertCircle
} from 'lucide-react';
import { Lead } from '../types';
import { useCrm } from '../hooks/useCrm';
import { EmailService } from '../services/EmailService';

export const EmailDispatchModal: React.FC = () => {
  const { setupConfig, crmSettings, updateLeadStage, emailModalLead, setEmailModalLead } = useCrm();
  const templates = EmailService.getTemplates();

  const activeLead = emailModalLead;
  const isModalOpen = Boolean(emailModalLead);
  const handleClose = () => setEmailModalLead(null);
  
  const defaultTemplateId = 'tpl_quebra_gelo';

  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(defaultTemplateId);
  const [recipientEmail, setRecipientEmail] = useState<string>('');
  const [subject, setSubject] = useState<string>('');
  const [body, setBody] = useState<string>('');
  const [isSending, setIsSending] = useState<boolean>(false);
  const [sendSuccess, setSendSuccess] = useState<boolean>(false);
  const [isDrafting, setIsDrafting] = useState<boolean>(false);
  const [draftSuccess, setDraftSuccess] = useState<boolean>(false);
  const [isValidated, setIsValidated] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  // Update subject, body, and recipient when template or lead changes
  useEffect(() => {
    if (!activeLead) return;

    const selectedTemplate = templates.find(t => t.id === selectedTemplateId) || templates[0];
    if (selectedTemplate) {
      const generatedSubject = EmailService.replacePlaceholders(selectedTemplate.subject, activeLead, setupConfig, crmSettings);
      const generatedBody = EmailService.replacePlaceholders(selectedTemplate.body, activeLead, setupConfig, crmSettings);
      setSubject(generatedSubject);
      setBody(generatedBody);
    }
    if (activeLead.email) {
      setRecipientEmail(activeLead.email);
    } else {
      // Create a fallback domain email if missing
      const slug = activeLead.name ? activeLead.name.toLowerCase().replace(/[^a-z0-9]/g, '') : 'empresa';
      setRecipientEmail(`contato@${slug}.com.br`);
    }
    setIsValidated(false);
  }, [selectedTemplateId, activeLead, setupConfig, crmSettings]);

  if (!isModalOpen || !activeLead) return null;

  const lead = activeLead;
  const onClose = handleClose;

  const handleSend = async () => {
    if (!recipientEmail || !subject || !body || !isValidated) return;

    setIsSending(true);
    try {
      const res = await EmailService.sendEmail({
        toEmail: recipientEmail,
        toName: lead.name,
        leadId: lead.id,
        subject,
        body,
        templateId: selectedTemplateId,
        senderName: crmSettings.closerName,
        senderEmail: crmSettings.closerEmail,
      }, crmSettings);

      if (res.success) {
        setSendSuccess(true);
        // Advance lead to follow_up or proposta_enviada if earlier
        if (lead.crmStage === 'novo' || lead.crmStage === 'auditado' || lead.crmStage === 'redesenhado') {
          updateLeadStage(lead.id, 'follow_up');
        }
        setTimeout(() => {
          setSendSuccess(false);
          onClose();
        }, 1500);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSending(false);
    }
  };

  const handleValidateDraft = async () => {
    if (!recipientEmail || !subject || !body) return;

    setIsDrafting(true);
    try {
      const res = await EmailService.sendEmail({
        toEmail: recipientEmail,
        toName: lead.name,
        leadId: lead.id,
        subject,
        body,
        templateId: selectedTemplateId,
        senderName: crmSettings.closerName,
        senderEmail: crmSettings.closerEmail,
        isDraft: true,
      }, crmSettings);

      if (res.success) {
        setDraftSuccess(true);
        setTimeout(() => {
          setDraftSuccess(false);
          setIsValidated(true);
        }, 800);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsDrafting(false);
    }
  };

  const handleCopyBody = () => {
    navigator.clipboard.writeText(`${subject}\n\n${body}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const openInGmail = () => {
    const link = EmailService.generateGmailWebLink({
      toEmail: recipientEmail,
      toName: lead.name,
      subject,
      body,
    });
    window.open(link, '_blank');
  };

  const openInMailto = () => {
    const link = EmailService.generateMailtoLink({
      toEmail: recipientEmail,
      toName: lead.name,
      subject,
      body,
    });
    window.location.href = link;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-3xl glass-panel border border-white/20 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-white/10 bg-white/[0.03] gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 shrink-0">
              <Mail className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold text-white tracking-tight truncate">Enviar E-mail de Follow-up</h3>
                <span className="px-2 py-0.5 text-[10px] font-semibold bg-sky-500/20 text-sky-300 border border-sky-400/30 rounded-full shrink-0">
                  EmailService v2
                </span>
              </div>
              <p className="text-xs text-slate-400 truncate">
                Disparo personalizado com prévia e tokens de {lead.name}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Template Selector Pills */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              Selecione o Template Estratégico:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {templates.map((tpl) => {
                const isSelected = tpl.id === selectedTemplateId;
                return (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => setSelectedTemplateId(tpl.id)}
                    className={`text-left p-2.5 rounded-xl border text-xs transition-all ${
                      isSelected
                        ? 'bg-indigo-600/30 border-indigo-400/60 text-white font-medium shadow-md shadow-indigo-500/20'
                        : 'bg-white/[0.03] border-white/10 text-slate-300 hover:bg-white/[0.08] hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold truncate">{tpl.name}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400">
                      <span className="capitalize">{tpl.tone}</span>
                      <span>•</span>
                      <span>{tpl.recommendedDays === 0 ? 'Imediato' : `+${tpl.recommendedDays} dias`}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Recipient & Metadata Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-white/[0.02] border border-white/10 p-3 rounded-xl">
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">
                Destinatário (E-mail):
              </label>
              <input
                type="email"
                value={recipientEmail}
                onChange={(e) => {
                  setRecipientEmail(e.target.value);
                  setIsValidated(false);
                }}
                className="w-full px-3 py-1.5 text-xs bg-slate-900/60 border border-white/15 rounded-lg text-white focus:outline-none focus:border-indigo-400"
                placeholder="contato@empresa.com.br"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">
                Remetente (Closer Configurado):
              </label>
              <div className="flex items-center justify-between px-3 py-1.5 text-xs bg-slate-900/40 border border-white/10 rounded-lg text-slate-300">
                <span className="font-medium">{crmSettings.closerName} ({crmSettings.closerTitle})</span>
                <span className="text-[10px] text-indigo-300">{crmSettings.closerEmail}</span>
              </div>
            </div>
          </div>

          {/* Subject Field */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Assunto da Mensagem:
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => {
                setSubject(e.target.value);
                setIsValidated(false);
              }}
              className="w-full px-3.5 py-2 text-xs bg-slate-900/70 border border-white/15 rounded-xl text-white font-medium focus:outline-none focus:border-indigo-400"
            />
          </div>

          {/* Body Field with real-time token replacement */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-300">
                Corpo do E-mail (com link da demonstração ao vivo):
              </label>
              <button
                type="button"
                onClick={handleCopyBody}
                className="flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copiado!' : 'Copiar Texto'}</span>
              </button>
            </div>
            <textarea
              rows={8}
              value={body}
              onChange={(e) => {
                setBody(e.target.value);
                setIsValidated(false);
              }}
              className="w-full px-3.5 py-2.5 text-xs font-mono leading-relaxed bg-slate-900/80 border border-white/15 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-400 resize-none"
            />
          </div>

          {/* Preview banner info */}
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-sky-500/10 border border-sky-400/20 text-xs text-sky-200">
            <Sparkles className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-sky-300">Link de Prévia Integrado: </span>
              <span>
                https://{setupConfig.baseDomain}/clientes/{lead.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}
              </span>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Ao clicar, o lead vê a comparação Antes vs Depois e o botão de agendamento no seu WhatsApp.
              </p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 px-4 sm:px-6 py-4 border-t border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={openInGmail}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all"
              title="Abrir no Gmail Web"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Gmail</span>
            </button>
            <button
              type="button"
              onClick={openInMailto}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all"
              title="Abrir no cliente de e-mail padrão"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Mailto</span>
            </button>
          </div>

          <div className="flex items-center justify-end gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 text-xs font-medium text-slate-400 hover:text-white transition-colors"
            >
              Cancelar
            </button>

            {isValidated ? (
              <button
                type="button"
                disabled={isSending || sendSuccess}
                onClick={handleSend}
                className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2 text-xs font-semibold text-white rounded-xl shadow-lg transition-all ${
                  sendSuccess
                    ? 'bg-emerald-600 shadow-emerald-500/25'
                    : 'bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-500 hover:to-green-400 shadow-emerald-500/25 border border-white/15'
                }`}
              >
                {isSending ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Disparando...</span>
                  </>
                ) : sendSuccess ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-white" />
                    <span>Enviado!</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Enviar Definitivo</span>
                  </>
                )}
              </button>
            ) : (
              <button
                type="button"
                disabled={isDrafting || draftSuccess}
                onClick={handleValidateDraft}
                className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-5 py-2 text-xs font-semibold text-white rounded-xl shadow-lg transition-all ${
                  draftSuccess
                    ? 'bg-emerald-600 shadow-emerald-500/25'
                    : 'bg-gradient-to-r from-indigo-600 via-blue-600 to-sky-600 hover:from-indigo-500 hover:to-sky-500 shadow-indigo-500/25 border border-white/15'
                }`}
              >
                {isDrafting ? (
                  <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : draftSuccess ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                ) : (
                  <FileText className="w-3.5 h-3.5" />
                )}
                <span>{draftSuccess ? 'Rascunho Validado!' : 'Validar Rascunho'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
