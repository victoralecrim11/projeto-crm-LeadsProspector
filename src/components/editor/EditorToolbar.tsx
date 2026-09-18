import React from "react";
import {
  Undo2,
  Redo2,
  Save,
  Download,
  Monitor,
  Tablet,
  Smartphone,
} from "lucide-react";
import type { PreviewViewport } from "./types";

export interface EditorToolbarProps {
  dirty: boolean;
  busy: boolean;
  canUndo: boolean;
  canRedo: boolean;
  previewViewport: PreviewViewport;
  onUndo: () => void;
  onRedo: () => void;
  onViewportChange: (v: PreviewViewport) => void;
  onSave: () => void;
  onExport: () => void;
}

const VIEWPORTS: { key: PreviewViewport; label: string; Icon: React.ElementType }[] = [
  { key: "Mobile", label: "Mobile", Icon: Smartphone },
  { key: "Tablet", label: "Tablet", Icon: Tablet },
  { key: "Desktop", label: "Desktop", Icon: Monitor },
];

export const EditorToolbar: React.FC<EditorToolbarProps> = ({
  dirty,
  busy,
  canUndo,
  canRedo,
  previewViewport,
  onUndo,
  onRedo,
  onViewportChange,
  onSave,
  onExport,
}) => {
  return (
    <div className="adv-editor-toolbar" role="toolbar" aria-label="Controles do editor">
      {/* Undo / Redo */}
      <div className="adv-toolbar-group">
        <button
          type="button"
          title="Desfazer (Ctrl+Z)"
          aria-label="Desfazer"
          disabled={!canUndo || busy}
          onClick={onUndo}
          className="adv-toolbar-btn"
        >
          <Undo2 size={16} aria-hidden="true" />
        </button>
        <button
          type="button"
          title="Refazer (Ctrl+Shift+Z)"
          aria-label="Refazer"
          disabled={!canRedo || busy}
          onClick={onRedo}
          className="adv-toolbar-btn"
        >
          <Redo2 size={16} aria-hidden="true" />
        </button>
      </div>

      {/* Viewport */}
      <div className="adv-toolbar-group" role="group" aria-label="Viewport de prévia">
        {VIEWPORTS.map(({ key, label, Icon }) => (
          <button
            key={key}
            type="button"
            title={label}
            aria-label={label}
            aria-pressed={previewViewport === key}
            onClick={() => onViewportChange(key)}
            className={`adv-toolbar-btn${previewViewport === key ? " active" : ""}`}
          >
            <Icon size={15} aria-hidden="true" />
            <span className="adv-toolbar-label">{label}</span>
          </button>
        ))}
      </div>

      {/* Status + Save/Export */}
      <div className="adv-toolbar-group adv-toolbar-end">
        <span className={`adv-save-status${dirty ? " pending" : ""}`} aria-live="polite">
          {dirty ? "Não salvo" : "Salvo"}
        </span>
        <button
          type="button"
          disabled={busy}
          onClick={onSave}
          className="adv-toolbar-action-btn primary"
          aria-label="Salvar projeto"
        >
          <Save size={15} aria-hidden="true" />
          <span>Salvar</span>
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={onExport}
          className="adv-toolbar-action-btn"
          aria-label="Exportar site ZIP"
        >
          <Download size={15} aria-hidden="true" />
          <span>Exportar</span>
        </button>
      </div>
    </div>
  );
};
