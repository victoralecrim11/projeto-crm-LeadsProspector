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
    assert.match(serializedSchema, /"enum":\[1\]/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
