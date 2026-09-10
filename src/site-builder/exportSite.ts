import JSZip from "jszip";
import { renderSiteDocument } from "./renderer/SiteRenderer";
import { contextSchema } from "./types";
import { normalizeForRender } from "./sections/registry";
import type { Project } from "../types";
import { designForBlueprint, designSystemMarkdown, buildDesignSystemContract } from './designPipeline';
import type { MediaAssetStore } from './media/assetStore';
import { IndexedDbMediaAssetStore } from './media/assetStore';

export async function createSiteZip(project: Project, assetStore?: MediaAssetStore) {
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

  const assetUrls: Record<string, string> = {};

  if (project.siteMediaManifest && project.siteMediaManifest.entries.length > 0) {
    for (const entry of project.siteMediaManifest.entries) {
      if (['reviewed', 'exportable'].includes(entry.reviewStatus)) {
        if (assetStore) {
          let buffer: Uint8Array | null = null;
          if (assetStore.getBuffer) {
            buffer = await assetStore.getBuffer(entry.assetId);
          }
          if (!buffer) {
            const blob = await assetStore.get(entry.assetId);
            if (blob) {
              const arrayBuf = await blob.arrayBuffer();
              buffer = new Uint8Array(arrayBuf);
            }
          }

          if (buffer) {
            zip.file(`assets/${entry.assetPath}`, buffer);
            assetUrls[entry.assetId] = `./assets/${entry.assetPath}`;
          }
        }
      }
    }
    zip.file("media/media-manifest.json", JSON.stringify(project.siteMediaManifest, null, 2));
  }

  zip.file("index.html", renderSiteDocument(blueprint, context, design, project.siteMediaManifest, assetUrls));
  if (design) {
    zip.file('DESIGN.md', design.designMarkdown);
    zip.file('design.json', JSON.stringify(design, null, 2));
    zip.file('.design/design-system.md', designSystemMarkdown(buildDesignSystemContract(design)));
  }
  zip.file("blueprint.json", JSON.stringify(blueprint, null, 2));
  zip.file("context.json", JSON.stringify(context, null, 2));
  return zip.generateAsync({ type: "uint8array" });
}

export async function downloadSiteZip(project: Project, assetStore?: MediaAssetStore) {
  const store = assetStore ?? (typeof window !== 'undefined' ? new IndexedDbMediaAssetStore() : undefined);
  const bytes = await createSiteZip(project, store);
  const blob = new Blob([bytes as BlobPart], { type: "application/zip" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "site.zip";
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
