import { useState, useEffect } from 'react';
import { safeStorage } from '../utils/safeStorage';
import { downloadProposalPdf } from '../utils/pdfGenerator';
import { generateAiContent } from '../services/aiService';
import { useCrm } from './useCrm';
import { Lead } from '../types';

const PROPOSAL_STORAGE_KEY = 'leadsite_crm_proposals_autosave_v2';

interface ProposalStoreData {
  activeDraft: {
    leadId: string;
    templateType: 'cold' | 'technical' | 'whatsapp';
    subject: string;
    emailBody: string;
    whatsappScript: string;
    dealValue: number;
    mrrValue: number;
    validityDays: number;
    notes: string;
    savedAt: string;
  };
  byLead?: Record<string, {
    subject: string;
    emailBody: string;
    whatsappScript: string;
    dealValue: number;
    mrrValue: number;
    validityDays: number;
    notes: string;
    templateType: 'cold' | 'technical' | 'whatsapp';
    savedAt: string;
  }>;
}



export const useProposalForm = () => {
  const { leads, setupConfig, crmSettings, updateLeadStage } = useCrm();

  // Load saved draft state initially from localStorage
  const savedData = (() => {
    try {
      const raw = safeStorage.getItem(PROPOSAL_STORAGE_KEY);
      if (raw) return JSON.parse(raw) as ProposalStoreData;
    } catch (e) {
      console.error('Error loading proposal draft', e);
    }
    return null;
  })();

  const initialLeadId = (() => {
    if (savedData?.activeDraft?.leadId && leads.some(l => l.id === savedData.activeDraft.leadId)) {
      return savedData.activeDraft.leadId;
    }
    return leads[0]?.id || '';
  })();

  const [selectedLeadId, setSelectedLeadId] = useState<string>(initialLeadId);
  const [templateType, setTemplateType] = useState<'cold' | 'technical' | 'whatsapp'>(
    savedData?.activeDraft?.templateType || 'cold'
  );

  const currentLead = leads.find(l => l.id === selectedLeadId) || leads[0];
  const slug = currentLead ? currentLead.name.toLowerCase().replace(/[^a-z0-9]/g, '-') : 'cliente';
  const previewUrl = `https://${setupConfig.baseDomain}/clientes/${slug}`;
  const proposalCode = currentLead ? `PROP-${new Date().getFullYear()}-${currentLead.id.slice(0, 6).toUpperCase()}` : '';

  // Default generators
  const computeDefaultSubject = (lead = currentLead, type = templateType) => {
    if (!lead) return '';
    if (type === 'technical') {
      return `Diagnóstico técnico e ideia para o site de ${lead.name}`;
    }
    return typeof lead.rating === 'number'
      ? `Ideia para valorizar a presença digital de ${lead.name}`
      : `Ideia de presença digital para ${lead.name}`;
  };

  const computeDefaultEmailBody = (lead = currentLead, type = templateType) => {
    if (!lead) return '';
    const leadSlug = lead.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const leadPreviewUrl = `https://${setupConfig.baseDomain}/clientes/${leadSlug}`;

    if (type === 'technical') {
      const auditDetail = lead.audit
        ? `A auditoria disponível indicou ${lead.audit.loadingTimeSeconds}s de carregamento e oportunidades de melhoria na experiência mobile.`
        : `Ainda não realizamos uma auditoria técnica do site; a proposta parte de uma melhoria geral de presença digital e conversão mobile.`;
      return `Olá equipe ${lead.name}!\n\nTudo bem? Meu nome é ${setupConfig.senderName}.\n\n${auditDetail}\n\nPara ajudar, preparei uma versão demonstrativa moderna e adaptada para celular:\n👉 ${leadPreviewUrl}\n\nO que achou da prévia? Se fizer sentido, podemos bater um papo rápido de 5 minutos nesta semana.`;
    }

    const reputation = typeof lead.rating === 'number'
      ? `Vi que o negócio tem uma avaliação de ${lead.rating} estrelas${typeof lead.reviewsCount === 'number' ? ` em ${lead.reviewsCount} avaliações` : ''}.`
      : `Conheci o negócio de vocês na região de ${lead.city}.`;
    return `Olá ${lead.name}!\n\nTudo bem por aí? Meu nome é ${setupConfig.senderName}.\n\n${reputation}\n\nPreparei uma página modelo moderna e adaptada para celular para valorizar a presença digital e facilitar novos agendamentos no WhatsApp.\n\nVocê pode ver como ficou aqui:\n👉 ${leadPreviewUrl}\n\nPodemos conversar 5 minutinhos amanhã para eu mostrar como colocar no ar sem complicação?\n\nUm abraço,\n${setupConfig.senderName}\n${setupConfig.senderEmail}`;
  };

  const computeDefaultWhatsappScript = (lead = currentLead) => {
    if (!lead) return '';
    const leadSlug = lead.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const leadPreviewUrl = `https://${setupConfig.baseDomain}/clientes/${leadSlug}`;
    const ratingMention = typeof lead.rating === 'number' ? ` Vi uma avaliação de ${lead.rating} estrelas para o negócio.` : '';
    return `Olá ${lead.name}, tudo bem?${ratingMention} Criei uma prévia gratuita de um site novo para facilitar agendamentos pelo WhatsApp: ${leadPreviewUrl}`;
  };

  // Editable fields with auto-save
  const [subject, setSubject] = useState<string>(() => {
    if (savedData?.activeDraft && savedData.activeDraft.leadId === initialLeadId && savedData.activeDraft.subject) {
      return savedData.activeDraft.subject;
    }
    return computeDefaultSubject();
  });

  const [emailBody, setEmailBody] = useState<string>(() => {
    if (savedData?.activeDraft && savedData.activeDraft.leadId === initialLeadId && savedData.activeDraft.emailBody) {
      return savedData.activeDraft.emailBody;
    }
    return computeDefaultEmailBody();
  });

  const [whatsappScript, setWhatsappScript] = useState<string>(() => {
    if (savedData?.activeDraft && savedData.activeDraft.leadId === initialLeadId && savedData.activeDraft.whatsappScript) {
      return savedData.activeDraft.whatsappScript;
    }
    return computeDefaultWhatsappScript();
  });

  const [dealValue, setDealValue] = useState<number>(() => {
    if (savedData?.activeDraft?.dealValue) return savedData.activeDraft.dealValue;
    return currentLead?.dealValue || 1800;
  });

  const [mrrValue, setMrrValue] = useState<number>(() => {
    if (savedData?.activeDraft?.mrrValue) return savedData.activeDraft.mrrValue;
    return currentLead?.mrrValue || 197;
  });

  const [validityDays, setValidityDays] = useState<number>(() => {
    if (savedData?.activeDraft?.validityDays) return savedData.activeDraft.validityDays;
    return 15;
  });

  const [proposalNotes, setProposalNotes] = useState<string>(() => {
    if (savedData?.activeDraft?.notes) return savedData.activeDraft.notes;
    return '';
  });

  // UI state
  const [lastSavedTime, setLastSavedTime] = useState<string>(() => {
    if (savedData?.activeDraft?.savedAt) return savedData.activeDraft.savedAt;
    return new Date().toLocaleTimeString('pt-BR');
  });
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [isSavedPulse, setIsSavedPulse] = useState(false);
  const [hasRestoredNotice, setHasRestoredNotice] = useState(Boolean(savedData?.activeDraft));
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedWhatsapp, setCopiedWhatsapp] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [pdfSuccessToast, setPdfSuccessToast] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [pdfTheme, setPdfTheme] = useState<'light' | 'dark'>('light');
  const [pdfZoom, setPdfZoom] = useState<number>(1);

  // Close preview modal on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isPreviewModalOpen) {
        setIsPreviewModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPreviewModalOpen]);

  // Handle lead change: check if there's a draft saved for that lead in localStorage
  const handleLeadChange = (newLeadId: string) => {
    setSelectedLeadId(newLeadId);
    const targetLead = leads.find(l => l.id === newLeadId);
    if (!targetLead) return;

    try {
      const raw = safeStorage.getItem(PROPOSAL_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as ProposalStoreData;
        if (parsed.byLead && parsed.byLead[newLeadId]) {
          const leadDraft = parsed.byLead[newLeadId];
          setSubject(leadDraft.subject);
          setEmailBody(leadDraft.emailBody);
          setWhatsappScript(leadDraft.whatsappScript);
          setDealValue(leadDraft.dealValue);
          setMrrValue(leadDraft.mrrValue);
          setValidityDays(leadDraft.validityDays);
          setProposalNotes(leadDraft.notes);
          setTemplateType(leadDraft.templateType);
          return;
        }
      }
    } catch {
      // fallback
    }

    // Otherwise apply default templates
    setSubject(computeDefaultSubject(targetLead, templateType));
    setEmailBody(computeDefaultEmailBody(targetLead, templateType));
    setWhatsappScript(computeDefaultWhatsappScript(targetLead));
    setDealValue(targetLead.dealValue || 1800);
    setMrrValue(targetLead.mrrValue || 197);
  };

  // Handle template type change
  const handleTemplateTypeChange = (newType: 'cold' | 'technical' | 'whatsapp') => {
    setTemplateType(newType);
    setSubject(computeDefaultSubject(currentLead, newType));
    setEmailBody(computeDefaultEmailBody(currentLead, newType));
  };

  // Reset to default
  const handleResetToDefault = () => {
    if (!currentLead) return;
    setSubject(computeDefaultSubject(currentLead, templateType));
    setEmailBody(computeDefaultEmailBody(currentLead, templateType));
    setWhatsappScript(computeDefaultWhatsappScript(currentLead));
    setDealValue(currentLead.dealValue || 1800);
    setMrrValue(currentLead.mrrValue || 197);
    setValidityDays(15);
    setProposalNotes('');
  };

  // Persistent Auto-Save to localStorage
  useEffect(() => {
    if (!currentLead) return;

    const timer = setTimeout(() => {
      try {
        const timeStr = new Date().toLocaleTimeString('pt-BR');
        let existingByLead: Record<string, any> = {};

        const raw = safeStorage.getItem(PROPOSAL_STORAGE_KEY);
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            if (parsed.byLead) existingByLead = parsed.byLead;
          } catch {
            // ignore
          }
        }

        const draftData = {
          leadId: selectedLeadId,
          templateType,
          subject,
          emailBody,
          whatsappScript,
          dealValue,
          mrrValue,
          validityDays,
          notes: proposalNotes,
          savedAt: timeStr,
        };

        existingByLead[selectedLeadId] = draftData;

        const storePayload: ProposalStoreData = {
          activeDraft: draftData,
          byLead: existingByLead,
        };

        safeStorage.setItem(PROPOSAL_STORAGE_KEY, JSON.stringify(storePayload));
        setLastSavedTime(timeStr);
        setIsSavedPulse(true);
        setTimeout(() => setIsSavedPulse(false), 1500);
      } catch (err) {
        console.warn('Falha no salvamento automático da proposta:', err);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [
    selectedLeadId,
    templateType,
    subject,
    emailBody,
    whatsappScript,
    dealValue,
    mrrValue,
    validityDays,
    proposalNotes,
    currentLead
  ]);

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(`Assunto: ${subject}\n\n${emailBody}`);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  const handleCopyWhatsapp = () => {
    navigator.clipboard.writeText(whatsappScript);
    setCopiedWhatsapp(true);
    setTimeout(() => setCopiedWhatsapp(false), 2000);
  };

  const handleExportPdf = () => {
    if (!currentLead) return;
    setIsExportingPdf(true);
    try {
      downloadProposalPdf({
        lead: {
          ...currentLead,
          dealValue: Number(dealValue) || currentLead.dealValue || 1800,
          mrrValue: Number(mrrValue) || currentLead.mrrValue || 197,
        },
        setupConfig,
        crmSettings
      });
      setPdfSuccessToast(true);
      setTimeout(() => setPdfSuccessToast(false), 3500);
    } catch (err) {
      console.error('Erro ao gerar PDF da proposta:', err);
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleOpenGmail = () => {
    if (!currentLead) return;
    updateLeadStage(currentLead.id, 'proposta_enviada');
    const mailto = `mailto:${currentLead.email || ''}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(emailBody)}`;
    window.open(mailto, '_blank');
  };

  const handleOpenWhatsapp = () => {
    if (!currentLead) return;
    updateLeadStage(currentLead.id, 'proposta_enviada');
    const phone = currentLead.whatsapp || currentLead.phone.replace(/\D/g, '');
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(whatsappScript)}`;
    window.open(url, '_blank');
  };

  const handleEnhanceWithAI = async (targetField: 'email' | 'whatsapp') => {
    if (!currentLead) return;
    setIsGeneratingAi(true);

    try {
      const prompt = targetField === 'email'
        ? `Reescreva este e-mail comercial tornando-o mais persuasivo e focado em conversão. 
         Empresa alvo: ${currentLead.name} (Nicho: ${currentLead.category}). 
         O e-mail atual é: "${emailBody}"`
        : `Reescreva esta mensagem de WhatsApp deixando-a mais magnética e curta. 
         Empresa alvo: ${currentLead.name}. 
         Mensagem atual: "${whatsappScript}"`;

      // Chama o roteador universal (que vai decidir se usa Ollama, Gemini, etc.)
      const generatedCopy = await generateAiContent(crmSettings, prompt);

      if (targetField === 'email') {
        setEmailBody(generatedCopy);
      } else {
        setWhatsappScript(generatedCopy);
      }

    } catch (error: any) {
      alert(error.message || 'Falha ao gerar texto com IA. Verifique suas configurações.');
    } finally {
      setIsGeneratingAi(false);
    }
  };



  return {
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
    handleLeadChange,
    handleResetToDefault,
    handleCopyEmail, handleCopyWhatsapp,
    handleExportPdf, handleOpenGmail, handleOpenWhatsapp,
    handleEnhanceWithAI
  };
};
