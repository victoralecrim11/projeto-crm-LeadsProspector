import { useState, useEffect, useMemo, useCallback } from 'react';
import { safeStorage } from '../utils/safeStorage';
import { Lead } from '../types';

// IBGE Municipality IDs for major supported Brazilian cities
export const IBGE_CITY_IDS: Record<string, string> = {
  'Belo Horizonte - MG': '3106200',
  'São Paulo - SP': '3550308',
  'Rio de Janeiro - RJ': '3304557',
  'Curitiba - PR': '4106902',
  'Porto Alegre - RS': '4314902',
  'Salvador - BA': '2927408',
  'Brasília - DF': '5300108',
  'Goiânia - GO': '5208707',
  'Campinas - SP': '3509502',
  'Recife - PE': '2611606'
};

// Curated high-precision base catalogue for instant zero-latency rendering
export const BASE_CITY_NEIGHBORHOODS: Record<string, string[]> = {
  'Belo Horizonte - MG': [
    'Alto Caiçaras',
    'Alto dos Caiçaras',
    'Alípio de Melo',
    'Anchieta',
    'Barreiro',
    'Belvedere',
    'Buritis',
    'Caiçaras',
    'Carlos Prates',
    'Castelo',
    'Centro',
    'Cidade Nova',
    'Coração Eucarístico',
    'Floresta',
    'Funcionários',
    'Gutierrez',
    'Itapoã',
    'Lourdes',
    'Mangabeiras',
    'Nova Suíça',
    'Ouro Preto',
    'Padre Eustáquio',
    'Palmares',
    'Pampulha',
    'Planalto',
    'Prado',
    'Sagrada Família',
    'Santa Efigênia',
    'Santa Lúcia',
    'Santa Tereza',
    'Santo Agostinho',
    'Santo Antônio',
    'São Bento',
    'Savassi',
    'Serra',
    'Sion',
    'Venda Nova'
  ],
  'São Paulo - SP': [
    'Alto de Pinheiros',
    'Barra Funda',
    'Bela Vista',
    'Brooklin',
    'Butantã',
    'Campo Belo',
    'Centro',
    'Consolação',
    'Higienópolis',
    'Ipiranga',
    'Itaim Bibi',
    'Jardim Paulista',
    'Jardins',
    'Lapa',
    'Liberdade',
    'Moema',
    'Mooca',
    'Morumbi',
    'Perdizes',
    'Pinheiros',
    'Santana',
    'Santo Amaro',
    'Saúde',
    'Tatuapé',
    'Vila Madalena',
    'Vila Mariana',
    'Vila Nova Conceição',
    'Vila Olímpia'
  ],
  'Rio de Janeiro - RJ': [
    'Barra da Tijuca',
    'Botafogo',
    'Catete',
    'Centro',
    'Copacabana',
    'Flamengo',
    'Gávea',
    'Humaitá',
    'Ipanema',
    'Jardim Botânico',
    'Lapa',
    'Laranjeiras',
    'Leblon',
    'Recreio dos Bandeirantes',
    'São Conrado',
    'Tijuca',
    'Urca'
  ],
  'Curitiba - PR': [
    'Água Verde',
    'Batel',
    'Bigorrilho',
    'Cabral',
    'Centro',
    'Centro Cívico',
    'Cristo Rei',
    'Ecoville',
    'Jardim Botânico',
    'Juvevê',
    'Mercês',
    'Portão',
    'Prado Velho',
    'Santa Felicidade'
  ],
  'Porto Alegre - RS': [
    'Bela Vista',
    'Bom Fim',
    'Centro Histórico',
    'Cidade Baixa',
    'Independência',
    'Menino Deus',
    'Moinhos de Vento',
    'Mont\'Serrat',
    'Petrópolis',
    'Praia de Belas',
    'Rio Branco',
    'Tristeza'
  ],
  'Salvador - BA': [
    'Barra',
    'Brotas',
    'Caminho das Árvores',
    'Campo Grande',
    'Graça',
    'Imbuí',
    'Itaigara',
    'Ondina',
    'Pelourinho',
    'Pituba',
    'Rio Vermelho',
    'Stiep',
    'Vitória'
  ],
  'Brasília - DF': [
    'Águas Claras',
    'Asa Norte',
    'Asa Sul',
    'Cruzeiro',
    'Guará',
    'Lago Norte',
    'Lago Sul',
    'Noroeste',
    'Park Way',
    'Setor Hoteleiro',
    'Setor Noroeste',
    'Setor Sudoeste',
    'Sudoeste',
    'Taguatinga'
  ],
  'Goiânia - GO': [
    'Alto da Glória',
    'Campinas',
    'Centro',
    'Jardim Goiás',
    'Setor Aeroporto',
    'Setor Bela Vista',
    'Setor Bueno',
    'Setor Coimbra',
    'Setor Marista',
    'Setor Oeste',
    'Setor Pedro Ludovico',
    'Setor Sul',
    'Setor Universitário'
  ],
  'Campinas - SP': [
    'Barão Geraldo',
    'Botafogo',
    'Cambuí',
    'Castelo',
    'Centro',
    'Chácara da Barra',
    'Guanabara',
    'Nova Campinas',
    'Sousas',
    'Taquaral'
  ],
  'Recife - PE': [
    'Aflitos',
    'Boa Viagem',
    'Casa Forte',
    'Derby',
    'Espinheiro',
    'Graças',
    'Ilha do Leite',
    'Jaqueira',
    'Madalena',
    'Parnamirim',
    'Pina',
    'Recife Antigo',
    'Torre'
  ]
};

const normalize = (str: string) =>
  (str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

// Cache keys in safeStorage
const STORAGE_CUSTOM_KEY = 'leadsite_custom_neighborhoods_v1';
const STORAGE_IBGE_KEY = 'leadsite_cached_ibge_neighborhoods_v1';

/**
 * Loads custom user added neighborhoods from safeStorage
 */
export function getSavedCustomNeighborhoods(): Record<string, string[]> {
  try {
    const raw = safeStorage.getItem(STORAGE_CUSTOM_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

/**
 * Saves a new custom neighborhood to safeStorage
 */
export function saveCustomNeighborhood(cityKey: string, neighborhoodName: string): Record<string, string[]> {
  const clean = neighborhoodName.trim();
  if (!clean) return getSavedCustomNeighborhoods();

  const current = getSavedCustomNeighborhoods();
  const cityList = current[cityKey] || [];
  
  if (cityList.some(n => normalize(n) === normalize(clean))) {
    return current;
  }

  const updated = {
    ...current,
    [cityKey]: [...cityList, clean]
  };
  safeStorage.setItem(STORAGE_CUSTOM_KEY, JSON.stringify(updated));
  return updated;
}

/**
 * Loads cached IBGE neighborhoods from safeStorage
 */
export function getCachedIbgeNeighborhoods(): Record<string, string[]> {
  try {
    const raw = safeStorage.getItem(STORAGE_IBGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

/**
 * Fetches official districts & subdistricts from the Brazilian IBGE API
 * Endpoint: https://servicodados.ibge.gov.br/api/v1/localidades/municipios/{id}/distritos e subdistritos
 */
export async function fetchIbgeNeighborhoods(cityKey: string): Promise<string[]> {
  const ibgeCode = IBGE_CITY_IDS[cityKey];
  if (!ibgeCode) return [];

  // Check in-memory/localStorage cache first
  const cache = getCachedIbgeNeighborhoods();
  if (cache[cityKey] && cache[cityKey].length > 0) {
    return cache[cityKey];
  }

  try {
    const [distResponse, subResponse] = await Promise.allSettled([
      fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/municipios/${ibgeCode}/distritos`),
      fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/municipios/${ibgeCode}/subdistritos`)
    ]);

    const results = new Set<string>();
    const cityNameSimple = normalize(cityKey.split(' - ')[0]);

    if (distResponse.status === 'fulfilled' && distResponse.value.ok) {
      const distData = await distResponse.value.json();
      if (Array.isArray(distData)) {
        distData.forEach((item: any) => {
          const name = (item.nome || '').trim();
          // Filter out the exact city name to avoid redundancy in neighborhood lists
          if (name && normalize(name) !== cityNameSimple && name.length > 2) {
            results.add(name);
          }
        });
      }
    }

    if (subResponse.status === 'fulfilled' && subResponse.value.ok) {
      const subData = await subResponse.value.json();
      if (Array.isArray(subData)) {
        subData.forEach((item: any) => {
          const name = (item.nome || '').trim();
          if (name && normalize(name) !== cityNameSimple && name.length > 2) {
            results.add(name);
          }
        });
      }
    }

    const fetchedList = Array.from(results);
    if (fetchedList.length > 0) {
      const updatedCache = { ...cache, [cityKey]: fetchedList };
      safeStorage.setItem(STORAGE_IBGE_KEY, JSON.stringify(updatedCache));
    }

    return fetchedList;
  } catch (err) {
    console.warn('[NeighborhoodService] IBGE API sync warning:', err);
    return [];
  }
}

export async function searchNeighborhoodsViaApi(
  query: string,
  cityKey: string
): Promise<{ name: string; type: string; fullAddress?: string }[]> {
  const cleanQuery = query.trim();
  if (!cleanQuery || cleanQuery.length < 2) return [];

  const cityName = cityKey.split(' - ')[0];

  try {
    const encoded = encodeURIComponent(`${cleanQuery} ${cityName} Brasil`);
    const resp = await fetch(`/api/nominatim/search?q=${encoded}`, {
      headers: { 'Accept-Language': 'pt-BR,pt;q=0.9' }
    });

    if (resp.ok) {
      const data = await resp.json();
      if (Array.isArray(data)) {
        return data
          .filter((item: any) => {
            const t = item.type || item.addresstype || '';
            return ['suburb', 'neighbourhood', 'administrative', 'quarter', 'city_district'].includes(t) ||
                   item.address?.suburb || item.address?.neighbourhood;
          })
          .map((item: any) => ({
            name: item.address?.suburb || item.address?.neighbourhood || item.name,
            type: 'OpenStreetMap / IBGE',
            fullAddress: item.display_name
          }));
      }
    }
  } catch (err) {
    console.warn('[NeighborhoodService] Nominatim proxy search warning:', err);
  }

  return [];
}

/**
 * Universal React Hook for managing dynamic and static neighborhoods.
 * Guarantees zero latency, persistence, API sync, and complete stability for prospecting.
 */
export function useCityNeighborhoods(selectedCity: string, leads: Lead[] = []) {
  const [customList, setCustomList] = useState<Record<string, string[]>>(getSavedCustomNeighborhoods);
  const [ibgeList, setIbgeList] = useState<Record<string, string[]>>(getCachedIbgeNeighborhoods);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Background fetch from official IBGE Localidades API
  useEffect(() => {
    let isMounted = true;

    // Check if already in cache or in memory
    const cached = getCachedIbgeNeighborhoods();
    if (cached[selectedCity] && cached[selectedCity].length > 0) {
      return;
    }

    setIsSyncing(true);
    fetchIbgeNeighborhoods(selectedCity)
      .then((data) => {
        if (isMounted && data.length > 0) {
          setIbgeList(prev => ({ ...prev, [selectedCity]: data }));
        }
      })
      .catch((err) => {
        console.warn('[NeighborhoodService] Fetch failed:', err);
      })
      .finally(() => {
        if (isMounted) setIsSyncing(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedCity]);

  // Combine all sources:
  // 1. Base curated catalogue (includes Caiçaras, Alto Caiçaras, etc.)
  // 2. IBGE official subdistritos / distritos API
  // 3. Custom neighborhoods added by user (persisted in safeStorage)
  // 4. Neighborhoods discovered dynamically in CRM leads for this city
  const neighborhoods = useMemo(() => {
    const base = BASE_CITY_NEIGHBORHOODS[selectedCity] || [
      'Centro', 'Zona Sul', 'Zona Norte', 'Zona Leste', 'Zona Oeste'
    ];
    const ibge = ibgeList[selectedCity] || [];
    const custom = customList[selectedCity] || [];

    // Extract from existing leads in this city
    const cityNameSimple = normalize(selectedCity.split(' - ')[0]);
    const fromLeads = leads
      .filter(l => {
        const leadCity = normalize(l.city || '');
        return !leadCity || leadCity.includes(cityNameSimple) || cityNameSimple.includes(leadCity);
      })
      .map(l => l.neighborhood?.trim())
      .filter((n): n is string => Boolean(n && n.length > 1));

    const combinedSet = new Set<string>([...base, ...ibge, ...custom, ...fromLeads]);
    return Array.from(combinedSet).sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }, [selectedCity, ibgeList, customList, leads]);

  const addNeighborhood = useCallback((name: string) => {
    const updated = saveCustomNeighborhood(selectedCity, name);
    setCustomList(updated);
  }, [selectedCity]);

  const refreshFromApi = useCallback(async () => {
    setIsSyncing(true);
    try {
      // Clear cache for this city
      const currentCache = getCachedIbgeNeighborhoods();
      delete currentCache[selectedCity];
      safeStorage.setItem(STORAGE_IBGE_KEY, JSON.stringify(currentCache));
      
      const fresh = await fetchIbgeNeighborhoods(selectedCity);
      setIbgeList(prev => ({ ...prev, [selectedCity]: fresh }));
    } finally {
      setIsSyncing(false);
    }
  }, [selectedCity]);

  const searchApi = useCallback((query: string) => {
    return searchNeighborhoodsViaApi(query, selectedCity);
  }, [selectedCity]);

  return {
    neighborhoods,
    isSyncing,
    addNeighborhood,
    refreshFromApi,
    searchApi
  };
}
