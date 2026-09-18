import React, { useEffect, useRef, useCallback } from "react";
import type { GeneratedSiteBlueprint, LeadSiteContext } from "../../site-builder/types";
import type { ResolvedDesign } from "../../site-builder/contracts/research";
import type { MediaManifest } from "../../site-builder/contracts/media";
import { renderSiteDocument } from "../../site-builder/renderer/SiteRenderer";

export const PREVIEW_WIDTHS: Record<string, number> = {
  Mobile: 390,
  Tablet: 768,
  Desktop: 1440,
};

export interface PreviewCanvasProps {
  blueprint: GeneratedSiteBlueprint;
  context: LeadSiteContext;
  design?: ResolvedDesign;
  mediaManifest?: MediaManifest;
  assetUrls?: Record<string, string>;
  previewViewport: string;
  selectedSectionId: string | null;
  hoveredSectionId: string | null;
  onSectionSelected: (sectionId: string) => void;
  onHoverSection: (sectionId: string | null) => void;
}

/**
 * PreviewCanvas renders the site in an iframe using the existing renderSiteDocument
 * (no renderer duplication). In editor mode it:
 *  1. Injects a single stable <style id="__editor_style__"> for hover/selected highlighting.
 *  2. Uses event delegation on contentDocument to detect clicks on
 *     [data-editor-section-id] elements emitted by the editor-mode renderer.
 *  3. Cleans up listeners on every HTML change to prevent accumulation.
 *
 * The editor metadata attributes (data-editor-section-id) are injected only when
 * editorMode=true is passed to renderSiteDocument, keeping the export clean.
 */
export const PreviewCanvas: React.FC<PreviewCanvasProps> = ({
  blueprint,
  context,
  design,
  mediaManifest,
  assetUrls,
  previewViewport,
  selectedSectionId,
  hoveredSectionId,
  onSectionSelected,
  onHoverSection,
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const styleRef = useRef<HTMLStyleElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const viewportWidth = PREVIEW_WIDTHS[previewViewport] ?? 1440;

  // Generate HTML with editor metadata attributes
  const html = React.useMemo(() => {
    try {
      return renderSiteDocument(
        blueprint,
        context,
        design,
        mediaManifest,
        assetUrls,
        /* editorMode= */ true,
      );
    } catch {
      return null;
    }
  }, [blueprint, context, design, mediaManifest, assetUrls]);

  // Inject/update selection+hover CSS into iframe without accumulating <style> tags
  const updateEditorStyles = useCallback((doc: Document) => {
    let styleEl = doc.getElementById("__editor_style__") as HTMLStyleElement | null;
    if (!styleEl) {
      styleEl = doc.createElement("style");
      styleEl.id = "__editor_style__";
      doc.head.appendChild(styleEl);
    }
    styleRef.current = styleEl;

    const selRule = selectedSectionId
      ? `[data-editor-section-id="${selectedSectionId}"] { outline: 2px solid #6366f1 !important; outline-offset: 2px; }`
      : "";
    const hovRule = hoveredSectionId && hoveredSectionId !== selectedSectionId
      ? `[data-editor-section-id="${hoveredSectionId}"] { outline: 1px dashed #38bdf8 !important; outline-offset: 2px; }`
      : "";
    // Label on hover
    const labelRule = hoveredSectionId
      ? `[data-editor-section-id="${hoveredSectionId}"]::before { content: attr(data-editor-section-label); position: absolute; top: 0; left: 0; background: #38bdf8cc; color: #fff; font-size: 10px; padding: 2px 6px; pointer-events: none; z-index: 9999; }`
      : "";

    styleEl.textContent = [
      `[data-editor-section-id] { cursor: pointer; position: relative; transition: outline 0.1s; }`,
      selRule,
      hovRule,
      labelRule,
    ].join("\n");
  }, [selectedSectionId, hoveredSectionId]);

  // Re-attach listeners after HTML changes (srcDoc update triggers load)
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe || !html) return;

    const blobUrl = URL.createObjectURL(new Blob([html], { type: "text/html;charset=utf-8" }));

    // Abort previous controller if any
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const { signal } = controller;

    const onLoad = () => {
      if (signal.aborted) return;
      const doc = iframe.contentDocument;
      if (!doc) return;

      updateEditorStyles(doc);

      // Click delegation — find closest section with editor metadata
      const handleClick = (e: MouseEvent) => {
        const target = (e.target as HTMLElement).closest("[data-editor-section-id]") as HTMLElement | null;
        if (!target) return;
        const sectionId = target.dataset.editorSectionId;
        if (sectionId) onSectionSelected(sectionId);
      };

      // Hover delegation
      const handleMouseOver = (e: MouseEvent) => {
        const target = (e.target as HTMLElement).closest("[data-editor-section-id]") as HTMLElement | null;
        onHoverSection(target?.dataset.editorSectionId ?? null);
      };
      const handleMouseOut = () => onHoverSection(null);

      doc.addEventListener("click", handleClick, { signal } as any);
      doc.addEventListener("mouseover", handleMouseOver, { signal } as any);
      doc.addEventListener("mouseout", handleMouseOut, { signal } as any);
    };

    iframe.addEventListener("load", onLoad, { signal } as any);
    iframe.src = blobUrl;

    return () => {
      controller.abort();
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
    };
  }, [html, onSectionSelected, onHoverSection, updateEditorStyles]);

  // Update styles reactively without reloading iframe
  useEffect(() => {
    const doc = iframeRef.current?.contentDocument;
    if (!doc || doc.readyState === "loading") return;
    updateEditorStyles(doc);
  }, [selectedSectionId, hoveredSectionId, updateEditorStyles]);

  // Scroll selected section into view inside iframe
  useEffect(() => {
    if (!selectedSectionId) return;
    const doc = iframeRef.current?.contentDocument;
    if (!doc) return;
    const el = doc.querySelector(`[data-editor-section-id="${selectedSectionId}"]`);
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [selectedSectionId]);

  const containerWidth = viewportWidth;

  return (
    <div className="adv-preview-canvas" aria-label={`Prévia do site — ${previewViewport}`}>
      <div
        className="adv-preview-scaler"
        style={{ "--preview-width": `${containerWidth}px` } as React.CSSProperties}
      >
        {html ? (
          <iframe
            ref={iframeRef}
            title="Prévia do site em edição"
            sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox allow-same-origin"
            className="adv-preview-iframe"
            style={{ width: containerWidth }}
          />
        ) : (
          <p role="status" className="adv-preview-empty-msg">
            Preencha os campos obrigatórios para visualizar a prévia.
          </p>
        )}
      </div>
    </div>
  );
};
