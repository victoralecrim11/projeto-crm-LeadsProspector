import type { GeneratedSiteBlueprint } from './types';

/** Demonstration prices are never evidence of the business's actual price list. */
export function addExampleServicePrices(
  blueprint: GeneratedSiteBlueprint,
  category: string,
): GeneratedSiteBlueprint {
  const niche = category.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const isBarbershop = /barbearia|barbershop/.test(niche);
  const isSalon = /salao|cabeleireir/.test(niche);
  if (!isBarbershop && !isSalon) return blueprint;

  const services = blueprint.services.map((service) => {
    if (service.source !== 'ai_suggestion' || service.price) return service;
    const title = service.title.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    let amount: number | undefined;
    if (isBarbershop) {
      if (/corte|cabelo/.test(title) && /barba/.test(title)) amount = 135;
      else if (/barba/.test(title)) amount = 65;
      else if (/corte|cabelo/.test(title)) amount = 85;
    } else if (isSalon) {
      if (/hidrat|tratamento/.test(title)) amount = 120;
      else if (/escova/.test(title)) amount = 70;
      else if (/corte|cabelo/.test(title)) amount = 90;
    }
    return amount === undefined ? service : {
      ...service,
      price: `R$ ${amount.toFixed(2).replace('.', ',')}`,
      priceKind: 'example' as const,
    };
  });
  return { ...blueprint, services };
}
