export interface LicensedMediaQueryInput {
  niche: string;
  subNiche?: string;
  section: string;
  purpose: string;
  imageryDirection?: string;
  locale?: string;
}

const CRM_DATA_PATTERNS = [
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, // email
  /(?:\+?55\s?)?(?:\(?\d{2}\)?\s?)?(?:9?\d{4}[-.\s]?\d{4})/g, // phone
  /\b(?:rua|av\.|avenida|alameda|rodovia|bairro|cep|número|no|nº)\b[\w\s,.-]*/gi, // addresses
  /\b\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}\b/g, // CNPJ
  /\b\d{3}\.\d{3}\.\d{3}-\d{2}\b/g, // CPF
];

function sanitizeContextText(text: string): string {
  let cleaned = text;
  for (const pattern of CRM_DATA_PATTERNS) {
    cleaned = cleaned.replace(pattern, ' ');
  }
  return cleaned
    .replace(/[^\w\s-]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function buildLicensedMediaQueries(input: LicensedMediaQueryInput): string[] {
  const niche = sanitizeContextText(input.niche).toLowerCase();
  const subNiche = input.subNiche ? sanitizeContextText(input.subNiche).toLowerCase() : '';
  const section = input.section.toLowerCase();
  const imagery = input.imageryDirection ? sanitizeContextText(input.imageryDirection).toLowerCase() : '';

  const queries: string[] = [];

  // 1. Primary contextual query (niche + purpose/section)
  if (niche === 'restaurant' || niche.includes('restaurante') || niche.includes('gastronomia') || niche.includes('pizza')) {
    if (section === 'hero') {
      queries.push('modern restaurant interior');
      queries.push('gourmet artisan food dining');
      if (imagery.includes('warm') || imagery.includes('editorial')) {
        queries.push('warm atmospheric restaurant dining');
      } else {
        queries.push('chef culinary kitchen presentation');
      }
    } else if (section === 'about') {
      queries.push('chef plating dish restaurant');
      queries.push('restaurant kitchen craftsmanship');
    } else {
      queries.push('restaurant food table setting');
    }
  } else if (niche === 'barbershop' || niche.includes('barbearia') || niche.includes('barber')) {
    if (section === 'hero') {
      queries.push('modern barbershop interior chair');
      queries.push('classic barbershop haircut grooming');
      if (imagery.includes('dark') || imagery.includes('craft')) {
        queries.push('barber tools craftsmanship razor');
      } else {
        queries.push('barber styling men haircut');
      }
    } else if (section === 'about') {
      queries.push('barber shaving beard razor');
      queries.push('vintage barber shop tools detail');
    } else {
      queries.push('barber shop haircut styling');
    }
  } else if (niche === 'dentistry' || niche.includes('odont') || niche.includes('dental')) {
    if (section === 'hero') {
      queries.push('modern dental clinic interior');
      queries.push('dentist consulting patient clinic');
      queries.push('bright clean medical dental office');
    } else if (section === 'about') {
      queries.push('friendly dentist smiling clinic');
      queries.push('dental healthcare medical equipment');
    } else {
      queries.push('dentistry healthy smile care');
    }
  } else {
    // Generic fallback for any other niche
    const subject = subNiche || niche || 'business';
    queries.push(`${subject} modern professional`);
    queries.push(`${subject} interior architecture`);
    if (imagery) {
      const firstImageryWords = imagery.split(' ').slice(0, 3).join(' ');
      queries.push(`${subject} ${firstImageryWords}`);
    }
  }

  // Deduplicate and return max 3 queries
  return Array.from(new Set(queries.filter((q) => q.length > 2))).slice(0, 3);
}
