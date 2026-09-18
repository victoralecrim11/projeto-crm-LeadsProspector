import React from "react";
import type { GeneratedSiteBlueprint } from "../../site-builder/types";
import type { SiteUserOverrides } from "../../site-builder/contracts/overrides";
import type { EditorTarget } from "./types";
import { GlobalAppearanceInspector } from "./GlobalAppearanceInspector";
import { SectionInspector } from "./SectionInspector";

export interface ContextualInspectorProps {
  selectedTarget: EditorTarget | null;
  effectiveBlueprint: GeneratedSiteBlueprint;
  draftBlueprint: GeneratedSiteBlueprint;
  overrides: SiteUserOverrides;
  busy: boolean;
  onChangeBlueprint: (next: GeneratedSiteBlueprint) => void;
  onChangeOverrides: (updater: (prev: SiteUserOverrides) => SiteUserOverrides) => void;
}

export const ContextualInspector: React.FC<ContextualInspectorProps> = ({
  selectedTarget,
  effectiveBlueprint,
  draftBlueprint,
  overrides,
  busy,
  onChangeBlueprint,
  onChangeOverrides,
}) => {
  if (selectedTarget === null) {
    return (
      <div className="adv-inspector adv-inspector-empty">
        <p className="adv-inspector-empty-msg">
          Selecione uma seção ou o Design do Site para editar.
        </p>
      </div>
    );
  }

  if (selectedTarget.scope === "site") {
    return (
      <div className="adv-inspector">
        <p className="adv-inspector-title">Design do Site</p>
        <GlobalAppearanceInspector
          effectiveBlueprint={effectiveBlueprint}
          overrides={overrides}
          busy={busy}
          onChangeOverrides={onChangeOverrides}
        />
      </div>
    );
  }

  // scope === 'section'
  return (
    <div className="adv-inspector">
      <SectionInspector
        sectionId={selectedTarget.sectionId}
        effectiveBlueprint={effectiveBlueprint}
        draftBlueprint={draftBlueprint}
        overrides={overrides}
        busy={busy}
        onChangeBlueprint={onChangeBlueprint}
        onChangeOverrides={onChangeOverrides}
      />
    </div>
  );
};
