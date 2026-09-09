import test from "node:test";
import assert from "node:assert/strict";
import { blueprint, legacyBlueprint, context, project } from "../fixtures/siteFixture";
import { blueprintSchema, blueprintV2Schema, defaultVisualVariants, templates } from "../../src/site-builder/types";
import { loadProjects } from "../../src/site-builder/projectPersistence";

test("v1 migra deterministicamente sem alterar copy, cores ou ordem", () => {
  for (const templateId of templates) {
    const source = { ...legacyBlueprint, templateId };
    const result = blueprintSchema.parse(source);
    assert.equal(result.version, 2);
    assert.deepEqual(result.visual, defaultVisualVariants(templateId));
    const { visual, version, ...content } = result;
    const { version: oldVersion, ...oldContent } = source;
    assert.deepEqual(content, oldContent);
    assert.deepEqual(blueprintSchema.parse(result), result);
  }
});
test("v2 aceita variantes válidas e rejeita variantes, versões e ordem inválidas", () => {
  assert.ok(blueprintV2Schema.safeParse(blueprint).success);
  for (const input of [
    { ...blueprint, version: 3 },
    { ...blueprint, visual: undefined },
    { ...blueprint, visual: { ...blueprint.visual, hero: "collage" } },
    { ...blueprint, sectionOrder: ["hero", "hero", "about", "services", "contact"] },
    { ...blueprint, recipeId: "unimplemented" },
    { ...blueprint, imageIntent: { query: "unsupported" } },
  ]) assert.equal(blueprintSchema.safeParse(input).success, false);
});
test("persistência devolve v2 para projeto legado e mantém contexto e revisão", () => {
  const saved = { ...project, siteBlueprint: legacyBlueprint };
  const loaded = loadProjects({ getItem: () => JSON.stringify([saved]) });
  assert.equal(loaded[0].siteBlueprint.version, 2);
  assert.deepEqual(loaded[0].siteContext, context);
  assert.equal(loaded[0].contentReviewed, true);
});
