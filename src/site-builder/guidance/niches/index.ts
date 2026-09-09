// Pilot niches (dentistry, restaurant) have curated market research in market.ts.
// automaticClassification refers to the Guidance layer auto-generating niche rules — it does not.
// Derived niche classification (lead → dentistry/restaurant/other) lives in leadSource.ts.
export const nicheGuidanceStatus = { status: "pilot-niches-researched", automaticClassification: false, pilots: ["dentistry", "restaurant"] as const } as const;
