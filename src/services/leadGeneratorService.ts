// Shared prospecting metadata. Lead records are obtained exclusively from
// OpenStreetMap/Overpass; this module never generates businesses.

export function normalizeStr(text: string): string {
  return (text || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
}

export const NICHE_OPTIONS = [
  { id: 'todos', label: 'Todos os Nichos' }, { id: 'Barbearia', label: 'Barbearias & Salões' },
  { id: 'Clínica Odontológica', label: 'Dentistas & Odonto' }, { id: 'Restaurante & Pizzaria', label: 'Restaurantes & Pizzarias' },
  { id: 'Estética & Beleza', label: 'Estética, Beleza & Fitness' }, { id: 'Advocacia', label: 'Advocacia & Jurídico' },
  { id: 'Pet Shop & Veterinária', label: 'Pet Shops & Veterinárias' }, { id: 'Oficina Mecânica', label: 'Oficinas Mecânicas & Auto' },
  { id: 'Contabilidade', label: 'Contabilidade & Finanças' },
];

// Used only as a geographic search center, never to fabricate locations or leads.
export const NEIGHBORHOOD_CENTROIDS: Record<string, { lat: number; lng: number }> = {
  'alipio de melo': { lat: -19.8763, lng: -43.9989 }, 'caicaras': { lat: -19.8847, lng: -43.9716 },
  'alto caicaras': { lat: -19.8768, lng: -43.9692 }, savassi: { lat: -19.9358, lng: -43.9382 },
  lourdes: { lat: -19.9321, lng: -43.9448 }, centro: { lat: -19.9208, lng: -43.9410 },
  buritis: { lat: -19.9742, lng: -43.9650 }, castelo: { lat: -19.8891, lng: -43.9924 },
  sion: { lat: -19.9488, lng: -43.9408 }, pampulha: { lat: -19.8517, lng: -43.9781 },
  barreiro: { lat: -19.9790, lng: -44.0158 }, 'venda nova': { lat: -19.8202, lng: -43.9554 },
  'santa efigenia': { lat: -19.9101, lng: -43.9263 }, 'santo agostinho': { lat: -19.9322, lng: -43.9511 },
};

export function matchesNiche(source: string, target: string): boolean {
  if (!target || target === 'todos' || target === 'Todos os Nichos') return true;
  const normalizedTarget = normalizeStr(target); const normalizedSource = normalizeStr(source);
  if (normalizedSource === normalizedTarget || normalizedSource.includes(normalizedTarget) || normalizedTarget.includes(normalizedSource)) return true;
  const keywords: Record<string, string[]> = {
    barb: ['barb'], dent: ['odont', 'dent'], rest: ['rest', 'pizz', 'bistr', 'gastron', 'churrasc'],
    estet: ['estet', 'beleza', 'crossfit', 'laser', 'facial'], advoc: ['advoc', 'jurid', 'direito'],
    pet: ['pet', 'vet', 'animal', 'bicho'], mecan: ['mecan', 'auto', 'carro'], contab: ['contab', 'fiscal', 'finan'],
  };
  return Object.entries(keywords).some(([needle, candidates]) => normalizedTarget.includes(needle) && candidates.some((candidate) => normalizedSource.includes(candidate)));
}
