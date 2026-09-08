import { constrainBlueprint } from "../../../src/site-builder/context.js";
import type {
  GeneratedSiteBlueprint,
  GenerationMetadata,
  LeadSiteContext,
  SitePreferences,
  ModelSelection,
  RegenerationSection,
  AiModelDefinition,
} from "../../../src/site-builder/types.js";
import {
  discoverModels,
  resolveModels,
  SiteAiError,
  type Credentials,
} from "./modelRegistry.js";
import { buildSitePrompt } from "./sitePromptBuilder.js";
import { requestBlueprint } from "./providers/siteProviders.js";
import { normalizeDesignBrief } from "../../../src/site-builder/designBrief.js";
export async function generateSite(
  input: {
    context: LeadSiteContext;
    preferences: SitePreferences;
    modelSelection: ModelSelection;
    blueprint?: GeneratedSiteBlueprint;
    section?: RegenerationSection;
  },
  credentials: Credentials,
  dependencies: {
    discoverModels: typeof discoverModels;
    requestBlueprint: typeof requestBlueprint;
    delay?: (milliseconds: number) => Promise<void>;
  } = { discoverModels, requestBlueprint },
) {
  let design: ReturnType<typeof normalizeDesignBrief>;
  try {
    design = normalizeDesignBrief(input.context, input.preferences);
  } catch (error) {
    throw new SiteAiError(
      error instanceof Error ? error.message : "Briefing visual inválido.",
      400,
    );
  }
  const catalog = await dependencies.discoverModels(credentials);
  const candidates = resolveModels(
    catalog.models,
    input.modelSelection,
    Boolean(input.section),
  );
  let lastError: unknown;
  const delay =
    dependencies.delay ??
    ((milliseconds: number) =>
      new Promise<void>((resolve) => setTimeout(resolve, milliseconds)));
  for (const model of candidates) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const prompt = buildSitePrompt(
          input.context,
          input.preferences,
          input.section
            ? "Regenerar " +
                input.section +
                ". Estado atual (dados): " +
                JSON.stringify(input.blueprint)
            : undefined,
        );
        const raw = await dependencies.requestBlueprint(
          model,
          prompt +
            (attempt
              ? "\nA resposta anterior foi inválida. Respeite exatamente o schema."
              : ""),
          credentials,
        );
        let blueprint = constrainBlueprint(raw, input.context, true);
        if (input.preferences.templateId !== "auto")
          blueprint.templateId = input.preferences.templateId;
        if (input.preferences.designBrief?.paletteMode !== "recommended") {
          blueprint.brand.primaryColor = design.colors[0];
          blueprint.brand.accentColor = design.colors[1] ?? design.colors[0];
        }
        blueprint.brand.tone = input.preferences.style;
        if (input.blueprint && input.section)
          blueprint = mergeSection(
            input.blueprint,
            blueprint,
            input.section,
            input.context,
          );
        const generation: GenerationMetadata = {
          provider: model.provider,
          model: model.model,
          modelId: model.id,
          generatedAt: new Date().toISOString(),
          blueprintVersion: 1,
        };
        return {
          success: true as const,
          blueprint,
          warnings: [...catalog.warnings, ...blueprint.warnings],
          generation,
        };
      } catch (e) {
        lastError = e;
        if (e instanceof SiteAiError && !e.retryable) throw e;
        if (attempt === 0) await delay(250);
      }
    }
  }
  if (lastError instanceof SiteAiError) throw lastError;
  throw new SiteAiError(
    "A IA retornou um Blueprint incompatível após as tentativas permitidas.",
    502,
    true,
  );
}
export function mergeSection(
  current: GeneratedSiteBlueprint,
  generated: GeneratedSiteBlueprint,
  section: RegenerationSection,
  context: LeadSiteContext,
) {
  const next = structuredClone(current);
  if (section === "headline") {
    next.hero.headline = generated.hero.headline;
    next.hero.subtitle = generated.hero.subtitle;
  }
  if (section === "cta") {
    next.hero.ctaText = generated.hero.ctaText;
    next.hero.ctaType = generated.hero.ctaType;
  }
  if (section === "about") next.about = generated.about;
  if (section === "services") next.services = generated.services;
  if (section === "tone") {
    next.brand.tone = generated.brand.tone;
    next.hero = generated.hero;
    next.about = generated.about;
  }
  next.warnings = generated.warnings;
  return constrainBlueprint(next, context);
}
