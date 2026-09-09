import test from "node:test";
import assert from "node:assert/strict";
import { createOverpassAgent, overpassFailure } from "../../server/services/overpassTransport";
import { fetchLeadsFromOverpass } from "../../src/services/overpassService";

test("Overpass mantém validação TLS e distingue certificado, timeout e indisponibilidade", () => {
  const agent = createOverpassAgent();
  assert.equal(agent.options.rejectUnauthorized, true);
  agent.destroy();
  assert.equal(overpassFailure({ code: "SELF_SIGNED_CERT_IN_CHAIN" }).code, "OVERPASS_TLS_ERROR");
  assert.equal(overpassFailure(new Error("Request timed out")).status, 504);
  assert.equal(overpassFailure(new Error("HTTP 503")).code, "OVERPASS_UNAVAILABLE");
});

test("busca mostra causa correta para erro TLS e aceita erro não JSON", async () => {
  const originalFetch = globalThis.fetch;
  try {
    for (const [body, pattern] of [
      ['{"code":"OVERPASS_TLS_ERROR"}', /certificado HTTPS/],
      ['<html>Bad Gateway</html>', /indisponíveis ou a conexão falhou/],
    ] as const) {
      globalThis.fetch = async () => new Response(body, { status: 502 });
      await assert.rejects(fetchLeadsFromOverpass({ lat: -19.9167, lng: -43.9345, radiusMeters: 1000 }, "Belo Horizonte", "MG"), pattern);
    }
  } finally {
    globalThis.fetch = originalFetch;
  }
});
