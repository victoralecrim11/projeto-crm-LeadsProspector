import React, { useRef, useEffect } from "react";
import {
  GripVertical,
  Eye,
  EyeOff,
  ChevronUp,
  ChevronDown,
  Palette,
} from "lucide-react";
import type { GeneratedSiteBlueprint } from "../../site-builder/types";
import type { SiteUserOverrides } from "../../site-builder/contracts/overrides";
import type { EditorTarget } from "./types";

/** Human-readable labels for the known section IDs */
const SECTION_LABELS: Record<string, string> = {
  hero: "Abertura",
  about: "Sobre",
  services: "Serviços",
  contact: "Contato",
  location: "Localização",
};

export interface SectionNavigatorProps {
  effectiveBlueprint: GeneratedSiteBlueprint;
  overrides: SiteUserOverrides;
  selectedTarget: EditorTarget | null;
  hoveredSectionId: string | null;
  busy: boolean;
  liveAnnouncement: string;
  onSelectTarget: (target: EditorTarget) => void;
  onHoverSection: (id: string | null) => void;
  onReorderSection: (sectionId: string, direction: "up" | "down") => void;
  onToggleVisibility: (sectionId: string, visible: boolean) => void;
}

export const SectionNavigator: React.FC<SectionNavigatorProps> = ({
  effectiveBlueprint,
  selectedTarget,
  hoveredSectionId,
  busy,
  liveAnnouncement,
  onSelectTarget,
  onHoverSection,
  onReorderSection,
  onToggleVisibility,
}) => {
  const siteItemRef = useRef<HTMLButtonElement>(null);
  const selectedRef = useRef<HTMLButtonElement | null>(null);

  // Scroll selected item into view when selection changes
  useEffect(() => {
    selectedRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [selectedTarget]);

  const sectionOrder = effectiveBlueprint.sectionOrder;
  const sections = effectiveBlueprint.sections;

  const isSiteSelected = selectedTarget?.scope === "site";

  return (
    <nav className="adv-navigator" aria-label="Navegação de seções">
      {/* aria-live region for reorder announcements */}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="adv-navigator-live"
        role="status"
      >
        {liveAnnouncement}
      </div>

      <p className="adv-navigator-heading">Estrutura</p>

      {/* Design do Site — site-scope target, not a section */}
      <button
        ref={isSiteSelected ? (el) => { siteItemRef.current = el; selectedRef.current = el; } : siteItemRef}
        type="button"
        aria-pressed={isSiteSelected}
        aria-current={isSiteSelected ? "true" : undefined}
        className={`adv-nav-item adv-nav-site${isSiteSelected ? " selected" : ""}`}
        onClick={() => onSelectTarget({ scope: "site" })}
      >
        <Palette size={14} aria-hidden="true" className="adv-nav-icon" />
        <span className="adv-nav-label">Design do Site</span>
      </button>

      <hr className="adv-navigator-divider" />

      {/* Section items */}
      <ul className="adv-nav-list" role="list">
        {sectionOrder.map((sectionId, idx) => {
          const isVisible = sections[sectionId as keyof typeof sections] !== false;
          const isSelected =
            selectedTarget?.scope === "section" &&
            selectedTarget.sectionId === sectionId;
          const isHovered = hoveredSectionId === sectionId;
          const isFirst = idx === 0;
          const isLast = idx === sectionOrder.length - 1;
          const label = SECTION_LABELS[sectionId] ?? sectionId;

          return (
            <li key={sectionId} className="adv-nav-list-item">
              {/* Main select button */}
              <button
                ref={isSelected ? (el) => { selectedRef.current = el; } : undefined}
                type="button"
                aria-pressed={isSelected}
                aria-current={isSelected ? "true" : undefined}
                className={`adv-nav-item${isSelected ? " selected" : ""}${isHovered ? " hovered" : ""}${!isVisible ? " hidden-section" : ""}`}
                onClick={() =>
                  onSelectTarget({ scope: "section", sectionId })
                }
                onMouseEnter={() => onHoverSection(sectionId)}
                onMouseLeave={() => onHoverSection(null)}
                title={!isVisible ? `${label} (oculta)` : label}
              >
                <GripVertical
                  size={13}
                  aria-hidden="true"
                  className="adv-nav-drag-handle"
                />
                <span className="adv-nav-label">
                  {label}
                  {!isVisible && (
                    <span className="adv-nav-hidden-badge"> (oculta)</span>
                  )}
                </span>
              </button>

              {/* Reorder & visibility controls */}
              <div className="adv-nav-controls" role="group" aria-label={`Controles de ${label}`}>
                <button
                  type="button"
                  aria-label={`Mover ${label} acima`}
                  disabled={isFirst || busy}
                  onClick={() => onReorderSection(sectionId, "up")}
                  className="adv-nav-ctrl-btn"
                  title="Mover acima"
                >
                  <ChevronUp size={13} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  aria-label={`Mover ${label} abaixo`}
                  disabled={isLast || busy}
                  onClick={() => onReorderSection(sectionId, "down")}
                  className="adv-nav-ctrl-btn"
                  title="Mover abaixo"
                >
                  <ChevronDown size={13} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  aria-label={isVisible ? `Ocultar ${label}` : `Mostrar ${label}`}
                  aria-pressed={!isVisible}
                  onClick={() => onToggleVisibility(sectionId, !isVisible)}
                  className="adv-nav-ctrl-btn"
                  title={isVisible ? "Ocultar seção" : "Mostrar seção"}
                  disabled={busy}
                >
                  {isVisible ? (
                    <Eye size={13} aria-hidden="true" />
                  ) : (
                    <EyeOff size={13} aria-hidden="true" />
                  )}
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};
