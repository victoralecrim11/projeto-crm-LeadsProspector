// src/services/overpassService.ts
// Fetches real local business data from OpenStreetMap via the Overpass API.
// Free, no API key required.

import { Lead } from '../types';
import { isValidCoordinate } from '../utils/coordinates';
import { calculateOpportunityScore } from '../utils/leadScoring';

const NICHE_TO_OSM_TAGS: Record<string, { key: string; value: string }[]> = {
  'Barbearia': [
    { key: 'shop', value: 'hairdresser' },
    { key: 'shop', value: 'barber' },
  ],
  'Clínica Odontológica': [
    { key: 'amenity', value: 'dentist' },
  ],
  'Restaurante & Pizzaria': [
    { key: 'amenity', value: 'restaurant' },
    { key: 'amenity', value: 'fast_food' },
  ],
  'Estética & Beleza': [
    { key: 'shop', value: 'beauty' },
    { key: 'amenity', value: 'beauty_salon' },
    { key: 'shop', value: 'cosmetics' },
  ],
  'Advocacia': [
    { key: 'amenity', value: 'lawyer' },
  ],
  'Pet Shop & Veterinária': [
    { key: 'amenity', value: 'veterinary' },
    { key: 'shop', value: 'pet' },
  ],
  'Oficina Mecânica': [
    { key: 'shop', value: 'car_repair' },
    { key: 'amenity', value: 'car_repair' },
  ],
  'Contabilidade': [
    { key: 'office', value: 'accountant' },
    { key: 'office', value: 'financial' },
  ],
};

const ALL_BUSINESS_TAGS: { key: string; value: string }[] = Array.from(
  new Set(
    Object.values(NICHE_TO_OSM_TAGS)
      .flat()
      .map(t => JSON.stringify(t))
  )
).map(t => JSON.parse(t));

export interface OverpassSearchOptions {
  lat: number;
  lng: number;
  radiusMeters: number;
  niche?: string;
  maxResults?: number;
}

interface OverpassElement {
  type: 'node' | 'way' | 'relation';
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

function buildOverpassQuery(opts: OverpassSearchOptions): string {
  const { lat, lng, radiusMeters, niche, maxResults = 50 } = opts;
  const tags = niche && NICHE_TO_OSM_TAGS[niche]
    ? NICHE_TO_OSM_TAGS[niche]
    : ALL_BUSINESS_TAGS;

  const nodeQueries = tags
    .map(tag => `  node["${tag.key}"="${tag.value}"](around:${radiusMeters},${lat},${lng});`)
    .join('\n');
  const wayQueries = tags
    .map(tag => `  way["${tag.key}"="${tag.value}"](around:${radiusMeters},${lat},${lng});`)
    .join('\n');
  const relationQueries = tags
    .map(tag => `  relation["${tag.key}"="${tag.value}"](around:${radiusMeters},${lat},${lng});`)
    .join('\n');

  return `[out:json][timeout:25];\n(\n${nodeQueries}\n${wayQueries}\n${relationQueries}\n);\nout body center ${maxResults};`;
}

function buildAddress(tags: Record<string, string>, cityName: string): string {
  const street = tags['addr:street'] || '';
  const number = tags['addr:housenumber'] || '';
  const neighborhood = tags['addr:suburb'] || tags['addr:neighbourhood'] || '';
  const city = tags['addr:city'] || cityName;

  if (street) {
    const parts = [
      `${street}${number ? `, ${number}` : ''}`,
      neighborhood || undefined,
      city,
    ].filter(Boolean);
    return parts.join(' - ');
  }
  return city;
}

function extractNeighborhood(tags: Record<string, string>): string {
  return (
    tags['addr:suburb'] ||
    tags['addr:neighbourhood'] ||
    tags['addr:quarter'] ||
    tags['district'] ||
    ''
  );
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

function osmElementToLead(
  element: OverpassElement,
  cityName: string,
  stateName: string,
  fallbackNiche: string,
  originLat: number,
  originLng: number,
): Omit<Lead, 'id' | 'createdAt'> | null {
  const tags = element.tags || {};
  const name = tags['name'];

  if (!name || name.trim().length < 2) return null;

  const lat = element.lat ?? element.center?.lat;
  const lng = element.lon ?? element.center?.lon;
  if (!isValidCoordinate(lat, lng)) return null;

  const phone = tags['phone'] || tags['contact:phone'] || tags['contact:mobile'] || '';
  const cleanPhone = phone.replace(/\s/g, '').replace(/^\+55/, '');
  const formattedPhone = cleanPhone
    ? cleanPhone.replace(/(\d{2})(\d{4,5})(\d{4})/, '($1) $2-$3')
    : '';

  const website = tags['website'] || tags['contact:website'] || tags['url'] || '';
  const hasWebsite = website.length > 3;

  const ratingStr = tags['rating'] || tags['stars'] || '';
  const parsedRating = ratingStr ? parseFloat(ratingStr) : NaN;
  const rating = !isNaN(parsedRating) ? Math.min(5, Math.max(1, parsedRating)) : undefined;

  const address = buildAddress(tags, cityName);
  const neighborhood = extractNeighborhood(tags);

  let realCategory = fallbackNiche;
  if (fallbackNiche === 'Negócio Local') {
     for (const [n, reqTags] of Object.entries(NICHE_TO_OSM_TAGS)) {
        for (const rt of reqTags) {
           if (tags[rt.key] === rt.value) {
              realCategory = n;
              break;
           }
        }
        if (realCategory !== 'Negócio Local') break;
     }
  }

  const distanceKm = Number(calculateDistance(originLat, originLng, lat, lng).toFixed(1));

  const opportunityScore = calculateOpportunityScore({
    hasWebsite,
    phone,
    email: tags['email'] || tags['contact:email'],
    address,
    category: realCategory,
  });

  const rawWhatsapp = tags['contact:whatsapp'] || tags['whatsapp'] || '';
  const cleanWhatsapp = rawWhatsapp.replace(/\D/g, '');
  const whatsapp = cleanWhatsapp ? (cleanWhatsapp.startsWith('55') ? cleanWhatsapp : `55${cleanWhatsapp}`) : undefined;

  return {
    name: name.trim(),
    category: realCategory,
    niche: realCategory,
    temperature: 'quente',
    score: opportunityScore,
    rating,
    reviewsCount: undefined,
    phone: formattedPhone,
    whatsapp,
    email: tags['email'] || tags['contact:email'] || '',
    city: cityName,
    state: stateName,
    neighborhood,
    address,
    geoLat: lat,
    geoLng: lng,
    distanceKm,
    hasWebsite,
    websiteUrl: hasWebsite ? website : undefined,
    inCrm: false,
    placeId: `${element.type}/${element.id}`,
    osmId: String(element.id),
    osmType: element.type,
    osmLat: lat,
    osmLng: lng,
    osmRating: rating,
    dataSource: 'real',
    audit: undefined,
  };
}

async function fetchFromProxy(query: string): Promise<any> {
  // Etapa 1: Log de Pré-Requisição e Execução
  console.log(`[OverpassService] Preparando consulta Overpass:\n${query}`);
  
  try {
    const response = await fetch('/api/overpass', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
    });

    // Etapa 1: Log da Resposta Completa
    console.log(`[OverpassService] Resposta HTTP - Status: ${response.status}, StatusText: ${response.statusText}`);
    
    if (!response.ok) {
      let errorBody = '';
      try {
        const json = await response.json();
        errorBody = JSON.stringify(json);
      } catch (e) {
        errorBody = await response.text();
      }
      
      console.error(`[OverpassService] Erro bruto da API:`, errorBody);
      
      // Etapa 2: Refatorar o Tratamento de Erros
      if (response.status === 504 || response.status === 502) {
        throw new Error(`Timeout da API Overpass: Os servidores demoraram muito para responder ou estão indisponíveis (Status ${response.status}).`);
      }
      if (response.status === 400) {
        throw new Error(`Erro de Requisição: A consulta enviada para o Overpass era inválida (Status 400).`);
      }
      
      throw new Error(`Erro na API Overpass (Status ${response.status}): ${errorBody}`);
    }

    const data = await response.json();
    console.log(`[OverpassService] Corpo bruto da resposta parseado com sucesso.`);
    return data;
  } catch (err) {
    // Distinguir erro de rede no fetch do navegador (ex: erro de DNS, server down)
    if (err instanceof TypeError && err.message.includes('Failed to fetch')) {
      throw new Error("Erro de Rede: Não foi possível alcançar o servidor proxy interno (Verifique se o backend está rodando).");
    }
    throw err;
  }
}

/**
 * Fetches real local businesses from OpenStreetMap/Overpass.
 */
export async function fetchLeadsFromOverpass(
  opts: OverpassSearchOptions,
  cityName: string,
  stateName: string,
): Promise<Omit<Lead, 'id' | 'createdAt'>[]> {
  const niche = opts.niche && opts.niche !== 'Todos os Nichos' ? opts.niche : '';
  const maxResults = opts.maxResults ?? 30;

  const query = buildOverpassQuery({ ...opts, niche: niche || undefined, maxResults });

  try {
    const data = await fetchFromProxy(query);
    const elements: OverpassElement[] = data.elements || [];

    // Etapa 2: Tratar Resultado Vazio explicitamente
    if (elements.length === 0) {
      console.log("[OverpassService] Resultado Vazio: O Overpass retornou Status 200, mas 0 elementos foram encontrados nesta região.");
      return [];
    }
    
    console.log(`[OverpassService] Sucesso: ${elements.length} elementos brutos recebidos da API.`);

    const leads: Omit<Lead, 'id' | 'createdAt'>[] = [];

    for (const el of elements) {
      if (leads.length >= maxResults) break;
      const lead = osmElementToLead(el, cityName, stateName, niche || 'Negócio Local', opts.lat, opts.lng);
      if (lead) leads.push(lead);
    }

    console.log(`[OverpassService] Conversão finalizada: ${leads.length} leads qualificados gerados.`);
    return leads;
  } catch (err) {
    const error = err as Error;
    console.error(`[OverpassService] Falha na execução:`, error.message);
    throw error;
  }
}
