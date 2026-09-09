# Pesquisa e resolução visual — Fase B

Pesquisa em 2026-09-08. Referências são de mercado; não são leads piloto nem fontes de fatos sobre os leads.

| Nicho | Fonte primária | Observação estrutural | Uso proposto |
| --- | --- | --- | --- |
| Odontologia | https://www.hellotend.com/site/home | Agendamento repetido, categorias, unidades | CTA claro e orientação local |
| Odontologia | https://www.swiss-smile.com/ | Unidades e navegação de atendimento | Encontrabilidade e contexto local |
| Odontologia | https://www.implart.com.br/ | Especialidades e identificação profissional | Hierarquia, apenas com fatos confirmados |
| Restaurante | https://www.evvai.com.br/ | Navegação curta, menu e reserva | Ritmo editorial e ação direta |
| Restaurante | https://www.restaurantemani.com.br/ | Percursos de gastronomia e ambiente, reservas | Separar conteúdo e experiência |
| Restaurante | https://lasai.com.br/ | Narrativa, menu e reserva | Sequência editorial de conversão |

Ten Dental foi consultado, mas retornou conteúdo textual insuficiente; não foi contado entre as três referências clínicas. Maní redirecionou do domínio antigo para restaurantemani.com.br. Pesquisa textual não comprova medidas CSS ou qualidade responsiva das referências; escolhas de spacing, fontes e grid são decisões de design desta fase, não medições dos concorrentes.

## Contexto e limites

Pilotos de negócios locais em contexto brasileiro. Subnicho, público e posicionamento comercial não confirmados ficam ausentes. “Premium” qualifica a direção visual pretendida; não é uma alegação sobre a empresa. Referências internacionais de odontologia contribuem com estrutura, sem transferir serviços, preços, legislação ou linguagem comercial para o lead.

A classe CurrentBusinessReference contém somente o site do negócio. O catálogo de mercado não contém endereço, contato, identificação ou auditoria de lead. Freshness: 90 dias. Pesquisa específica Premium automática ainda depende de provider; esta execução fez curadoria manual.

## Stitch — execução real pelo navegador

Projeto: https://stitch.withgoogle.com/projects/16495453154449814409

Autenticação observada e escrita comprovada pela criação de quatro telas. Nenhuma fotografia ou mídia solicitada; somente blocos e tipografia. Dados transmitidos: contexto inteiramente fictício, direções, paletas e URLs públicas de referência. Nenhum telefone, email, coordenada exata ou identificador CRM real.

| Nicho | Alternativas efetivamente geradas | Seleção técnica | Motivo |
| --- | --- | --- | --- |
| Clínica | Minimal Clinical; Warm Premium | Minimal Clinical | Hierarquia mais direta, Hero dividido e contraste claro; compatibilidade com família health-trust |
| Restaurante | Editorial Dining; Warm Contemporary | Editorial Dining | Serif e superfícies quentes escuras distinguem o restaurante; hierarquia editorial |

Revisão: as telas clínicas inseriram alegações não comprovadas sobre registro profissional, instalações e rigor técnico. Copy rejeitada, não importada ao Blueprint. A segunda solicitação reforçou essa restrição e o restaurante omitiu canais inexistentes. Rótulos internos de demonstração do Stitch também não fazem parte do produto final.

## Comparação com React

Os artefatos premium são adaptações após seleção, não exportação pixel a pixel. Mantêm paleta, contraste entre famílias e vocabulário de composição. Fontes externas do Stitch foram substituídas por fontes locais. Cards laterais e Hero internos do Stitch são mapeados para as variantes suportadas do renderer. As cinco seções continuam as da baseline; galeria, FAQ e provas especializadas não foram adicionadas. Conteúdo sem evidência é omitido, mesmo que a tela do Stitch o apresente.

As telas do Stitch foram inspecionadas por screenshot nesta sessão. Os HTMLs resultantes ficam nos subdiretórios dentistry/premium e restaurant/premium. A comparação mostra direção coerente, mas diferenças de geometria e densidade. Não se declara fidelidade pixel a pixel ou aprovação comercial humana.

## Segurança consultada

- https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html
- https://nodejs.org/api/net.html#socketconnectoptions-connectlistener

DNS revalidado por redirect e conexão fixada no IP autorizado. Callback suporta resultado único e lista exigida pela seleção automática de família do Node. URLs e conteúdo externos não dão instruções ao sistema.
