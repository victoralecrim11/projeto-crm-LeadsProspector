import { z } from "zod";
import {
  contextSchema,
  preferencesSchema,
  selectionSchema,
  blueprintSchema,
  regenerationSections,
} from "../../src/site-builder/types.js";
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

const geminiSchemaKeywords = new Set([
  "$id",
  "$defs",
  "$ref",
  "$anchor",
  "type",
  "format",
  "title",
  "description",
  "enum",
  "items",
  "prefixItems",
  "minItems",
  "maxItems",
  "minimum",
  "maximum",
  "anyOf",
  "oneOf",
  "properties",
  "additionalProperties",
  "required",
  "propertyOrdering",
]);

function toGeminiSchema(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(toGeminiSchema);
  if (!value || typeof value !== "object") return value;

  const source = value as Record<string, unknown>;
  const result: Record<string, unknown> = {};
  if (
    (typeof source.const === "string" || typeof source.const === "number") &&
    !Array.isArray(source.enum)
  ) {
    result.enum = [source.const];
  }

  for (const [key, child] of Object.entries(source)) {
    if (key === "const" || !geminiSchemaKeywords.has(key)) continue;
    if (key === "properties" || key === "$defs") {
      result[key] = Object.fromEntries(
        Object.entries(child as Record<string, unknown>).map(
          ([name, schema]) => [name, toGeminiSchema(schema)],
        ),
      );
      continue;
    }
    if (["items", "additionalProperties"].includes(key)) {
      result[key] = toGeminiSchema(child);
      continue;
    }
    if (["prefixItems", "anyOf", "oneOf"].includes(key)) {
      result[key] = Array.isArray(child)
        ? child.map(toGeminiSchema)
        : child;
      continue;
    }
    result[key] = child;
  }
  return result;
}

export const geminiGeneratedSiteJsonSchema = toGeminiSchema(
  generatedSiteJsonSchema,
);
