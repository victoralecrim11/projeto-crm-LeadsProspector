import JSZip from "jszip";
import { renderSiteDocument } from "./renderer/SiteRenderer";
import { contextSchema } from "./types";
import { normalizeForRender } from "./sections/registry";
import type { Project } from "../types";
import { designForBlueprint, designSystemMarkdown, buildDesignSystemContract } from './designPipeline';
export async function createSiteZip(project: Project) {
  if (!project.siteBlueprint || !project.siteContext)
    throw new Error("Este projeto ainda não tem site gerado.");
  const blueprint = normalizeForRender(project.siteBlueprint);
  const context = contextSchema.parse(project.siteContext);
  if (!project.contentReviewed)
    throw new Error(
      "Revise o conteúdo e confirme as informações antes de exportar.",
    );
  if (blueprint.services.some((s) => s.source === "ai_suggestion"))
    throw new Error(
      "Aceite ou remova os serviços sugeridos antes de exportar.",
    );
  const zip = new JSZip();
  const design = project.siteDesign ? designForBlueprint(project.siteDesign, blueprint) : undefined;
  zip.file("index.html", renderSiteDocument(blueprint, context, design));
  if (design) {
    zip.file('DESIGN.md', design.designMarkdown);
    zip.file('design.json', JSON.stringify(design, null, 2));
    zip.file('.design/design-system.md', designSystemMarkdown(buildDesignSystemContract(design)));
  }
  zip.file("blueprint.json", JSON.stringify(blueprint, null, 2));
  zip.file("context.json", JSON.stringify(context, null, 2));
  return zip.generateAsync({ type: "uint8array" });
}
export async function downloadSiteZip(project: Project) {
  const bytes = await createSiteZip(project);
  const blob = new Blob([bytes as BlobPart], { type: "application/zip" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "site.zip";
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
