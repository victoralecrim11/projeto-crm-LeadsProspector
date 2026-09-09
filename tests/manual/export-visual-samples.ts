import { mkdir, writeFile } from "node:fs/promises";
import { visualSamples } from "../fixtures/visualSamples";
import { project } from "../fixtures/siteFixture";
import { createSiteZip } from "../../src/site-builder/exportSite";
import { renderSiteDocument } from "../../src/site-builder/renderer/SiteRenderer";
const directory = "docs/reviews/visual-p0";
await mkdir(directory, { recursive: true });
for (const sample of visualSamples) {
  await writeFile(directory + "/" + sample.id + ".html", renderSiteDocument(sample.blueprint, sample.context));
  await writeFile(directory + "/" + sample.id + ".json", JSON.stringify(sample.blueprint, null, 2));
  await writeFile(directory + "/" + sample.id + ".zip", new Uint8Array(await createSiteZip({ ...project, siteBlueprint: sample.blueprint, siteContext: sample.context })));
}
await writeFile(directory + "/index.html", `<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Comparação P0</title><style>body{margin:24px;background:#eee;font-family:system-ui}main{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:20px}iframe{width:100%;height:900px;border:1px solid #aaa;background:white}h2{font-size:20px}p{font-size:13px}@media(max-width:900px){main{grid-template-columns:1fr}}</style><h1>Composições P0 — demonstrações fictícias</h1><p>Sem recipes ou imagens ainda. Abra cada HTML para avaliar desktop, tablet e mobile em tamanho real.</p><main>${visualSamples.map((s) => `<article><h2>${s.context.business.category}</h2><p>${s.blueprint.visual.hero} / ${s.blueprint.visual.about} / ${s.blueprint.visual.services}</p><p><a href="${s.id}.html">Abrir HTML</a> · <a href="${s.id}.zip">ZIP</a> · <a href="${s.id}.json">Blueprint v2</a></p><iframe title="${s.context.business.category}" src="${s.id}.html"></iframe></article>`).join("")}</main></html>`);
console.log("Cinco HTMLs, Blueprints e ZIPs gerados em " + directory);
