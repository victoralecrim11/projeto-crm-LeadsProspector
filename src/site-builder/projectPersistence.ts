import type { Project } from "../types";
import { blueprintSchema, contextSchema } from "./types";
const key = "leadsite_crm_projects_v2";
export function loadProjects(storage: Pick<Storage, "getItem">): Project[] {
  try {
    const raw = JSON.parse(storage.getItem(key) || "[]");
    if (!Array.isArray(raw)) return [];
    return raw
      .filter((p) => p && typeof p.id === "string")
      .map((p: Project) => {
        if (
          p.siteBlueprint &&
          (!blueprintSchema.safeParse(p.siteBlueprint).success ||
            !contextSchema.safeParse(p.siteContext).success)
        )
          return {
            ...p,
            siteBlueprint: undefined,
            generationStatus: "error",
            generationError: "Blueprint salvo inválido. Gere novamente.",
          };
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
  storage.setItem(key, JSON.stringify(projects));
}
