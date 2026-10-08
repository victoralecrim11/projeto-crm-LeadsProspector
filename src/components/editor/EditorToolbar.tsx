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
  exportDisabled?: boolean;
  demoExportDisabled?: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onViewportChange: (v: PreviewViewport) => void;
  onSave: () => void;
  onExport: () => void;
  onExportDemo: () => void;
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
  exportDisabled = false,
  demoExportDisabled = false,
  onUndo,
  onRedo,
  onViewportChange,
  onSave,
  onExport,
  onExportDemo,
}) => (
  <div className="adv-editor-toolbar" role="toolbar" aria-label="Controles do editor">
    <div className="adv-toolbar-group">
      <button type="button" title="Desfazer (Ctrl+Z)" aria-label="Desfazer" disabled={!canUndo || busy} onClick={onUndo} className="adv-toolbar-btn">
        <Undo2 size={16} aria-hidden="true" />
      </button>
      <button type="button" title="Refazer (Ctrl+Shift+Z)" aria-label="Refazer" disabled={!canRedo || busy} onClick={onRedo} className="adv-toolbar-btn">
        <Redo2 size={16} aria-hidden="true" />
      </button>
    </div>

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

    <div className="adv-toolbar-group adv-toolbar-end">
      <span className={`adv-save-status${dirty ? " pending" : ""}`} aria-live="polite">
        {dirty ? "Não salvo" : "Salvo"}
      </span>
      <button type="button" disabled={busy} onClick={onSave} className="adv-toolbar-action-btn primary" aria-label="Salvar projeto">
        <Save size={15} aria-hidden="true" />
        <span>Salvar</span>
      </button>
      <button
        type="button"
        disabled={busy || demoExportDisabled}
        onClick={onExportDemo}
        className="adv-toolbar-action-btn"
        aria-label="Baixar demonstração do site"
        title={demoExportDisabled ? "Revise o conteúdo, os serviços e as imagens antes de baixar a demonstração." : undefined}
      >
        <Download size={15} aria-hidden="true" />
        <span>Baixar demo</span>
      </button>
      <button
        type="button"
        disabled={busy || exportDisabled}
        onClick={onExport}
        className="adv-toolbar-action-btn"
        aria-label="Exportar site final ZIP"
        title={exportDisabled ? "Corrija os gates de publicação antes de exportar." : undefined}
      >
        <Download size={15} aria-hidden="true" />
        <span>Exportar final</span>
      </button>
    </div>
  </div>
);
