import test from "node:test";
import assert from "node:assert/strict";
import { reactToolkitProfile, reactComponentCatalog } from "../../src/site-builder/guidance/reactToolkit";
import { sectionRegistry } from "../../src/site-builder/sections/registry";
import { confirmedContactLinks, resolveCtaHref } from "../../src/site-builder/contactLinks";
import { generateSite } from "../../server/services/ai/siteGeneratorService";
import { blueprint, context } from "../fixtures/siteFixture";
import type { AiModelDefinition, SitePreferences } from "../../src/site-builder/types";

test("catálogo incorporado descreve exatamente os componentes disponíveis", () => {
  for (const section of Object.keys(sectionRegistry)) {
    assert.deepEqual(Object.keys(reactComponentCatalog[section]).sort(), Object.keys(sectionRegistry[section]).sort());
    for (const description of Object.values(reactComponentCatalog[section]) as { composition: string; mobile: string }[]) {
      assert.ok(description.composition.length > 20);
      assert.ok(description.mobile.length > 15);
    }
  }
});
test("geração e regeneração usam referências Antigravity e registram proveniência", async () => {
  const model: AiModelDefinition = { id: "gemini:test", provider: "gemini", model: "test", label: "Test", description: "Test", tier: "quality", enabled: true, capabilities: { coding: true, structuredOutput: true, vision: false } };
  const preferences: SitePreferences = { siteType: "landing-page", templateId: "auto", style: "moderno", goal: "none" };
  for (const section of [undefined, "about"] as const) {
    let observed = "";
    const result = await generateSite({ context, preferences, modelSelection: { mode: "auto" }, ...(section ? { section, blueprint } : {}) }, {}, {
      discoverModels: async () => ({ models: [model], warnings: [] }),
      requestBlueprint: async (_model, prompt) => { observed = prompt; return blueprint; },
    });
    assert.ok(observed.includes(reactToolkitProfile.sourceCommit));
    assert.ok(observed.includes("editorial-split"));
    assert.ok(observed.includes("reduced-motion"));
    assert.equal(result.generation.guidance?.sourceVersion, "1.3.3");
    assert.equal(result.generation.guidance?.sourceCommit, reactToolkitProfile.sourceCommit);
    assert.equal(result.blueprint.version, 2);
  }
});
test("regra de contato compartilhada não cria canais ausentes", () => {
  assert.deepEqual(confirmedContactLinks(context), []);
  assert.equal(resolveCtaHref({ ...blueprint, hero: { ...blueprint.hero, ctaType: "contact" }, sections: { ...blueprint.sections, contact: true } }, context), "");
  const phoneOnly = { ...context, contact: { ...context.contact, phone: "(31) 3333-4444" } };
  assert.deepEqual(confirmedContactLinks(phoneOnly).map((link) => link.kind), ["phone"]);
  assert.equal(resolveCtaHref({ ...blueprint, hero: { ...blueprint.hero, ctaType: "whatsapp" } }, phoneOnly), "");
});
