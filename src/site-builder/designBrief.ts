import {
  templates,
  type DesignBrief,
  type LeadSiteContext,
  type SitePreferences,
} from "./types";

export type DesignLens =
  | "local-conversion"
  | "premium-editorial"
  | "trust-institutional"
  | "appointment-flow";

export type NormalizedDesignBrief = {
  lens: DesignLens;
  colors: string[];
  motion: "subtle" | "cinematic" | "none";
  referenceNotes: string;
  templateCandidates: (typeof templates)[number][];
};

const defaultBrief: DesignBrief = {
  paletteMode: "recommended",
  primaryColor: "#153a50",
  accentColor: "#d8aa63",
  designSystemInput: "",
  motion: "subtle",
  referenceNotes: "",
};

const colorPattern = /^#[0-9a-fA-F]{6}$/;
const unsafePattern = /url\s*\(|@import|<\s*script/i;

function invalidDesignSystem(detail: string): never {
  throw new Error(`Design system inválido: ${detail}.`);
}

function addJsonColors(
  value: unknown,
  output: Record<string, string>,
  prefix = "",
  depth = 0,
) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return;
  if (depth > 1) invalidDesignSystem("use no máximo dois níveis de tokens");

  for (const [key, child] of Object.entries(value)) {
    const token = prefix ? `${prefix}.${key}` : key;
    if (typeof child === "string" && colorPattern.test(child)) {
      output[token] = child.toLowerCase();
    } else if (child && typeof child === "object" && !Array.isArray(child)) {
      addJsonColors(child, output, token, depth + 1);
    }
  }
}

export function parseDesignSystemInput(input: string): Record<string, string> {
  const source = input.trim();
  if (!source || source.length > 4000)
    invalidDesignSystem("informe entre 1 e 4000 caracteres");
  if (unsafePattern.test(source))
    invalidDesignSystem("URLs, imports e scripts não são aceitos");

  const colors: Record<string, string> = {};
  if (source.startsWith("{")) {
    try {
      addJsonColors(JSON.parse(source), colors);
    } catch (error) {
      if (error instanceof Error && error.message.startsWith("Design system"))
        throw error;
      invalidDesignSystem("JSON malformado");
    }
  } else {
    const variables = source.matchAll(
      /--([a-zA-Z0-9_-]+)\s*:\s*(#[0-9a-fA-F]{6})\s*;?/g,
    );
    for (const match of variables) colors[match[1]] = match[2].toLowerCase();
  }

  const count = Object.keys(colors).length;
  if (!count) invalidDesignSystem("nenhuma cor hexadecimal foi encontrada");
  if (count > 12) invalidDesignSystem("use no máximo 12 cores");
  return colors;
}

export function resolveDesignLens(
  _context: LeadSiteContext,
  preferences: SitePreferences,
): DesignLens {
  if (preferences.templateId === "appointment-focused")
    return "appointment-flow";
  if (preferences.siteType === "institutional") return "trust-institutional";
  if (
    preferences.style === "premium" ||
    preferences.designBrief?.motion === "cinematic"
  )
    return "premium-editorial";
  return "local-conversion";
}

function recommendedColors(context: LeadSiteContext) {
  const category = context.business.category
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  if (/salao|beleza|estetica|spa/.test(category))
    return ["#402a3a", "#d7a9a1"];
  if (/restaurante|cafe|lanch|burger|padaria/.test(category))
    return ["#3b2416", "#e6a23c"];
  if (/saude|clinica|medic|odonto/.test(category))
    return ["#164e63", "#22c55e"];
  if (/imovel|imobili|advoc|consult/.test(category))
    return ["#172554", "#c8a96b"];
  return ["#153a50", "#d8aa63"];
}

function templateCandidates(lens: DesignLens): (typeof templates)[number][] {
  if (lens === "premium-editorial")
    return [
      "premium-service",
      "minimal-professional",
      "modern-local-business",
    ];
  if (lens === "trust-institutional")
    return [
      "minimal-professional",
      "premium-service",
      "modern-local-business",
    ];
  if (lens === "appointment-flow")
    return [
      "appointment-focused",
      "premium-service",
      "modern-local-business",
    ];
  return [
    "modern-local-business",
    "appointment-focused",
    "premium-service",
  ];
}

export function normalizeDesignBrief(
  context: LeadSiteContext,
  preferences: SitePreferences,
): NormalizedDesignBrief {
  const brief = { ...defaultBrief, ...preferences.designBrief };
  const lens = resolveDesignLens(context, preferences);
  let colors = recommendedColors(context);

  if (brief.paletteMode === "custom")
    colors = [brief.primaryColor.toLowerCase(), brief.accentColor.toLowerCase()];
  if (brief.paletteMode === "imported")
    colors = Object.values(parseDesignSystemInput(brief.designSystemInput));

  return {
    lens,
    colors,
    motion: brief.motion,
    referenceNotes: brief.referenceNotes.trim().slice(0, 600),
    templateCandidates: templateCandidates(lens),
  };
}
