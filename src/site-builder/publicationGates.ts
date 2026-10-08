import { confirmedContactLinks, resolveCtaHref } from "./contactLinks.js";
import type { MediaManifest } from "./contracts/media.js";
import type { GeneratedSiteBlueprint, LeadSiteContext } from "./types.js";

export type PublicationGateStatus = "PASS" | "FAIL" | "BLOCKED" | "NOT_EVALUATED";

export type PublicationGate = {
  id: "content-review" | "service-review" | "commercial-contact" | "cta-conversion" | "media-review" | "preview-export-parity";
  label: string;
  status: PublicationGateStatus;
  reason: string;
  blocking: boolean;
};

export type PublicationReadiness = {
  gates: PublicationGate[];
  canExport: boolean;
  canExportDemo: boolean;
};

export function evaluatePublicationReadiness(input: {
  blueprint: GeneratedSiteBlueprint;
  context: LeadSiteContext;
  contentReviewed: boolean;
  mediaManifest?: MediaManifest;
}): PublicationReadiness {
  const { blueprint, context, contentReviewed, mediaManifest } = input;
  const contactLinks = confirmedContactLinks(context);
  const ctaHref = resolveCtaHref(blueprint, context);
  const pendingServices = blueprint.services.filter((service) => service.source === "ai_suggestion");
  const pendingMedia = mediaManifest?.entries.filter((entry) => entry.reviewStatus === "selected") ?? [];

  const gates: PublicationGate[] = [
    {
      id: "content-review",
      label: "Revisão de conteúdo",
      status: contentReviewed ? "PASS" : "FAIL",
      reason: contentReviewed
        ? "Os textos foram revisados no editor."
        : "Revise e confirme os textos antes de exportar.",
      blocking: true,
    },
    {
      id: "service-review",
      label: "Serviços",
      status: pendingServices.length ? "FAIL" : "PASS",
      reason: pendingServices.length
        ? `${pendingServices.length} serviço(s) ainda são sugestão da IA.`
        : "Não há serviços pendentes de confirmação.",
      blocking: true,
    },
    {
      id: "commercial-contact",
      label: "Canal comercial",
      status: contactLinks.length ? "PASS" : "FAIL",
      reason: contactLinks.length
        ? "Há pelo menos um canal de contato utilizável."
        : "Adicione telefone, WhatsApp ou e-mail antes de exportar.",
      blocking: true,
    },
    {
      id: "cta-conversion",
      label: "CTA e conversão",
      status: ctaHref ? "PASS" : "FAIL",
      reason: ctaHref
        ? "O CTA principal possui um destino válido."
        : "Configure um CTA principal com destino comercial válido.",
      blocking: true,
    },
    {
      id: "media-review",
      label: "Mídia",
      status: pendingMedia.length ? "FAIL" : mediaManifest?.entries.length ? "PASS" : "NOT_EVALUATED",
      reason: pendingMedia.length
        ? `${pendingMedia.length} imagem(ns) aguardam aprovação ou remoção.`
        : mediaManifest?.entries.length
          ? "As imagens do projeto foram revisadas."
          : "O projeto não possui mídia para avaliar.",
      blocking: pendingMedia.length > 0,
    },
    {
      id: "preview-export-parity",
      label: "Paridade de preview e exportação",
      status: "PASS",
      reason: "Preview e ZIP usam o mesmo SiteRenderer.",
      blocking: true,
    },
  ];

  return {
    gates,
    canExport: gates.every((gate) => !gate.blocking || gate.status === "PASS"),
    canExportDemo: gates
      .filter((gate) => !["commercial-contact", "cta-conversion"].includes(gate.id))
      .every((gate) => !gate.blocking || gate.status === "PASS"),
  };
}
