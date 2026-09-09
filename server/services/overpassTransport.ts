import https from "node:https";
import * as tls from "node:tls";

// Preserve Node/extra roots and also trust certificates installed by the OS.
// Older Node releases continue using their default trust store.
export function createOverpassAgent() {
  const getCertificates = (tls as typeof tls & {
    getCACertificates?: (type: "default" | "system") => string[];
  }).getCACertificates;
  return new https.Agent({
    rejectUnauthorized: true,
    ...(getCertificates ? {
      ca: [...new Set([...getCertificates("default"), ...getCertificates("system")])],
    } : {}),
  });
}

export function overpassFailure(error: unknown) {
  const code = (error as { code?: string } | null)?.code;
  if (code && ["SELF_SIGNED_CERT_IN_CHAIN", "DEPTH_ZERO_SELF_SIGNED_CERT", "UNABLE_TO_VERIFY_LEAF_SIGNATURE", "UNABLE_TO_GET_ISSUER_CERT_LOCALLY", "CERT_HAS_EXPIRED", "ERR_TLS_CERT_ALTNAME_INVALID"].includes(code)) {
    return { status: 502, code: "OVERPASS_TLS_ERROR", error: "Não foi possível validar o certificado HTTPS do Overpass. Verifique os certificados confiáveis do servidor." };
  }
  if (code === "ETIMEDOUT" || (error instanceof Error && error.message === "Request timed out")) {
    return { status: 504, code: "OVERPASS_TIMEOUT", error: "O servidor Overpass demorou demais para responder. Tente novamente." };
  }
  return { status: 502, code: "OVERPASS_UNAVAILABLE", error: "Não foi possível consultar os servidores Overpass. Tente novamente em instantes." };
}
