import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCrm } from '../../../hooks/useCrm';
import { 
  DraftFlowState, 
  WizardStep, 
  GenerationPhase 
} from './types';
import { StepperIndicator } from './StepperIndicator';
import { LeadSelectionStep } from './LeadSelectionStep';
import { ContextReviewStep } from './ContextReviewStep';
import { GenerationModeStep } from './GenerationModeStep';
import { ReviewConfirmStep } from './ReviewConfirmStep';
import { ProductionProgressStep } from './ProductionProgressStep';
import { GenerationResultStep } from './GenerationResultStep';
import { buildLeadSiteContext } from '../../context';
import { normalizeLeadSource } from '../../leadSource';
import { generateSiteBlueprint, generateStandardAiBlueprint } from '../../../services/siteGenerationService';
import { resolvedDesignSchema } from '../../contracts/research';
import { deriveDefaultMediaPlan } from '../../media/mediaPlanBuilder';
import { toast } from '../../../store/toastStore';

const initialDraftState: DraftFlowState = {
  categoryId: null,
  leadId: null,
  generationMode: 'standard',
  prefs: {
    siteType: 'landing-page',
    templateId: 'auto',
    style: 'moderno',
    goal: 'contact',
    designBrief: {
      paletteMode: 'recommended',
      primaryColor: '#153a50',
      accentColor: '#d8aa63',
      designSystemInput: '',
      motion: 'subtle',
      referenceNotes: '',
    }
  },
  selection: { mode: 'auto' }
};

interface GenerationFlowOrchestratorProps {
  initialLeadId?: string;
  onClose: () => void;
}

export const GenerationFlowOrchestrator: React.FC<GenerationFlowOrchestratorProps> = ({ initialLeadId, onClose }) => {
  const crm = useCrm();
  const navigate = useNavigate();
  
  // Transient state
  const [currentStep, setCurrentStep] = useState<WizardStep>('lead');
  const [phase, setPhase] = useState<GenerationPhase>('idle');
  
  // Real design production tracking
  const [productionStatus, setProductionStatus] = useState<string>('');
  const [productionStage, setProductionStage] = useState<string>('');
  const [errorDetails, setErrorDetails] = useState<string>('');
  const [generatedProjectId, setGeneratedProjectId] = useState<string>('');

  // Form draft state
  const [draft, setDraft] = useState<DraftFlowState>(() => {
    let cat = null;
    if (initialLeadId) {
       const l = crm.leads.find(l => l.id === initialLeadId);
       if (l) cat = l.category || null;
    }
    return { ...initialDraftState, leadId: initialLeadId || null, categoryId: cat };
  });

  // Guard against closing while processing (UX warning only)
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (phase === 'design' || phase === 'site-generation') {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [phase]);

  // Derived
  const selectedLead = crm.leads.find(l => l.id === draft.leadId);

  const updateDraft = (partial: Partial<DraftFlowState>) => {
    setDraft(prev => ({ ...prev, ...partial }));
  };

  const handleNext = () => {
    if (currentStep === 'lead' && draft.leadId) setCurrentStep('context');
    else if (currentStep === 'context') setCurrentStep('mode');
    else if (currentStep === 'mode') setCurrentStep('review');
  };

  const handleBack = () => {
    if (currentStep === 'context') setCurrentStep('lead');
    else if (currentStep === 'mode') setCurrentStep('context');
    else if (currentStep === 'review') setCurrentStep('mode');
  };

  const startGeneration = async () => {
    if (!selectedLead || phase !== 'idle') return;
    setPhase('starting');
    setErrorDetails('');
    setProductionStatus('PENDING');

    let pollInterval: NodeJS.Timeout | undefined;
    
    try {
      const context = buildLeadSiteContext(selectedLead);
      const sourceContext = normalizeLeadSource(selectedLead);
      
      let finalGenerationRequestId: string | undefined;
      let finalDesignProductionId: string | undefined;
      
      if (draft.generationMode === 'standard') {
         setPhase('design');
         const reqId = crypto.randomUUID();
         
         const produceRes = await fetch('/api/ai/research/stitch/produce', {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({
             generationRequestId: reqId,
             leadId: selectedLead.id,
             source: sourceContext
           })
         });
         
         if (!produceRes.ok) {
           const errData = await produceRes.json();
           const msg = errData.error || 'Falha ao iniciar produção de design.';
           // Provider block parsing
           if (msg.toLowerCase().includes('timeout') || produceRes.status === 504 || produceRes.status === 429) {
             throw new Error('O serviço de design está indisponível ou demorando mais que o esperado. ' + msg);
           }
           throw new Error(msg);
         }
         
         const produceData = await produceRes.json();
         finalGenerationRequestId = produceData.generationRequestId;
         finalDesignProductionId = produceData.designProductionId;
         setProductionStatus(produceData.status);
         
         // Polling
         const terminalStates = ['PAIRED', 'PARTIAL', 'FAILED'];
         let currentStatus = produceData.status;
         let currentStage = produceData.stage || 'INITIALIZING';
         
         console.info('[StitchFlow]', {
           generationRequestId: finalGenerationRequestId,
           designProductionId: finalDesignProductionId,
           previousStatus: 'PENDING',
           status: currentStatus,
           previousStage: 'NONE',
           stage: currentStage,
           elapsedMs: 0,
           lastEvent: 'Started production'
         });
         
         if (!terminalStates.includes(currentStatus)) {
           await new Promise<void>((resolve, reject) => {
             pollInterval = setInterval(async () => {
               try {
                 const pollRes = await fetch(`/api/ai/research/stitch/produce/${finalGenerationRequestId}`);
                 if (!pollRes.ok) throw new Error('Falha ao ler status da produção');
                 const pollData = await pollRes.json();
                 
                 const statusChanged = currentStatus !== pollData.status;
                 const stageChanged = currentStage !== pollData.stage;
                 
                 if (statusChanged || stageChanged) {
                   console.info('[StitchFlow]', {
                     generationRequestId: finalGenerationRequestId,
                     designProductionId: finalDesignProductionId,
                     previousStatus: currentStatus,
                     status: pollData.status,
                     previousStage: currentStage,
                     stage: pollData.stage,
                     elapsedMs: pollData.elapsedMs || 0,
                     lastEvent: 'State transition'
                   });
                 }
                 
                 currentStatus = pollData.status;
                 currentStage = pollData.stage || currentStage;
                 
                 setProductionStatus(currentStatus);
                 setProductionStage(currentStage);
                 
                 if (currentStatus === 'FAILED') {
                   clearInterval(pollInterval);
                   
                   console.error('[StitchFlow] FAILED', {
                     generationRequestId: finalGenerationRequestId,
                     designProductionId: finalDesignProductionId,
                     errorCode: pollData.errorCode,
                     stage: currentStage,
                     elapsedMs: pollData.elapsedMs || 0,
                     providerStatus: pollData.providerStatus
                   });
                   
                   // Translate technical error to user-friendly error based on stage/code
                   let userMsg = `Falha na produção do design: ${pollData.errorCode || 'UNHANDLED'}`;
                   if (pollData.errorCode === 'STITCH_MOBILE_TIMEOUT' || pollData.errorCode === 'STITCH_JOB_TIMEOUT') {
                     userMsg = 'O serviço de design demorou mais que o esperado durante a criação da direção visual.';
                   }
                   
                   reject(new Error(userMsg));
                 } else if (terminalStates.includes(currentStatus)) {
                   clearInterval(pollInterval);
                   
                   if (currentStatus === 'PARTIAL') {
                     console.warn('[StitchFlow] PARTIAL', {
                       generationRequestId: finalGenerationRequestId,
                       designProductionId: finalDesignProductionId,
                       errorCode: pollData.errorCode,
                       stage: currentStage,
                       elapsedMs: pollData.elapsedMs || 0,
                       providerStatus: pollData.providerStatus
                     });
                   }
                   
                   resolve();
                 }
               } catch (e) {
                 clearInterval(pollInterval);
                 reject(e);
               }
             }, 2000);
           });
         }
      }

      setPhase('site-generation');
      setProductionStatus('SAVING_PROJECT');

      const project = crm.addProject({
        leadId: selectedLead.id,
        clientName: selectedLead.name,
        title: "Site — " + selectedLead.name,
        category: selectedLead.category,
        type: draft.prefs.siteType === "institutional" ? "Site Institucional" : "Landing Page",
        status: "rascunho",
        previewUrl: "",
        slug: selectedLead.id,
        siteContext: context,
        generationStatus: "generating",
        contentReviewed: false,
      });

      const result = draft.generationMode === 'standard' 
        ? await generateStandardAiBlueprint(
            crm.crmSettings, 
            sourceContext, 
            draft.selection,
            draft.prefs.designBrief.paletteMode === 'custom' ? { primary: draft.prefs.designBrief.primaryColor, accent: draft.prefs.designBrief.accentColor } : undefined,
            finalGenerationRequestId,
            finalDesignProductionId
          ) 
        : await generateSiteBlueprint(crm.crmSettings, {
            leadId: selectedLead.id,
            context,
            preferences: draft.prefs,
            modelSelection: draft.selection,
          });

      const resolvedDesign = 'design' in result ? resolvedDesignSchema.parse(result.design) : undefined;
      const mediaPlan = deriveDefaultMediaPlan({
        ...project,
        siteBlueprint: result.blueprint,
        siteDesign: resolvedDesign,
        siteContext: context,
      });
      
      crm.updateProject({
        ...project,
        siteBlueprint: result.blueprint,
        siteDesign: resolvedDesign,
        siteMediaPlan: mediaPlan,
        aiGeneration: result.generation,
        generationStatus: "generated",
      });

      setGeneratedProjectId(project.id);
      setPhase('completed');
      
      crm.addNotification({
        id: crypto.randomUUID(),
        title: "Site gerado",
        message: selectedLead.name + " — projeto disponível para revisão.",
        timestamp: new Date().toISOString(),
        read: false,
        type: "system",
        leadId: selectedLead.id,
      });
      
      toast(result.generation.fallbackUsed
        ? "A IA não estava disponível. Site criado com fallback; você pode regenerá-lo com IA depois."
        : "Site gerado com sucesso.");
        
    } catch (e) {
      if (pollInterval) clearInterval(pollInterval);
      setPhase('failed');
      const message = e instanceof Error ? e.message : "Falha inesperada ao gerar site.";
      setErrorDetails(message);
    } finally {
      if (pollInterval) clearInterval(pollInterval);
    }
  };

  const handleRetry = () => {
    setPhase('idle');
  };

  const handleReviewConfig = () => {
    setPhase('idle');
    setCurrentStep('mode');
  };

  const handleOpenEditor = () => {
    if (generatedProjectId) {
      onClose();
      navigate("/editor?project=" + encodeURIComponent(generatedProjectId));
    }
  };

  const handleClose = () => {
    if (phase === 'design' || phase === 'site-generation') {
      const confirmClose = window.confirm("A geração já foi iniciada e pode continuar no servidor. Fechar esta janela não cancela necessariamente o processo. Deseja fechar?");
      if (!confirmClose) return;
    }
    onClose();
  };

  // Rendering
  const isDecisionPhase = phase === 'idle';

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center mb-6 shrink-0">
        <h2 id="site-generator-title" className="text-2xl font-bold text-white tracking-tight">
          {isDecisionPhase ? 'Gerar Site' : 'Produção em andamento'}
        </h2>
        <button 
          aria-label="Fechar gerador" 
          onClick={handleClose}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
        >
          ×
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 pb-4">
        {isDecisionPhase && <StepperIndicator currentStep={currentStep} />}
        
        {isDecisionPhase && currentStep === 'lead' && (
          <LeadSelectionStep state={draft} updateState={updateDraft} leads={crm.leads} />
        )}
        
        {isDecisionPhase && currentStep === 'context' && selectedLead && (
          <ContextReviewStep state={draft} updateState={updateDraft} lead={selectedLead} />
        )}

        {isDecisionPhase && currentStep === 'mode' && (
          <GenerationModeStep state={draft} updateState={updateDraft} settings={crm.crmSettings} />
        )}

        {isDecisionPhase && currentStep === 'review' && selectedLead && (
          <ReviewConfirmStep state={draft} lead={selectedLead} />
        )}

        {(phase === 'starting' || phase === 'design' || phase === 'site-generation') && (
          <ProductionProgressStep status={productionStatus} stage={productionStage} />
        )}

        {(phase === 'completed' || phase === 'failed') && (
          <GenerationResultStep 
            phase={phase} 
            error={errorDetails} 
            projectId={generatedProjectId}
            onOpenEditor={handleOpenEditor}
            onRetry={handleRetry}
            onReviewConfig={handleReviewConfig}
          />
        )}
      </div>

      {isDecisionPhase && (
        <div className="flex items-center justify-end gap-3 mt-4 pt-4 border-t border-slate-800 shrink-0">
          {currentStep !== 'lead' && (
            <button
              onClick={handleBack}
              className="px-6 py-2.5 rounded-xl font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Voltar
            </button>
          )}
          
          {currentStep !== 'review' ? (
            <button
              onClick={handleNext}
              disabled={currentStep === 'lead' && !draft.leadId}
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold transition-colors"
            >
              Continuar
            </button>
          ) : (
            <button
              onClick={startGeneration}
              disabled={phase !== 'idle'}
              className="px-8 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold shadow-lg shadow-indigo-500/20 transition-all flex items-center gap-2"
            >
              ✨ Confirmar e Gerar
            </button>
          )}
        </div>
      )}
    </div>
  );
};
