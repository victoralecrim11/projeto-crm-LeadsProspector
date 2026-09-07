import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCrm } from "../hooks/useCrm";
import { buildLeadSiteContext } from "../site-builder/context";
import {
  templates,
  tones,
  type ModelSelection,
  type SitePreferences,
} from "../site-builder/types";
import { generateSiteBlueprint } from "../services/siteGenerationService";
import { ModelControls } from "../site-builder/components/ModelControls";
import { toast } from "../store/toastStore";

export const SiteGeneratorModal: React.FC = () => {
  const crm = useCrm();
  const navigate = useNavigate();
  const [leadId, setLeadId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [selection, setSelection] = useState<ModelSelection>({ mode: "auto" });
  const [prefs, setPrefs] = useState<SitePreferences>({
    siteType: "landing-page",
    templateId: "premium-service",
    style: "moderno",
    goal: "contact",
  });
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
    let project: ReturnType<typeof crm.addProject> | undefined;
    try {
      const context = buildLeadSiteContext(lead);
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
      const result = await generateSiteBlueprint(crm.crmSettings, {
        leadId: lead.id,
        context,
        preferences: prefs,
        modelSelection: selection,
      });
      crm.updateProject({
        ...project,
        siteBlueprint: result.blueprint,
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
      toast("Site gerado. Revise o conteúdo no editor.");
      crm.setIsCreateSiteModalOpen(false);
      crm.setSiteGeneratorLead(null);
      navigate("/editor?project=" + encodeURIComponent(project.id));
    } catch (e) {
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
        <fieldset disabled={busy} className="space-y-3">
          <label className="block">
            Lead
            <select
              className="block w-full p-2 bg-slate-800 rounded-lg"
              value={leadId}
              onChange={(e) => setLeadId(e.target.value)}
            >
              <option value="">Selecione um lead</option>
              {crm.leads.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name} · {l.city}
                </option>
              ))}
            </select>
          </label>
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
          <label className="block">
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
          </label>
        </fieldset>
        <ModelControls
          settings={crm.crmSettings}
          value={selection}
          onChange={setSelection}
          disabled={busy}
        />
        {error && (
          <p role="alert" className="text-rose-300">
            {error}
          </p>
        )}
        <button
          disabled={
            busy ||
            !lead ||
            (selection.mode === "explicit" && !selection.modelId)
          }
          onClick={generate}
          className="w-full p-3 rounded-xl bg-indigo-600 disabled:opacity-50 font-bold"
        >
          {busy ? "Gerando site… aguarde a resposta da IA" : "✨ Gerar Site"}
        </button>
        {!lead && <p>Adicione um lead no radar ou no CRM para continuar.</p>}
      </section>
    </div>
  );
};
