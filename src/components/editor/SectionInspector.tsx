import React from "react";
import { visualVariants } from "../../site-builder/types";
import type { GeneratedSiteBlueprint } from "../../site-builder/types";
import type { SiteUserOverrides } from "../../site-builder/contracts/overrides";
import type { VisualVariants } from "../../site-builder/types";

const SECTION_LABELS: Record<string, string> = {
  hero: "Abertura",
  about: "Sobre",
  services: "Serviços",
  contact: "Contato",
  location: "Localização",
};

const VARIANT_LABELS: Record<string, string> = {
  "full-bleed": "Abertura ampla",
  split: "Duas colunas",
  minimal: "Essencial",
  "editorial-split": "Editorial em colunas",
  "centered-story": "Narrativa centralizada",
  "editorial-list": "Lista editorial",
  "horizontal-cards": "Blocos em colunas",
  "contact-minimal": "Contato essencial",
  "contact-split": "Contato em colunas",
  editorial: "Editorial",
  "location-editorial": "Editorial de localização",
  inline: "Navegação em linha",
};

// Sanitize: block raw HTML, scripts, javascript: URLs
function sanitizeText(value: string): string {
  return value
    .replace(/<[^>]*>/g, "")
    .replace(/javascript:/gi, "")
    .replace(/on\w+\s*=/gi, "");
}

function sanitizeUrl(value: string): string {
  try {
    const url = new URL(value);
    if (!["https:", "http:", "tel:", "mailto:"].includes(url.protocol)) return "";
  } catch {
    // relative or invalid — allow relative paths but strip dangerous prefixes
    if (/^javascript:/i.test(value)) return "";
  }
  return value;
}

interface Props {
  sectionId: string;
  effectiveBlueprint: GeneratedSiteBlueprint;
  draftBlueprint: GeneratedSiteBlueprint;
  overrides: SiteUserOverrides;
  busy: boolean;
  onChangeBlueprint: (next: GeneratedSiteBlueprint) => void;
  onChangeOverrides: (updater: (prev: SiteUserOverrides) => SiteUserOverrides) => void;
}

export const SectionInspector: React.FC<Props> = ({
  sectionId,
  effectiveBlueprint,
  draftBlueprint,
  overrides,
  busy,
  onChangeBlueprint,
  onChangeOverrides,
}) => {
  const label = SECTION_LABELS[sectionId] ?? sectionId;

  // Variants for this section (only known sections have visual variants)
  const sectionVariants =
    visualVariants[sectionId as keyof typeof visualVariants] ?? [];
  const currentVariant =
    effectiveBlueprint.visual[sectionId as keyof VisualVariants] ?? "";
  const hasVariantOverride = !!(overrides.visual as Record<string, string> | undefined)?.[sectionId];

  const field = (
    fieldLabel: string,
    id: string,
    value: string,
    onChange: (v: string) => void,
    multiline = false,
    maxLen = 1600,
  ) => (
    <label className="adv-inspector-label" htmlFor={id}>
      {fieldLabel}
      {multiline ? (
        <textarea
          id={id}
          maxLength={maxLen}
          className="adv-inspector-textarea"
          value={value}
          onChange={(e) => onChange(sanitizeText(e.target.value))}
          disabled={busy}
        />
      ) : (
        <input
          id={id}
          type="text"
          maxLength={maxLen}
          className="adv-inspector-input"
          value={value}
          onChange={(e) => onChange(sanitizeText(e.target.value))}
          disabled={busy}
        />
      )}
    </label>
  );

  return (
    <fieldset disabled={busy} className="adv-inspector-fieldset">
      <p className="adv-inspector-title">{label}</p>

      {/* ── Variant ─────────────────────────────────────── */}
      {sectionVariants.length > 1 && (
        <div className="adv-inspector-group">
          <div className="adv-inspector-subheading-row">
            <p className="adv-inspector-subheading">Layout / Variante</p>
            {hasVariantOverride && (
              <button
                type="button"
                className="adv-reset-btn"
                onClick={() =>
                  onChangeOverrides((prev) => {
                    const newVisual = { ...prev.visual };
                    delete (newVisual as Record<string, string>)[sectionId];
                    return { ...prev, visual: newVisual };
                  })
                }
              >
                Restaurar original
              </button>
            )}
          </div>
          <label className="adv-inspector-label" htmlFor={`si-variant-${sectionId}`}>
            Variante
            <select
              id={`si-variant-${sectionId}`}
              className="adv-inspector-select"
              value={currentVariant}
              onChange={(e) =>
                onChangeOverrides((prev) => ({
                  ...prev,
                  visual: { ...prev.visual, [sectionId]: e.target.value },
                }))
              }
            >
              {sectionVariants.map((v) => (
                <option key={v} value={v}>
                  {VARIANT_LABELS[v] ?? v}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}

      {/* ── Content by section ──────────────────────────── */}
      {sectionId === "hero" && (
        <div className="adv-inspector-group">
          <p className="adv-inspector-subheading">Conteúdo</p>
          {field("Título principal", "si-hero-headline", effectiveBlueprint.hero.headline, (v) =>
            onChangeBlueprint({ ...draftBlueprint, hero: { ...draftBlueprint.hero, headline: v } }), false, 180,
          )}
          {field("Subtítulo", "si-hero-subtitle", effectiveBlueprint.hero.subtitle, (v) =>
            onChangeBlueprint({ ...draftBlueprint, hero: { ...draftBlueprint.hero, subtitle: v } }), true,
          )}
          {field("Texto do botão CTA", "si-hero-cta", effectiveBlueprint.hero.ctaText, (v) =>
            onChangeBlueprint({ ...draftBlueprint, hero: { ...draftBlueprint.hero, ctaText: v } }), false, 180,
          )}
          <label className="adv-inspector-label" htmlFor="si-hero-ctatype">
            Canal do botão
            <select
              id="si-hero-ctatype"
              className="adv-inspector-select"
              value={effectiveBlueprint.hero.ctaType}
              onChange={(e) =>
                onChangeBlueprint({
                  ...draftBlueprint,
                  hero: {
                    ...draftBlueprint.hero,
                    ctaType: e.target.value as GeneratedSiteBlueprint["hero"]["ctaType"],
                  },
                })
              }
            >
              {["none", "contact", "phone", "whatsapp"].map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </label>
          <p className="adv-inspector-hint">
            Canais ausentes nos dados do lead são omitidos na página exportada.
          </p>
          {/* Media */}
          {effectiveBlueprint.hero.assetId && (
            <button
              type="button"
              className="adv-remove-media-btn"
              onClick={() =>
                onChangeOverrides((prev) => ({
                  ...prev,
                  content: {
                    ...prev.content,
                    hero: { ...prev.content?.hero, assetId: "__REMOVE__" },
                  },
                }))
              }
            >
              Remover mídia
            </button>
          )}
        </div>
      )}

      {sectionId === "about" && (
        <div className="adv-inspector-group">
          <p className="adv-inspector-subheading">Conteúdo</p>
          {field("Título Sobre", "si-about-title", effectiveBlueprint.about.title, (v) =>
            onChangeBlueprint({ ...draftBlueprint, about: { ...draftBlueprint.about, title: v } }), false, 180,
          )}
          {field("Descrição", "si-about-desc", effectiveBlueprint.about.description, (v) =>
            onChangeBlueprint({ ...draftBlueprint, about: { ...draftBlueprint.about, description: v } }), true,
          )}
          {effectiveBlueprint.about.assetId && (
            <button
              type="button"
              className="adv-remove-media-btn"
              onClick={() =>
                onChangeOverrides((prev) => ({
                  ...prev,
                  content: {
                    ...prev.content,
                    about: { ...prev.content?.about, assetId: "__REMOVE__" },
                  },
                }))
              }
            >
              Remover mídia
            </button>
          )}
        </div>
      )}

      {sectionId === "services" && (
        <div className="adv-inspector-group">
          <p className="adv-inspector-subheading">
            Serviços ({effectiveBlueprint.services.length})
          </p>
          <div className="adv-services-list">
            {effectiveBlueprint.services.map((s, i) => (
              <div key={i} className="adv-service-item">
                {field(
                  `Serviço ${i + 1}`,
                  `si-svc-title-${i}`,
                  s.title,
                  (v) =>
                    onChangeBlueprint({
                      ...draftBlueprint,
                      services: draftBlueprint.services.map((x, j) =>
                        j === i ? { ...x, title: v } : x,
                      ),
                    }),
                  false,
                  180,
                )}
                {field(
                  "Descrição",
                  `si-svc-desc-${i}`,
                  s.description,
                  (v) =>
                    onChangeBlueprint({
                      ...draftBlueprint,
                      services: draftBlueprint.services.map((x, j) =>
                        j === i ? { ...x, description: v } : x,
                      ),
                    }),
                  true,
                )}
                {s.source === "ai_suggestion" && (
                  <p className="adv-inspector-hint adv-ai-warning">
                    ⚠ Sugestão da IA — revise antes de publicar
                  </p>
                )}
                <button
                  type="button"
                  className="adv-remove-media-btn"
                  onClick={() =>
                    onChangeBlueprint({
                      ...draftBlueprint,
                      services: draftBlueprint.services.filter((_, j) => j !== i),
                    })
                  }
                >
                  Remover serviço
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            disabled={effectiveBlueprint.services.length >= 12}
            className="adv-add-service-btn"
            onClick={() =>
              onChangeBlueprint({
                ...draftBlueprint,
                services: [
                  ...draftBlueprint.services,
                  { title: "Novo serviço", description: "", source: "ai_suggestion" },
                ],
              })
            }
          >
            + Adicionar serviço
          </button>
        </div>
      )}

      {sectionId === "contact" && (
        <div className="adv-inspector-group">
          <p className="adv-inspector-subheading">Contato</p>
          <p className="adv-inspector-hint">
            Os canais de contato são derivados dos dados do lead e não podem ser editados
            diretamente no site.
          </p>
        </div>
      )}

      {sectionId === "location" && (
        <div className="adv-inspector-group">
          <p className="adv-inspector-subheading">Localização</p>
          <p className="adv-inspector-hint">
            A localização é derivada dos dados do lead e não pode ser editada diretamente no
            site.
          </p>
        </div>
      )}
    </fieldset>
  );
};
