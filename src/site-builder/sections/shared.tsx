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

  let overrideId: string | undefined;
  if (section === 'hero') overrideId = props.blueprint.hero?.assetId;
  else if (section === 'about') overrideId = props.blueprint.about?.assetId;

  if (overrideId === "__REMOVE__") return undefined;

  let entry: MediaManifestEntry | undefined;
  
  if (overrideId) {
    // Os mesmos bytes podem ter alt, intenção decorativa e revisão diferentes por seção.
    const matching = props.mediaManifest.entries.filter(e => e.assetId === overrideId);
    entry = matching.find(e => e.section === section);
    // Referências antigas sem entrada na seção preservam a resolução pelo assetId.
    if (!entry) entry = matching.find(e => ['selected', 'reviewed', 'exportable'].includes(e.reviewStatus));
    // Uma rejeição local não pode ser substituída pela aprovação em outra seção.
    if (entry && !['selected', 'reviewed', 'exportable'].includes(entry.reviewStatus)) return undefined;
  } else {
    entry = props.mediaManifest.entries.find(
      (e) => e.section === section && ['selected', 'reviewed', 'exportable'].includes(e.reviewStatus),
    );
  }

  if (!entry) return undefined;
  const url = props.assetUrls?.[entry.assetId] || props.assetUrls?.[entry.id];
  return url ? { ...entry, url } : undefined;
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
