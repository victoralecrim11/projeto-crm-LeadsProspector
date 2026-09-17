import { GeneratedSiteBlueprint, visualSchema } from './types';
import { SiteUserOverrides } from './contracts/overrides';

export function applySiteUserOverrides(
  blueprint: GeneratedSiteBlueprint,
  overrides?: SiteUserOverrides
): GeneratedSiteBlueprint {
  if (!overrides) return blueprint;

  const result: GeneratedSiteBlueprint = {
    ...blueprint,
  };

  if (overrides.brand) {
    result.brand = { ...result.brand, ...overrides.brand };
  }

  if (overrides.presentation && result.version === 2) {
    result.presentation = { ...result.presentation, ...overrides.presentation };
  }

  if (overrides.templateId) {
    result.templateId = overrides.templateId;
  }

  if (overrides.visual && result.version === 2) {
    result.visual = { ...result.visual, ...overrides.visual } as any;
    // ensure strict schema compliance for visual
    const parsedVisual = visualSchema.safeParse(result.visual);
    if (parsedVisual.success) {
      result.visual = parsedVisual.data;
    }
  }

  if (overrides.sectionOrder && overrides.sectionOrder.length === 5) {
    result.sectionOrder = [...overrides.sectionOrder] as any;
  }

  if (overrides.sectionVisibility) {
    result.sections = { ...result.sections, ...overrides.sectionVisibility } as any;
  }

  if (overrides.content) {
    if (overrides.content.hero) {
      result.hero = { ...result.hero, ...overrides.content.hero };
    }
    if (overrides.content.about) {
      result.about = { ...result.about, ...overrides.content.about };
    }
    if (overrides.content.services) {
      // Overrides for services replace the matched service by ID/index or replace entirely
      // Here, since services is an array, we match by title (or could match by index).
      // Assuming overrides.content.services provides a partial list to merge.
      // Wait, we need deterministic logic. Let's map over result.services and merge.
      const serviceMap = new Map(result.services.map(s => [s.title, s]));
      for (const overrideService of overrides.content.services) {
        if (serviceMap.has(overrideService.id)) {
           // We use overrideService.id to match the service title in legacy schema (since it doesn't have an ID).
           const existing = serviceMap.get(overrideService.id)!;
           serviceMap.set(overrideService.id, { ...existing, ...overrideService });
        } else {
           // If it's a completely new service, we just add it? 
           // In legacy blueprint, services are just an array. We can just append or replace.
           // For determinism, if not found, we append.
           serviceMap.set(overrideService.id, { 
             title: overrideService.title, 
             description: overrideService.description, 
             assetId: overrideService.assetId,
             source: 'known',
           });
        }
      }
      result.services = Array.from(serviceMap.values());
    }
  }

  return result;
}
