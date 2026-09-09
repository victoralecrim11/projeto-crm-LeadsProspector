import { reactToolkitProfile, reactComponentCatalog } from "./reactToolkit.js";
import { foundationRules } from "./foundations/index.js";
import { nicheGuidanceStatus } from "./niches/index.js";
import { generationFoundation } from "./generation/index.js";
import { foundationQualityRules } from "./quality/index.js";
import { legacyDefaultFamily } from "./design-families/legacy-default.js";
import { pilotFamilies } from "./design-families/pilots.js";

// Internal catalog, not an instruction to ask the current LLM for unsupported fields.
// Pilot families (health-trust, hospitality-editorial) use pilotSpecification() for resolution,
// while legacyDefaultFamily uses legacyDesignSpecification(). Both produce DesignSpecification.
export const siteGuidanceFoundation = {
  version: 1, engineering: reactToolkitProfile, components: reactComponentCatalog,
  foundations: foundationRules, niches: nicheGuidanceStatus,
  families: [legacyDefaultFamily],
  pilotFamilies: Object.fromEntries(Object.entries(pilotFamilies).map(([niche, f]) => [niche, { id: f.id, version: f.version }])),
  generation: generationFoundation, quality: foundationQualityRules,
} as const;
