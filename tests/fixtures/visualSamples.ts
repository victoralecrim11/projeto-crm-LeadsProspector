import { blueprint } from "./siteFixture";
import { defaultVisualVariants, type GeneratedSiteBlueprint, type LeadSiteContext, type VisualVariants } from "../../src/site-builder/types";

// Fictional, explicitly labelled examples. No real leads or paid AI calls.
const samples: { id: string; name: string; category: string; template: GeneratedSiteBlueprint["templateId"]; hero: VisualVariants["hero"]; about: VisualVariants["about"]; services: VisualVariants["services"]; primary: string; accent: string }[] = [
  { id: "restaurante", name: "Mesa — demonstração", category: "Restaurante / Pizzaria", template: "premium-service", hero: "full-bleed", about: "editorial-split", services: "editorial-list", primary: "#422c23", accent: "#d2ab74" },
  { id: "barbearia", name: "Traço — demonstração", category: "Barbearia", template: "modern-local-business", hero: "split", about: "centered-story", services: "horizontal-cards", primary: "#182a27", accent: "#c7dc69" },
  { id: "clinica", name: "Clara — demonstração", category: "Clínica", template: "minimal-professional", hero: "minimal", about: "centered-story", services: "editorial-list", primary: "#245e62", accent: "#d7e7df" },
  { id: "salao", name: "Forma — demonstração", category: "Salão / Estética", template: "appointment-focused", hero: "split", about: "editorial-split", services: "horizontal-cards", primary: "#594651", accent: "#efdad1" },
  { id: "imobiliaria", name: "Morada — demonstração", category: "Imobiliária", template: "premium-service", hero: "full-bleed", about: "centered-story", services: "horizontal-cards", primary: "#263443", accent: "#d4c8ad" },
];
export const visualSamples = samples.map((sample) => {
  const context: LeadSiteContext = {
    business: { name: sample.name, category: sample.category, city: "Cidade de exemplo", neighborhood: "" },
    contact: { phone: "", whatsapp: "", email: "contato@example.com", address: "" },
    onlinePresence: { hasWebsite: false, websiteUrl: "" },
    reputation: { rating: null, reviewsCount: null },
  };
  const site: GeneratedSiteBlueprint = {
    ...structuredClone(blueprint), templateId: sample.template,
    seo: { title: sample.name, description: "Exemplo fictício para revisão visual P0." },
    brand: { ...blueprint.brand, primaryColor: sample.primary, accentColor: sample.accent },
    visual: { ...defaultVisualVariants(sample.template), hero: sample.hero, about: sample.about, services: sample.services },
    hero: { headline: sample.name, subtitle: sample.category + ". Uma composição de demonstração para revisar estrutura, tipografia e leitura em diferentes telas.", ctaText: "Contato de demonstração", ctaType: "contact" },
    about: { title: "Um espaço para conhecer", description: "Este é um negócio fictício usado para avaliar a apresentação visual. Nome, categoria e cidade são dados de exemplo. O conteúdo comercial precisa ser informado e confirmado pelo responsável antes de qualquer publicação." },
    services: ["Primeiro conteúdo", "Segundo conteúdo", "Terceiro conteúdo"].map((title) => ({ title, description: "Conteúdo demonstrativo de layout. Não representa um serviço real oferecido.", source: "known" })),
    sections: { ...blueprint.sections, services: true, contact: true },
  };
  return { id: sample.id, context, blueprint: site };
});
