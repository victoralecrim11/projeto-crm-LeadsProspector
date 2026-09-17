import React, { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { useCrm } from "../hooks/useCrm";
import {
  blueprintSchema,
  templates,
  tones,
  visualVariants,
  defaultVisualVariants,
  type GeneratedSiteBlueprint,
  type ModelSelection,
  type RegenerationSection,
} from "../site-builder/types";
import { constrainBlueprint } from "../site-builder/context";
import { SitePreview } from "../site-builder/components/SitePreview";
import { resolvePresentation } from "../site-builder/renderer/presentation";
import { ModelControls } from "../site-builder/components/ModelControls";
import { MediaPanel } from "../site-builder/components/MediaPanel";
import { useMediaManager } from "../site-builder/media/useMediaManager";
import { autoResolveEligibleMedia } from "../site-builder/media/autoResolveService";
import { isLicensedAutoResolveEligible, deriveDefaultMediaPlan } from "../site-builder/media/mediaPlanBuilder";
import { generateSiteBlueprint, generateStandardBlueprint } from "../services/siteGenerationService";
import { downloadSiteZip } from "../site-builder/exportSite";
import { toast } from "../store/toastStore";
import type { MediaManifest } from "../site-builder/contracts/media";
import type { SiteUserOverrides } from "../site-builder/contracts/overrides";
import { applySiteUserOverrides } from "../site-builder/overridesResolver";
import { useEditorHistory } from "../site-builder/hooks/useEditorHistory";
import {
  PanelsTopLeft,
  FolderOpen,
  ChevronDown,
  Sparkles,
  SlidersHorizontal,
  Save,
  Download,
  ImageIcon,
  Undo2,
  Redo2,
} from "lucide-react";

export const VisualEditorView: React.FC = () => {
  const crm = useCrm();
  const [params, setParams] = useSearchParams();
  const project = params.get("project")
    ? crm.projects.find((p) => p.id === params.get("project"))
    : crm.projects.find(
        (p) => p.leadId === crm.currentEditingLead?.id && p.siteBlueprint,
      ) || crm.projects.find((p) => p.siteBlueprint);

  const { snapshot, pushSnapshot, undo, redo, canUndo, canRedo } = useEditorHistory({
    blueprint: project?.siteBlueprint as GeneratedSiteBlueprint,
    overrides: project?.siteOverrides || {},
  });

  const draftBlueprint = snapshot.blueprint;
  const draftOverrides = snapshot.overrides || {};
  const effectiveDraft = applySiteUserOverrides(draftBlueprint, draftOverrides);

  const [reviewed, setReviewed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [selection, setSelection] = useState<ModelSelection>({ mode: "auto" });
  const [autoResolveStatus, setAutoResolveStatus] = useState<'idle' | 'resolving' | 'done' | 'not-configured'>('idle');
  const [autoResolveMessage, setAutoResolveMessage] = useState<string>('');

  const mediaPlan = React.useMemo(() => {
    if (project?.siteMediaPlan) return project.siteMediaPlan;
    if (project && project.siteBlueprint && project.siteContext) {
      return deriveDefaultMediaPlan(project);
    }
    return undefined;
  }, [project]);

  useEffect(() => {
    if (project && !project.siteMediaPlan && mediaPlan) {
      crm.updateProject({ ...project, siteMediaPlan: mediaPlan });
    }
  }, [project, mediaPlan, crm]);

  const handleManifestChange = useCallback((updatedManifest: MediaManifest) => {
    if (!project) return;
    crm.updateProject({ ...project, siteMediaManifest: updatedManifest });
  }, [project, crm]);

  const mediaManager = useMediaManager({
    projectId: project?.id || '',
    niche: project?.category?.toLowerCase() || 'business',
    subNiche: undefined,
    imageryDirection: project?.siteDesign?.imageryDirection,
    mediaPlan: mediaPlan,
    initialManifest: project?.siteMediaManifest,
    onManifestChange: handleManifestChange,
  });

  useEffect(() => {
    // Only reset state when project ID changes.
    // useEditorHistory already initializes with the project's state.
    setReviewed(project?.contentReviewed || false);
    setDirty(false);
    setAutoResolveStatus('idle');
    setAutoResolveMessage('');
  }, [project?.id]);

  const triggerAutoResolve = useCallback(async () => {
    if (!mediaPlan || mediaPlan.items.length === 0) return;
    setAutoResolveStatus('resolving');
    setAutoResolveMessage('Buscando imagens licenciadas ilustrativas...');
    try {
      const result = await autoResolveEligibleMedia(
        mediaPlan,
        mediaManager,
      );
      if (result.resolved > 0) {
        setAutoResolveMessage(
          `${result.resolved} imagem(ns) selecionada(s) automaticamente para revisão.`,
        );
        setAutoResolveStatus('done');
      } else if (result.skipped === 0 && result.failed === 0) {
        setAutoResolveMessage('');
        setAutoResolveStatus('idle');
      } else {
        setAutoResolveMessage(
          'Provedores de mídia não configurados. O site continuará com o layout visual sem imagens.',
        );
        setAutoResolveStatus('not-configured');
      }
    } catch {
      setAutoResolveMessage(
        'Provedores de mídia não configurados. O site continuará com o layout visual sem imagens.',
      );
      setAutoResolveStatus('not-configured');
    }
  }, [mediaPlan, mediaManager]);

  useEffect(() => {
    if (!mediaPlan || mediaPlan.items.length === 0) return;
    
    const hasUnresolvedEligible = mediaPlan.items.some(
      (item) => item.sourcePreference === 'licensed' &&
                isLicensedAutoResolveEligible(item) &&
                !mediaManager.manifest.entries.some((e) => e.requestId === item.id)
    );

    if (hasUnresolvedEligible && autoResolveStatus === 'idle') {
      // Trigger automatically in background when project is persisted and manager mounted
      void triggerAutoResolve();
    }
  }, [
    mediaPlan,
    mediaManager.manifest.entries,
    autoResolveStatus,
    triggerAutoResolve,
  ]);
  useEffect(() => {
    const before = (e: BeforeUnloadEvent) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", before);
    return () => window.removeEventListener("beforeunload", before);
  }, [dirty]);
  const changeBlueprint = (next: GeneratedSiteBlueprint) => {
    pushSnapshot({ blueprint: next, overrides: draftOverrides });
    setReviewed(false);
    setDirty(true);
  };
  
  const changeOverrides = (updater: (prev: SiteUserOverrides) => SiteUserOverrides) => {
    pushSnapshot({ blueprint: draftBlueprint, overrides: updater(draftOverrides) });
    setDirty(true);
  };

  const save = () => {
    if (!project?.siteContext || !draftBlueprint)
      throw new Error("Selecione um projeto gerado.");
    const blueprint = constrainBlueprint(draftBlueprint, project.siteContext);
    const next = {
      ...project,
      siteBlueprint: blueprint,
      siteOverrides: draftOverrides,
      siteDesign: project.siteDesign, // Preserves the original D.5 design intact
      siteMediaPlan: mediaPlan,
      siteMediaManifest: mediaManager.manifest,
      contentReviewed: reviewed,
      generationStatus:
        reviewed && blueprint.services.every((s) => s.source === "known")
          ? ("ready" as const)
          : ("editing" as const),
    };
    crm.updateProject(next);
    setDirty(false);
    return next;
  };
  const runSave = () => {
    try {
      save();
      toast("Projeto salvo.");
    } catch (e) {
      toast((e as Error).message, "error");
    }
  };
  const refreshAudit = async () => {
    if (!project?.siteDesign || !draftBlueprint || busy) return;
    setBusy(true);
    try {
      const result = await generateStandardBlueprint(crm.crmSettings, project.siteDesign.referenceBrief.business.source);
      const next = { ...project.siteDesign, referenceBrief: result.design.referenceBrief };
      crm.updateProject({ ...project, siteDesign: next });
      toast('Análise do site anterior atualizada.');
    } catch (e) { toast((e as Error).message, 'error'); }
    finally { setBusy(false); }
  };
  const regenerate = async (section: RegenerationSection) => {
    if (!project?.siteContext || !draftBlueprint || busy) return;
    setBusy(true);
    try {
      const result = await generateSiteBlueprint(crm.crmSettings, {
        leadId: project.leadId || project.id,
        context: project.siteContext,
        blueprint: draftBlueprint,
        section,
        modelSelection: selection,
        preferences: {
          siteType:
            project.type === "Site Institucional"
              ? "institutional"
              : "landing-page",
          templateId: effectiveDraft.templateId,
          style: effectiveDraft.brand.tone,
          goal: effectiveDraft.hero.ctaType,
        },
      });
      crm.updateProject({
        ...project,
        siteBlueprint: result.blueprint,
        contentReviewed: false,
        aiGeneration: result.generation,
        generationStatus: "editing",
      });
      changeBlueprint(result.blueprint);
      setReviewed(false);
      setDirty(false);
      
      if (result.generation.fallbackUsed) {
        toast("A IA está indisponível. A seção foi alterada com nosso modelo local offline.", "success");
      } else {
        toast("Seção regenerada. Revise o novo conteúdo.");
      }
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      setBusy(false);
    }
  };
  const exportSite = async () => {
    setBusy(true);
    try {
      const next = save();
      // Warn about auto-selected (not reviewed) media in export
      const selectedOnly = next.siteMediaManifest?.entries.filter(
        (e) => e.reviewStatus === 'selected',
      );
      if (selectedOnly && selectedOnly.length > 0) {
        const reviewNow = window.confirm(
          `Há ${selectedOnly.length} imagem(ns) selecionada(s) automaticamente que ainda não foi(ram) aprovada(s).\n\nElas NÃO entrarão no arquivo ZIP exportado, e o site exibirá o layout visual padrão sem fotos nessas seções.\n\nClique em OK para revisar as imagens agora, ou Cancelar para exportar sem elas.`
        );
        if (reviewNow) {
          setBusy(false);
          return;
        }
      }
      await downloadSiteZip(next);
      crm.updateProject({ ...next, generationStatus: "exported" });
      toast("Site exportado em ZIP.");
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      setBusy(false);
    }
  };
  const field = (
    label: string,
    value: string,
    onChange: (s: string) => void,
    multiline = false,
  ) => (
    <label className="block text-sm space-y-1">
      <span>{label}</span>
      {multiline ? (
        <textarea
          maxLength={1600}
          className="w-full bg-slate-800 rounded-lg p-2 min-h-24"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <input
          maxLength={180}
          className="w-full bg-slate-800 rounded-lg p-2"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </label>
  );
  return (
    <div className="site-workspace editor-workspace pb-12">
      <div className="editor-page-heading">
        <header className="redesign-heading">
          <span className="site-eyebrow">
            <PanelsTopLeft size={15} aria-hidden="true" /> ESTÚDIO DE SITES
          </span>
          <h2>Editor Visual de Sites</h2>
          <p>Refine cada detalhe e acompanhe o resultado antes de exportar.</p>
        </header>
        <button
          className="site-primary-action"
          onClick={() => crm.setIsCreateSiteModalOpen(true)}
        >
          <Sparkles size={17} aria-hidden="true" /> Gerar novo site
        </button>
      </div>
      <div className="lead-picker site-surface">
        <div className="lead-picker-copy">
          <span className="site-icon">
            <FolderOpen size={21} aria-hidden="true" />
          </span>
          <div>
            <h3>Seu projeto em edição</h3>
            <p>Selecione o site que você quer personalizar.</p>
          </div>
        </div>
        <label className="lead-picker-field">
          <span>Projeto</span>
          <div className="site-select-wrap">
            <select
              disabled={busy}
              className="block w-full bg-slate-800 p-2 rounded-lg"
              value={project?.id || ""}
              onChange={(e) => {
                if (
                  dirty &&
                  !window.confirm(
                    "Trocar de projeto e descartar alterações não salvas?",
                  )
                )
                  return;
                setParams({ project: e.target.value });
              }}
            >
              <option value="">Selecione</option>
              {crm.projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                  {!p.siteBlueprint ? " — sem Blueprint" : ""}
                </option>
              ))}
            </select>
            <ChevronDown size={18} aria-hidden="true" />
          </div>
        </label>
      </div>
      {!draftBlueprint || !project?.siteContext ? (
        <div className="site-surface site-preview-empty">
          <span className="empty-preview-icon">
            <PanelsTopLeft size={30} aria-hidden="true" />
          </span>
          <h3>Um espaço para o seu próximo site</h3>
          <p>
            Este projeto ainda não possui um site gerado. Use “Gerar novo site”
            para começar.
          </p>
          {project?.generationError && (
            <p role="alert">{project.generationError}</p>
          )}
        </div>
      ) : (
        <div className="site-editor-grid">
          <fieldset disabled={busy} className="site-surface editor-controls">
            <div className="editor-panel-heading">
              <span className="site-eyebrow">01 · PERSONALIZAÇÃO</span>
              <h3>
                <SlidersHorizontal size={18} aria-hidden="true" /> Conteúdo e
                aparência
              </h3>
              <div className="editor-model-status">
                <span>
                  {project.aiGeneration?.model || "Modelo não informado"}
                </span>
                <span
                  className={dirty ? "editor-status pending" : "editor-status"}
                >
                  {dirty ? "Não salvo" : "Salvo"}
                </span>
                <div className="flex gap-1 ml-4 border-l border-slate-700 pl-4">
                  <button title="Desfazer (Ctrl+Z)" disabled={!canUndo || busy} onClick={undo} className="p-1 rounded hover:bg-slate-700 disabled:opacity-30"><Undo2 size={16} /></button>
                  <button title="Refazer (Ctrl+Shift+Z)" disabled={!canRedo || busy} onClick={redo} className="p-1 rounded hover:bg-slate-700 disabled:opacity-30"><Redo2 size={16} /></button>
                </div>
              </div>
            </div>
            <section className="editor-control-section">
              <div className="flex items-center justify-between">
                <h4 className="editor-section-title mb-0">Mensagem principal</h4>
                {effectiveDraft.hero.assetId && (
                  <button 
                    type="button"
                    onClick={() => changeOverrides((prev) => {
                      const newContent = { ...prev.content };
                      if (newContent.hero) {
                        newContent.hero = { ...newContent.hero, assetId: "__REMOVE__" };
                      } else {
                        newContent.hero = { assetId: "__REMOVE__" };
                      }
                      return { ...prev, content: newContent };
                    })} 
                    className="text-xs text-rose-400 hover:text-rose-300 underline"
                  >
                    Remover mídia
                  </button>
                )}
              </div>
              {field("Título principal", effectiveDraft.hero.headline, (v) =>
                changeBlueprint({ ...draftBlueprint, hero: { ...draftBlueprint.hero, headline: v } }),
              )}
              {field(
                "Subtítulo",
                effectiveDraft.hero.subtitle,
                (v) =>
                  changeBlueprint({ ...draftBlueprint, hero: { ...draftBlueprint.hero, subtitle: v } }),
                true,
              )}
              {field("Texto do botão", effectiveDraft.hero.ctaText, (v) =>
                changeBlueprint({ ...draftBlueprint, hero: { ...draftBlueprint.hero, ctaText: v } }),
              )}
              <label className="block">
                Canal do botão
                <select
                  className="w-full bg-slate-800 p-2"
                  value={effectiveDraft.hero.ctaType}
                  onChange={(e) =>
                    changeBlueprint({
                      ...draftBlueprint,
                      hero: {
                        ...draftBlueprint.hero,
                        ctaType: e.target
                          .value as GeneratedSiteBlueprint["hero"]["ctaType"],
                      },
                    })
                  }
                >
                  {["none", "contact", "phone", "whatsapp"].map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </label>
              <p className="text-xs text-slate-300">
                Canais ausentes nos dados do lead são omitidos na página.
              </p>
            </section>
            <section className="editor-control-section">
              <h4 className="editor-section-title">Identidade visual</h4>
              <label className="block">
                Template
                <select
                  className="w-full bg-slate-800 p-2"
                  value={effectiveDraft.templateId}
                  onChange={(e) =>
                    changeOverrides((prev) => ({
                      ...prev,
                      templateId: e.target.value as GeneratedSiteBlueprint["templateId"],
                      visual: { ...prev.visual, ...defaultVisualVariants(e.target.value as GeneratedSiteBlueprint["templateId"]) }
                    }))
                  }
                >
                  {templates.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </label>
              <div className="editor-color-fields">
                {(["primaryColor", "accentColor"] as const).map((k) => (
                  <label key={k}>
                    {k === "primaryColor" ? "Cor principal" : "Destaque"}
                    <input
                      aria-label={k}
                      type="color"
                      value={effectiveDraft.brand[k]}
                      onChange={(e) =>
                        changeOverrides((prev) => ({
                          ...prev,
                          brand: { ...prev.brand, [k]: e.target.value },
                        }))
                      }
                      className="block w-20 h-10"
                    />
                    <span className="editor-color-value">{effectiveDraft.brand[k]}</span>
                  </label>
                ))}
              </div>
              <label className="block">
                Tom
                <select
                  className="w-full bg-slate-800 p-2"
                  value={effectiveDraft.brand.tone}
                  onChange={(e) =>
                    changeOverrides((prev) => ({
                      ...prev,
                      brand: {
                        ...prev.brand,
                        tone: e.target
                          .value as GeneratedSiteBlueprint["brand"]["tone"],
                      },
                    }))
                  }
                >
                  {tones.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </label>
            </section>
            <section className="editor-control-section">
              <h4 className="editor-section-title">Composição das seções</h4>
              {(["theme", "typography", "motion"] as const).map((key) => <label className="block" key={key}>
                {{ theme: "Tema das superfícies", typography: "Tipografia", motion: "Animações" }[key]}
                <select className="w-full bg-slate-800 p-2" value={resolvePresentation(effectiveDraft)[key]} onChange={(event) => changeOverrides((prev) => ({ ...prev, presentation: { ...prev.presentation, [key]: event.target.value } }))}>
                  {(key === "theme" ? [["light", "Claro"], ["dark", "Escuro"]] : key === "typography" ? [["modern", "Moderna"], ["editorial", "Editorial"]] : [["subtle", "Suaves"], ["none", "Sem animação"]]).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </label>)}
              {(["hero", "about", "services", "contact", "footer"] as const).map((section) => <div className="block" key={section}>
                <div className="flex justify-between items-center mb-1">
                  <span>{{ hero: "Composição da abertura", about: "Composição de Sobre", services: "Composição de Serviços", contact: "Composição de Contato", footer: "Composição do rodapé" }[section]}</span>
                  {draftOverrides.visual?.[section] && (
                    <button 
                      type="button"
                      onClick={() => changeOverrides((prev) => {
                        const newVisual = { ...prev.visual };
                        delete newVisual[section];
                        return { ...prev, visual: newVisual };
                      })} 
                      className="text-[10px] text-rose-400 hover:text-rose-300"
                    >
                      Restaurar original
                    </button>
                  )}
                </div>
                <select className="w-full bg-slate-800 p-2" value={effectiveDraft.visual[section]} onChange={(event) => changeOverrides((prev) => ({ ...prev, visual: { ...prev.visual, [section]: event.target.value } }))}>
                  {visualVariants[section].map((variant) => <option key={variant} value={variant}>{{ "full-bleed": "Abertura ampla", split: "Duas colunas", minimal: "Essencial", "editorial-split": "Editorial em colunas", "centered-story": "Narrativa centralizada", "editorial-list": "Lista editorial", "horizontal-cards": "Blocos em colunas", "contact-minimal": "Contato essencial", "contact-split": "Contato em colunas", editorial: "Editorial" }[variant]}</option>)}
                </select>
              </div>)}
            </section>
            {mediaPlan && (
              <section className="editor-control-section" data-testid="media-panel-section">
                <div className="flex justify-between items-center">
                  <h4 className="editor-section-title mb-0">
                    <ImageIcon size={15} aria-hidden="true" /> Mídia do Site
                  </h4>
                </div>
                <MediaPanel
                  mediaPlan={mediaPlan}
                  manifest={mediaManager.manifest}
                  objectUrls={mediaManager.objectUrls}
                  candidatesByItem={mediaManager.candidatesByItem}
                  loadingByItem={mediaManager.loadingByItem}
                  errorByItem={mediaManager.errorByItem}
                  searchMedia={mediaManager.searchMedia}
                  selectCandidate={async (item, candidate) => {
                    const assetId = await mediaManager.selectCandidate(item, candidate);
                    if (assetId) {
                      changeOverrides((prev) => {
                        const newContent = { ...prev.content };
                        const secId = item.section as 'hero' | 'about';
                        if (secId === 'hero' || secId === 'about') {
                          newContent[secId] = { ...newContent[secId], assetId };
                        }
                        return { ...prev, content: newContent };
                      });
                    }
                  }}
                  approveMedia={mediaManager.approveMedia}
                  rejectMedia={mediaManager.rejectMedia}
                  autoResolveStatus={autoResolveStatus}
                  autoResolveMessage={autoResolveMessage as any}
                  getProjectAssets={mediaManager.getProjectAssets}
                  getAssetUrl={mediaManager.getAssetUrl}
                  selectProjectAsset={async (item, asset) => {
                    const assetId = await mediaManager.selectProjectAsset(item, asset);
                    if (assetId) {
                      changeOverrides((prev) => {
                        const newContent = { ...prev.content };
                        const secId = item.section as 'hero' | 'about';
                        if (secId === 'hero' || secId === 'about') {
                          newContent[secId] = { ...newContent[secId], assetId };
                        }
                        return { ...prev, content: newContent };
                      });
                    }
                  }}
                />
                {autoResolveStatus === 'idle' && mediaPlan.items.some(i => i.sourcePreference === 'licensed') && (
                  <button
                    type="button"
                    onClick={() => void triggerAutoResolve()}
                    disabled={busy}
                    className="w-full py-2 px-3 rounded-lg bg-indigo-900/80 hover:bg-indigo-900 text-white font-medium text-xs flex items-center justify-center gap-2 transition-all mt-2"
                  >
                    <Sparkles size={14} aria-hidden="true" /> Buscar imagens automaticamente
                  </button>
                )}
              </section>
            )}
            <section className="editor-control-section">
              <div className="flex items-center justify-between">
                <h4 className="editor-section-title mb-0">Sobre o negócio</h4>
                {effectiveDraft.about.assetId && (
                  <button 
                    type="button"
                    onClick={() => changeOverrides((prev) => {
                      const newContent = { ...prev.content };
                      if (newContent.about) {
                        newContent.about = { ...newContent.about, assetId: "__REMOVE__" };
                      } else {
                        newContent.about = { assetId: "__REMOVE__" };
                      }
                      return { ...prev, content: newContent };
                    })} 
                    className="text-xs text-rose-400 hover:text-rose-300 underline"
                  >
                    Remover mídia
                  </button>
                )}
              </div>
              {field("Título Sobre", effectiveDraft.about.title, (v) =>
                changeBlueprint({ ...draftBlueprint, about: { ...draftBlueprint.about, title: v } }),
              )}
              {field(
                "Sobre",
                effectiveDraft.about.description,
                (v) =>
                  changeBlueprint({
                    ...draftBlueprint,
                    about: { ...draftBlueprint.about, description: v },
                  }),
                true,
              )}
            </section>
            <details>
              <summary className="font-bold cursor-pointer">
                Serviços ({effectiveDraft.services.length})
              </summary>
              <div className="space-y-4 mt-3">
                {effectiveDraft.services.map((s, i) => (
                  <div
                    key={i}
                    className="border border-slate-600 rounded-xl p-3 space-y-2"
                  >
                    {field("Serviço", s.title, (v) =>
                      changeBlueprint({
                        ...draftBlueprint,
                        services: draftBlueprint.services.map((x, j) =>
                          j === i ? { ...x, title: v } : x,
                        ),
                      }),
                    )}
                    {field(
                      "Descrição",
                      s.description,
                      (v) =>
                        changeBlueprint({
                          ...draftBlueprint,
                          services: draftBlueprint.services.map((x, j) =>
                            j === i ? { ...x, description: v } : x,
                          ),
                        }),
                      true,
                    )}
                    {s.source === "known" &&
                      field("Preço confirmado (opcional)", s.price || "", (v) =>
                        changeBlueprint({
                          ...draftBlueprint,
                          services: draftBlueprint.services.map((x, j) =>
                            j === i ? { ...x, price: v } : x,
                          ),
                        }),
                      )}
                    {s.source === "ai_suggestion" && (
                      <>
                        <p className="text-amber-300 text-xs">
                          Sugestão da IA — revisar antes de publicar
                        </p>
                        <button
                          className="underline text-emerald-300"
                          onClick={() =>
                            changeBlueprint({
                              ...draftBlueprint,
                              services: draftBlueprint.services.map((x, j) =>
                                j === i ? { ...x, source: "known" } : x,
                              ),
                            })
                          }
                        >
                          Confirmar serviço com o responsável
                        </button>
                      </>
                    )}
                    <button
                      className="block text-rose-300 underline"
                      onClick={() =>
                        changeBlueprint({
                          ...draftBlueprint,
                          services: draftBlueprint.services.filter((_, j) => j !== i),
                        })
                      }
                    >
                      Remover serviço
                    </button>
                  </div>
                ))}
                <button
                  disabled={effectiveDraft.services.length >= 12}
                  className="underline"
                  onClick={() =>
                    changeBlueprint({
                      ...draftBlueprint,
                      services: [
                        ...draftBlueprint.services,
                        {
                          title: "Novo serviço",
                          description: "",
                          source: "ai_suggestion",
                        },
                      ],
                    })
                  }
                >
                  Adicionar serviço para revisar
                </button>
              </div>
            </details>
            <details>
              <summary>SEO</summary>
              {field("Título SEO", effectiveDraft.seo.title, (v) =>
                changeBlueprint({ ...draftBlueprint, seo: { ...draftBlueprint.seo, title: v } }),
              )}
              {field(
                "Descrição SEO",
                effectiveDraft.seo.description,
                (v) =>
                  changeBlueprint({ ...draftBlueprint, seo: { ...draftBlueprint.seo, description: v } }),
                true,
              )}
            </details>
            <div className="editor-control-section editor-section-order">
              <p className="font-bold">Seções e ordem</p>
              {effectiveDraft.sectionOrder.map((s, i) => (
                <div key={s} className="flex gap-2 items-center">
                  <label className="flex-1">
                    <input
                      type="checkbox"
                      checked={effectiveDraft.sections[s]}
                      onChange={(e) =>
                        changeOverrides((prev) => ({
                          ...prev,
                          sectionVisibility: {
                            ...prev.sectionVisibility,
                            [s]: e.target.checked,
                          },
                        }))
                      }
                    />{" "}
                    {s}
                  </label>
                  <button
                    aria-label={"Mover " + s + " acima"}
                    disabled={i === 0}
                    onClick={() => {
                      const a = [...effectiveDraft.sectionOrder];
                      [a[i - 1], a[i]] = [a[i], a[i - 1]];
                      changeOverrides((prev) => ({ ...prev, sectionOrder: a as any }));
                    }}
                  >
                    ↑
                  </button>
                  <button
                    aria-label={"Mover " + s + " abaixo"}
                    disabled={i === 4}
                    onClick={() => {
                      const a = [...effectiveDraft.sectionOrder];
                      [a[i], a[i + 1]] = [a[i + 1], a[i]];
                      changeOverrides((prev) => ({ ...prev, sectionOrder: a as any }));
                    }}
                  >
                    ↓
                  </button>
                </div>
              ))}
            </div>
            <section className="editor-control-section">
              <h4 className="editor-section-title">
                <Sparkles size={15} aria-hidden="true" /> Assistente de conteúdo
              </h4>
              <ModelControls
                settings={crm.crmSettings}
                value={selection}
                onChange={setSelection}
                disabled={busy}
              />
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    ["headline", "Regenerar headline"],
                    ["about", "Regenerar Sobre"],
                    ["cta", "Melhorar CTA"],
                    ["services", "Sugerir serviços"],
                    ["tone", "Aplicar tom com IA"],
                  ] as const
                ).map(([s, label]) => (
                  <button
                    key={s}
                    onClick={() => regenerate(s)}
                    className="bg-indigo-900 rounded-lg px-3 py-2 text-xs"
                  >
                    {label}
                  </button>
                ))}
              </div>
            </section>
            <div className="editor-save-panel">
              <label className="editor-review-label">
                <input
                  type="checkbox"
                  checked={reviewed}
                  onChange={(e) => {
                    setReviewed(e.target.checked);
                    setDirty(true);
                  }}
                />{" "}
                Revisei os textos e confirmei que correspondem aos dados
                disponíveis.
              </label>
              <button onClick={runSave} className="site-primary-action w-full">
                <Save size={17} aria-hidden="true" /> Salvar projeto
              </button>
              <button
                onClick={exportSite}
                className="site-secondary-action w-full"
              >
                <Download size={17} aria-hidden="true" /> Exportar site.zip
              </button>
            </div>
          </fieldset>
          <section className="site-surface editor-live-preview">
            <div className="preview-section-heading">
              <span className="site-eyebrow">02 · PRÉVIA DO PROJETO</span>
              <h3>Veja o site ganhar forma</h3>
              <p>Confira as versões desktop e mobile enquanto edita.</p>
            </div>
            {project.siteDesign && <details className="rounded-xl p-3 border border-slate-600">
              <summary>Direção visual e fontes utilizadas</summary>
              <p>Família: {project.siteDesign.specification.family.id}. Dados: {project.siteDesign.referenceBrief.business.source.source}.</p>
              <p>Site anterior: {{ absent: 'não informado', audited: 'HTML analisado', blocked: 'URL bloqueada por segurança', failed: 'análise indisponível' }[project.siteDesign.referenceBrief.currentBusiness.status]}.</p>
              {project.siteDesign.referenceBrief.currentBusiness.technicalProblems.map((p,i) => <p key={i}>{p}</p>)}
              <p>A análise estática não verifica aparência, velocidade ou responsividade do site anterior.</p>
              <p>{project.siteDesign.referenceBrief.market.references.length} referências de mercado. Informações encontradas na web não foram incorporadas como fatos.</p>
              <button type="button" disabled={busy} onClick={refreshAudit}>Atualizar análise do site anterior</button>
            </details>}
            {busy && <p role="status">Processando…</p>}
            {!reviewed && (
              <p className="rounded-xl p-3 bg-amber-950 text-amber-200">
                Rascunho de IA: revise todas as afirmações. Serviços,
                experiência e benefícios sugeridos não são fatos confirmados.
              </p>
            )}
            <SitePreview blueprint={effectiveDraft} context={project.siteContext} design={project.siteDesign} mediaManifest={mediaManager.manifest} assetUrls={mediaManager.objectUrls} />
          </section>
        </div>
      )}
    </div>
  );
};
