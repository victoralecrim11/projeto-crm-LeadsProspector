import type { GeneratedSiteBlueprint, LeadSiteContext } from "./types.js";
import { phoneDigits, whatsappDigits } from "./context.js";

export interface ConfirmedContactLink {
  kind: "phone" | "whatsapp" | "email";
  href: string;
  label: string;
}

export function confirmedContactLinks(context: LeadSiteContext): ConfirmedContactLink[] {
  const links: ConfirmedContactLink[] = [];
  const phone = phoneDigits(context.contact.phone);
  const whatsapp = whatsappDigits(context.contact.whatsapp);
  if (phone) links.push({ kind: "phone", href: "tel:+" + phone, label: context.contact.phone });
  if (whatsapp) links.push({ kind: "whatsapp", href: "https://wa.me/" + whatsapp, label: "Conversar no WhatsApp" });
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(context.contact.email)) {
    links.push({ kind: "email", href: "mailto:" + context.contact.email, label: context.contact.email });
  }
  return links;
}

export function resolveCtaHref(blueprint: GeneratedSiteBlueprint, context: LeadSiteContext): string {
  const links = confirmedContactLinks(context);
  if (blueprint.hero.ctaType === "contact") return blueprint.sections.contact && links.length ? "#contact" : "";
  return links.find((link) => link.kind === blueprint.hero.ctaType)?.href ?? "";
}
