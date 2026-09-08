import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import type { Express } from "express";

const rootUrl = new URL("../../", import.meta.url);

test("runtime da Vercel usa uma versão LTS compatível com a CLI do projeto", () => {
  const packageJson = JSON.parse(
    readFileSync(new URL("package.json", rootUrl), "utf8"),
  ) as { engines?: { node?: string } };

  assert.equal(packageJson.engines?.node, "22.x");
});

test("imports relativos do backend permanecem resolvíveis após compilar para ESM", () => {
  const backendFiles = [
    "api/index.ts",
    "server.ts",
    "src/types.ts",
    "src/site-builder/context.ts",
    "src/site-builder/designBrief.ts",
    "src/site-builder/types.ts",
    ...readdirSync(new URL("server", rootUrl), { recursive: true })
      .map(String)
      .filter((path) => path.endsWith(".ts"))
      .map((path) => `server/${path.replaceAll("\\", "/")}`),
  ];

  for (const file of backendFiles) {
    const source = readFileSync(new URL(file, rootUrl), "utf8");
    const imports = source.matchAll(/from\s+["'](\.{1,2}\/[^"']+)["']/g);
    for (const match of imports) {
      assert.match(match[1], /\.js$/, `${file}: ${match[1]}`);
    }
  }
});

test("deploy da Vercel separa o frontend estático da função Express", () => {
  const functionUrl = new URL("api/index.ts", rootUrl);
  assert.equal(existsSync(functionUrl), true, "api/index.ts deve existir");

  const config = JSON.parse(
    readFileSync(new URL("vercel.json", rootUrl), "utf8"),
  ) as {
    buildCommand?: string;
    outputDirectory?: string;
    functions?: Record<string, { maxDuration?: number }>;
    rewrites?: Array<{ source: string; destination: string }>;
  };

  assert.equal(config.buildCommand, "npm run build:client");
  assert.equal(config.outputDirectory, "dist");
  assert.equal(config.functions?.["api/index.ts"]?.maxDuration, 60);
  assert.deepEqual(config.rewrites, [
    { source: "/api/:path*", destination: "/api" },
    { source: "/:path*", destination: "/index.html" },
  ]);
});

test("função Express da Vercel preserva as rotas e respostas JSON", async () => {
  const moduleUrl = new URL("api/index.ts", rootUrl);
  const imported = await import(moduleUrl.href).catch(() => null);
  assert.ok(imported, "api/index.ts deve ser importável");

  const app = imported.default as Express;
  assert.equal(typeof app.listen, "function");

  const server = app.listen(0, "127.0.0.1");
  await new Promise<void>((resolve) => server.once("listening", resolve));
  const address = server.address() as { port: number };
  const origin = `http://127.0.0.1:${address.port}`;

  try {
    const health = await fetch(`${origin}/api/health`);
    assert.equal(health.status, 200);
    assert.deepEqual(await health.json(), { status: "ok" });

    const overpass = await fetch(`${origin}/api/overpass`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{}",
    });
    assert.equal(overpass.status, 400);
    assert.match(overpass.headers.get("content-type") ?? "", /json/);

    const nominatim = await fetch(`${origin}/api/nominatim/search`);
    assert.equal(nominatim.status, 400);
    assert.match(nominatim.headers.get("content-type") ?? "", /json/);

    const missing = await fetch(`${origin}/api/nao-existe`);
    assert.equal(missing.status, 404);
    assert.match(missing.headers.get("content-type") ?? "", /json/);
  } finally {
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  }
});
