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
import { isCooling, setCooldown } from "./providerCooldown.js";
import { buildSitePrompt } from "./sitePromptBuilder.js";
import { requestBlueprint } from "./providers/siteProviders.js";
import { normalizeDesignBrief } from "../../../src/site-builder/designBrief.js";
import { reactToolkitProfile } from "../../../src/site-builder/guidance/reactToolkit.js";
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
  const startTime = Date.now();
  const GLOBAL_TIMEOUT_MS = 120_000;
  for (const model of candidates) {
    // Global timeout guard
    if (Date.now() - startTime > GLOBAL_TIMEOUT_MS)
      throw new SiteAiError("Tempo limite da geração atingido.", 504, true, 'SITE_AI_PROVIDER_TIMEOUT');
    // If running in automatic selection, skip providers/models currently in cooldown
    if (input.modelSelection?.mode === "auto" && isCooling(model.provider, model.model)) {
      console.warn(`[SiteGenerator] Skipping model in cooldown: ${model.id}`);
      continue;
    }
    console.log(`[SiteGenerator] Tentando modelo: ${model.id}`);
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        console.log(`[SiteGenerator] Attempt ${attempt} for ${model.id}`);
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
        blueprint.presentation = {
          theme: blueprint.presentation?.theme ?? (blueprint.templateId === "premium-service" || blueprint.templateId === "modern-local-business" ? "dark" : "light"),
          typography: blueprint.presentation?.typography ?? "modern",
          motion: design.motion === "none" ? "none" : "subtle",
        };
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
          blueprintVersion: blueprint.version,
          mode: "legacy",
          guidance: { id: reactToolkitProfile.id, version: reactToolkitProfile.version, sourceVersion: reactToolkitProfile.sourceVersion, sourceCommit: reactToolkitProfile.sourceCommit },
        };
        return {
          success: true as const,
          blueprint,
          warnings: [...catalog.warnings, ...blueprint.warnings],
          generation,
        };
      } catch (e) {
        console.error(`[SiteGenerator] Error in attempt ${attempt} for ${model.id}:`, e instanceof Error ? e.message : e);
        lastError = e;
        if (e instanceof SiteAiError && (e.status === 429 || e.status === 503 || e.status === 504 || e.code === 'SITE_AI_PROVIDER_TIMEOUT' || e.code === 'SITE_AI_PROVIDER_NETWORK')) {
          // Automatic selection: mark cooldown and move to next fallback model.
          // Note: requestBlueprint already sets cooldown using Retry-After if present.
          if (input.modelSelection?.mode === "auto") {
            if (!isCooling(model.provider, model.model)) {
              setCooldown(model.provider, model.model, e.status === 429 ? 60000 : 30000);
            }
            console.warn(`[SiteGenerator] Provider status ${e.status} for ${model.id}. Moving to next fallback model.`);
            break;
          }
          // Explicit/manual: allow retry on retryable errors (do not fallback to other models).
        }
        if (e instanceof SiteAiError && !e.retryable) {
          console.error(`[SiteGenerator] Error is NOT retryable. Aborting fallback loop for ${model.id}!`);
          throw e;
        }
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
