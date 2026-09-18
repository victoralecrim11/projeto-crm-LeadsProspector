import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCrm } from "../hooks/useCrm";
import { buildLeadSiteContext } from "../site-builder/context";
import {
  templates,
  tones,
  type DesignBrief,
  type ModelSelection,
  type SitePreferences,
} from "../site-builder/types";
import { normalizeDesignBrief } from "../site-builder/designBrief";
import { generateSiteBlueprint, generateStandardAiBlueprint } from "../services/siteGenerationService";
import { normalizeLeadSource, getLeadCategory } from '../site-builder/leadSource';
import { BUSINESS_CATEGORIES } from '../domain/businessTaxonomy';
import { resolvedDesignSchema } from '../site-builder/contracts/research';
import { deriveDefaultMediaPlan } from '../site-builder/media/mediaPlanBuilder';
import { ModelControls } from "../site-builder/components/ModelControls";
import { DesignBriefControls } from "../site-builder/components/DesignBriefControls";
import { toast } from "../store/toastStore";

const defaultDesignBrief: DesignBrief = {
  paletteMode: "recommended",
  primaryColor: "#153a50",
  accentColor: "#d8aa63",
  designSystemInput: "",
  motion: "subtle",
  referenceNotes: "",
};

const lensLabels = {
  "local-conversion": "Conversão local",
  "premium-editorial": "Editorial premium",
  "trust-institutional": "Confiança institucional",
  "appointment-flow": "Fluxo de agendamento",
} as const;

export const SiteGeneratorModal: React.FC = () => {
  const crm = useCrm();
  const navigate = useNavigate();
  const [leadId, setLeadId] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [busy, setBusy] = useState(false);
  const [generationMode, setGenerationMode] = useState<'existing' | 'standard'>('standard');
  const [error, setError] = useState("");
  const [selection, setSelection] = useState<ModelSelection>({ mode: "auto" });
  const [prefs, setPrefs] = useState<SitePreferences>({
    siteType: "landing-page",
    templateId: "auto",
    style: "moderno",
    goal: "contact",
    designBrief: defaultDesignBrief,
  });
  const [productionStatus, setProductionStatus] = useState<string>('');
  const [productionRequestId, setProductionRequestId] = useState<string>('');
  
  // Clean up polling if modal closes
  useEffect(() => {
    if (!crm.isCreateSiteModalOpen) {
      setProductionStatus('');
      setProductionRequestId('');
    }
  }, [crm.isCreateSiteModalOpen]);

  useEffect(() => {
    if (crm.isCreateSiteModalOpen) {
      setLeadId(crm.siteGeneratorLead?.id || crm.leads[0]?.id || "");
      setError("");
    }
  }, [crm.isCreateSiteModalOpen, crm.siteGeneratorLead?.id]);

  if (!crm.isCreateSiteModalOpen) return null;

  const lead =
    crm.leads.find((l) => l.id === leadId) ||
    (crm.siteGeneratorLead?.id === leadId ? crm.siteGeneratorLead : undefined);
  const designBrief = prefs.designBrief ?? defaultDesignBrief;
  let designPreview: ReturnType<typeof normalizeDesignBrief> | null = null;
  let designPreviewError = "";
  if (lead) {
    try {
      designPreview = normalizeDesignBrief(buildLeadSiteContext(lead), prefs);
    } catch (previewError) {
      designPreviewError =
        previewError instanceof Error ? previewError.message : "Briefing inválido.";
    }
  }
  const close = () => {
    if (!busy) {
      crm.setIsCreateSiteModalOpen(false);
      crm.setSiteGeneratorLead(null);
    }
  };

  const generate = async () => {
    if (!lead || busy) return;
    setBusy(true);
    setError("");
    setProductionStatus("");
    
    let project: ReturnType<typeof crm.addProject> | undefined;
    let pollInterval: NodeJS.Timeout | undefined;
    
    try {
      const context = buildLeadSiteContext(lead);
      const sourceContext = normalizeLeadSource(lead);
      
      let finalGenerationRequestId: string | undefined;
      let finalDesignProductionId: string | undefined;
      
      if (generationMode === 'standard') {
         // Stitch On-Demand Flow
         const reqId = productionRequestId || crypto.randomUUID();
         if (!productionRequestId) setProductionRequestId(reqId);
         
         const produceRes = await fetch('/api/ai/research/stitch/produce', {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({
             generationRequestId: reqId,
             leadId: lead.id,
             source: sourceContext
           })
         });
         
         if (!produceRes.ok) {
           const errData = await produceRes.json();
           throw new Error(errData.error || 'Falha ao iniciar produção de design.');
         }
         
         const produceData = await produceRes.json();
         finalGenerationRequestId = produceData.generationRequestId;
         finalDesignProductionId = produceData.designProductionId;
         setProductionStatus(produceData.status);
         
         // Polling
         const terminalStates = ['PAIRED', 'PARTIAL', 'FAILED'];
         let currentStatus = produceData.status;
         
         if (!terminalStates.includes(currentStatus)) {
           await new Promise<void>((resolve, reject) => {
             pollInterval = setInterval(async () => {
               try {
                 if (!crm.isCreateSiteModalOpen) {
                   clearInterval(pollInterval);
                   return; // Abandon polling if closed, but backend job continues
                 }
                 const pollRes = await fetch(`/api/ai/research/stitch/produce/${finalGenerationRequestId}`);
                 if (!pollRes.ok) throw new Error('Falha ao ler status da produção');
                 const pollData = await pollRes.json();
                 currentStatus = pollData.status;
                 setProductionStatus(currentStatus);
                 
                 if (currentStatus === 'FAILED') {
                   clearInterval(pollInterval);
                   reject(new Error(`Falha na produção do design: ${pollData.errorCode || 'UNHANDLED'}`));
                 } else if (terminalStates.includes(currentStatus)) {
                   clearInterval(pollInterval);
                   resolve();
                 }
               } catch (e) {
                 clearInterval(pollInterval);
                 reject(e);
               }
             }, 2000);
           });
         }
         
         setProductionStatus('GENERATING_CONTENT');
      }

      project = crm.addProject({
        leadId: lead.id,
        clientName: lead.name,
        title: "Site — " + lead.name,
        category: lead.category,
        type:
          prefs.siteType === "institutional"
            ? "Site Institucional"
            : "Landing Page",
        status: "rascunho",
        previewUrl: "",
        slug: lead.id,
        siteContext: context,
        generationStatus: "generating",
        contentReviewed: false,
      });

      const result = generationMode === 'standard' 
        ? await generateStandardAiBlueprint(
            crm.crmSettings, 
            sourceContext, 
            selection,
            designBrief.paletteMode === 'custom' ? { primary: designBrief.primaryColor, accent: designBrief.accentColor } : undefined,
            finalGenerationRequestId,
            finalDesignProductionId
          ) 
        : await generateSiteBlueprint(crm.crmSettings, {
            leadId: lead.id,
            context,
            preferences: prefs,
            modelSelection: selection,
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
      crm.addNotification({
        id: crypto.randomUUID(),
        title: "Site gerado",
        message: lead.name + " — projeto disponível para revisão.",
        timestamp: new Date().toISOString(),
        read: false,
        type: "system",
        leadId: lead.id,
      });
      toast(result.generation.fallbackUsed
        ? "A IA não estava disponível. Site criado com fallback determinístico; você pode regenerá-lo com IA depois."
        : "Site gerado. Revise o conteúdo no editor.");
      crm.setIsCreateSiteModalOpen(false);
      crm.setSiteGeneratorLead(null);
      navigate("/editor?project=" + encodeURIComponent(project.id));
    } catch (e) {
      if (pollInterval) clearInterval(pollInterval);
      const message = e instanceof Error ? e.message : "Falha ao gerar site.";
      if (project)
        crm.updateProject({
          ...project,
          generationStatus: "error",
          generationError: message,
        });
      setError(message);
      toast(message, "error");
    } finally {
      if (pollInterval) clearInterval(pollInterval);
      setBusy(false);
    }
  };
  return (
    <div className="fixed inset-0 z-[90] bg-black/80 p-3 flex items-center justify-center">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="site-generator-title"
        className="site-workspace site-generator-panel bg-slate-950 text-white rounded-2xl border border-slate-600 w-full max-w-xl max-h-[90dvh] overflow-y-auto p-5 space-y-4"
      >
        <div className="flex justify-between">
          <h2 id="site-generator-title" className="text-xl font-bold">
            Gerar Site com IA
          </h2>
          <button aria-label="Fechar gerador" disabled={busy} onClick={close}>
            ×
          </button>
        </div>
        <p className="text-sm text-slate-300">
          Crie uma página editável a partir dos dados do lead. Revise as
          sugestões antes de exportar.
        </p>
        <fieldset disabled={busy} className="site-generator-grid">
          <div className="generator-field-wide space-y-2">
            <span className="font-bold">Modo de criação</span>
            <div className="flex flex-col gap-3">
              <label className={`flex gap-3 p-4 border rounded-xl cursor-pointer transition-colors ${generationMode === 'standard' ? 'bg-indigo-900/40 border-indigo-500' : 'bg-slate-800 border-slate-700 hover:bg-slate-800/80'}`}>
                <input type="radio" name="generationMode" value="standard" checked={generationMode === 'standard'} onChange={() => setGenerationMode('standard')} className="mt-1" />
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white">IA + Design Inteligente</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500 text-white">RECOMENDADO</span>
                  </div>
                  <span className="text-sm text-slate-300 mt-1">Cria um site completo com estrutura visual adaptada ao nicho, conteúdo por IA e mídia contextual.</span>
                  
                  {generationMode === 'standard' && lead && (
                    <div className="mt-3 p-3 bg-black/30 rounded-lg text-xs space-y-1">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Nicho</span>
                        <span className="text-slate-200">{lead.category || 'Não definido'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Design</span>
                        <span className="text-slate-200">Será resolvido automaticamente</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Mídia</span>
                        <span className="text-slate-200">Contextual + IA</span>
                      </div>
                    </div>
                  )}
                </div>
              </label>

              <label className={`flex gap-3 p-4 border rounded-xl cursor-pointer transition-colors ${generationMode === 'existing' ? 'bg-indigo-900/40 border-indigo-500' : 'bg-slate-800 border-slate-700 hover:bg-slate-800/80'}`}>
                <input type="radio" name="generationMode" value="existing" checked={generationMode === 'existing'} onChange={() => setGenerationMode('existing')} className="mt-1" />
                <div className="flex flex-col">
                  <span className="font-bold text-white">Gerador clássico</span>
                  <span className="text-sm text-slate-300 mt-1">Mantém o fluxo tradicional do Site Builder com assistência de IA para conteúdo.</span>
                </div>
              </label>
            </div>
          </div>
          <div className="flex gap-4">
            <label className="flex-1 block">
              Categoria
              <select
                className="block w-full p-2 bg-slate-800 rounded-lg"
                value={selectedCategory}
                onChange={(e) => {
                   setSelectedCategory(e.target.value);
                   setLeadId(''); // reset lead when category changes
                }}
              >
                <option value="all">Todas as Categorias</option>
                {BUSINESS_CATEGORIES.map(cat => {
                  const count = crm.leads.filter(l => getLeadCategory(l) === cat.label).length;
                  return (
                    <option key={cat.label} value={cat.label} disabled={count === 0}>
                      {cat.label} ({count})
                    </option>
                  );
                })}
              </select>
            </label>
            <label className="flex-[2] block">
              Lead
              <select
                className="block w-full p-2 bg-slate-800 rounded-lg"
                value={leadId}
                onChange={(e) => setLeadId(e.target.value)}
              >
                <option value="">Selecione um lead</option>
                {crm.leads
                  .filter(l => selectedCategory === 'all' || getLeadCategory(l) === selectedCategory)
                  .map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name} · {l.city}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="block">
            Tipo
            <select
              className="block w-full p-2 bg-slate-800 rounded-lg"
              value={prefs.siteType}
              onChange={(e) =>
                setPrefs({
                  ...prefs,
                  siteType: e.target.value as SitePreferences["siteType"],
                })
              }
            >
              <option value="landing-page">Landing page</option>
              <option value="institutional">Site institucional</option>
            </select>
          </label>
          {generationMode === 'existing' && <><label className="block">
            Template
            <select
              className="block w-full p-2 bg-slate-800 rounded-lg"
              value={prefs.templateId}
              onChange={(e) =>
                setPrefs({
                  ...prefs,
                  templateId: e.target.value as SitePreferences["templateId"],
                })
              }
            >
              <option value="auto">✨ Deixar a IA decidir</option>
              {templates.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </label>
          <label className="block">
            Estilo
            <select
              className="block w-full p-2 bg-slate-800 rounded-lg"
              value={prefs.style}
              onChange={(e) =>
                setPrefs({
                  ...prefs,
                  style: e.target.value as SitePreferences["style"],
                })
              }
            >
              {tones.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </label>
          <label className="block">
            Objetivo
            <select
              className="block w-full p-2 bg-slate-800 rounded-lg"
              value={prefs.goal}
              onChange={(e) =>
                setPrefs({
                  ...prefs,
                  goal: e.target.value as SitePreferences["goal"],
                })
              }
            >
              <option value="contact">Contato</option>
              <option value="phone">Ligação</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="none">Apresentação</option>
            </select>
          </label></>}
        </fieldset>
        {generationMode === 'existing' && <DesignBriefControls
          value={designBrief}
          onChange={(next) => setPrefs({ ...prefs, designBrief: next })}
          disabled={busy}
        />}
        {generationMode === 'existing' && designPreview && (
          <p className="design-strategy-preview" role="status">
            Estratégia sugerida: <strong>{lensLabels[designPreview.lens]}</strong>
            {prefs.templateId === "auto" && (
              <> · prioridade {designPreview.templateCandidates[0]}</>
            )}
          </p>
        )}
        {designPreviewError && (
          <p className="design-strategy-error" role="alert">
            {designPreviewError}
          </p>
        )}
        {<ModelControls
          settings={crm.crmSettings}
          value={selection}
          onChange={setSelection}
          disabled={busy}
        />}
        {error && (
          <p role="alert" className="text-rose-300">
            {error}
          </p>
        )}
        <button
          disabled={
            busy ||
            !lead ||
            Boolean(designPreviewError) ||
            (generationMode === 'existing' && selection.mode === "explicit" && !selection.modelId)
          }
          onClick={generate}
          className="w-full p-3 rounded-xl bg-indigo-600 disabled:opacity-50 font-bold"
        >
          {busy ? generationMode === 'standard' ? 
            (productionStatus === 'PENDING' ? 'Iniciando Stitch Production...' :
             productionStatus === 'MOBILE_GENERATING' ? 'Gerando design mobile no Stitch...' :
             productionStatus === 'DESKTOP_GENERATING' ? 'Gerando design desktop no Stitch...' :
             productionStatus === 'GENERATING_CONTENT' ? 'Analisando referências e estruturando site...' :
             'Gerando design...') 
            : 'Gerando site… aguarde a resposta da IA' : '✨ Gerar Site'}
        </button>
        {!lead && <p>Adicione um lead no radar ou no CRM para continuar.</p>}
      </section>
    </div>
  );
};
