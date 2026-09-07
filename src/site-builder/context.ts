import type { Lead } from "../types";
import {
  contextSchema,
  blueprintSchema,
  type LeadSiteContext,
  type GeneratedSiteBlueprint,
} from "./types";

const clean = (s?: string) =>
  typeof s === "string" ? s.trim().slice(0, 180) : "";
export function buildLeadSiteContext(lead: Lead): LeadSiteContext {
  const address = clean(lead.address);
  const city = clean(lead.city);
  return contextSchema.parse({
    business: {
      name: clean(lead.name),
      category: clean(lead.category),
      city: clean(lead.city),
      neighborhood: clean(lead.neighborhood),
    },
    contact: {
      phone: clean(lead.phone),
      whatsapp: clean(lead.whatsapp),
      email: clean(lead.email),
      address:
        address.toLocaleLowerCase() === city.toLocaleLowerCase() ? "" : address,
    },
    onlinePresence: {
      hasWebsite: Boolean(lead.hasWebsite),
      websiteUrl: clean(lead.websiteUrl),
    },
    reputation: {
      rating: lead.rating ?? null,
      reviewsCount: lead.reviewsCount ?? null,
    },
  });
}
export function phoneDigits(value: string) {
  const digits = value.replace(/\D/g, "");
  return digits.length >= 10 && digits.length <= 15 ? digits : "";
}
export function whatsappDigits(value: string) {
  const digits = phoneDigits(value);
  return digits.length === 10 || digits.length === 11 ? "55" + digits : digits;
}
export function contactAvailable(c: LeadSiteContext) {
  return Boolean(
    phoneDigits(c.contact.phone) ||
    whatsappDigits(c.contact.whatsapp) ||
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.contact.email),
  );
}
export function constrainBlueprint(
  input: unknown,
  context: LeadSiteContext,
  fromAi = false,
): GeneratedSiteBlueprint {
  const b = blueprintSchema.parse(input);
  const hasContact = contactAvailable(context);
  if (
    (b.hero.ctaType === "whatsapp" &&
      !whatsappDigits(context.contact.whatsapp)) ||
    (b.hero.ctaType === "phone" && !phoneDigits(context.contact.phone)) ||
    (b.hero.ctaType === "contact" && !hasContact)
  )
    b.hero.ctaType = "none";
  b.sections.contact = b.sections.contact && hasContact;
  b.sections.location =
    b.sections.location &&
    Boolean(context.contact.address) &&
    context.contact.address.toLocaleLowerCase() !==
      context.business.city.toLocaleLowerCase();
  if (b.hero.ctaType === "contact" && !b.sections.contact)
    b.hero.ctaType = "none";
  b.sections.testimonials = false;
  if (fromAi) {
    b.services = b.services.map((s) => ({
      title: s.title,
      description: s.description,
      source: "ai_suggestion",
    }));
    b.warnings = [
      "Texto gerado por IA: revise as afirmações antes de exportar.",
      ...(b.services.length
        ? ["Serviços sugeridos precisam de confirmação do responsável."]
        : []),
    ];
  }
  return b;
}
