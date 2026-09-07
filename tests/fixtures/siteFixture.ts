import type { Lead, Project } from "../../src/types";
import type { GeneratedSiteBlueprint } from "../../src/site-builder/types";
import { buildLeadSiteContext } from "../../src/site-builder/context";
export const lead: Lead = {
  id: "node/1055833549",
  osmId: "1055833549",
  osmType: "node",
  osmLat: -19.9196454,
  osmLng: -43.9477558,
  dataSource: "real",
  name: "Salão Renova",
  category: "Salão",
  niche: "Beleza",
  city: "Belo Horizonte",
  state: "MG",
  address: "",
  phone: "",
  hasWebsite: false,
  inCrm: true,
  createdAt: "2026-09-06",
  temperature: "frio",
  score: 0,
};
export const context = buildLeadSiteContext(lead);
export const blueprint: GeneratedSiteBlueprint = {
  version: 1,
  templateId: "premium-service",
  seo: { title: "Salão Renova", description: "Salão em Belo Horizonte" },
  brand: {
    primaryColor: "#153a50",
    accentColor: "#d8aa63",
    tone: "profissional",
  },
  hero: {
    headline: "Salão Renova",
    subtitle: "Salão em Belo Horizonte",
    ctaText: "Contato",
    ctaType: "none",
  },
  about: { title: "Sobre", description: "Conheça o Salão Renova." },
  services: [],
  sections: {
    hero: true,
    about: true,
    services: false,
    contact: false,
    location: false,
    testimonials: false,
  },
  sectionOrder: ["hero", "about", "services", "contact", "location"],
  warnings: [],
};
export const project: Project = {
  id: "test-project",
  clientName: lead.name,
  title: "Site de teste",
  category: lead.category,
  type: "Landing Page",
  status: "rascunho",
  previewUrl: "",
  slug: "test",
  createdAt: "2026-09-06",
  leadId: lead.id,
  siteContext: context,
  siteBlueprint: blueprint,
  contentReviewed: true,
  generationStatus: "ready",
};
