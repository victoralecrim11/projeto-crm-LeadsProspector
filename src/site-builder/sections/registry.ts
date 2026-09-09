import type { ComponentType } from "react";
import { blueprintSchema, defaultVisualVariants, templates, visualVariants, type VisualVariants } from "../types";
import type { SectionProps } from "./shared";
import { FullBleedHero, SplitHero, MinimalHero, heroStyles } from "./hero";
import { EditorialSplit, CenteredStory, aboutStyles } from "./about";
import { EditorialList, HorizontalCards, servicesStyles } from "./services";
import { ContactMinimal, ContactSplit, contactStyles } from "./contact";
import { LocationEditorial, locationStyles } from "./location";
import { InlineNavigation, navigationStyles } from "./navigation";
import { MinimalFooter, EditorialFooter, footerStyles } from "./footer";

export const sectionRegistry = {
  hero: { "full-bleed": FullBleedHero, split: SplitHero, minimal: MinimalHero },
  about: { "editorial-split": EditorialSplit, "centered-story": CenteredStory },
  services: { "editorial-list": EditorialList, "horizontal-cards": HorizontalCards },
  contact: { "contact-minimal": ContactMinimal, "contact-split": ContactSplit },
  location: { "location-editorial": LocationEditorial },
  navigation: { inline: InlineNavigation },
  footer: { minimal: MinimalFooter, editorial: EditorialFooter },
} satisfies { [K in keyof VisualVariants]: Record<VisualVariants[K], ComponentType<SectionProps>> };

export function resolveSection(section: keyof VisualVariants, variant: string): ComponentType<SectionProps> {
  const registry = sectionRegistry[section];
  return Object.hasOwn(registry, variant) ? registry[variant] : registry[visualVariants[section][0]];
}
// Defensive rendering only: other invalid fields still fail strict validation.
export function normalizeForRender(input: unknown) {
  if (!input || typeof input !== "object") return blueprintSchema.parse(input);
  const raw = input as Record<string, unknown>;
  if (raw.version !== 2) return blueprintSchema.parse(input);
  const template = templates.includes(raw.templateId as any) ? raw.templateId as (typeof templates)[number] : "minimal-professional";
  const defaults = defaultVisualVariants(template);
  const given = raw.visual && typeof raw.visual === "object" ? raw.visual as Record<string, unknown> : {};
  const visual = Object.fromEntries(Object.entries(defaults).map(([key, fallback]) => [key,
    (visualVariants[key] as readonly unknown[]).includes(given[key]) ? given[key] : fallback,
  ]));
  return blueprintSchema.parse({ ...raw, visual });
}
export const variantStyles = [navigationStyles, heroStyles, aboutStyles, servicesStyles, contactStyles, locationStyles, footerStyles].join("\n");
