import React, { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { useCrm } from "../hooks/useCrm";
import "./editor/editor.css";
import {
  blueprintSchema,
  type GeneratedSiteBlueprint,
  type ModelSelection,
  type RegenerationSection,
} from "../site-builder/types";
import { constrainBlueprint } from "../site-builder/context";
import { resolvePresentation } from "../site-builder/renderer/presentation";
import { ModelControls } from "../site-builder/components/ModelControls";
import { MediaPanel } from "../site-builder/components/MediaPanel";
import { useMediaManager } from "../site-builder/media/useMediaManager";
import { autoResolveEligibleMedia } from "../site-builder/media/autoResolveService";
import {
  isLicensedAutoResolveEligible,
  deriveDefaultMediaPlan,
} from "../site-builder/media/mediaPlanBuilder";
import {
  generateSiteBlueprint,
  generateStandardBlueprint,
} from "../services/siteGenerationService";
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
  PanelLeftOpen,
  PanelRightOpen,
} from "lucide-react";

// E.2 Editor workspace components
import { EditorToolbar } from "./editor/EditorToolbar";
import { SectionNavigator } from "./editor/SectionNavigator";
import { PreviewCanvas } from "./editor/PreviewCanvas";
import { ContextualInspector } from "./editor/ContextualInspector";
import type { EditorTarget, PreviewViewport } from "./editor/types";

export const VisualEditorView: React.FC = () => {
  const crm = useCrm();
  const [params, setParams] = useSearchParams();

  const project = params.get("project")
    ? crm.projects.find((p) => p.id === params.get("project"))
    : crm.projects.find(
        (p) => p.leadId === crm.currentEditingLead?.id && p.siteBlueprint,
      ) || crm.projects.find((p) => p.siteBlueprint);

  const { snapshot, pushSnapshot, undo, redo, canUndo, canRedo } =
    useEditorHistory({
      blueprint: project?.siteBlueprint as GeneratedSiteBlueprint,
      overrides: project?.siteOverrides || {},
    });

  const draftBlueprint = snapshot.blueprint;
  const draftOverrides = snapshot.overrides || {};
  const effectiveDraft = applySiteUserOverrides(draftBlueprint, draftOverrides);

  // ── Persistent document state ──────────────────────────────
  const [reviewed, setReviewed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [selection, setSelection] = useState<ModelSelection>({ mode: "auto" });
  const [autoResolveStatus, setAutoResolveStatus] = useState<
    "idle" | "resolving" | "done" | "not-configured"
  >("idle");
  const [autoResolveMessage, setAutoResolveMessage] = useState<string>("");

  // ── Transient editor UI state (never persisted) ────────────
  const [selectedTarget, setSelectedTarget] = useState<EditorTarget | null>(null);
  const [hoveredSectionId, setHoveredSectionId] = useState<string | null>(null);
  const [previewViewport, setPreviewViewport] = useState<PreviewViewport>("Desktop");
  const [navigatorOpen, setNavigatorOpen] = useState(false);
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const [liveAnnouncement, setLiveAnnouncement] = useState("");

  const selectedSectionId =
    selectedTarget?.scope === "section" ? selectedTarget.sectionId : null;

  // ── Media ──────────────────────────────────────────────────
  const mediaPlan = React.useMemo(() => {
    if (project?.siteMediaPlan) return project.siteMediaPlan;
    if (project?.siteBlueprint && project?.siteContext) {
      return deriveDefaultMediaPlan(project);
    }
    return undefined;
  }, [project]);

  useEffect(() => {
    if (project && !project.siteMediaPlan && mediaPlan) {
      crm.updateProject({ ...project, siteMediaPlan: mediaPlan });
    }
  }, [project, mediaPlan, crm]);

  const handleManifestChange = useCallback(
    (updatedManifest: MediaManifest) => {
      if (!project) return;
      crm.updateProject({ ...project, siteMediaManifest: updatedManifest });
    },
    [project, crm],
  );

  const mediaManager = useMediaManager({
    projectId: project?.id || "",
    niche: project?.category?.toLowerCase() || "business",
    subNiche: undefined,
    imageryDirection: project?.siteDesign?.imageryDirection,
    mediaPlan: mediaPlan,
    initialManifest: project?.siteMediaManifest,
    onManifestChange: handleManifestChange,
  });

  // Reset transient UI when project switches
  useEffect(() => {
    setReviewed(project?.contentReviewed || false);
    setDirty(false);
    setAutoResolveStatus("idle");
    setAutoResolveMessage("");
    // Transient — intentionally reset
    setSelectedTarget(null);
    setHoveredSectionId(null);
    setPreviewViewport("Desktop");
  }, [project?.id]);

  // Auto-resolve eligible media
  const triggerAutoResolve = useCallback(async () => {
    if (!mediaPlan || mediaPlan.items.length === 0) return;
    setAutoResolveStatus("resolving");
    setAutoResolveMessage("Buscando imagens licenciadas ilustrativas...");
    try {
      const result = await autoResolveEligibleMedia(mediaPlan, mediaManager);
      if (result.resolved > 0) {
        setAutoResolveMessage(
          `${result.resolved} imagem(ns) selecionada(s) automaticamente para revisão.`,
        );
        setAutoResolveStatus("done");
      } else if (result.skipped === 0 && result.failed === 0) {
        setAutoResolveMessage("");
        setAutoResolveStatus("idle");
      } else {
        setAutoResolveMessage(
          "Provedores de mídia não configurados. O site continuará com o layout visual sem imagens.",
        );
        setAutoResolveStatus("not-configured");
      }
    } catch {
      setAutoResolveMessage(
        "Provedores de mídia não configurados. O site continuará com o layout visual sem imagens.",
      );
      setAutoResolveStatus("not-configured");
    }
  }, [mediaPlan, mediaManager]);

  useEffect(() => {
    if (!mediaPlan || mediaPlan.items.length === 0) return;
    const hasUnresolved = mediaPlan.items.some(
      (item) =>
        item.sourcePreference === "licensed" &&
        isLicensedAutoResolveEligible(item) &&
        !mediaManager.manifest.entries.some((e) => e.requestId === item.id),
    );
    if (hasUnresolved && autoResolveStatus === "idle") {
      void triggerAutoResolve();
    }
  }, [mediaPlan, mediaManager.manifest.entries, autoResolveStatus, triggerAutoResolve]);

  // Warn before unload when dirty
  useEffect(() => {
    const before = (e: BeforeUnloadEvent) => {
      if (dirty) { e.preventDefault(); e.returnValue = ""; }
    };
    window.addEventListener("beforeunload", before);
    return () => window.removeEventListener("beforeunload", before);
  }, [dirty]);

  // ── Document change helpers ────────────────────────────────
  const changeBlueprint = useCallback(
    (next: GeneratedSiteBlueprint) => {
      pushSnapshot({ blueprint: next, overrides: draftOverrides });
      setReviewed(false);
      setDirty(true);
    },
    [pushSnapshot, draftOverrides],
  );

  const changeOverrides = useCallback(
    (updater: (prev: SiteUserOverrides) => SiteUserOverrides) => {
      pushSnapshot({ blueprint: draftBlueprint, overrides: updater(draftOverrides) });
      setDirty(true);
    },
    [pushSnapshot, draftBlueprint, draftOverrides],
  );

  // ── Navigator callbacks ────────────────────────────────────
  const handleReorderSection = useCallback(
    (sectionId: string, direction: "up" | "down") => {
      const order = [...effectiveDraft.sectionOrder];
      const idx = order.indexOf(sectionId as any);
      if (idx < 0) return;
      const swapIdx = direction === "up" ? idx - 1 : idx + 1;
      if (swapIdx < 0 || swapIdx >= order.length) return;
      [order[idx], order[swapIdx]] = [order[swapIdx], order[idx]];
      changeOverrides((prev) => ({ ...prev, sectionOrder: order as any }));
      // selectedTarget already uses sectionId — stable, no change needed
      const labels: Record<string, string> = {
        hero: "Abertura", about: "Sobre", services: "Serviços",
        contact: "Contato", location: "Localização",
      };
      setLiveAnnouncement(
        `Seção ${labels[sectionId] ?? sectionId} movida para posição ${swapIdx + 1}.`,
      );
      setTimeout(() => setLiveAnnouncement(""), 2000);
    },
    [effectiveDraft.sectionOrder, changeOverrides],
  );

  const handleToggleVisibility = useCallback(
    (sectionId: string, visible: boolean) => {
      changeOverrides((prev) => ({
        ...prev,
        sectionVisibility: { ...prev.sectionVisibility, [sectionId]: visible },
      }));
    },
    [changeOverrides],
  );

  // After undo/redo, clear selectedTarget if its section no longer exists
  const handleUndo = useCallback(() => {
    undo();
    // The snapshot will change on next render; check validity then
  }, [undo]);

  const handleRedo = useCallback(() => {
    redo();
  }, [redo]);

  // Clean up invalid selectedTarget after blueprint/overrides changes
  useEffect(() => {
    if (selectedTarget?.scope !== "section") return;
    const exists = effectiveDraft.sectionOrder.includes(
      selectedTarget.sectionId as any,
    );
    if (!exists) setSelectedTarget(null);
  }, [effectiveDraft.sectionOrder, selectedTarget]);

  // ── Save / Export ──────────────────────────────────────────
  const save = useCallback(() => {
    if (!project?.siteContext || !draftBlueprint) {
      throw new Error("Selecione um projeto gerado.");
    }
    const blueprint = constrainBlueprint(draftBlueprint, project.siteContext);
    const next = {
      ...project,
      siteBlueprint: blueprint,
      siteOverrides: draftOverrides, // persist overrides
      siteDesign: project.siteDesign, // immutable baseline preserved
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
  }, [project, draftBlueprint, draftOverrides, mediaPlan, mediaManager.manifest, reviewed, crm]);

  const runSave = useCallback(() => {
    try { save(); toast("Projeto salvo."); }
    catch (e) { toast((e as Error).message, "error"); }
  }, [save]);

  const refreshAudit = useCallback(async () => {
    if (!project?.siteDesign || !draftBlueprint || busy) return;
    setBusy(true);
    try {
      const result = await generateStandardBlueprint(
        crm.crmSettings,
        project.siteDesign.referenceBrief.business.source,
      );
      crm.updateProject({
        ...project,
        siteDesign: { ...project.siteDesign, referenceBrief: result.design.referenceBrief },
      });
      toast("Análise do site anterior atualizada.");
    } catch (e) { toast((e as Error).message, "error"); }
    finally { setBusy(false); }
  }, [project, draftBlueprint, busy, crm]);

  const regenerate = useCallback(
    async (section: RegenerationSection) => {
      if (!project?.siteContext || !draftBlueprint || busy) return;
      setBusy(true);
      try {
        const pres = resolvePresentation(effectiveDraft);
        const result = await generateSiteBlueprint(crm.crmSettings, {
          leadId: project.leadId || project.id,
          context: project.siteContext,
          blueprint: draftBlueprint,
          section,
          modelSelection: selection,
          preferences: {
            siteType: project.type === "Site Institucional" ? "institutional" : "landing-page",
            templateId: effectiveDraft.templateId,
            style: pres.motion === "none" ? "minimalista" : effectiveDraft.brand.tone,
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
        toast(
          result.generation.fallbackUsed
            ? "A IA está indisponível. Seção alterada com modelo local offline."
            : "Seção regenerada. Revise o novo conteúdo.",
        );
      } catch (e) { toast((e as Error).message, "error"); }
      finally { setBusy(false); }
    },
    [project, draftBlueprint, busy, effectiveDraft, selection, crm, changeBlueprint],
  );

  const exportSite = useCallback(async () => {
    setBusy(true);
    try {
      const next = save();
      const selectedOnly = next.siteMediaManifest?.entries.filter(
        (e) => e.reviewStatus === "selected",
      );
      if (selectedOnly && selectedOnly.length > 0) {
        const reviewNow = window.confirm(
          `Há ${selectedOnly.length} imagem(ns) selecionada(s) automaticamente que ainda não foi(ram) aprovada(s).\n\nElas NÃO entrarão no arquivo ZIP exportado, e o site exibirá o layout visual padrão sem fotos nessas seções.\n\nClique em OK para revisar as imagens agora, ou Cancelar para exportar sem elas.`,
        );
        if (reviewNow) { setBusy(false); return; }
      }
      await downloadSiteZip(next);
      crm.updateProject({ ...next, generationStatus: "exported" });
      toast("Site exportado em ZIP.");
    } catch (e) { toast((e as Error).message, "error"); }
    finally { setBusy(false); }
  }, [save, crm]);

  // ────────────────────────────────────────────────────────────
  return (
    <div className="site-workspace editor-workspace pb-12">
      {/* Page heading + project picker */}
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

      {/* Project selector */}
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
                if (dirty && !window.confirm("Trocar de projeto e descartar alterações não salvas?")) return;
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
            Este projeto ainda não possui um site gerado. Use "Gerar novo site" para
            começar.
          </p>
          {project?.generationError && <p role="alert">{project.generationError}</p>}
        </div>
      ) : (
        <div className="adv-editor-shell" data-testid="adv-editor-shell">
          {/* ── Toolbar ──────────────────────────────────────── */}
          <EditorToolbar
            dirty={dirty}
            busy={busy}
            canUndo={canUndo}
            canRedo={canRedo}
            previewViewport={previewViewport}
            onUndo={handleUndo}
            onRedo={handleRedo}
            onViewportChange={setPreviewViewport}
            onSave={runSave}
            onExport={exportSite}
          />

          {/* ── 3-column workspace ───────────────────────────── */}
          <div className="adv-editor-body">
            {/* Mobile drawer toggles */}
            <button
              type="button"
              className="adv-drawer-toggle adv-drawer-toggle-nav"
              aria-label={navigatorOpen ? "Fechar navegação" : "Abrir navegação"}
              aria-expanded={navigatorOpen}
              onClick={() => setNavigatorOpen((o) => !o)}
            >
              <PanelLeftOpen size={18} aria-hidden="true" />
            </button>
            <button
              type="button"
              className="adv-drawer-toggle adv-drawer-toggle-insp"
              aria-label={inspectorOpen ? "Fechar inspetor" : "Abrir inspetor"}
              aria-expanded={inspectorOpen}
              onClick={() => setInspectorOpen((o) => !o)}
            >
              <PanelRightOpen size={18} aria-hidden="true" />
            </button>

            {/* Navigator column */}
            <aside
              className={`adv-navigator-col${navigatorOpen ? " open" : ""}`}
              aria-label="Navegação de seções"
            >
              <SectionNavigator
                effectiveBlueprint={effectiveDraft}
                overrides={draftOverrides}
                selectedTarget={selectedTarget}
                hoveredSectionId={hoveredSectionId}
                busy={busy}
                liveAnnouncement={liveAnnouncement}
                onSelectTarget={(t) => {
                  setSelectedTarget(t);
                  setNavigatorOpen(false); // collapse on mobile
                }}
                onHoverSection={setHoveredSectionId}
                onReorderSection={handleReorderSection}
                onToggleVisibility={handleToggleVisibility}
              />
            </aside>

            {/* Preview column */}
            <main className="adv-preview-col" aria-label="Prévia do site">
              {project.siteDesign && (
                <details className="adv-design-meta rounded-xl p-3 border border-slate-600 mb-3">
                  <summary>Direção visual e fontes utilizadas</summary>
                  <p>
                    Família: {project.siteDesign.specification.family.id}. Dados:{" "}
                    {project.siteDesign.referenceBrief.business.source.source}.
                  </p>
                  <p>
                    Site anterior:{" "}
                    {
                      {
                        absent: "não informado",
                        audited: "HTML analisado",
                        blocked: "URL bloqueada por segurança",
                        failed: "análise indisponível",
                      }[project.siteDesign.referenceBrief.currentBusiness.status]
                    }
                    .
                  </p>
                  <button type="button" disabled={busy} onClick={refreshAudit}>
                    Atualizar análise do site anterior
                  </button>
                </details>
              )}
              {busy && <p role="status">Processando…</p>}
              {!reviewed && (
                <p className="rounded-xl p-3 bg-amber-950 text-amber-200 mb-3">
                  Rascunho de IA: revise todas as afirmações. Serviços, experiência e
                  benefícios sugeridos não são fatos confirmados.
                </p>
              )}

              <PreviewCanvas
                blueprint={effectiveDraft}
                context={project.siteContext}
                design={project.siteDesign}
                mediaManifest={mediaManager.manifest}
                assetUrls={mediaManager.objectUrls}
                previewViewport={previewViewport}
                selectedSectionId={selectedSectionId}
                hoveredSectionId={hoveredSectionId}
                onSectionSelected={(sectionId) => {
                  setSelectedTarget({ scope: "section", sectionId });
                  setInspectorOpen(true);
                }}
                onHoverSection={setHoveredSectionId}
              />
            </main>

            {/* Inspector column */}
            <aside
              className={`adv-inspector-col${inspectorOpen ? " open" : ""}`}
              aria-label="Inspetor de propriedades"
            >
              <ContextualInspector
                selectedTarget={selectedTarget}
                effectiveBlueprint={effectiveDraft}
                draftBlueprint={draftBlueprint}
                overrides={draftOverrides}
                busy={busy}
                onChangeBlueprint={changeBlueprint}
                onChangeOverrides={changeOverrides}
              />

              {/* Media panel — shown when a section with media is selected */}
              {mediaPlan && selectedSectionId && (
                <section className="adv-inspector-media-section" data-testid="media-panel-section">
                  <p className="adv-inspector-subheading">Mídia da Seção</p>
                  <MediaPanel
                    mediaPlan={{
                      ...mediaPlan,
                      items: mediaPlan.items.filter(
                        (i) => i.section === selectedSectionId,
                      ),
                    }}
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
                          const secId = item.section as "hero" | "about";
                          if (secId === "hero" || secId === "about") {
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
                          const secId = item.section as "hero" | "about";
                          if (secId === "hero" || secId === "about") {
                            newContent[secId] = { ...newContent[secId], assetId };
                          }
                          return { ...prev, content: newContent };
                        });
                      }
                    }}
                  />
                </section>
              )}

              {/* AI copy regen (visible at global level) */}
              {selectedTarget?.scope === "site" && (
                <section className="adv-inspector-ai-section">
                  <p className="adv-inspector-subheading">Assistente de conteúdo</p>
                  <ModelControls
                    settings={crm.crmSettings}
                    value={selection}
                    onChange={setSelection}
                    disabled={busy}
                  />
                  <div className="flex flex-wrap gap-2 mt-2">
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
                        type="button"
                        onClick={() => regenerate(s)}
                        className="bg-indigo-900 rounded-lg px-3 py-2 text-xs"
                        disabled={busy}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </section>
              )}

              {/* Review checkbox + media auto-resolve (global level) */}
              {selectedTarget?.scope === "site" && (
                <div className="adv-inspector-review-panel">
                  <label className="editor-review-label">
                    <input
                      type="checkbox"
                      checked={reviewed}
                      onChange={(e) => {
                        setReviewed(e.target.checked);
                        setDirty(true);
                      }}
                    />{" "}
                    Revisei os textos e confirmei que correspondem aos dados disponíveis.
                  </label>
                  {autoResolveStatus === "idle" &&
                    mediaPlan?.items.some((i) => i.sourcePreference === "licensed") && (
                      <button
                        type="button"
                        onClick={() => void triggerAutoResolve()}
                        disabled={busy}
                        className="w-full py-2 px-3 rounded-lg bg-indigo-900/80 hover:bg-indigo-900 text-white font-medium text-xs flex items-center justify-center gap-2 transition-all mt-2"
                      >
                        <Sparkles size={14} aria-hidden="true" /> Buscar imagens
                        automaticamente
                      </button>
                    )}
                  {autoResolveMessage && (
                    <p className="text-xs text-slate-400 mt-1">{autoResolveMessage}</p>
                  )}
                </div>
              )}
            </aside>
          </div>
        </div>
      )}
    </div>
  );
};
