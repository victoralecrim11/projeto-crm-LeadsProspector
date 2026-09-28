import test from "node:test";
import assert from "node:assert/strict";
import type { CrmSettingsConfig } from "../../src/types";
import { getSiteModels } from "../../src/services/siteGenerationService";

const settings = {} as CrmSettingsConfig;

test("informa quando o servidor local está indisponível", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => {
    throw new TypeError("fetch failed");
  };
  try {
    await assert.rejects(
      () => getSiteModels(settings),
      /Servidor local indisponível/,
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("distingue timeout de indisponibilidade imediata", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => {
    throw new DOMException("timed out", "TimeoutError");
  };
  try {
    await assert.rejects(
      () => getSiteModels(settings),
      /excedeu o tempo limite/,
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("informa quando o backend retorna JSON inválido", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () =>
    new Response("Bad gateway", {
      status: 502,
      headers: { "Content-Type": "text/plain" },
    });
  try {
    await assert.rejects(
      () => getSiteModels(settings),
      /resposta inválida/,
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("explica quando a SPA responde HTML no lugar da API de IA", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () =>
    new Response("<!doctype html><html><head></head></html>", {
      status: 200,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  try {
    await assert.rejects(
      () => getSiteModels(settings),
      /API de IA não está disponível.*npm run dev/i,
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("preserva mensagem segura devolvida pelo backend", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () =>
    Response.json(
      { error: "O provedor está temporariamente indisponível." },
      { status: 503 },
    );
  try {
    await assert.rejects(
      () => getSiteModels(settings),
      /temporariamente indisponível/,
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("catálogo de sites recebe as chaves de todos os provedores homologados", async () => {
  const originalFetch = globalThis.fetch;
  let captured = new Headers();
  globalThis.fetch = async (_input, init) => {
    captured = new Headers(init?.headers);
    return Response.json({ models: [], warnings: [] });
  };
  const configured = {
    aiProviders: [
      { id: "g", provider: "gemini", apiKey: "gemini-secret" },
      { id: "q", provider: "groq", apiKey: "groq-secret" },
      { id: "h", provider: "huggingface", apiKey: "hf-secret" },
      { id: "c", provider: "cohere", apiKey: "cohere-secret" },
      { id: "o", provider: "openrouter", apiKey: "openrouter-secret" },
    ],
  } as CrmSettingsConfig;
  try {
    await getSiteModels(configured);
    for (const provider of ["gemini", "groq", "huggingface", "cohere", "openrouter"]) {
      assert.ok(captured.get(`x-${provider}-api-key`));
    }
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("catálogo de sites prioriza a configuração mais recente do mesmo provedor", async () => {
  const originalFetch = globalThis.fetch;
  let captured = new Headers();
  globalThis.fetch = async (_input, init) => {
    captured = new Headers(init?.headers);
    return Response.json({ models: [], warnings: [] });
  };
  const configured = {
    aiProviders: [
      { id: "old", provider: "groq", apiKey: "old-secret" },
      { id: "empty", provider: "groq", apiKey: "" },
      { id: "new", provider: "groq", apiKey: " new-secret " },
    ],
  } as CrmSettingsConfig;
  try {
    await getSiteModels(configured);
    assert.equal(captured.get("x-groq-api-key"), "new-secret");
  } finally {
    globalThis.fetch = originalFetch;
  }
});
