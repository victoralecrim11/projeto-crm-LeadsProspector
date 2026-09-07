import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

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
