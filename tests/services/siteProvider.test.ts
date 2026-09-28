import test from "node:test";
import assert from "node:assert/strict";
import { blueprint } from "../fixtures/siteFixture";
import type { AiModelDefinition } from "../../src/site-builder/types";
import { requestBlueprint } from "../../server/services/ai/providers/siteProviders";

const model: AiModelDefinition = {
  id: "gemini:gemini-2.5-pro",
  provider: "gemini",
  model: "gemini-2.5-pro",
  label: "Gemini 2.5 Pro",
  description: "Gemini · premium",
  tier: "premium",
  enabled: true,
  supportsSiteBuilder: true,
  capabilities: { structuredOutput: true, coding: true, vision: true },
};

test("Gemini recebe somente palavras-chave de JSON Schema suportadas", async () => {
  const originalFetch = globalThis.fetch;
  let requestBody: Record<string, unknown> | undefined;
  globalThis.fetch = async (_input, init) => {
    requestBody = JSON.parse(String(init?.body));
    return Response.json({
      candidates: [
        { content: { parts: [{ text: JSON.stringify(blueprint) }] } },
      ],
    });
  };

  try {
    await requestBlueprint(model, "Gere um site", { geminiKey: "test-key" });
    const serializedSchema = JSON.stringify(
      (
        requestBody?.generationConfig as {
          responseJsonSchema?: unknown;
        }
      )?.responseJsonSchema,
    );
    for (const unsupported of [
      "$schema",
      "const",
      "minLength",
      "maxLength",
      "pattern",
    ]) {
      assert.equal(
        serializedSchema.includes(`"${unsupported}"`),
        false,
        unsupported,
      );
    }
    assert.match(serializedSchema, /"enum":\[2\]/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("Cohere gera JSON pela API v2 para o Site Builder", async () => {
  const originalFetch = globalThis.fetch;
  let url = "";
  let body: any;
  globalThis.fetch = async (input, init) => {
    url = String(input);
    body = JSON.parse(String(init?.body));
    return Response.json({ message: { content: [{ type: "text", text: JSON.stringify(blueprint) }] } });
  };
  try {
    const cohere = { ...model, id: "cohere:command-a-plus-05-2026", provider: "cohere" as const, model: "command-a-plus-05-2026" };
    assert.deepEqual(await requestBlueprint(cohere, "Gere um site", { cohereKey: "test-key" }), blueprint);
    assert.equal(url, "https://api.cohere.ai/v2/chat");
    assert.deepEqual(body.response_format, { type: "json_object" });
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("Hugging Face usa o router atual e OpenRouter 402 vira erro de provedor", async () => {
  const originalFetch = globalThis.fetch;
  const urls: string[] = [];
  globalThis.fetch = async input => {
    urls.push(String(input));
    if (String(input).includes("openrouter")) return Response.json({}, { status: 402 });
    return Response.json({ choices: [{ message: { content: JSON.stringify(blueprint) } }] });
  };
  try {
    const hf = { ...model, id: "huggingface:test", provider: "huggingface" as const, model: "openai/gpt-oss-120b:fastest" };
    await requestBlueprint(hf, "Gere um site", { huggingfaceKey: "test-key" });
    assert.equal(urls[0], "https://router.huggingface.co/v1/chat/completions");
    const openrouter = { ...model, id: "openrouter:test", provider: "openrouter" as const, model: "~openai/gpt-latest" };
    await assert.rejects(
      requestBlueprint(openrouter, "Gere um site", { openrouterKey: "test-key" }),
      (error: any) => error.status === 402 && error.safeDetail === "provider-payment-required",
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});
