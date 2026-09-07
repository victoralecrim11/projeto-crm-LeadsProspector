import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCrm } from "../hooks/useCrm";
import { SitePreview } from "../site-builder/components/SitePreview";
import {
  Building2,
  ChevronDown,
  Globe,
  ShieldCheck,
  Sparkles,
  PanelsTopLeft,
  ArrowUpRight,
  MapPin,
} from "lucide-react";
export const RedesenhoView: React.FC = () => {
  const crm = useCrm();
  const navigate = useNavigate();
  const [id, setId] = useState(
    crm.currentEditingLead?.id || crm.leads[0]?.id || "",
  );
  const lead = crm.leads.find((l) => l.id === id);
  const project = crm.projects.find(
    (p) => p.leadId === id && p.siteBlueprint && p.siteContext,
  );
  const safeUrl =
    lead?.websiteUrl && /^https?:\/\//i.test(lead.websiteUrl)
      ? lead.websiteUrl
      : null;
  return (
    <div className="site-workspace redesign-workspace">
      <header className="redesign-heading">
        <span className="site-eyebrow">
          <PanelsTopLeft size={15} aria-hidden="true" /> ESTÚDIO DE SITES
        </span>
        <h2>Redesenho e prévia do site</h2>
        <p>
          Do negócio local à sua próxima apresentação. Selecione um lead para
          começar.
        </p>
      </header>
      <div className="lead-picker site-surface">
        <div className="lead-picker-copy">
          <span className="site-icon">
            <Building2 size={21} aria-hidden="true" />
          </span>
          <div>
            <h3>Escolha o negócio</h3>
            <p>Use os dados do lead como ponto de partida.</p>
          </div>
        </div>
        <label className="lead-picker-field">
          <span>Lead</span>
          <div className="site-select-wrap">
            <select
              className="site-lead-select"
              value={id}
              onChange={(e) => setId(e.target.value)}
            >
              <option value="">Selecione</option>
              {crm.leads.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
            <ChevronDown size={18} aria-hidden="true" />
          </div>
        </label>
      </div>
      {lead && (
        <div className="redesign-grid">
          <section className="site-surface presence-card">
            <span className="site-eyebrow">01 · PRESENÇA ATUAL</span>
            <h3>{lead.name}</h3>
            <p className="lead-location">
              <MapPin size={15} aria-hidden="true" />
              {[lead.category, lead.city].filter(Boolean).join(" · ")}
            </p>
            <div className="presence-fact">
              <Globe size={19} aria-hidden="true" />
              <div>
                <h4>Site do negócio</h4>
                {safeUrl ? (
                  <a
                    href={safeUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="underline text-sky-300"
                  >
                    Abrir site informado
                  </a>
                ) : (
                  <p>Site não informado nos dados do lead.</p>
                )}
              </div>
            </div>
            <div className="presence-fact">
              <ShieldCheck size={19} aria-hidden="true" />
              <div>
                <h4>Auditoria técnica</h4>
                {lead.audit ? (
                  <ul>
                    {lead.audit.issues.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                ) : (
                  <p>Auditoria técnica não realizada.</p>
                )}
              </div>
            </div>
            <div className="presence-actions">
              <button
                className="site-primary-action"
                onClick={() => {
                  crm.setSiteGeneratorLead(lead);
                  crm.setIsCreateSiteModalOpen(true);
                }}
              >
                <Sparkles size={17} aria-hidden="true" /> Gerar Site com IA
              </button>
              {project && (
                <button
                  className="site-secondary-action"
                  onClick={() =>
                    navigate(
                      "/editor?project=" + encodeURIComponent(project.id),
                    )
                  }
                >
                  Editar e exportar{" "}
                  <ArrowUpRight size={17} aria-hidden="true" />
                </button>
              )}
            </div>
          </section>
          <section className="site-surface redesign-preview">
            <div className="preview-section-heading">
              <span className="site-eyebrow">02 · NOVA EXPERIÊNCIA</span>
              <h3>Prévia do site</h3>
            </div>
            {project?.siteBlueprint && project.siteContext ? (
              <SitePreview
                blueprint={project.siteBlueprint}
                context={project.siteContext}
              />
            ) : (
              <div className="site-preview-empty">
                <span className="empty-preview-icon">
                  <PanelsTopLeft size={30} aria-hidden="true" />
                </span>
                <h4>Seu próximo site começa aqui</h4>
                <p>
                  Gere um projeto para visualizar, editar e preparar uma
                  apresentação para {lead.name}.
                </p>
                <span className="preview-hint">
                  Prévia desktop e mobile · Conteúdo editável
                </span>
              </div>
            )}
          </section>
        </div>
      )}
      {!lead && (
        <div className="site-surface site-preview-empty">
          <Building2 size={28} aria-hidden="true" />
          <h3>Selecione um lead para continuar</h3>
          <p>Os negócios adicionados ao CRM aparecem no seletor acima.</p>
        </div>
      )}
    </div>
  );
};
