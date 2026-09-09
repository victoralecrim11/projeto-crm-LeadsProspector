import { reactToolkitProfile, reactComponentCatalog } from "./reactToolkit.js";
import { foundationRules } from "./foundations/index.js";
import { nicheGuidanceStatus } from "./niches/index.js";
import { generationFoundation } from "./generation/index.js";
import { foundationQualityRules } from "./quality/index.js";
import { legacyDefaultFamily } from "./design-families/legacy-default.js";

// Internal catalog, not an instruction to ask the current LLM for unsupported fields.
export const siteGuidanceFoundation = {
  version: 1, engineering: reactToolkitProfile, components: reactComponentCatalog,
  foundations: foundationRules, niches: nicheGuidanceStatus,
  families: [legacyDefaultFamily],
  generation: generationFoundation, quality: foundationQualityRules,
} as const;
