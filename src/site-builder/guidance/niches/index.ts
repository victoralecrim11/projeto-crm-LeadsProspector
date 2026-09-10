// Pilot niches (dentistry, restaurant, barbershop) have curated market research in market.ts and dynamic research in B.3.
// automaticClassification refers to the Guidance layer auto-generating niche rules — it does not.
// Derived niche classification (lead → dentistry/restaurant/barbershop/other) lives in leadSource.ts.
export const nicheGuidanceStatus = { status: "pilot-niches-researched", automaticClassification: false, pilots: ["dentistry", "restaurant", "barbershop"] as const } as const;
