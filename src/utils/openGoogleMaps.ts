import { isValidCoordinate } from './coordinates';

/**
 * Utilitário universal para abertura de fichas de empresas no Google Maps.
 *
 * Prioriza coordenadas quando existirem e usa uma consulta textual como
 * fallback. Para um lead OSM, coordenadas podem abrir apenas um pino/localização
 * — não garantem uma ficha comercial oficial, fotos, avaliações ou horários.
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
  dataSource?: 'real' | 'synthetic';
}

export function buildGoogleMapsSearchUrl(lead: MapLeadTarget): string {
  // 1. Coordenadas precisas, especialmente as recebidas do OSM.
  if (isValidCoordinate(lead.geoLat, lead.geoLng)) {
    // Para OSM, a query por coordenada exata no link do Maps abre o local ou pino
    return `https://www.google.com/maps/search/?api=1&query=${lead.geoLat},${lead.geoLng}`;
  }

  if (lead.googleMapsUri) {
    return lead.googleMapsUri;
  }

  // Only use Place ID if we don't have coordinates and it's not explicitly a real OSM lead
  if (lead.googlePlaceId && lead.dataSource !== 'real') {
    return `https://www.google.com/maps/search/?api=1&query=Google&query_place_id=${lead.googlePlaceId}`;
  }

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

  if (query) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
  }

  return 'https://www.google.com/maps';
}

export function openGoogleMapsPlace(lead: MapLeadTarget): void {
  const url = buildGoogleMapsSearchUrl(lead);
  window.open(url, '_blank', 'noopener,noreferrer');
}
