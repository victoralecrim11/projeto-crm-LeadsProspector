import { referenceBriefSchema, type ReferenceBrief } from '../../contracts/index.js';

// Curated research, checked 2026-09-08. Only reusable patterns, never lead data.
const research = {
  dentistry: {
    references: [
      { url: 'https://www.hellotend.com/site/home', reason: 'CTA de agendamento repetido, serviços separados, localização acessível.' },
      { url: 'https://www.swiss-smile.com/', reason: 'Busca por unidade e acesso ao atendimento na arquitetura de navegação.' },
      { url: 'https://www.implart.com.br/', reason: 'Referência brasileira: hierarquia de especialidades e identificação profissional; não reutilizar alegações.' },
    ],
    patterns: ['Contato direto no Hero e no fechamento.', 'Separar especialidades de credenciais verificadas.', 'Hierarquia clara e leitura confortável; composição clínica com espaço negativo.'],
    avoid: ['Não transferir serviços, resultados, prêmios ou depoimentos das referências.', 'Não prometer resultados clínicos.', 'Não afirmar posicionamento premium como fato do lead.'],
  },
  restaurant: {
    references: [
      { url: 'https://www.evvai.com.br/', reason: 'Navegação curta; acesso a reservas; apresentação editorial do menu.' },
      { url: 'https://www.restaurantemani.com.br/', reason: 'Gastronomia, ambiente e identidade em percursos distintos; reservas recorrentes.' },
      { url: 'https://lasai.com.br/', reason: 'Narrativa, menu e reserva em sequência; galeria separada.' },
    ],
    patterns: ['Composição editorial com título amplo e ritmo assimétrico.', 'Menu confirmado antes de narrativa longa; contato para reserva no fechamento.', 'Ambiente e gastronomia dependem de imagens reais autorizadas, pendentes para Fase C.'],
    avoid: ['Não copiar pratos, preços, chef, prêmios ou horários.', 'Não simular reserva confirmada em um link de contato.', 'Não inventar ambiente ou fotografias reais.'],
  },
} as const;
export type PilotNiche = keyof typeof research;
export function marketReferenceKey(niche: PilotNiche, subNiche = 'unspecified', positioning = 'premium-design', version = 1) {
  return JSON.stringify([niche, subNiche, positioning, version]);
}
export function getMarketReference(niche: PilotNiche, now = new Date()): ReferenceBrief {
  const researchedAt = '2026-09-08T22:30:00.000Z';
  if (now.getTime() - Date.parse(researchedAt) > 90 * 86400000) throw new Error('Referências expiradas: atualizar pesquisa antes de resolver o design.');
  return referenceBriefSchema.parse({ version: 1, id: `${niche}-market-v1`, niche, researchedAt, ...research[niche] });
}
