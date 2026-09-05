/**
 * Utilitário universal para abertura de fichas de empresas no Google Maps.
 *
 * Em vez de abrir coordenadas puras (que exibem apenas um ponto de GPS vazio
 * no meio de ruas ou morros), este utilitário monta uma query contextualizada
 * com Nome da Empresa + Endereço/Bairro + Cidade.
 *
 * Dessa forma, o Google Maps abre a ficha comercial oficial da empresa,
 * exibindo fotos, avaliações, horário de funcionamento e Street View.
 */

export interface MapLeadTarget {
  name: string;
  address?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  geoLat?: number;
  geoLng?: number;
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

  if (query) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
  }

  // Fallback de última instância: coordenadas GPS se não houver nome nem endereço
  if (typeof lead.geoLat === 'number' && typeof lead.geoLng === 'number') {
    return `https://www.google.com/maps/search/?api=1&query=${lead.geoLat},${lead.geoLng}`;
  }

  return 'https://www.google.com/maps';
}

export function openGoogleMapsPlace(lead: MapLeadTarget): void {
  const url = buildGoogleMapsSearchUrl(lead);
  window.open(url, '_blank', 'noopener,noreferrer');
}
