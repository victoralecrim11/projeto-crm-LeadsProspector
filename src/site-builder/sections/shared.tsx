import React from "react";
import type { GeneratedSiteBlueprint, LeadSiteContext } from "../types";
import { resolveCtaHref } from "../contactLinks";
export type SectionProps = { blueprint: GeneratedSiteBlueprint; context: LeadSiteContext };
export const sectionNames = { hero: "Início", about: "Sobre", services: "Serviços", contact: "Contato", location: "Localização" };
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
