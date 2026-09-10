import {
  designResearchSnapshotSchema,
  type DesignResearchSnapshot,
  type DesignResearchSource,
  type DesignFamilyCandidate,
  type PalettePattern,
  type TypographyPattern,
  type LayoutPattern,
} from '../../../src/site-builder/contracts/research.js';
import type { DesignAnalysisResult } from './designAnalyzer.js';

export interface AnalyzedSourceEntry {
  source: DesignResearchSource;
  analysis: DesignAnalysisResult;
}

export function synthesizeDesignPatterns(
  niche: string,
  sources: AnalyzedSourceEntry[],
  providerChain: string[],
  queries: string[],
  now = new Date(),
  subNiche?: string,
): DesignResearchSnapshot {
  const researchedAt = now.toISOString();
  // 60 days TTL by default
  const ttlDays = parseInt(process.env.DESIGN_RESEARCH_TTL_DAYS || '60', 10);
  const expiresAt = new Date(now.getTime() + ttlDays * 86400000).toISOString();

  // Aggregate colors
  const colorFrequency = new Map<string, { uses: number; contexts: Set<string> }>();
  for (const entry of sources) {
    for (const c of entry.analysis.colors) {
      const existing = colorFrequency.get(c.hex) ?? { uses: 0, contexts: new Set<string>() };
      existing.uses += c.uses;
      c.contexts.forEach(ctx => existing.contexts.add(ctx));
      colorFrequency.set(c.hex, existing);
    }
  }

  const sampleEvidence: PalettePattern['sampleEvidence'] = Array.from(colorFrequency.entries())
    .map(([hex, data]) => ({
      hex,
      uses: data.uses,
      context: Array.from(data.contexts).join(', ') || 'general',
    }))
    .sort((a, b) => b.uses - a.uses)
    .slice(0, 20);

  // Derive dominant families based on niche and evidence
  let dominantFamilies: string[] = [];
  let contrast: PalettePattern['contrast'] = 'high';
  let saturation: PalettePattern['saturation'] = 'low-medium';
  let surfaceStrategy: PalettePattern['surfaceStrategy'] = 'light-clean';

  if (niche === 'dentistry') {
    dominantFamilies = ['deep-green', 'clinical-teal', 'warm-neutral', 'off-white'];
    contrast = 'high';
    saturation = 'low-medium';
    surfaceStrategy = 'light-clean';
  } else if (niche === 'restaurant') {
    dominantFamilies = ['espresso-brown', 'warm-ochre', 'terracotta', 'rich-charcoal'];
    contrast = 'high';
    saturation = 'medium';
    surfaceStrategy = 'dark-editorial';
  } else if (niche === 'barbershop') {
    dominantFamilies = ['dark-charcoal', 'warm-amber', 'slate-grey', 'warm-white'];
    contrast = 'high';
    saturation = 'medium';
    surfaceStrategy = 'dark-editorial';
  } else {
    dominantFamilies = ['modern-slate', 'vibrant-blue', 'neutral-grey', 'pure-white'];
    contrast = 'medium';
    saturation = 'medium';
    surfaceStrategy = 'light-clean';
  }

  // Aggregate Typography
  const allHeadings = new Set<string>();
  const allBodies = new Set<string>();
  const allGoogleFonts = new Set<string>();

  for (const entry of sources) {
    entry.analysis.typography.headingFonts.forEach(f => allHeadings.add(f));
    entry.analysis.typography.bodyFonts.forEach(f => allBodies.add(f));
    entry.analysis.typography.googleFonts.forEach(f => allGoogleFonts.add(f));
  }

  const typographyPatterns: TypographyPattern = {
    headingStyles: niche === 'restaurant' ? ['editorial-serif'] : ['modern-sans'],
    bodyStyles: ['modern-sans', 'neutral-sans'],
    observedHeadings: Array.from(allHeadings).slice(0, 8),
    observedBody: Array.from(allBodies).slice(0, 8),
    googleFonts: Array.from(allGoogleFonts).slice(0, 8),
  };

  // Aggregate Layout
  const layoutPatterns: LayoutPattern = {
    hero: niche === 'restaurant' ? 'full-bleed' : 'split',
    services: niche === 'dentistry' ? 'cards' : 'editorial',
    navigation: 'inline',
    density: 'balanced',
    shape: niche === 'restaurant' ? 'sharp' : niche === 'dentistry' ? 'soft' : 'sharp',
  };

  // Niche-specific patterns and imagery directions
  let patterns: string[] = [];
  let imageryPatterns: string[] = [];
  let conversionPatterns: string[] = [];
  let avoid: string[] = [];
  let candidates: DesignFamilyCandidate[] = [];

  if (niche === 'dentistry') {
    patterns = [
      'Espaço negativo amplo e sensação de clareza asséptica.',
      'Hierarquia clínica com especialidades em cartões destacados.',
      'Acesso direto ao WhatsApp/telefone em pontos de contato estratégicos.',
    ];
    imageryPatterns = [
      'Ambiente odontológico limpo com iluminação natural suave.',
      'Foco em sorrisos genuínos e acolhimento humano.',
      'Nenhuma imagem de cirurgia explícita ou instrumentos invasivos.',
    ];
    conversionPatterns = [
      'Botão de consulta rápida com canal direto.',
      'Indicação clara da localização e facilidade de acesso.',
    ];
    avoid = [
      'Não simular resultados clínicos como garantia.',
      'Não clonar nomes de procedimentos ou prêmios de sites pesquisados.',
    ];
    candidates = [
      {
        id: 'health-trust',
        label: 'Health Trust',
        description: 'Direção clínica acolhedora com foco em confiança e atendimento humanizado.',
        variant: 'minimal-clinical',
        primaryCandidate: '#194f50',
        accentCandidate: '#dcece6',
        theme: 'light',
        typography: 'modern',
      },
      {
        id: 'clinical-prestige',
        label: 'Clinical Prestige',
        description: 'Direção premium para clínicas especializadas com design contemporâneo e sóbrio.',
        variant: 'modern-specialist',
        primaryCandidate: '#0d3b42',
        accentCandidate: '#e0f2f1',
        theme: 'light',
        typography: 'modern',
      },
    ];
  } else if (niche === 'restaurant') {
    patterns = [
      'Apresentação editorial com tipografia expressiva e atmosfera intimista.',
      'Cardápio organizado por categorias com ênfase em pratos artesanais.',
      'Chamada visível para reservas e horários de funcionamento.',
    ];
    imageryPatterns = [
      'Fotografia de pratos reais com iluminação acolhedora e foco seletivo.',
      'Ambiente e mesas com textura aconchegante.',
      'Não utilizar fotografias de banco de imagens genérico com pessoas fingindo comer.',
    ];
    conversionPatterns = [
      'Acesso rápido a reserva de mesa ou consulta de cardápio.',
      'Canal direto para eventos ou pedidos.',
    ];
    avoid = [
      'Não copiar itens de cardápio, preços ou nomes de chefs de referências.',
      'Não simular confirmação de reserva sem backend conectado.',
    ];
    candidates = [
      {
        id: 'hospitality-editorial',
        label: 'Hospitality Editorial',
        description: 'Composição gastronômica elegante com narrativa editorial e tons quentes.',
        variant: 'editorial-dining',
        primaryCandidate: '#422a21',
        accentCandidate: '#e7b777',
        theme: 'dark',
        typography: 'editorial',
      },
      {
        id: 'bistro-contemporary',
        label: 'Bistro Contemporary',
        description: 'Visual moderno e autêntico para restaurantes e bistrôs com apelo vibrante.',
        variant: 'casual-vibrant',
        primaryCandidate: '#2b1b17',
        accentCandidate: '#d97706',
        theme: 'dark',
        typography: 'modern',
      },
    ];
  } else if (niche === 'barbershop') {
    patterns = [
      'Estética marcante com contraste escuro, tipografia robusta e linhas definidas.',
      'Tabela objetiva de serviços (cabelo, barba, tratamentos especiais).',
      'Atmosfera de convivência e agendamento simplificado.',
    ];
    imageryPatterns = [
      'Fotografia de cortes contemporâneos e acabamento de barba com iluminação lateral.',
      'Detalhes de navalha, tesoura e cadeiras clássicas em materiais nobres.',
      'Não utilizar bancos de imagens genéricos de salão unissex.',
    ];
    conversionPatterns = [
      'Acesso imediato para agendar horário pelo WhatsApp.',
      'Localização precisa com referências de fácil acesso.',
    ];
    avoid = [
      'Não inventar nomes de barbeiros ou serviços fictícios não confirmados.',
      'Não copiar slogans ou promoções de outras barbearias.',
    ];
    candidates = [
      {
        id: 'heritage-craft',
        label: 'Heritage Craft',
        description: 'Barbearia clássica com estética vintage-industrial, couro escuro e âmbar.',
        variant: 'classic-heritage',
        primaryCandidate: '#1c1917',
        accentCandidate: '#d97706',
        theme: 'dark',
        typography: 'modern',
      },
      {
        id: 'urban-minimal',
        label: 'Urban Minimal',
        description: 'Estilo contemporâneo urbano com tons grafite e tipografia geométrica.',
        variant: 'urban-minimal',
        primaryCandidate: '#18181b',
        accentCandidate: '#38bdf8',
        theme: 'dark',
        typography: 'modern',
      },
    ];
  } else {
    patterns = ['Estrutura corporativa clara com seções bem demarcadas.'];
    imageryPatterns = ['Imagens profissionais autênticas do negócio local.'];
    conversionPatterns = ['Contato direto e endereço confirmado.'];
    avoid = ['Não copiar dados de terceiros.'];
    candidates = [
      {
        id: 'modern-service',
        label: 'Modern Service',
        description: 'Direção equilibrada para prestadores de serviços locais.',
        variant: 'clean-service',
        primaryCandidate: '#1e293b',
        accentCandidate: '#0ea5e9',
        theme: 'light',
        typography: 'modern',
      },
    ];
  }

  // Calculate aggregated confidence
  let avgConfidence = 0.6;
  if (sources.length > 0) {
    const sum = sources.reduce((acc, s) => acc + (s.analysis.confidence || 0.5), 0);
    avgConfidence = Math.round((sum / sources.length) * 100) / 100;
  }

  const rawSnapshot = {
    version: 1 as const,
    niche,
    subNiche,
    researchedAt,
    expiresAt,
    status: (sources.length > 0 ? 'fresh' : 'fallback') as 'fresh' | 'fallback',
    providerChain,
    queries,
    sources: sources.map(s => s.source),
    patterns,
    palettePatterns: {
      dominantFamilies,
      contrast,
      saturation,
      surfaceStrategy,
      sampleEvidence,
    },
    typographyPatterns,
    layoutPatterns,
    imageryPatterns,
    conversionPatterns,
    candidates,
    avoid,
    confidence: avgConfidence,
    limitations: [
      'Padrões sintetizados a partir de evidências agregadas de referências públicas.',
      'Não constitui cópia de layout, código ou marca registrada de nenhum site específico.',
    ],
  };

  return designResearchSnapshotSchema.parse(rawSnapshot);
}
