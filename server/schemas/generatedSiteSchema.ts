import { z } from "zod";
import {
  contextSchema,
  preferencesSchema,
  selectionSchema,
  blueprintSchema,
  regenerationSections,
} from "../../src/site-builder/types";
export { blueprintSchema };
export const generationRequestSchema = z
  .object({
    leadId: z.string().min(1).max(160),
    context: contextSchema,
    preferences: preferencesSchema,
    modelSelection: selectionSchema,
  })
  .strict();
export const regenerateRequestSchema = generationRequestSchema
  .extend({
    blueprint: blueprintSchema,
    section: z.enum(regenerationSections),
  })
  .strict();
export const generatedSiteJsonSchema = z.toJSONSchema(blueprintSchema);
