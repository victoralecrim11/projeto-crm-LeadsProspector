import { isValidCoordinate } from './coordinates';

/**
 * Links externos não devem confundir um ponto OSM com uma ficha comercial de
 * outro provedor. Uma busca por nome só é segura com endereço de logradouro.
 */

export interface MapLeadTarget {
  name: string;
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
  const parts: string[] = [];

  const cleanName = (lead.name || '').trim();
  if (cleanName) {
    parts.push(cleanName);
  }

  const cleanAddress = (lead.address || '').trim();
  if (cleanAddress) {
    // Se o endereço já contém rua e cidade, usamos diretamente
    parts.push(cleanAddress);
  } else {
    // Caso não haja logradouro completo, compõe bairro + cidade
    const localParts: string[] = [];
    if (lead.neighborhood && lead.neighborhood !== 'Todos os Bairros') {
      localParts.push(lead.neighborhood.trim());
    }
    if (lead.city) {
      localParts.push(lead.city.trim());
    }
    if (localParts.length > 0) {
      parts.push(localParts.join(', '));
    }
  }

  const query = parts.filter(Boolean).join(', ');

  if (query && hasPreciseOsmAddress(lead)) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
  }

  // A coordenada OSM é precisa, mas não garante que o provedor externo tenha
  // uma ficha comercial naquele ponto. Por isso é o fallback, não a busca padrão.
  if (isValidCoordinate(lead.geoLat, lead.geoLng)) {
    return `https://www.google.com/maps/search/?api=1&query=${lead.geoLat},${lead.geoLng}`;
  }

  if (lead.googleMapsUri) return lead.googleMapsUri;

  if (lead.googlePlaceId && lead.dataSource !== 'real') {
    return `https://www.google.com/maps/search/?api=1&query=Google&query_place_id=${lead.googlePlaceId}`;
  }

  return 'https://www.google.com/maps';
}

export function buildOpenStreetMapLocationUrl(lead: MapLeadTarget): string {
  if (isValidCoordinate(lead.geoLat, lead.geoLng)) {
    return `https://www.openstreetmap.org/?mlat=${lead.geoLat}&mlon=${lead.geoLng}#map=19/${lead.geoLat}/${lead.geoLng}`;
  }
  return 'https://www.openstreetmap.org';
}

export function openLeadLocation(lead: MapLeadTarget): void {
  // Every OSM lead can open Google Maps. With a full street address this is a
  // business search; otherwise the URL intentionally opens only the exact pin.
  const url = buildGoogleMapsSearchUrl(lead);
  window.open(url, '_blank', 'noopener,noreferrer');
}

export function openOpenStreetMapLocation(lead: MapLeadTarget): void {
  window.open(buildOpenStreetMapLocationUrl(lead), '_blank', 'noopener,noreferrer');
}
