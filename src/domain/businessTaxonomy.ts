import { z } from 'zod';

export const canonicalNicheSchema = z.enum([
  'barbershop',
  'hair-salon',
  'beauty-studio',
  'cosmetics-retail',
  'dentistry',
  'restaurant',
  'pizzeria',
  'fast-food',
  'law-firm',
  'veterinary',
  'pet-shop',
  'auto-repair',
  'accounting',
  'financial-services',
  'other',
]);

export type CanonicalNiche = z.infer<typeof canonicalNicheSchema>;

export const BUSINESS_CATEGORIES: { id: CanonicalNiche; label: string }[] = [
  { id: 'barbershop', label: 'Barbearia' },
  { id: 'hair-salon', label: 'Salão de Beleza / Cabeleireiro' },
  { id: 'beauty-studio', label: 'Estética & Beleza' },
  { id: 'cosmetics-retail', label: 'Loja de Cosméticos' },
  { id: 'dentistry', label: 'Clínica Odontológica' },
  { id: 'restaurant', label: 'Restaurante' },
  { id: 'pizzeria', label: 'Pizzaria' },
  { id: 'fast-food', label: 'Lanchonete / Fast Food' },
  { id: 'law-firm', label: 'Advocacia' },
  { id: 'veterinary', label: 'Clínica Veterinária' },
  { id: 'pet-shop', label: 'Pet Shop' },
  { id: 'auto-repair', label: 'Oficina Mecânica' },
  { id: 'accounting', label: 'Contabilidade' },
  { id: 'financial-services', label: 'Serviços Financeiros' },
  { id: 'other', label: 'Outro' },
];

export const PROSPECTING_GROUPS = [
  { id: 'todos', label: 'Todos os Nichos' },
  { id: 'Barbearia', label: 'Barbearias & Salões' },
  { id: 'Clínica Odontológica', label: 'Dentistas & Odonto' },
  { id: 'Restaurante & Pizzaria', label: 'Restaurantes & Pizzarias' },
  { id: 'Estética & Beleza', label: 'Estética & Beleza' },
  { id: 'Advocacia', label: 'Advocacia & Jurídico' },
  { id: 'Pet Shop & Veterinária', label: 'Pet Shops & Veterinárias' },
  { id: 'Oficina Mecânica', label: 'Oficinas Mecânicas & Auto' },
  { id: 'Contabilidade', label: 'Contabilidade & Finanças' },
];

export function getCanonicalBusinessCategory(niche: CanonicalNiche): string {
  const found = BUSINESS_CATEGORIES.find(c => c.id === niche);
  return found?.label || 'Negócio Local';
}

export function isSupportedDesignNiche(niche: string): niche is CanonicalNiche {
  return canonicalNicheSchema.safeParse(niche).success;
}

export interface OsmClassificationResult {
  canonicalNiche: CanonicalNiche;
  categoryLabel: string;
  prospectingGroup?: string;
  subNiche?: string;
  ruleId: string;
  confidence: number;
  evidenceTags: Record<string, string>;
}

export function classifyOsmBusiness(tags: Record<string, string>, prospectingGroup?: string): OsmClassificationResult {
  let canonicalNiche: CanonicalNiche = 'other';
  let ruleId = 'fallback';
  let confidence = 0.5;

  // 1. Barbershop vs Hair Salon
  if (tags['shop'] === 'hairdresser') {
    if (tags['hairdresser'] === 'barber' || tags['name']?.toLowerCase().includes('barbearia')) {
      canonicalNiche = 'barbershop';
      ruleId = 'shop=hairdresser+barber';
      confidence = 0.9;
    } else {
      canonicalNiche = 'hair-salon';
      ruleId = 'shop=hairdresser';
      confidence = 0.8;
    }
  } else if (tags['shop'] === 'barber') {
    canonicalNiche = 'barbershop';
    ruleId = 'shop=barber';
    confidence = 0.9;
  }
  // 2. Beauty & Cosmetics
  else if (tags['shop'] === 'beauty' || tags['amenity'] === 'beauty_salon') {
    canonicalNiche = 'beauty-studio';
    ruleId = 'shop=beauty';
    confidence = 0.9;
  } else if (tags['shop'] === 'cosmetics') {
    canonicalNiche = 'cosmetics-retail';
    ruleId = 'shop=cosmetics';
    confidence = 0.9;
  }
  // 3. Food
  else if (tags['amenity'] === 'restaurant') {
    if (tags['cuisine']?.includes('pizza') || tags['name']?.toLowerCase().includes('pizzaria')) {
      canonicalNiche = 'pizzeria';
      ruleId = 'amenity=restaurant+pizza';
      confidence = 0.9;
    } else {
      canonicalNiche = 'restaurant';
      ruleId = 'amenity=restaurant';
      confidence = 0.8;
    }
  } else if (tags['amenity'] === 'fast_food') {
    canonicalNiche = 'fast-food';
    ruleId = 'amenity=fast_food';
    confidence = 0.9;
  }
  // 4. Other
  else if (tags['amenity'] === 'dentist') {
    canonicalNiche = 'dentistry';
    ruleId = 'amenity=dentist';
    confidence = 0.9;
  } else if (tags['amenity'] === 'veterinary') {
    canonicalNiche = 'veterinary';
    ruleId = 'amenity=veterinary';
    confidence = 0.9;
  } else if (tags['shop'] === 'pet') {
    canonicalNiche = 'pet-shop';
    ruleId = 'shop=pet';
    confidence = 0.9;
  } else if (tags['shop'] === 'car_repair' || tags['amenity'] === 'car_repair') {
    canonicalNiche = 'auto-repair';
    ruleId = 'shop=car_repair';
    confidence = 0.9;
  } else if (tags['office'] === 'accountant') {
    canonicalNiche = 'accounting';
    ruleId = 'office=accountant';
    confidence = 0.9;
  } else if (tags['office'] === 'financial') {
    canonicalNiche = 'financial-services';
    ruleId = 'office=financial';
    confidence = 0.9;
  } else if (tags['amenity'] === 'lawyer') {
    canonicalNiche = 'law-firm';
    ruleId = 'amenity=lawyer';
    confidence = 0.9;
  }

  // Weak fallback by name if nothing matched
  if (canonicalNiche === 'other' && tags['name']) {
    const name = tags['name'].toLowerCase();
    if (name.includes('barbearia') || name.includes('barber')) { canonicalNiche = 'barbershop'; ruleId = 'name-fallback'; confidence = 0.4; }
    else if (name.includes('salão') || name.includes('salao') || name.includes('cabeleireiro')) { canonicalNiche = 'hair-salon'; ruleId = 'name-fallback'; confidence = 0.4; }
    else if (name.includes('estética') || name.includes('estetica') || name.includes('spa')) { canonicalNiche = 'beauty-studio'; ruleId = 'name-fallback'; confidence = 0.4; }
    else if (name.includes('odont') || name.includes('dentist')) { canonicalNiche = 'dentistry'; ruleId = 'name-fallback'; confidence = 0.4; }
    else if (name.includes('restaurante')) { canonicalNiche = 'restaurant'; ruleId = 'name-fallback'; confidence = 0.4; }
    else if (name.includes('pizzaria')) { canonicalNiche = 'pizzeria'; ruleId = 'name-fallback'; confidence = 0.4; }
    else if (name.includes('lanchonete')) { canonicalNiche = 'fast-food'; ruleId = 'name-fallback'; confidence = 0.4; }
    else if (name.includes('veterin')) { canonicalNiche = 'veterinary'; ruleId = 'name-fallback'; confidence = 0.4; }
    else if (name.includes('pet shop') || name.includes('petshop')) { canonicalNiche = 'pet-shop'; ruleId = 'name-fallback'; confidence = 0.4; }
    else if (name.includes('oficina') || name.includes('auto center')) { canonicalNiche = 'auto-repair'; ruleId = 'name-fallback'; confidence = 0.4; }
    else if (name.includes('contabilidad') || name.includes('contábil')) { canonicalNiche = 'accounting'; ruleId = 'name-fallback'; confidence = 0.4; }
    else if (name.includes('advocacia') || name.includes('advogad')) { canonicalNiche = 'law-firm'; ruleId = 'name-fallback'; confidence = 0.4; }
  }

  return {
    canonicalNiche,
    categoryLabel: getCanonicalBusinessCategory(canonicalNiche),
    prospectingGroup,
    ruleId,
    confidence,
    evidenceTags: tags,
  };
}

export function normalizeLegacyBusinessNiche(categoryOrNiche: string): CanonicalNiche {
  if (!categoryOrNiche) return 'other';
  const normalized = categoryOrNiche.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (normalized.includes('barbear') || normalized.includes('barber')) return 'barbershop';
  if (normalized.includes('salao') || normalized.includes('cabeleireiro')) return 'hair-salon';
  if (normalized.includes('estetica') || normalized.includes('spa')) return 'beauty-studio';
  if (normalized.includes('cosmetico')) return 'cosmetics-retail';
  if (normalized.includes('odont') || normalized.includes('dentist')) return 'dentistry';
  if (normalized.includes('pizzaria') || normalized.includes('pizza') || normalized.includes('pizzeria')) return 'pizzeria';
  if (normalized.includes('restaurante') || normalized.includes('bistro') || normalized.includes('restaurant')) return 'restaurant';
  if (normalized.includes('lanchonete') || normalized.includes('fast food')) return 'fast-food';
  if (normalized.includes('advocacia') || normalized.includes('advogad') || normalized.includes('direito') || normalized.includes('juridico')) return 'law-firm';
  if (normalized.includes('veterinar')) return 'veterinary';
  if (normalized.includes('pet')) return 'pet-shop';
  if (normalized.includes('mecanica') || normalized.includes('auto center') || normalized.includes('oficina')) return 'auto-repair';
  if (normalized.includes('contabil') || normalized.includes('contador')) return 'accounting';
  if (normalized.includes('financeiro') || normalized.includes('financa')) return 'financial-services';
  return 'other';
}
