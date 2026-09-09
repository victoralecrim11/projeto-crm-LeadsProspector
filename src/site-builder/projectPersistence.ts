import type { Project } from "../types";
import { blueprintSchema, contextSchema } from "./types";
import { resolvedDesignSchema } from './contracts/research';
import { designForBlueprint } from './designPipeline';
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
