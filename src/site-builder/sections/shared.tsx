import React from "react";
import type { GeneratedSiteBlueprint, LeadSiteContext } from "../types";
import { resolveCtaHref } from "../contactLinks";
import type { MediaManifest, MediaManifestEntry } from "../contracts/media";
export type SectionProps = {
  blueprint: GeneratedSiteBlueprint;
  context: LeadSiteContext;
  mediaManifest?: MediaManifest;
  assetUrls?: Record<string, string>;
};
export const sectionNames = { hero: "Início", about: "Sobre", services: "Serviços", contact: "Contato", location: "Localização" };

export function findSectionMedia(
  props: SectionProps,
  section: keyof typeof sectionNames,
): (MediaManifestEntry & { url: string }) | undefined {
  if (!props.mediaManifest) return undefined;
  const entry = props.mediaManifest.entries.find(
    (e) => e.section === section && ['selected', 'reviewed', 'exportable'].includes(e.reviewStatus),
  );
  if (!entry) return undefined;
  const url = props.assetUrls?.[entry.assetId] || props.assetUrls?.[entry.id];
  return url ? { ...entry, url } : undefined;
}

export function MediaCredits({ manifest }: { manifest?: MediaManifest }) {
  if (!manifest || !manifest.entries) return null;
  const requiringAttribution = manifest.entries.filter(
    (e) => e.licenseLabel && (e.attributionText || e.creator) && ['selected', 'reviewed', 'exportable'].includes(e.reviewStatus),
  );
  if (requiringAttribution.length === 0) return null;
  return (
    <div className="media-credits" aria-label="Créditos das imagens">
      <div className="media-credits-inner">
        <span className="media-credits-title">Créditos de imagem:</span>
        <ul className="media-credits-list">
          {requiringAttribution.map((e) => (
            <li key={e.id} className="media-credits-item">
              {e.attributionText ? (
                <span>{e.attributionText}</span>
              ) : (
                <span>
                  Foto por {e.creator || 'Fotógrafo'} ({e.provider === 'pexels' ? 'Pexels' : 'Pixabay'})
                </span>
              )}
              {e.sourcePageUrl && (
                <a href={e.sourcePageUrl} target="_blank" rel="noopener noreferrer" className="media-credits-link">
                  Ver foto ↗
                </a>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function Cta({ blueprint: b, context }: SectionProps) {
  const href = resolveCtaHref(b, context);
  return href ? <a className="cta" href={href}>{b.hero.ctaText || "Entrar em contato"}<span aria-hidden="true"> ↗</span></a> : null;
}
export function Eyebrow({ context }: SectionProps) {
  return <p className="eyebrow">{context.business.category} · {context.business.city}</p>;
}
export function ServiceContent({ service: s }: { service: GeneratedSiteBlueprint["services"][number] }) {
  return <><h3>{s.title}</h3><p>{s.description}</p>{s.source === "ai_suggestion"
    ? <p className="suggestion">Sugestão da IA — revisar antes de publicar</p>
    : s.price ? <p className="service-price">{s.price}</p> : null}</>;
}
