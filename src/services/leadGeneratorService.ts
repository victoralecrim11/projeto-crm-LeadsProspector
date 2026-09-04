import { Lead } from '../types';

export interface GenerateLeadsOptions {
  city: string;
  neighborhood: string;
  niche?: string;
  count?: number;
  query?: string;
}

// Normalized string helper
export function normalizeStr(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

// Canonical Niches list used across Prospector views
export const NICHE_OPTIONS = [
  { id: 'todos', label: 'Todos os Nichos' },
  { id: 'Barbearia', label: 'Barbearias & Salões' },
  { id: 'Clínica Odontológica', label: 'Dentistas & Odonto' },
  { id: 'Restaurante & Pizzaria', label: 'Restaurantes & Pizzarias' },
  { id: 'Estética & Beleza', label: 'Estética, Beleza & Fitness' },
  { id: 'Advocacia', label: 'Advocacia & Jurídico' },
  { id: 'Pet Shop & Veterinária', label: 'Pet Shops & Veterinárias' },
  { id: 'Oficina Mecânica', label: 'Oficinas Mecânicas & Auto' },
  { id: 'Contabilidade', label: 'Contabilidade & Finanças' },
];

// Street database by neighborhood
const NEIGHBORHOOD_STREETS: Record<string, string[]> = {
  'alipio de melo': [
    'Av. Abílio Machado',
    'Rua dos Geólogos',
    'Rua dos Filósofos',
    'Rua dos Matemáticos',
    'Rua dos Físicos',
    'Av. Brigadeiro Eduardo Gomes',
    'Rua dos Médicos'
  ],
  'caicaras': [
    'Av. Dom Pedro II',
    'Rua Rosinha Sigaud',
    'Rua Belmiro Braga',
    'Rua Miramar',
    'Rua Desembargador Tinoco'
  ],
  'alto caicaras': [
    'Rua Belmiro Braga',
    'Rua Carlos Turner',
    'Rua Aggeo Pio Sobrinho',
    'Rua Coromandel'
  ],
  'savassi': [
    'Av. Cristóvão Colombo',
    'Rua Pernambuco',
    'Rua Antônio de Albuquerque',
    'Rua Sergipe',
    'Rua Fernandes Tourinho'
  ],
  'lourdes': [
    'Rua São Paulo',
    'Rua Marília de Dirceu',
    'Rua Curitiba',
    'Rua Tomás Gonzaga',
    'Av. Álvares Cabral'
  ],
  'centro': [
    'Rua da Bahia',
    'Av. Amazonas',
    'Av. Afonso Pena',
    'Rua dos Tupis',
    'Rua dos Goitacazes'
  ],
  'buritis': [
    'Av. Professor Mário Werneck',
    'Rua Henrique Badaró Portugal',
    'Rua Senador Firmino',
    'Rua Deputado Cristovam Chiaradia'
  ],
  'castelo': [
    'Av. dos Engenheiros',
    'Av. Altamiro Avelino Soares',
    'Rua Romualdo Lopes Cançado',
    'Rua Doutor Sylvio Menicucci'
  ],
  'sion': [
    'Rua Grão Mogol',
    'Rua Pium-í',
    'Av. Bandeirantes',
    'Rua Montes Claros'
  ],
  'pampulha': [
    'Av. Fleming',
    'Av. Portugal',
    'Av. Coronel José Dias Bicalho',
    'Av. Otacílio Negrão de Lima'
  ],
  'barreiro': [
    'Av. Sinfrônio Brochado',
    'Av. Visconde de Ibituruna',
    'Av. Olinto Meireles'
  ],
  'venda nova': [
    'Rua Padre Pedro Pinto',
    'Av. Vilarinho',
    'Rua Elias Jorge'
  ],
  'santa efigenia': [
    'Av. Brasil',
    'Rua Álvares Maciel',
    'Rua Ceará',
    'Rua Padre Marinho'
  ],
  'santo agostinho': [
    'Rua Araguari',
    'Av. Olegário Maciel',
    'Rua Alvarenga Peixoto',
    'Rua Rodrigues Caldas'
  ]
};

const DEFAULT_STREETS = [
  'Av. Principal',
  'Av. Central',
  'Rua São Paulo',
  'Av. Brasil',
  'Rua das Flores',
  'Av. Independência',
  'Rua Quinze de Novembro',
  'Av. Presidente Vargas'
];

// Approximate centroids (lat, lng) for BH neighborhoods — used to scatter
// synthetic leads around a real geographic point instead of dropping them
// at the city center. Values come from public OpenStreetMap Nominatim data.
const NEIGHBORHOOD_CENTROIDS: Record<string, { lat: number; lng: number }> = {
  'alipio de melo': { lat: -19.8763, lng: -43.9989 },
  'caicaras': { lat: -19.8847, lng: -43.9716 },
  'alto caicaras': { lat: -19.8768, lng: -43.9692 },
  'savassi': { lat: -19.9358, lng: -43.9382 },
  'lourdes': { lat: -19.9321, lng: -43.9448 },
  'centro': { lat: -19.9208, lng: -43.9410 },
  'buritis': { lat: -19.9742, lng: -43.9650 },
  'castelo': { lat: -19.8891, lng: -43.9924 },
  'sion': { lat: -19.9488, lng: -43.9408 },
  'pampulha': { lat: -19.8517, lng: -43.9781 },
  'barreiro': { lat: -19.9790, lng: -44.0158 },
  'venda nova': { lat: -19.8202, lng: -43.9554 },
  'santa efigenia': { lat: -19.9101, lng: -43.9263 },
  'santo agostinho': { lat: -19.9322, lng: -43.9511 },
  'Funcionarios': { lat: -19.9346, lng: -43.9261 },
  'serra': { lat: -19.9479, lng: -43.9272 },
  'cidade jardim': { lat: -19.9461, lng: -43.9556 },
  'floresta': { lat: -19.9158, lng: -43.9410 },
  'jaragua': { lat: -19.8863, lng: -43.9924 },
  'mangabeiras': { lat: -19.9502, lng: -43.9039 },
  'belvedere': { lat: -19.9758, lng: -43.9452 },
  'cidade nova': { lat: -19.8758, lng: -43.9358 },
  'gloria': { lat: -19.8761, lng: -43.9221 },
};

// Default fallback: Praça da Liberdade, BH
const FALLBACK_CENTROID = { lat: -19.9328, lng: -43.9388 };

// Helper to test if lead matches selected niche query
export function matchesNiche(leadNicheOrCat: string, targetNiche: string): boolean {
  if (!targetNiche || targetNiche === 'todos' || targetNiche === 'Todos os Nichos') return true;

  const target = normalizeStr(targetNiche);
  const src = normalizeStr(leadNicheOrCat);

  if (src === target || src.includes(target) || target.includes(src)) return true;

  // Keyword associations
  if (target.includes('barb') && src.includes('barb')) return true;
  if ((target.includes('dent') || target.includes('odont')) && (src.includes('odont') || src.includes('dent'))) return true;
  if ((target.includes('rest') || target.includes('pizz') || target.includes('gastron')) && (src.includes('rest') || src.includes('pizz') || src.includes('bistr') || src.includes('gastron') || src.includes('churrasc') || src.includes('bolo'))) return true;
  if ((target.includes('estet') || target.includes('beleza') || target.includes('fit') || target.includes('acad')) && (src.includes('estet') || src.includes('beleza') || src.includes('crossfit') || src.includes('laser') || src.includes('facial'))) return true;
  if ((target.includes('advoc') || target.includes('jurid') || target.includes('direit')) && (src.includes('advoc') || src.includes('jurid') || src.includes('direito'))) return true;
  if ((target.includes('pet') || target.includes('vet') || target.includes('anim')) && (src.includes('pet') || src.includes('vet') || src.includes('animal') || src.includes('bicho'))) return true;
  if ((target.includes('mecan') || target.includes('auto')) && (src.includes('mecan') || src.includes('auto') || src.includes('carro'))) return true;
  if (target.includes('contab') && (src.includes('contab') || src.includes('fiscal') || src.includes('finan'))) return true;

  return false;
}

// Generate 2-4 tailored leads for any chosen city, neighborhood and niche
export function generateRealisticLeadsForLocation(options: GenerateLeadsOptions): Omit<Lead, 'id' | 'createdAt'>[] {
  const { city, neighborhood, niche, count = 3, query } = options;

  const cityName = city.split(' - ')[0] || 'Belo Horizonte';
  const stateName = city.split(' - ')[1] || 'MG';
  const cleanNeighborhood = neighborhood && neighborhood !== 'Todos os Bairros' ? neighborhood : 'Centro';
  const normBairro = normalizeStr(cleanNeighborhood);

  // Available streets for this neighborhood
  const streets = NEIGHBORHOOD_STREETS[normBairro] || DEFAULT_STREETS;

  // Determine actual target category
  let targetCat = niche && niche !== 'todos' && niche !== 'Todos os Nichos' ? niche : 'Barbearia';
  if (query) {
    const qNorm = normalizeStr(query);
    if (/barba|cabel|fade|navalha/i.test(qNorm)) targetCat = 'Barbearia';
    else if (/dent|odonto|sorris/i.test(qNorm)) targetCat = 'Clínica Odontológica';
    else if (/pizz|restauran|burger|comida/i.test(qNorm)) targetCat = 'Restaurante & Pizzaria';
    else if (/advoc|jurid|direito/i.test(qNorm)) targetCat = 'Advocacia';
    else if (/pet|vet|animal/i.test(qNorm)) targetCat = 'Pet Shop & Veterinária';
    else if (/mecan|auto|oficina|carro/i.test(qNorm)) targetCat = 'Oficina Mecânica';
    else if (/estet|beleza|laser|spa|fit/i.test(qNorm)) targetCat = 'Estética & Beleza';
    else if (/contab|fiscal|financeiro/i.test(qNorm)) targetCat = 'Contabilidade';
  }

  // Prefix naming templates
  const businessNaming: Record<string, string[]> = {
    'Barbearia': [
      `Barbearia Imperial ${cleanNeighborhood}`,
      `Vintage Barber Club ${cleanNeighborhood}`,
      `Studio Alfa Barbearia & Estilo`,
      `Roots Barber Shop ${cityName}`
    ],
    'Clínica Odontológica': [
      `Centro Odontológico Dr. ${cleanNeighborhood}`,
      `Odonto Prime Especializada ${cleanNeighborhood}`,
      `Clínica Sorriso & Estética Dental`,
      `Instituto Odontológico ${cleanNeighborhood}`
    ],
    'Restaurante & Pizzaria': [
      `Pizzaria & Forno Artesanal ${cleanNeighborhood}`,
      `Trattoria & Gastronomia ${cleanNeighborhood}`,
      `Bistrô Sabor & Lenha`,
      `Churrascaria & Grill ${cleanNeighborhood}`
    ],
    'Estética & Beleza': [
      `Espaço VIP Harmonia & Estética`,
      `Studio Laser & Beleza Facial ${cleanNeighborhood}`,
      `Clínica Dermatofuncional & Spa ${cleanNeighborhood}`,
      `Centro de Beleza & Estética Avançada`
    ],
    'Advocacia': [
      `Advocacia & Consultoria Jurídica ${cleanNeighborhood}`,
      `Melo, Silva & Associados Advogados`,
      `Escritório Jurídico Especializado ${cleanNeighborhood}`,
      `Soluções Jurídicas & Compliance Empresarial`
    ],
    'Pet Shop & Veterinária': [
      `Clínica Veterinária & Pet Care ${cleanNeighborhood}`,
      `Hospital Veterinário 24h ${cleanNeighborhood}`,
      `Amigo Fiel Pet Shop & Estética Animal`,
      `Bichos & Mimos Veterinária Integrada`
    ],
    'Oficina Mecânica': [
      `Auto Center & Mecânica de Precisão ${cleanNeighborhood}`,
      `Centro Automotivo & Alinhamento ${cleanNeighborhood}`,
      `Oficina Motor Tech Especializada`,
      `Pit Stop Serviços Automotivos`
    ],
    'Contabilidade': [
      `Contabilidade & BPO Estratégico ${cleanNeighborhood}`,
      `Assessoria Contábil & Fiscal ${cleanNeighborhood}`,
      `Gestão & Controladoria Empresarial`,
      `Alliance Contabilidade & Consultoria`
    ]
  };

  const names = businessNaming[targetCat] || businessNaming['Barbearia'];
  const phoneDdd = stateName === 'SP' ? '11' : stateName === 'RJ' ? '21' : stateName === 'PR' ? '41' : '31';

  // Pick centroid for this neighborhood so synthetic leads scatter around a
  // realistic geographic point rather than the city center
  const centroid = NEIGHBORHOOD_CENTROIDS[normBairro] || FALLBACK_CENTROID;

  const leads: Omit<Lead, 'id' | 'createdAt'>[] = [];

  for (let i = 0; i < Math.min(count, names.length); i++) {
    const street = streets[i % streets.length];
    const streetNumber = Math.floor(200 + Math.random() * 1800);
    const phoneNum = Math.floor(98000000 + Math.random() * 1999999);
    const landline = Math.floor(34000000 + Math.random() * 999999);
    const rating = Number((4.8 + Math.random() * 0.2).toFixed(1));
    const reviewsCount = Math.floor(40 + Math.random() * 180);
    const hasWebsite = Math.random() > 0.65; // most prospected local businesses lack site

    // Scatter within ~1.2 km of the centroid (so the pin lands on the actual
    // neighborhood instead of stacking at the city center)
    const scatterAngle = Math.random() * 2 * Math.PI;
    const scatterRadiusKm = 0.4 + Math.random() * 0.8;
    const deltaLat = (scatterRadiusKm / 111) * Math.sin(scatterAngle);
    const deltaLng = (scatterRadiusKm / 104) * Math.cos(scatterAngle);
    const geoLat = centroid.lat + deltaLat;
    const geoLng = centroid.lng + deltaLng;

    // Compute Haversine distance from centroid for the badge
    const distanceKm = Number(
      Math.sqrt(
        Math.pow((geoLat - centroid.lat) * 111, 2) +
        Math.pow((geoLng - centroid.lng) * 104, 2),
      ).toFixed(1),
    );

    leads.push({
      name: names[i],
      category: targetCat,
      niche: targetCat,
      temperature: 'quente',
      score: Math.floor(88 + Math.random() * 10),
      rating,
      reviewsCount,
      phone: `(${phoneDdd}) ${phoneNum.toString().slice(0, 5)}-${phoneNum.toString().slice(5)}`,
      whatsapp: `55${phoneDdd}${phoneNum}`,
      email: `contato@${normalizeStr(names[i]).replace(/[^a-z0-9]/g, '')}.com.br`,
      city: cityName,
      state: stateName,
      neighborhood: cleanNeighborhood,
      address: `${street}, ${streetNumber} - ${cleanNeighborhood}, ${cityName}`,
      distanceKm,
      hasWebsite,
      websiteUrl: hasWebsite ? `https://${normalizeStr(names[i]).replace(/[^a-z0-9]/g, '')}.com.br` : undefined,
      inCrm: false,
      geoLat,
      geoLng,
      dataSource: 'synthetic',
      placeId: `synthetic/${normalizeStr(names[i]).replace(/[^a-z0-9]/g, '-')}-${i}-${Date.now().toString(36)}`,
      audit: {
        speedScore: hasWebsite ? Math.floor(25 + Math.random() * 25) : 0,
        loadingTimeSeconds: hasWebsite ? Number((5.0 + Math.random() * 3.5).toFixed(1)) : 0,
        mobileFriendly: false,
        hasSsl: false,
        hasWhatsappButton: false,
        seoScore: Math.floor(30 + Math.random() * 30),
        issues: hasWebsite
          ? [
              'Site não responsivo para celulares (60% do tráfego perdido)',
              'Sem certificado HTTPS (exibe alerta de Não Seguro)',
              'Sem botão de agendamento no WhatsApp'
            ]
          : [
              'Empresa sem website oficial cadastrado no Google Maps',
              'Perdendo clientes diários para concorrentes com site próprio',
              'Oportunidade de ouro para criação de Landing Page de alta conversão'
            ],
        opportunities: [
          'Agendamento rápido em 1 clique direto no WhatsApp',
          'Página moderna com carregamento instantâneo em 0.8s',
          'Exibição das avaliações 5 estrelas do Google Maps'
        ]
      }
    });
  }

  return leads;
}
