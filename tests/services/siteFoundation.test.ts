import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { blueprint, context, legacyBlueprint } from "../fixtures/siteFixture";
import { blueprintSchema } from "../../src/site-builder/types";
import { referenceBriefSchema, mediaPlanSchema, designTokensSchema } from "../../src/site-builder/contracts/index";
import { businessContextFromLead } from "../../src/site-builder/guidance/foundations/index";
import { legacyDesignSpecification } from "../../src/site-builder/guidance/design-families/legacy-default";
import { siteGuidanceFoundation } from "../../src/site-builder/guidance/index";
import { renderSiteDocument } from "../../src/site-builder/renderer/SiteRenderer";

test("família legada preserva HTML e CSS das 40 combinações capturadas antes da extração", () => {
  const records = JSON.parse(readFileSync(new URL("../fixtures/phaseARenderBaseline.json", import.meta.url), "utf8"));
  assert.equal(records.length, 40);
  for (const record of records) {
    const html = renderSiteDocument(blueprintSchema.parse(record.input), context);
    assert.equal(createHash("sha256").update(html).digest("hex"), record.sha256);
    const spec = legacyDesignSpecification(record.input);
    assert.equal(spec.family.id, "legacy-default");
    assert.equal(spec.tokens.color.primary, record.input.brand.primaryColor);
  }
});

test("contratos são sidecars sem mutação ou alteração de compatibilidade v1/v2", () => {
  for (const input of [legacyBlueprint, blueprint]) {
    const before = JSON.stringify(input);
    assert.equal(legacyDesignSpecification(input).family.version, 1);
    assert.equal(JSON.stringify(input), before);
    assert.equal(blueprintSchema.parse(input).version, 2);
  }
  const business = businessContextFromLead(context);
  assert.deepEqual(business.lead, context);
  assert.deepEqual(business.confirmed, {});
  assert.equal(siteGuidanceFoundation.niches.automaticClassification, false);
});

test("referências exigem evidência, data e HTTPS sem credenciais", () => {
  const brief = { version: 1, id: "reference-test", niche: "Restaurante", researchedAt: "2026-09-08T12:00:00Z", references: [{url: "https://example.com", reason: "Exemplo de estrutura"}], patterns: ["Navegação curta"], avoid: [] };
  assert.ok(referenceBriefSchema.safeParse(brief).success);
  for (const url of ["javascript:alert(1)", "https://user:secret@example.com", "http://example.com"]) {
    assert.equal(referenceBriefSchema.safeParse({ ...brief, references: [{ url, reason: "Teste" }] }).success, false);
  }
  assert.equal(referenceBriefSchema.safeParse({ ...brief, references: [] }).success, false);
});

test("plano de mídia não simula assets, exige alt coerente e IDs únicos", () => {
  const item = { id: "hero-image", section: "hero", purpose: "Apresentação ilustrativa", sourcePreference: "generated-illustration", aspectRatio: "16:9", decorative: false, alt: "Mesa ilustrativa em ambiente acolhedor" };
  assert.ok(mediaPlanSchema.safeParse({ version: 1, items: [] }).success);
  assert.ok(mediaPlanSchema.safeParse({ version: 1, items: [item] }).success);
  for (const items of [[item, item], [{...item, alt: ""}], [{...item, decorative: true}], [{...item, url: "https://example.com/image.png"}]]) {
    assert.equal(mediaPlanSchema.safeParse({ version: 1, items }).success, false);
  }
  const tokens = legacyDesignSpecification(blueprint).tokens;
  assert.equal(designTokensSchema.safeParse({...tokens, color: {...tokens.color, primary: "url(evil)"}}).success, false);
});
