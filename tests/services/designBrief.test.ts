import test from "node:test";
import assert from "node:assert/strict";
import { context } from "../fixtures/siteFixture";
import {
  normalizeDesignBrief,
  parseDesignSystemInput,
  resolveDesignLens,
} from "../../src/site-builder/designBrief";

test("importa tokens de cor de JSON", () => {
  assert.deepEqual(
    parseDesignSystemInput(
      '{"primary":"#112233","nested":{"accent":"#AABBCC"}}',
    ),
    { primary: "#112233", "nested.accent": "#aabbcc" },
  );
});

test("importa tokens de cor de variáveis CSS", () => {
  assert.deepEqual(
    parseDesignSystemInput(
      "--brand-primary: #123456; --brand-accent: #ABCDEF;",
    ),
    { "brand-primary": "#123456", "brand-accent": "#abcdef" },
  );
});

test("rejeita conteúdo executável, URLs, entrada excessiva e paleta vazia", () => {
  for (const value of [
    "url(https://evil.example)",
    "@import 'x.css'",
    "<script>alert(1)</script>",
    "x".repeat(4001),
    "--space: 8px",
  ]) {
    assert.throws(() => parseDesignSystemInput(value), /Design system inválido/);
  }
});

test("limita o design system a doze cores", () => {
  const input = Array.from(
    { length: 13 },
    (_, index) => `--color-${index}: #${String(index).padStart(6, "0")};`,
  ).join(" ");
  assert.throws(() => parseDesignSystemInput(input), /no máximo 12 cores/);
});

test("seleciona lente premium para movimento cinematográfico", () => {
  const preferences = {
    siteType: "landing-page" as const,
    templateId: "auto" as const,
    style: "moderno" as const,
    goal: "contact" as const,
    designBrief: {
      paletteMode: "imported" as const,
      primaryColor: "#111827",
      accentColor: "#f59e0b",
      designSystemInput: "--brand: #102030; --accent: #FEDCBA;",
      motion: "cinematic" as const,
      referenceNotes: "Credibilidade executiva",
    },
  };

  assert.equal(resolveDesignLens(context, preferences), "premium-editorial");
  assert.deepEqual(normalizeDesignBrief(context, preferences), {
    lens: "premium-editorial",
    colors: ["#102030", "#fedcba"],
    motion: "cinematic",
    referenceNotes: "Credibilidade executiva",
    templateCandidates: [
      "premium-service",
      "minimal-professional",
      "modern-local-business",
    ],
  });
  assert.equal(
    "designSystemInput" in normalizeDesignBrief(context, preferences),
    false,
  );
});

test("prioriza fluxo de agendamento e institucional quando explícitos", () => {
  const brief = {
    paletteMode: "recommended" as const,
    primaryColor: "#153a50",
    accentColor: "#d8aa63",
    designSystemInput: "",
    motion: "subtle" as const,
    referenceNotes: "",
  };
  assert.equal(
    resolveDesignLens(context, {
      siteType: "landing-page",
      templateId: "appointment-focused",
      style: "moderno",
      goal: "contact",
      designBrief: brief,
    }),
    "appointment-flow",
  );
  assert.equal(
    resolveDesignLens(context, {
      siteType: "institutional",
      templateId: "auto",
      style: "profissional",
      goal: "none",
      designBrief: brief,
    }),
    "trust-institutional",
  );
});

test("paleta recomendada usa contexto e mantém fallback conservador", () => {
  const normalized = normalizeDesignBrief(context, {
    siteType: "landing-page",
    templateId: "auto",
    style: "moderno",
    goal: "none",
    designBrief: {
      paletteMode: "recommended",
      primaryColor: "#000000",
      accentColor: "#ffffff",
      designSystemInput: "",
      motion: "subtle",
      referenceNotes: "",
    },
  });
  assert.equal(normalized.colors.length, 2);
  assert.match(normalized.colors[0], /^#[0-9a-f]{6}$/);
});
