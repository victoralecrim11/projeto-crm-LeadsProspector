import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const packageJson = JSON.parse(
  readFileSync(new URL("../../package.json", import.meta.url), "utf8"),
) as { scripts: Record<string, string> };

test("servidor compilado inicia explicitamente em produção", () => {
  assert.match(packageJson.scripts.start, /NODE_ENV\s*=\s*['"]production['"]/);
});

test("preview usa o servidor completo em vez do Vite isolado", () => {
  assert.doesNotMatch(packageJson.scripts.preview, /vite preview/);
  assert.match(packageJson.scripts.preview, /npm run start/);
});

test("documento declara um favicon existente", () => {
  const html = readFileSync(new URL("../../index.html", import.meta.url), "utf8");
  assert.match(html, /rel="icon"[^>]+href="\/favicon\.svg"/);
  assert.equal(
    existsSync(new URL("../../public/favicon.svg", import.meta.url)),
    true,
  );
});
