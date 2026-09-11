import test from "node:test";
import assert from "node:assert/strict";
import JSZip from "jszip";
import { blueprint, context, lead, project } from "../fixtures/siteFixture";
import {
  blueprintSchema,
  type AiModelDefinition,
} from "../../src/site-builder/types";
import {
  buildLeadSiteContext,
  constrainBlueprint,
} from "../../src/site-builder/context";
import {
  resolveModels,
  SiteAiError,
} from "../../server/services/ai/modelRegistry";
import * as providerCooldown from "../../server/services/ai/providerCooldown";
import {
  generateSite,
  mergeSection,
} from "../../server/services/ai/siteGeneratorService";
import { buildSitePrompt } from "../../server/services/ai/sitePromptBuilder";
import { renderSiteDocument } from "../../src/site-builder/renderer/SiteRenderer";
import { createSiteZip } from "../../src/site-builder/exportSite";
import {
  loadProjects,
  persistProjects,
} from "../../src/site-builder/projectPersistence";
const model: AiModelDefinition = {
  id: "gemini:test",
  model: "test",
  provider: "gemini",
  label: "test",
  description: "test",
  tier: "quality",
  enabled: true,
  supportsSiteBuilder: true,
  capabilities: { structuredOutput: true, coding: true, vision: false },
};
test("ausências não viram canais, endereço, preços, avaliações ou depoimentos", () => {
  const result = constrainBlueprint(
    {
      ...blueprint,
      hero: { ...blueprint.hero, ctaType: "whatsapp" },
      sections: { ...blueprint.sections, contact: true, location: true },
      services: [
        {
          title: "Sugestão",
          description: "Revisar",
          source: "known",
          price: "R$ 999",
        },
      ],
    },
    context,
    true,
  );
  assert.equal(result.hero.ctaType, "none");
  assert.equal(result.sections.contact, false);
  assert.equal(result.sections.location, false);
  assert.equal(result.sections.testimonials, false);
  assert.equal(result.services[0].source, "ai_suggestion");
  assert.equal(result.services[0].price, undefined);
  const html = renderSiteDocument(result, context);
  for (const absent of [
    "wa.me",
    "tel:",
    "mailto:",
    "R$ 999",
    "★★★★★",
    "Segunda a",
  ])
    assert.ok(!html.includes(absent), absent);
});
test("site existente e reputação permanecem dados, não geram depoimentos", () => {
  const c = buildLeadSiteContext({
    ...lead,
    hasWebsite: true,
    websiteUrl: "https://example.com",
    rating: 4.2,
    reviewsCount: 10,
  });
  assert.equal(c.onlinePresence.hasWebsite, true);
  assert.equal(c.reputation.rating, 4.2);
  assert.equal(constrainBlueprint(blueprint, c).sections.testimonials, false);
});
test("telefone não é convertido em WhatsApp e contatos inválidos são omitidos", () => {
  const c = buildLeadSiteContext({
    ...lead,
    phone: "(31) 3333-4444",
    email: "javascript:alert(1)",
  });
  const b = constrainBlueprint(
    {
      ...blueprint,
      hero: { ...blueprint.hero, ctaType: "whatsapp" },
      sections: { ...blueprint.sections, contact: true },
    },
    c,
  );
  const html = renderSiteDocument(b, c);
  assert.ok(html.includes("tel:"));
  assert.ok(!html.includes("wa.me"));
  assert.ok(!html.includes("mailto:"));
});
test("schema rejeita campos extras, cor injetada, seções duplicadas e depoimentos", () => {
  for (const value of [
    { ...blueprint, html: "<script>" },
    {
      ...blueprint,
      brand: { ...blueprint.brand, primaryColor: "red;url(evil)" },
    },
    { ...blueprint, sectionOrder: ["hero", "hero", "hero", "hero", "hero"] },
    { ...blueprint, sections: { ...blueprint.sections, testimonials: true } },
  ])
    assert.equal(blueprintSchema.safeParse(value).success, false);
});
test("renderer escapa HTML e conserva ordem e visibilidade", () => {
  const b = {
    ...blueprint,
    hero: { ...blueprint.hero, headline: "<script>alert(1)</script>" },
    sectionOrder: [
      "about",
      "hero",
      "services",
      "contact",
      "location",
    ] as typeof blueprint.sectionOrder,
  };
  const html = renderSiteDocument(b, context);
  assert.ok(html.includes("&lt;script&gt;"));
  assert.ok(!html.includes("<script>"));
  assert.ok(
    html.indexOf('<section id="about"') < html.indexOf('<section id="hero"'),
  );
  assert.ok(!html.includes('<section id="contact"'));
});
test("modelos inválidos, desabilitados e incompatíveis falham; explícito é fixo", () => {
  assert.throws(() =>
    resolveModels([model], { mode: "explicit", modelId: "bad" }),
  );
  assert.throws(() =>
    resolveModels([{ ...model, enabled: false }], {
      mode: "explicit",
      modelId: model.id,
    }),
  );
  assert.throws(() =>
    resolveModels(
      [
        {
          ...model,
          capabilities: { ...model.capabilities, structuredOutput: false },
        },
      ],
      { mode: "explicit", modelId: model.id },
    ),
  );
  assert.deepEqual(
    resolveModels([model], { mode: "explicit", modelId: model.id }),
    [model],
  );
  assert.equal(resolveModels([model], { mode: "auto" })[0].id, model.id);
  assert.throws(() => resolveModels([model], { mode: "local" }));
});

test("429 triggers cooldown and automatic fallback to next model", async () => {
  providerCooldown._resetCooldowns();
  const calls: string[] = [];
  const second = { ...model, id: "gemini:alternate", model: "alternate" };
  const deps = {
    discoverModels: async () => ({ models: [model, second], warnings: [] }),
    requestBlueprint: async (m: any) => {
      calls.push(m.id);
      if (m.id === model.id) throw new SiteAiError("rate", 429, true);
      return blueprint;
    },
  };
  const result = await generateSite(
    {
      context,
      preferences: { siteType: "landing-page", templateId: blueprint.templateId, style: "moderno", goal: "none" },
      modelSelection: { mode: "auto" as const },
    },
    {},
    deps,
  );
  assert.equal(result.generation.modelId, second.id);
  assert.ok(providerCooldown.isCooling(model.provider, model.model));
});

test("503 triggers cooldown and fallback to next model", async () => {
  providerCooldown._resetCooldowns();
  const second = { ...model, id: "gemini:alternate2", model: "alternate2" };
  const deps = {
    discoverModels: async () => ({ models: [model, second], warnings: [] }),
    requestBlueprint: async (m: any) => {
      if (m.id === model.id) throw new SiteAiError("svc", 503, true);
      return blueprint;
    },
  };
  const result = await generateSite(
    {
      context,
      preferences: { siteType: "landing-page", templateId: blueprint.templateId, style: "moderno", goal: "none" },
      modelSelection: { mode: "auto" as const },
    },
    {},
    deps,
  );
  assert.equal(result.generation.modelId, second.id);
  assert.ok(providerCooldown.isCooling(model.provider, model.model));
});

test("504 timeout leads to fallback (retryable) and does not set aggressive retries", async () => {
  providerCooldown._resetCooldowns();
  const second = { ...model, id: "gemini:alternate3", model: "alternate3" };
  let calls = 0;
  const deps = {
    discoverModels: async () => ({ models: [model, second], warnings: [] }),
    requestBlueprint: async (m: any) => {
      calls++;
      if (m.id === model.id && calls === 1) throw new SiteAiError("timeout", 504, true);
      return blueprint;
    },
  };
  const result = await generateSite(
    {
      context,
      preferences: { siteType: "landing-page", templateId: blueprint.templateId, style: "moderno", goal: "none" },
      modelSelection: { mode: "auto" as const },
    },
    {},
    deps,
  );
  assert.equal(result.generation.modelId, second.id);
});

test("explicit/manual selection does not fallback automatically on 401/403", async () => {
  providerCooldown._resetCooldowns();
  const deps = {
    discoverModels: async () => ({ models: [model], warnings: [] }),
    requestBlueprint: async () => {
      throw new SiteAiError("auth", 401, false);
    },
  };
  await assert.rejects(
    () =>
      generateSite(
        {
          context,
          preferences: { siteType: "landing-page", templateId: blueprint.templateId, style: "moderno", goal: "none" },
          modelSelection: { mode: "explicit" as const, modelId: model.id },
        },
        {},
        deps,
      ),
    /auth/,
  );
});
test("auto permite fallback; explícito nunca troca de modelo", async () => {
  const calls: string[] = [];
  const second = { ...model, id: "gemini:alternate", model: "alternate" };
  const deps = {
    discoverModels: async () => ({ models: [model, second], warnings: [] }),
    requestBlueprint: async (m: AiModelDefinition) => {
      calls.push(m.id);
      if (m.id === model.id) throw new Error("upstream");
      return blueprint;
    },
  };
  const input = {
    context,
    preferences: {
      siteType: "landing-page" as const,
      templateId: blueprint.templateId,
      style: blueprint.brand.tone,
      goal: "contact" as const,
    },
    modelSelection: { mode: "explicit" as const, modelId: model.id },
  };
  await assert.rejects(() => generateSite(input, {}, deps));
  assert.deepEqual(calls, [model.id, model.id]);
  calls.length = 0;
  const result = await generateSite(
    { ...input, modelSelection: { mode: "auto", modelId: null } },
    {},
    deps,
  );
  assert.equal(result.generation.modelId, second.id);
  assert.ok(calls.includes(model.id));
});
test("falha transitória aguarda e tenta novamente", async () => {
  let calls = 0;
  const delays: number[] = [];
  const result = await generateSite(
    {
      context,
      preferences: {
        siteType: "landing-page",
        templateId: "premium-service",
        style: "moderno",
        goal: "none",
      },
      modelSelection: { mode: "explicit", modelId: model.id },
    },
    {},
    {
      discoverModels: async () => ({ models: [model], warnings: [] }),
      requestBlueprint: async () => {
        calls++;
        if (calls === 1)
          throw new SiteAiError("Temporariamente indisponível.", 503, true);
        return blueprint;
      },
      delay: async (milliseconds: number) => {
        delays.push(milliseconds);
      },
    },
  );
  assert.equal(result.success, true);
  assert.equal(calls, 2);
  assert.deepEqual(delays, [250]);
});
test("falha não retentável não repete a chamada", async () => {
  let calls = 0;
  await assert.rejects(
    () =>
      generateSite(
        {
          context,
          preferences: {
            siteType: "landing-page",
            templateId: "premium-service",
            style: "moderno",
            goal: "none",
          },
          modelSelection: { mode: "explicit", modelId: model.id },
        },
        {},
        {
          discoverModels: async () => ({ models: [model], warnings: [] }),
          requestBlueprint: async () => {
            calls++;
            throw new SiteAiError("Requisição incompatível.", 400, false);
          },
          delay: async () => {},
        },
      ),
    /Requisição incompatível/,
  );
  assert.equal(calls, 1);
});
test("JSON inválido esgota tentativas e não retorna sucesso", async () => {
  let calls = 0;
  await assert.rejects(() =>
    generateSite(
      {
        context,
        preferences: {
          siteType: "landing-page",
          templateId: blueprint.templateId,
          style: "moderno",
          goal: "none",
        },
        modelSelection: { mode: "auto" },
      },
      {},
      {
        discoverModels: async () => ({ models: [model], warnings: [] }),
        requestBlueprint: async () => {
          calls++;
          return { headline: "incompleto" };
        },
      },
    ),
  );
  assert.equal(calls, 2);
});
test("template automático preserva escolha válida da IA e manual prevalece", async () => {
  const dependencies = {
    discoverModels: async () => ({ models: [model], warnings: [] }),
    requestBlueprint: async () => ({
      ...blueprint,
      templateId: "minimal-professional" as const,
    }),
  };
  const base = {
    context,
    preferences: {
      siteType: "landing-page" as const,
      templateId: "auto" as const,
      style: "moderno" as const,
      goal: "none" as const,
      designBrief: {
        paletteMode: "recommended" as const,
        primaryColor: "#153a50",
        accentColor: "#d8aa63",
        designSystemInput: "",
        motion: "subtle" as const,
        referenceNotes: "",
      },
    },
    modelSelection: { mode: "auto" as const },
  };

  const automatic = await generateSite(base, {}, dependencies);
  assert.equal(automatic.blueprint.templateId, "minimal-professional");

  const manual = await generateSite(
    {
      ...base,
      preferences: {
        ...base.preferences,
        templateId: "premium-service" as const,
      },
    },
    {},
    dependencies,
  );
  assert.equal(manual.blueprint.templateId, "premium-service");
});
test("paleta personalizada prevalece sobre as cores retornadas pela IA", async () => {
  const result = await generateSite(
    {
      context,
      preferences: {
        siteType: "landing-page",
        templateId: "auto",
        style: "moderno",
        goal: "none",
        designBrief: {
          paletteMode: "custom",
          primaryColor: "#112233",
          accentColor: "#AABBCC",
          designSystemInput: "",
          motion: "subtle",
          referenceNotes: "",
        },
      },
      modelSelection: { mode: "auto" },
    },
    {},
    {
      discoverModels: async () => ({ models: [model], warnings: [] }),
      requestBlueprint: async () => blueprint,
    },
  );
  assert.equal(result.blueprint.brand.primaryColor, "#112233");
  assert.equal(result.blueprint.brand.accentColor, "#aabbcc");
});
test("prompt usa briefing normalizado sem incluir tokens brutos", () => {
  const prompt = buildSitePrompt(context, {
    siteType: "landing-page",
    templateId: "auto",
    style: "premium",
    goal: "contact",
    designBrief: {
      paletteMode: "imported",
      primaryColor: "#000000",
      accentColor: "#ffffff",
      designSystemInput: "--brand: #102030; RAW_MARKER_NAO_INCLUIR",
      motion: "cinematic",
      referenceNotes: "Referência editorial",
    },
  });
  assert.match(prompt, /premium-editorial/);
  assert.match(prompt, /#102030/);
  assert.doesNotMatch(prompt, /RAW_MARKER_NAO_INCLUIR/);
  assert.doesNotMatch(prompt, /designSystemInput/);
});
test("regenerar uma seção conserva serviços aprovados e outras edições", () => {
  const current = {
    ...blueprint,
    services: [
      {
        title: "Confirmado",
        description: "Manual",
        price: "R$ 20",
        source: "known" as const,
      },
    ],
  };
  const result = mergeSection(
    current,
    { ...blueprint, about: { title: "Novo", description: "Novo texto" } },
    "about",
    context,
  );
  assert.deepEqual(result.services, current.services);
  assert.equal(result.about.title, "Novo");
  assert.deepEqual(result.hero, current.hero);
});
test("persistência restaura Blueprint, edição, status e metadata após reload", () => {
  const values = new Map<string, string>();
  const storage = {
    setItem: (k: string, v: string) => {
      values.set(k, v);
    },
    getItem: (k: string) => values.get(k) || null,
  };
  const edited = {
    ...project,
    siteBlueprint: {
      ...blueprint,
      hero: { ...blueprint.hero, headline: "Título editado" },
    },
    aiGeneration: {
      provider: "gemini",
      model: "test",
      modelId: model.id,
      generatedAt: "2026-09-06",
      blueprintVersion: 1,
    },
  };
  persistProjects(storage, [edited]);
  assert.deepEqual(loadProjects(storage), [edited]);
  persistProjects(storage, [{ ...edited, generationStatus: "generating" }]);
  assert.equal(loadProjects(storage)[0].generationStatus, "error");
});
test("ZIP funciona sem dependências e coincide com renderer; export requer revisão", async () => {
  await assert.rejects(() =>
    createSiteZip({ ...project, contentReviewed: false }),
  );
  await assert.rejects(() =>
    createSiteZip({
      ...project,
      siteBlueprint: {
        ...blueprint,
        services: [{ title: "X", description: "X", source: "ai_suggestion" }],
      },
    }),
  );
  const zip = await JSZip.loadAsync(await createSiteZip(project));
  const html = await zip.file("index.html")!.async("string");
  assert.equal(html, renderSiteDocument(blueprint, context));
  assert.ok(!html.includes("/src/"));
  assert.ok(!html.includes("<script"));
  assert.deepEqual(
    JSON.parse(await zip.file("blueprint.json")!.async("string")),
    blueprint,
  );
});
