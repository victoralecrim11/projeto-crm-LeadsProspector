import React from "react";
import { templates, tones, defaultVisualVariants } from "../../site-builder/types";
import { resolvePresentation } from "../../site-builder/guidance/design-families/legacy-default";
import type { GeneratedSiteBlueprint } from "../../site-builder/types";
import type { SiteUserOverrides } from "../../site-builder/contracts/overrides";

interface Props {
  effectiveBlueprint: GeneratedSiteBlueprint;
  overrides: SiteUserOverrides;
  busy: boolean;
  onChangeOverrides: (updater: (prev: SiteUserOverrides) => SiteUserOverrides) => void;
}

/** Global design controls — all writes go through SiteUserOverrides. */
export const GlobalAppearanceInspector: React.FC<Props> = ({
  effectiveBlueprint,
  overrides,
  busy,
  onChangeOverrides,
}) => {
  const presentation = resolvePresentation(effectiveBlueprint);

  return (
    <fieldset disabled={busy} className="adv-inspector-fieldset">
      {/* Template */}
      <div className="adv-inspector-group">
        <label className="adv-inspector-label" htmlFor="gi-template">
          Template
        </label>
        <select
          id="gi-template"
          className="adv-inspector-select"
          value={effectiveBlueprint.templateId}
          onChange={(e) =>
            onChangeOverrides((prev) => ({
              ...prev,
              templateId: e.target.value as GeneratedSiteBlueprint["templateId"],
              visual: {
                ...prev.visual,
                ...defaultVisualVariants(
                  e.target.value as GeneratedSiteBlueprint["templateId"],
                ),
              },
            }))
          }
        >
          {templates.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      {/* Presentation */}
      <div className="adv-inspector-group">
        <p className="adv-inspector-subheading">Apresentação</p>
        {(["theme", "typography", "motion"] as const).map((key) => (
          <label className="adv-inspector-label" key={key} htmlFor={`gi-${key}`}>
            {{ theme: "Tema", typography: "Tipografia", motion: "Animações" }[key]}
            <select
              id={`gi-${key}`}
              className="adv-inspector-select"
              value={presentation[key]}
              onChange={(e) =>
                onChangeOverrides((prev) => ({
                  ...prev,
                  presentation: { ...prev.presentation, [key]: e.target.value },
                }))
              }
            >
              {(key === "theme"
                ? [["light", "Claro"], ["dark", "Escuro"]]
                : key === "typography"
                ? [["modern", "Moderna"], ["editorial", "Editorial"]]
                : [["subtle", "Suaves"], ["none", "Sem animação"]]
              ).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>

      {/* Brand Colors */}
      <div className="adv-inspector-group">
        <p className="adv-inspector-subheading">Cores</p>
        {(["primaryColor", "accentColor"] as const).map((k) => (
          <label key={k} className="adv-inspector-label adv-color-row" htmlFor={`gi-${k}`}>
            <span>{k === "primaryColor" ? "Principal" : "Destaque"}</span>
            <div className="adv-color-pair">
              <input
                id={`gi-${k}`}
                type="color"
                aria-label={k === "primaryColor" ? "Cor principal" : "Cor destaque"}
                value={effectiveBlueprint.brand[k]}
                onChange={(e) =>
                  onChangeOverrides((prev) => ({
                    ...prev,
                    brand: { ...prev.brand, [k]: e.target.value },
                  }))
                }
                className="adv-color-input"
              />
              <span className="adv-color-value">{effectiveBlueprint.brand[k]}</span>
            </div>
          </label>
        ))}
      </div>

      {/* Tone */}
      <div className="adv-inspector-group">
        <label className="adv-inspector-label" htmlFor="gi-tone">
          Tom
        </label>
        <select
          id="gi-tone"
          className="adv-inspector-select"
          value={effectiveBlueprint.brand.tone}
          onChange={(e) =>
            onChangeOverrides((prev) => ({
              ...prev,
              brand: {
                ...prev.brand,
                tone: e.target.value as GeneratedSiteBlueprint["brand"]["tone"],
              },
            }))
          }
        >
          {tones.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>
    </fieldset>
  );
};
