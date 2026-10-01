import { normalizeLegacyBusinessNiche, type CanonicalNiche } from '../domain/businessTaxonomy.js';
import type { LeadSiteContext } from './types.js';

// Editorial context describes the niche, never unverified facilities or services.
const stories: Record<CanonicalNiche, [string, string]> = {
  barbershop: ['Estilo que se revela nos detalhes', 'Um bom visual começa nos detalhes: as linhas do corte, o desenho da barba e a harmonia com o estilo pessoal. A cultura da barbearia une tradição e expressão individual, transformando o cuidado masculino em um momento para renovar a presença.'],
  'hair-salon': ['Beleza com identidade', 'Textura, movimento e expressão fazem parte da relação com o cabelo. No universo dos salões, referências de estilo e escolhas pessoais se encontram para dar espaço a uma beleza que acompanha cada pessoa e sua rotina.'],
  'beauty-studio': ['Um olhar para o autocuidado', 'O universo da beleza reúne escolhas de autocuidado, preferências pessoais e diferentes rotinas. Conhecer cada proposta e esclarecer dúvidas é parte importante de uma decisão consciente sobre o cuidado com a aparência.'],
  'cosmetics-retail': ['Beleza nas suas escolhas', 'Texturas, fragrâncias e formas de uso fazem parte da escolha de cosméticos. Explorar esse universo é descobrir possibilidades que combinam com preferências pessoais e com os pequenos rituais de cuidado do dia a dia.'],
  dentistry: ['Cuidado que começa pela informação', 'A saúde bucal faz parte do cuidado cotidiano. Entender as possibilidades de atendimento e conversar sobre dúvidas e necessidades ajuda a construir uma relação mais consciente com a prevenção e o acompanhamento odontológico.'],
  restaurant: ['À mesa, novas descobertas', 'Sabores, aromas e o prazer de compartilhar a mesa fazem parte da experiência gastronômica. Cada escolha, de uma refeição cotidiana a um encontro especial, abre espaço para descobrir combinações e aproveitar o momento.'],
  pizzeria: ['O prazer de compartilhar uma pizza', 'Massa, combinações de sabores e a tradição de dividir a mesa fazem da pizza um convite ao encontro. Das preferências clássicas às novas descobertas, esse universo reúne diferentes maneiras de aproveitar uma refeição.'],
  'fast-food': ['Uma pausa com sabor', 'Uma pausa para comer também pode ser um momento de descoberta. No universo das lanchonetes, combinações de sabores e preferências pessoais dão o tom de encontros informais e refeições que acompanham a rotina.'],
  'law-firm': ['Clareza para o próximo passo', 'Questões jurídicas pedem atenção ao contexto e compreensão das particularidades de cada situação. Organizar informações e esclarecer dúvidas são passos importantes antes de decidir como buscar orientação profissional.'],
  veterinary: ['Atenção à vida dos animais', 'O cuidado com os animais envolve observar hábitos, compreender necessidades e buscar orientação adequada. A relação entre tutores e atendimento veterinário começa com informação e atenção ao bem-estar em cada fase da vida.'],
  'pet-shop': ['O universo de quem cuida de pets', 'Conviver com um animal é descobrir suas preferências e necessidades todos os dias. Alimentação, brincadeiras e rotina fazem parte desse universo, em que cada escolha deve considerar as particularidades de cada pet.'],
  'auto-repair': ['Cuidado em cada detalhe do veículo', 'Entender os sinais do veículo e acompanhar sua manutenção faz parte de uma rotina de cuidado. Informações claras sobre necessidades e possibilidades de atendimento ajudam a planejar os próximos passos com mais consciência.'],
  accounting: ['Organização para decidir melhor', 'A rotina contábil conecta registros, documentos e decisões de gestão. Compreender essas informações e organizar as necessidades do negócio são passos importantes para conversar sobre acompanhamento profissional.'],
  'financial-services': ['Informação para suas escolhas', 'Cada decisão financeira depende de objetivos, contexto e compreensão das condições envolvidas. Organizar dúvidas e prioridades é o ponto de partida para conhecer alternativas e buscar informações sobre atendimento.'],
  other: ['Conheça o negócio', 'Conhecer a proposta de um negócio passa por entender sua área de atuação e identificar o que faz sentido para cada necessidade. Informações claras ajudam a comparar possibilidades e preparar o próximo contato.'],
};

export function buildAboutContent(context: LeadSiteContext, niche?: CanonicalNiche) {
  const business = context.business;
  const [title, story] = stories[niche ?? normalizeLegacyBusinessNiche(business.category)];
  const location = [business.neighborhood, business.city].filter(Boolean).join(', ');
  const identity = `${business.name} faz parte do segmento de ${business.category.toLocaleLowerCase('pt-BR')}${location ? ` em ${location}` : ''}.`;
  return { title, description: `${identity}\n\n${story}\n\nConheça a proposta de ${business.name} e consulte as opções de atendimento para encontrar o que combina com você. Antes de planejar sua visita, vale esclarecer dúvidas sobre disponibilidade e sobre as possibilidades que melhor atendem às suas necessidades.` };
}

export const aboutPromptGuidance = 'Quando a seção Sobre estiver ativa, escreva um título editorial e 2 ou 3 parágrafos (80 a 140 palavras) em about.description, separados por \\n\\n. Apresente o negócio e a localização disponível, desenvolva detalhes relevantes do nicho e encerre com um convite discreto. Para barbearias, use linguagem refinada sobre estilo pessoal, corte, barba e cuidado masculino, evocando uma estética premium sem afirmar luxo, instalações, serviços ou diferenciais não confirmados. Para outros nichos, adapte o vocabulário e o tema; nunca reutilize a narrativa de barbearia. Não entregue apenas a cidade ou um texto genérico de dedicação e qualidade.';
