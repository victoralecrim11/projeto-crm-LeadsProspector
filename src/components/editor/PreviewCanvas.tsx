import React, { useEffect, useRef, useCallback, useState } from "react";
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
 * PreviewCanvas renders the site in an iframe using the existing renderSiteDocument.
 * In editor mode it:
 *  1. Injects a single stable <style id="__editor_style__"> for hover/selected highlighting.
 *  2. Updates DOM atomically on content changes to avoid white flashes and iframe navigations.
 *  3. Uses event delegation on contentDocument to detect clicks on [data-editor-section-id].
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
  
  // Stable refs for callbacks and transient state to avoid unnecessary effect triggers
  const callbacksRef = useRef({ onSectionSelected, onHoverSection });
  const transientStateRef = useRef({ selectedSectionId, hoveredSectionId });

  useEffect(() => {
    callbacksRef.current = { onSectionSelected, onHoverSection };
  }, [onSectionSelected, onHoverSection]);

  useEffect(() => {
    transientStateRef.current = { selectedSectionId, hoveredSectionId };
  }, [selectedSectionId, hoveredSectionId]);

  const viewportWidth = PREVIEW_WIDTHS[previewViewport] ?? 1440;

  // Generate HTML based ONLY on render-affecting inputs
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

  // Inject/update selection+hover CSS into iframe idempotently
  const updateEditorStyles = useCallback((doc: Document, selId: string | null, hovId: string | null) => {
    let styleEl = doc.getElementById("__editor_style__") as HTMLStyleElement | null;
    if (!styleEl) {
      styleEl = doc.createElement("style");
      styleEl.id = "__editor_style__";
      const target = doc.head || doc.body || doc.documentElement;
      if (target) {
        target.appendChild(styleEl);
      } else {
        return;
      }
    }

    const selRule = selId
      ? `[data-editor-section-id="${selId}"] { outline: 2px solid #6366f1 !important; outline-offset: 2px; }`
      : "";
    const hovRule = hovId && hovId !== selId
      ? `[data-editor-section-id="${hovId}"] { outline: 1px dashed #38bdf8 !important; outline-offset: 2px; }`
      : "";
    const labelRule = hovId
      ? `[data-editor-section-id="${hovId}"]::before { content: attr(data-editor-section-label); position: absolute; top: 0; left: 0; background: #38bdf8cc; color: #fff; font-size: 10px; padding: 2px 6px; pointer-events: none; z-index: 9999; }`
      : "";

    styleEl.textContent = [
      `[data-editor-section-id] { cursor: pointer; position: relative; transition: outline 0.1s; }`,
      selRule,
      hovRule,
      labelRule,
    ].join("\n");
  }, []);

  // Atomic content update: never triggers full iframe reload/navigation
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe || !html) return;
    const doc = iframe.contentDocument;
    if (!doc) return;

    const isInitialized = doc.documentElement.hasAttribute("data-editor-initialized");

    if (!isInitialized) {
      // 1. Initial write
      doc.open();
      doc.write(html);
      doc.close();
      doc.documentElement.setAttribute("data-editor-initialized", "true");

      // Attach delegated event listeners to the Document (survives body replacement)
      const handleClick = (e: MouseEvent) => {
        const target = (e.target as HTMLElement).closest("[data-editor-section-id]") as HTMLElement | null;
        if (!target) return;
        const sectionId = target.dataset.editorSectionId;
        if (sectionId) callbacksRef.current.onSectionSelected(sectionId);
      };

      const handleMouseOver = (e: MouseEvent) => {
        const target = (e.target as HTMLElement).closest("[data-editor-section-id]") as HTMLElement | null;
        callbacksRef.current.onHoverSection(target?.dataset.editorSectionId ?? null);
      };

      const handleMouseOut = () => callbacksRef.current.onHoverSection(null);

      doc.addEventListener("click", handleClick);
      doc.addEventListener("mouseover", handleMouseOver);
      doc.addEventListener("mouseout", handleMouseOut);
    } else {
      // 2. Atomic in-place update for subsequent content changes
      const newDoc = new DOMParser().parseFromString(html, "text/html");
      const win = iframe.contentWindow;
      const scrollY = win?.scrollY || 0;

      // Replace site-owned head and body
      if (doc.head && newDoc.head) {
        doc.documentElement.replaceChild(doc.adoptNode(newDoc.head), doc.head);
      }
      if (doc.body && newDoc.body) {
        doc.documentElement.replaceChild(doc.adoptNode(newDoc.body), doc.body);
      }

      // Restore scroll after layout frame
      if (win) {
        requestAnimationFrame(() => {
          win.scrollTo(0, scrollY);
        });
      }
    }
    
    // Always apply editor styles because head might have been replaced
    updateEditorStyles(doc, transientStateRef.current.selectedSectionId, transientStateRef.current.hoveredSectionId);
    
    // We intentionally omit transient states to prevent full rebuilds on selection
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [html, updateEditorStyles]);

  // Update styles reactively for transient state WITHOUT reloading iframe
  useEffect(() => {
    const doc = iframeRef.current?.contentDocument;
    if (!doc || doc.readyState === "loading") return;
    updateEditorStyles(doc, selectedSectionId, hoveredSectionId);
  }, [selectedSectionId, hoveredSectionId, updateEditorStyles]);

  // Scroll selected section into view 
  useEffect(() => {
    if (!selectedSectionId) return;
    const doc = iframeRef.current?.contentDocument;
    if (!doc) return;
    const el = doc.querySelector(`[data-editor-section-id="${selectedSectionId}"]`);
    el?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [selectedSectionId]);

  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  // Measure container width to compute scale
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        const availableWidth = entry.contentRect.width;
        const newScale = viewportWidth > 0 ? Math.min(1, availableWidth / viewportWidth) : 1;
        setScale(newScale);
      }
    });
    
    observer.observe(container);
    return () => observer.disconnect();
  }, [viewportWidth]);

  return (
    <div 
      className="adv-preview-canvas" 
      aria-label={`Prévia do site — ${previewViewport}`}
      ref={containerRef}
      style={{ overflow: 'hidden', display: 'flex', justifyContent: 'center' }}
    >
      <div
        className="adv-preview-scaler"
        style={{ 
          width: '100%',
          height: '100%',
          display: 'flex',
          justifyContent: 'center',
          overflow: 'hidden' 
        }}
      >
        {html ? (
          <iframe
            ref={iframeRef}
            title="Prévia do site em edição"
            sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox allow-same-origin"
            className="adv-preview-iframe"
            style={{ 
              width: `${viewportWidth}px`, 
              height: `${100 / scale}%`,
              transform: `scale(${scale})`,
              transformOrigin: 'top center',
              border: 'none',
              flexShrink: 0
            }}
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

