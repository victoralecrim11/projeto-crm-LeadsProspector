import { isValidCoordinate } from './coordinates';

/**
 * Links externos não devem confundir um ponto OSM com uma ficha comercial de
 * outro provedor. Por isso a abertura da coordenada e a busca pelo nome
 * comercial são ações explicitamente separadas.
 */

export interface MapLeadTarget {
  name: string;
  category?: string;
  address?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  geoLat?: number;
  geoLng?: number;
  googleMapsUri?: string;
  googlePlaceId?: string;
  dataSource?: 'real' | 'manual';
}

export function hasPreciseOsmAddress(lead: MapLeadTarget): boolean {
  const address = (lead.address || '').trim();
  return /\b(rua|avenida|av\.?|travessa|alameda|praça|praca|rodovia|estrada)\b/i.test(address);
}

export function buildGoogleMapsSearchUrl(lead: MapLeadTarget): string {
  // Esta ação nunca tenta inferir uma ficha comercial: ela abre somente o
  // ponto exato informado pelo OpenStreetMap.
  if (isValidCoordinate(lead.geoLat, lead.geoLng)) {
    return `https://www.google.com/maps/search/?api=1&query=${lead.geoLat},${lead.geoLng}`;
  }

  if (lead.googleMapsUri) return lead.googleMapsUri;

  if (lead.googlePlaceId && lead.dataSource !== 'real') {
    return `https://www.google.com/maps/search/?api=1&query=Google&query_place_id=${lead.googlePlaceId}`;
  }

  return 'https://www.google.com/maps';
}

export function buildGoogleMapsBusinessSearchUrl(lead: MapLeadTarget): string {
  const parts: string[] = [];
  const name = (lead.name || '').trim();
  const category = (lead.category || '').trim();
  const address = (lead.address || '').trim();

  if (name) parts.push(name);

  // Nomes curtos ou genéricos (por exemplo, "Vitória") precisam da categoria
  // para que o Maps procure uma empresa, e não uma cidade, hotel ou região.
  if (category && category.toLowerCase() !== 'negócio local') parts.push(category);

  if (address && hasPreciseOsmAddress(lead)) {
    parts.push(address);
  } else {
    if (lead.neighborhood && lead.neighborhood !== 'Todos os Bairros') parts.push(lead.neighborhood.trim());
    if (lead.city) parts.push(lead.city.trim());
    if (lead.state) parts.push(lead.state.trim());
  }

  const query = parts.filter(Boolean).join(', ');
  return query
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
    : buildGoogleMapsSearchUrl(lead);
}

export function buildOpenStreetMapLocationUrl(lead: MapLeadTarget): string {
  if (isValidCoordinate(lead.geoLat, lead.geoLng)) {
    return `https://www.openstreetmap.org/?mlat=${lead.geoLat}&mlon=${lead.geoLng}#map=19/${lead.geoLat}/${lead.geoLng}`;
  }
  return 'https://www.openstreetmap.org';
}

export function openLeadLocation(lead: MapLeadTarget): void {
  const url = buildGoogleMapsSearchUrl(lead);
  window.open(url, '_blank', 'noopener,noreferrer');
}

export function openLeadBusinessSearch(lead: MapLeadTarget): void {
  const url = buildGoogleMapsBusinessSearchUrl(lead);
  window.open(url, '_blank', 'noopener,noreferrer');
}

export function openOpenStreetMapLocation(lead: MapLeadTarget): void {
  window.open(buildOpenStreetMapLocationUrl(lead), '_blank', 'noopener,noreferrer');
}
