import test from "node:test";
import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import { DesignBriefControls } from "../../src/site-builder/components/DesignBriefControls";
import type { DesignBrief } from "../../src/site-builder/types";

const base: DesignBrief = {
  paletteMode: "recommended",
  primaryColor: "#153a50",
  accentColor: "#d8aa63",
  designSystemInput: "",
  motion: "subtle",
  referenceNotes: "",
};

test("briefing inicia compacto e identifica campos opcionais", () => {
  const html = renderToStaticMarkup(
    <DesignBriefControls value={base} onChange={() => {}} />,
  );
  assert.match(html, /<details class="design-brief"/);
  assert.match(html, /Direção de design/);
  assert.match(html, /opcional/);
  assert.match(html, /Paleta/);
  assert.match(html, /Movimento/);
  assert.doesNotMatch(html, /Design system \(JSON/);
});

test("paleta personalizada mostra seletores de cor", () => {
  const html = renderToStaticMarkup(
    <DesignBriefControls
      value={{ ...base, paletteMode: "custom" }}
      onChange={() => {}}
    />,
  );
  assert.match(html, /Cor principal/);
  assert.match(html, /Cor de destaque/);
  assert.equal((html.match(/type="color"/g) ?? []).length, 2);
});

test("importação explica o formato seguro aceito", () => {
  const html = renderToStaticMarkup(
    <DesignBriefControls
      value={{ ...base, paletteMode: "imported" }}
      onChange={() => {}}
    />,
  );
  assert.match(html, /Design system \(JSON ou variáveis CSS\)/);
  assert.match(html, /URLs e CSS executável não são aceitos/);
  assert.match(html, /maxlength="4000"/i);
});
