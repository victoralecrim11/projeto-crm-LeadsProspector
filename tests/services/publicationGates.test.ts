import assert from "node:assert/strict";
import test from "node:test";
import { evaluatePublicationReadiness } from "../../src/site-builder/publicationGates";
import { blueprintSchema, type GeneratedSiteBlueprint, type LeadSiteContext } from "../../src/site-builder/types";
import type { MediaManifest } from "../../src/site-builder/contracts/media";

const context: LeadSiteContext = {
  business: { name: "Delta Burguer", category: "Lanchonete", city: "Belo Horizonte", neighborhood: "" },
  contact: { phone: "", whatsapp: "", email: "", address: "" },
  onlinePresence: { hasWebsite: false, websiteUrl: "" },
  reputation: { rating: null, reviewsCount: null },
};

const blueprint: GeneratedSiteBlueprint = blueprintSchema.parse({
  version: 2,
  templateId: "minimal-professional",
  seo: { title: "Delta Burguer", description: "Lanchonete em Belo Horizonte" },
  brand: { primaryColor: "#1e293b", accentColor: "#f59e0b", tone: "moderno" },
  hero: { headline: "Delta Burguer", subtitle: "Hambúrgueres em Belo Horizonte", ctaText: "Pedir agora", ctaType: "whatsapp" },
  about: { title: "Sobre", description: "Uma lanchonete local." },
  services: [{ title: "Hambúrguer", description: "Preparado na hora.", source: "known" }],
  sections: { hero: true, about: true, services: true, contact: true, location: false, testimonials: false },
  sectionOrder: ["hero", "about", "services", "contact", "location"],
  warnings: [],
  visual: { hero: "minimal", about: "centered-story", services: "editorial-list", contact: "contact-minimal", location: "location-editorial", navigation: "inline", footer: "minimal" },
});

const pendingManifest: MediaManifest = {
  version: 1,
  projectId: "delta",
  generatedAt: "2026-10-08T12:00:00.000Z",
  entries: [{
    id: "hero-image",
    requestId: "delta-image-request",
    section: "hero",
    sourceType: "licensed",
    provider: "pexels",
    providerAssetId: "delta-hero",
    sourcePageUrl: "https://images.example/hero.webp",
    licenseLabel: "Licensed",
    retrievedAt: "2026-10-08T12:00:00.000Z",
    contentHash: "a".repeat(64),
    assetId: "hero-image",
    assetPath: "hero.webp",
    mimeType: "image/webp",
    width: 1440,
    height: 810,
    byteLength: 100,
    alt: "Imagem ilustrativa",
    decorative: false,
    realBusinessMedia: false,
    licensed: true,
    aiGenerated: false,
    reviewStatus: "selected",
  }],
};
test("bloqueia exportação quando contato e CTA comercial estão ausentes", () => {
  const readiness = evaluatePublicationReadiness({ blueprint, context, contentReviewed: true });
  assert.equal(readiness.canExport, false);
  assert.equal(readiness.gates.find((gate) => gate.id === "commercial-contact")?.status, "FAIL");
  assert.equal(readiness.gates.find((gate) => gate.id === "cta-conversion")?.status, "FAIL");
});

test("libera exportação somente com revisão, contato e CTA válidos", () => {
  const readiness = evaluatePublicationReadiness({
    blueprint,
    context: { ...context, contact: { ...context.contact, whatsapp: "(31) 99999-9999" } },
    contentReviewed: true,
  });
  assert.equal(readiness.canExport, true);
  assert.equal(readiness.gates.find((gate) => gate.id === "media-review")?.status, "NOT_EVALUATED");
});

test("bloqueia exportação com serviços ou mídia ainda pendentes", () => {
  const readiness = evaluatePublicationReadiness({
    blueprint: { ...blueprint, services: [{ ...blueprint.services[0], source: "ai_suggestion" }] },
    context: { ...context, contact: { ...context.contact, phone: "(31) 3333-3333" } },
    contentReviewed: false,
    mediaManifest: pendingManifest,
  });
  assert.equal(readiness.canExport, false);
  assert.equal(readiness.gates.find((gate) => gate.id === "content-review")?.status, "FAIL");
  assert.equal(readiness.gates.find((gate) => gate.id === "service-review")?.status, "FAIL");
  assert.equal(readiness.gates.find((gate) => gate.id === "media-review")?.status, "FAIL");
});
