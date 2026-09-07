import { constrainBlueprint } from "../../../src/site-builder/context";
import type {
  GeneratedSiteBlueprint,
  GenerationMetadata,
  LeadSiteContext,
  SitePreferences,
  ModelSelection,
  RegenerationSection,
  AiModelDefinition,
} from "../../../src/site-builder/types";
import {
  discoverModels,
  resolveModels,
  SiteAiError,
  type Credentials,
} from "./modelRegistry";
import { buildSitePrompt } from "./sitePromptBuilder";
import { requestBlueprint } from "./providers/siteProviders";
export async function generateSite(
  input: {
    context: LeadSiteContext;
    preferences: SitePreferences;
    modelSelection: ModelSelection;
    blueprint?: GeneratedSiteBlueprint;
    section?: RegenerationSection;
  },
  credentials: Credentials,
  dependencies = { discoverModels, requestBlueprint },
) {
  const catalog = await dependencies.discoverModels(credentials);
  const candidates = resolveModels(
    catalog.models,
    input.modelSelection,
    Boolean(input.section),
  );
  let lastError: unknown;
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
        blueprint.templateId = input.preferences.templateId;
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
        if (e instanceof SiteAiError && e.status === 401) throw e;
      }
    }
  }
  throw new SiteAiError(
    lastError instanceof SiteAiError
      ? lastError.message
      : "A IA retornou um Blueprint incompatível após as tentativas permitidas.",
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
