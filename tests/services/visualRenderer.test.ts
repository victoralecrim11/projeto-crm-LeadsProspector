import test from "node:test";
import assert from "node:assert/strict";
import JSZip from "jszip";
import { blueprint, context, project } from "../fixtures/siteFixture";
import { visualSamples } from "../fixtures/visualSamples";
import { renderSiteDocument } from "../../src/site-builder/renderer/SiteRenderer";
import { normalizeForRender, sectionRegistry, resolveSection } from "../../src/site-builder/sections/registry";
import { visualVariants } from "../../src/site-builder/types";
import { createSiteZip } from "../../src/site-builder/exportSite";
import { foregroundFor } from "../../src/site-builder/renderer/baseStyles";

test("registry cobre cada variante suportada; não resolve membros herdados", () => {
  for (const [section, variants] of Object.entries(visualVariants)) {
    assert.deepEqual(Object.keys(sectionRegistry[section]).sort(), [...variants].sort());
    for (const variant of variants) assert.equal(typeof resolveSection(section as keyof typeof visualVariants, variant), "function");
  }
  assert.equal(typeof resolveSection("hero", "constructor"), "function");
  assert.notEqual(resolveSection("hero", "constructor"), Object);
});
test("renderer aplica fallback de variante sem permitir injeção de conteúdo ou CSS", () => {
  const invalid = { ...blueprint, visual: { ...blueprint.visual, hero: "<script>" } };
  assert.equal(normalizeForRender(invalid).visual.hero, "full-bleed");
  assert.equal(normalizeForRender({ ...blueprint, visual: undefined }).visual.services, "editorial-list");
  assert.throws(() => normalizeForRender({ ...invalid, brand: { ...blueprint.brand, primaryColor: "url(evil)" } }));
});
test("três Heroes e dois About/Services produzem estruturas próprias", () => {
  const signatures = new Set<string>();
  for (const hero of visualVariants.hero) {
    const html = renderSiteDocument({ ...blueprint, visual: { ...blueprint.visual, hero } }, context);
    const section = html.match(/<section id="hero"[\s\S]*?<\/section>/)![0];
    signatures.add(section.replace(/class="[^"]*"|data-variant="[^"]*"/g, ""));
  }
  assert.equal(signatures.size, 3);
  for (const about of visualVariants.about) {
    const html = renderSiteDocument({ ...blueprint, visual: { ...blueprint.visual, about } }, context);
    assert.ok(html.includes(about === "centered-story" ? '<article class="about-centered' : '<div class="about-prose"'));
  }
  for (const services of visualVariants.services) {
    const b = { ...visualSamples[0].blueprint, visual: { ...blueprint.visual, services } };
    const html = renderSiteDocument(b, context);
    assert.ok(html.includes(services === "editorial-list" ? "<ol>" : '<div class="service-columns">'));
  }
});
test("variantes preservam ausência de contatos, fatos e serviços não aprovados", () => {
  for (const { blueprint: b } of visualSamples) {
    const html = renderSiteDocument({ ...b, sections: { ...b.sections, location: true } }, context);
    for (const absent of ["wa.me", "tel:", "mailto:", '<section id="contact"', '<section id="location"', "R$", "★★★★★", "<img", "<script"]) assert.ok(!html.includes(absent), absent);
    assert.ok(html.includes("prefers-reduced-motion:reduce"));
    assert.ok(html.includes("focus-visible"));
  }
});
test("cinco nichos exportam o mesmo documento do preview e preservam v2", async () => {
  for (const sample of visualSamples) {
    const zip = await JSZip.loadAsync(await createSiteZip({ ...project, siteBlueprint: sample.blueprint, siteContext: sample.context }));
    assert.equal(await zip.file("index.html")!.async("string"), renderSiteDocument(sample.blueprint, sample.context));
    assert.deepEqual(JSON.parse(await zip.file("blueprint.json")!.async("string")), sample.blueprint);
  }
});
test("superfícies claras e escuras escolhem texto contrastante", () => {
  assert.equal(foregroundFor("#ffffff"), "#000000");
  assert.equal(foregroundFor("#000000"), "#ffffff");
  assert.equal(foregroundFor("#ffff00"), "#000000");
});
test("export também aplica fallback visual e mantém revisão obrigatória", async () => {
  const invalid = { ...blueprint, visual: { ...blueprint.visual, hero: "future-variant" } } as unknown as typeof blueprint;
  const zip = await JSZip.loadAsync(await createSiteZip({ ...project, siteBlueprint: invalid }));
  assert.equal(await zip.file("index.html")!.async("string"), renderSiteDocument(invalid, context));
  assert.equal(JSON.parse(await zip.file("blueprint.json")!.async("string")).visual.hero, "full-bleed");
  await assert.rejects(() => createSiteZip({ ...project, contentReviewed: false, siteBlueprint: invalid }));
});
