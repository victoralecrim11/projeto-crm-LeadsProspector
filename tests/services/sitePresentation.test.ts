import test from "node:test";
import assert from "node:assert/strict";
import { blueprint, context } from "../fixtures/siteFixture";
import { blueprintSchema } from "../../src/site-builder/types";
import { renderSiteDocument } from "../../src/site-builder/renderer/SiteRenderer";
import { resolvePresentation, surfacePalettes } from "../../src/site-builder/renderer/presentation";

function luminance(hex: string) {
  const rgb = hex.slice(1).match(/../g)!.map((c) => parseInt(c, 16) / 255).map((c) => c <= .04045 ? c / 12.92 : ((c + .055) / 1.055) ** 2.4);
  return rgb[0] * .2126 + rgb[1] * .7152 + rgb[2] * .0722;
}
test("textos principais e secundários mantêm contraste em todas as superfícies", () => {
  for (const palette of Object.values(surfacePalettes)) {
    for (const bg of [palette.background, palette.surface, palette.raised]) {
      for (const fg of [palette.text, palette.muted]) {
        const a = luminance(bg), b = luminance(fg);
        assert.ok((Math.max(a, b) + .05) / (Math.min(a, b) + .05) >= 4.5, `${fg} sobre ${bg}`);
      }
    }
  }
});
test("v2 anterior continua válido, apresentação opcional controla HTML sem scripts", () => {
  assert.equal(resolvePresentation(blueprint).typography, "modern");
  for (const theme of ["dark", "light"] as const) for (const motion of ["none", "subtle"] as const) {
    const value = blueprintSchema.parse({ ...blueprint, presentation: { theme, motion, typography: "modern" } });
    const html = renderSiteDocument(value, context);
    assert.ok(html.includes(`data-theme="${theme}"`));
    assert.ok(html.includes(`data-motion="${motion}"`));
    assert.ok(html.includes("prefers-reduced-motion:no-preference"));
    assert.ok(!html.includes("<script"));
    assert.equal(value.brand.primaryColor, blueprint.brand.primaryColor);
  }
  assert.equal(blueprintSchema.safeParse({ ...blueprint, presentation: { theme: "url(evil)", motion: "subtle", typography: "modern" } }).success, false);
});
