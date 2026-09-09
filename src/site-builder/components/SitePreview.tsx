import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { GeneratedSiteBlueprint, LeadSiteContext } from "../types";
import { renderSiteDocument } from "../renderer/SiteRenderer";
import "./preview.css";
import type { ResolvedDesign } from '../contracts/research';

export const previewDevices = { Desktop: 1440, Tablet: 768, Mobile: 390 } as const;
export function SitePreview({ blueprint, context, design }: {
  blueprint: GeneratedSiteBlueprint; context: LeadSiteContext; design?: ResolvedDesign;
}) {
  const [device, setDevice] = useState<keyof typeof previewDevices>("Desktop");
  const [nativeFullscreen, setNativeFullscreen] = useState(false);
  const [fallback, setFallback] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>();
  const [size, setSize] = useState({ width: 0, height: 600 });
  const container = useRef<HTMLDivElement>(null);
  const viewport = useRef<HTMLDivElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const urls = useRef(new Set<string>());
  const fullscreen = nativeFullscreen || fallback;
  const html = useMemo(() => {
    try { return renderSiteDocument(blueprint, context, design); }
    catch { return null; }
  }, [blueprint, context, design]);
  useEffect(() => {
    if (!html) { setPreviewUrl(undefined); return; }
    // srcDoc resolves fragment links against the CRM URL; a Blob owns its anchors.
    const url = URL.createObjectURL(new Blob([html], { type: "text/html;charset=utf-8" }));
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [html]);
  useEffect(() => {
    const change = () => setNativeFullscreen(document.fullscreenElement === container.current);
    document.addEventListener("fullscreenchange", change);
    return () => document.removeEventListener("fullscreenchange", change);
  }, []);
  useEffect(() => {
    if (!viewport.current) return;
    const observer = new ResizeObserver(([entry]) => setSize({
      width: entry.contentRect.width, height: entry.contentRect.height,
    }));
    observer.observe(viewport.current);
    return () => observer.disconnect();
  }, [fallback, html === null]);
  useEffect(() => {
    if (!fallback) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog.current?.showModal();
    return () => {
      document.body.style.overflow = previousOverflow;
      trigger.current?.focus();
    };
  }, [fallback]);
  useEffect(() => () => {
    urls.current.forEach((url) => URL.revokeObjectURL(url));
    urls.current.clear();
  }, []);
  async function toggleFullscreen() {
    if (fallback) { setFallback(false); return; }
    if (document.fullscreenElement === container.current) {
      await document.exitFullscreen();
      trigger.current?.focus();
      return;
    }
    try {
      if (!container.current?.requestFullscreen) throw new Error("unsupported");
      await container.current.requestFullscreen();
    } catch { setFallback(true); }
  }
  function openTab() {
    if (!html) return;
    const url = URL.createObjectURL(new Blob([html], { type: "text/html;charset=utf-8" }));
    urls.current.add(url);
    // Retain while mounted to allow new-tab loading/reloading; release on unmount.
    window.open(url, "_blank", "noopener,noreferrer");
  }
  const scale = Math.min(1, (size.width || previewDevices[device]) / previewDevices[device]);
  const content = <div ref={container} className={"visual-preview " + (fullscreen ? "is-fullscreen" : "")}
    onKeyDown={(event) => { if (fullscreen && event.key === "Escape") { event.preventDefault(); void toggleFullscreen(); } }}>
    <div className="visual-preview-toolbar" role="group" aria-label="Controles da prévia">
      {(Object.keys(previewDevices) as (keyof typeof previewDevices)[]).map((name) =>
        <button key={name} type="button" aria-pressed={device === name} onClick={() => setDevice(name)}>{name}</button>)}
      <button ref={trigger} type="button" aria-pressed={fullscreen} onClick={() => void toggleFullscreen()}>
        {fullscreen ? "Sair da tela cheia" : "⛶ Fullscreen"}
      </button>
      <button type="button" onClick={openTab} disabled={!html}>↗ Nova aba</button>
      <span className="visual-preview-size">{previewDevices[device]} px</span>
    </div>
    <div className="visual-preview-viewport" ref={viewport}>
      {html ? <div style={{ width: previewDevices[device] * scale, height: size.height, margin: "0 auto" }}>
        <iframe title="Prévia do site" sandbox="allow-popups allow-popups-to-escape-sandbox" src={previewUrl}
          style={{ width: previewDevices[device], height: size.height / scale, transform: `scale(${scale})`, transformOrigin: "top left", border: 0, display: "block", background: "white" }} />
      </div> : <p role="status">Complete os campos obrigatórios para atualizar a prévia.</p>}
    </div>
  </div>;
  return fallback ? createPortal(
    <dialog ref={dialog} className="visual-preview-dialog" aria-label="Prévia em tela cheia"
      onCancel={(event) => { event.preventDefault(); setFallback(false); }}>{content}</dialog>, document.body,
  ) : content;
}
