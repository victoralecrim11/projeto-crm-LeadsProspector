import type { Project } from "../types";
import { blueprintSchema, contextSchema } from "./types";
import { resolvedDesignSchema } from './contracts/research';
import { mediaPlanSchema } from './contracts/index.js';
import { mediaManifestSchema } from './contracts/media.js';
import { designForBlueprint } from './designPipeline';
import { deriveDefaultMediaPlan } from './media/mediaPlanBuilder';
const key = "leadsite_crm_projects_v2";
export function loadProjects(storage: Pick<Storage, "getItem">): Project[] {
  try {
    const raw = JSON.parse(storage.getItem(key) || "[]");
    if (!Array.isArray(raw)) return [];
    return raw
      .filter((p) => p && typeof p.id === "string")
      .map((p: Project) => {
        if (p.siteDesign) {
          const design = resolvedDesignSchema.safeParse(p.siteDesign);
          if (!design.success) return { ...p, siteBlueprint: undefined, generationStatus: 'error' as const, generationError: 'Design salvo inválido. Gere novamente.' };
          p = { ...p, siteDesign: design.data };
        }
        if (p.siteMediaPlan) {
          const mp = mediaPlanSchema.safeParse(p.siteMediaPlan);
          p = { ...p, siteMediaPlan: mp.success ? mp.data : undefined };
        }
        if (p.siteMediaManifest) {
          const mm = mediaManifestSchema.safeParse(p.siteMediaManifest);
          p = { ...p, siteMediaManifest: mm.success ? mm.data : undefined };
        }
        const parsed = blueprintSchema.safeParse(p.siteBlueprint);
        if (
          p.siteBlueprint &&
          (!parsed.success ||
            !contextSchema.safeParse(p.siteContext).success)
        )
          return {
            ...p,
            siteBlueprint: undefined,
            generationStatus: "error",
            generationError: "Blueprint salvo inválido. Gere novamente.",
          };
        if (parsed.success) p = { ...p, siteBlueprint: parsed.data };
        if (p.generationStatus === "generating")
          return {
            ...p,
            generationStatus: "error",
            generationError: "A geração foi interrompida. Gere novamente.",
          };
        return p;
      });
  } catch {
    return [];
  }
}
export function persistProjects(
  storage: Pick<Storage, "setItem">,
  projects: Project[],
) {
  storage.setItem(key, JSON.stringify(projects.map(p => p.siteDesign && p.siteBlueprint ?
    { ...p, siteDesign: designForBlueprint(p.siteDesign, p.siteBlueprint) } : p)));
}
