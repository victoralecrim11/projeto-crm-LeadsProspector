import test from "node:test";
import assert from "node:assert/strict";
import { visualSamples } from "../fixtures/visualSamples";
import { renderSiteDocument } from "../../src/site-builder/renderer/SiteRenderer";

test("todas as famílias geradas têm navegação mobile funcional no HTML estático", () => {
  for (const { id, blueprint, context } of visualSamples) {
    const html = renderSiteDocument(blueprint, context);
    assert.match(html, /<nav class="site-navigation-desktop" aria-label="Seções do site">/, id);
    assert.match(html, /<details class="site-navigation-mobile"><summary aria-label="Menu de navegação">/, id);
    assert.match(html, /\.site-navigation-mobile:not\(\[open\]\) nav\{display:none\}/, id);
    assert.match(html, /@media\(max-width:800px\)/, id);
    const header = html.match(/<header class="site-navigation">([\s\S]*?)<\/header>/)?.[1];
    assert.ok(header, `${id}: cabeçalho ausente`);
    for (const section of blueprint.sectionOrder.filter((name) => blueprint.sections[name])) {
      assert.equal(header.split(`href="#${section}"`).length - 1, 2, `${id}: ${section} deve existir nos dois menus`);
    }
  }
});
