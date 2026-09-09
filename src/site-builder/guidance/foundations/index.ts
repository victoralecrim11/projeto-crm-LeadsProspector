import { businessContextSchema } from "../../contracts/index.js";
import type { LeadSiteContext } from "../../types.js";

export const foundationRules = [
  "Contexto informado não comprova identidade empresarial.",
  "Decisões de design precedem a renderização; fatos desconhecidos permanecem ausentes.",
  "Blueprint v1/v2 mantém seu contrato; novos artefatos são independentes nesta fase.",
] as const;

export function businessContextFromLead(lead: LeadSiteContext) {
  return businessContextSchema.parse({ version: 1, lead, confirmed: {} });
}
