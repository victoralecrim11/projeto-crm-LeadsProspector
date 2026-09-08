# ProspectorCRM — resumo técnico atual

## Objetivo

Aplicação full-stack para descobrir negócios locais por dados do OpenStreetMap, validar oportunidades externamente e conduzir o atendimento em um CRM. O sistema reúne radar geográfico, funil, scripts comerciais com IA, propostas, contratos, projetos, agenda e exportação.

O OpenStreetMap/Overpass é a fonte do radar. Google Maps é usado somente como destino de conferência manual; a aplicação não trata o resultado textual do Maps como validação automática do registro OSM.

## Fluxo de prospecção

1. O usuário abre o **Radar Local** e seleciona cidade, bairro/região, nicho e raio de 5 a 50 km.
2. Ao executar a busca, o frontend envia a consulta ao proxy `/api/overpass`.
3. O backend consulta endpoints Overpass com fallback e transforma elementos `node`, `way` e `relation` em leads rastreáveis.
4. Os filtros são aplicados sobre a consulta ativa e os resultados retornados; negócios sem `addr:suburb` não são descartados quando pertencem ao conjunto OSM encontrado no raio do bairro.
5. O mesmo centro ativo orienta consulta, círculo, foco do mapa e cálculo das distâncias exibidas.
6. Um marcador abre o popup com detalhes, inclusão no CRM e ações independentes de conferência geográfica.

O aplicativo inicia sem leads, projetos, agendamentos, ranking ou notificações de demonstração. Registros locais antigos marcados como sintéticos são descartados durante a migração.

## Mapa, coordenadas e links externos

- O mapa usa Leaflet diretamente (`L.map`, `L.tileLayer`, `L.marker`, `L.circle` e `L.layerGroup`), sem `react-leaflet`.
- Tiles e atribuição podem ser configurados por `VITE_MAP_TILE_URL` e `VITE_MAP_TILE_ATTRIBUTION`, com OpenStreetMap como padrão.
- Latitude e longitude são validadas quanto a tipo, finitude e intervalo antes da criação de marcadores ou links.
- **Buscar empresa no Google Maps** monta uma pesquisa comercial com nome, categoria e cidade/região para reduzir ambiguidades de nomes genéricos.
- **Coordenada exata no Google Maps** abre as coordenadas recebidas do OSM. O Maps pode mostrar apenas um ponto ou Plus Code quando não associa essas coordenadas a uma ficha comercial.
- **Ver ponto exato no OpenStreetMap** centraliza o mapa OSM na mesma latitude e longitude.
- **Ver origem no OpenStreetMap** abre o objeto original pelo tipo e ID OSM quando a procedência está completa.
- A busca comercial e a coordenada exata permanecem separadas porque resolvem problemas diferentes e nenhuma delas altera os dados armazenados.
- O contêiner, o popup e as ações do mapa possuem regras específicas para celular e desktop, limitando altura e largura sem degradar a visualização ampla.

## Procedência e integridade dos leads

- Leads OSM preservam `osmType`, `osmId`, `osmLat`, `osmLng`, `geoLat` e `geoLng`.
- O selo **REAL OSM** só aparece quando a procedência necessária está presente.
- Nota, avaliações, endereço, telefone e site só são apresentados quando existem nos dados disponíveis.
- “Site não informado no OSM” não significa que a empresa não possui site.
- O score é determinístico e usa somente campos presentes no registro.
- A auditoria técnica não inventa métricas; quando ausente, a interface informa que o lead ainda não foi auditado.
- Entradas manuais são marcadas explicitamente como `manual` e não recebem localização, WhatsApp, avaliação ou auditoria fictícios.

## IA e Google Gemini

### Sites: pipeline novo

- `SiteGeneratorModal` chama o backend; não usa timer, URL fictícia ou publicação simulada.
- Contexto mínimo do lead → JSON Schema/structured output → Zod → Blueprint v1 → renderer React compartilhado pelo editor, prévia e ZIP.
- Quatro templates, SEO, branding, hero/CTA, sobre, serviços sugeridos, contato, localização, visibilidade e ordem editáveis.
- O modal usa um briefing compacto: campos principais em duas colunas no desktop e uma no celular, com direção de design opcional recolhida por padrão.
- O template pode ser escolhido pelo usuário ou ficar em **Deixar a IA decidir**. O backend restringe a escolha automática aos quatro templates validados.
- Paletas podem ser recomendadas pelo contexto, definidas por duas cores ou importadas de JSON/variáveis CSS. A importação extrai no máximo 12 cores hexadecimais; não executa CSS, URLs, scripts ou conteúdo arbitrário.
- Lentes internas (`local-conversion`, `premium-editorial`, `trust-institutional` e `appointment-flow`) orientam hierarquia, template e movimento de acordo com tipo, objetivo e estilo. Elas são regras do aplicativo, não execução de arquivos `SKILL.md` do Codex no servidor.
- `/api/ai/models` descobre modelos; `/api/ai/sites/generate` gera; `/api/ai/sites/regenerate-section` altera apenas a seção solicitada.
- Estratégias auto/fast/quality/premium/local e modelo explícito. Fallback entre modelos somente em automático; falhas não viram sucesso.
- Gemini via backend; Ollama opcional no servidor. Credenciais internas exigem token em produção; BYOK dos scripts permanece separado. O token do servidor é uma autorização temporária `Bearer`, não a chave Gemini nem autenticação individual.
- Erros de transporte local são separados de erros do provedor: backend parado retorna uma orientação de reinício; timeout, 401, 429, 502 e 503 mantêm categorias próprias. Falhas transitórias recebem espera curta e fallback permitido; falhas de autenticação ou formato não são repetidas.
- Projetos salvam contexto, Blueprint, status, revisão e metadata IA no navegador, com falha explícita de persistência. Registros antigos sem Blueprint continuam acessíveis, sem prévia fictícia.
- Exportação estática com `index.html`, `blueprint.json` e `context.json`. Sem deploy, dependência do CRM ou scripts gerados pela IA.
- Informações ausentes são omitidas; serviços de IA são sugestões sem preço. Export exige revisão humana e resolução das sugestões. Validação estrutural não é verificação semântica automática de toda afirmação textual.
- Toasts temporários convivem com notificações persistentes. A busca global existente inclui projetos e contratos.
- Evidências e pendências: [AI_SITE_IMPLEMENTATION.md](AI_SITE_IMPLEMENTATION.md).

### Pesquisa, imagens, movimento e MCP

- Pesquisa web automática de referências não está implementada. Antes dela, o backend precisa de provedor definido, fontes registradas, cache, timeout e defesa contra prompt injection.
- Geração de imagens não está implementada. A próxima fase precisa definir contrato de assets, armazenamento, moderação, licença/consentimento, limites de custo e empacotamento seguro no ZIP.
- O briefing aceita intenção de movimento cinematográfico, mas o renderer atual não adiciona WebGL ou 3D. Qualquer movimento futuro deverá respeitar `prefers-reduced-motion`.
- MCP não está integrado ao runtime do CRM. Uma integração futura deverá usar adapters permitidos no backend, com consentimento e servidores confiáveis; o navegador não poderá fornecer endpoints MCP arbitrários.

### Scripts comerciais: integração preservada

- Os scripts de abordagem, follow-up e objeção podem ser gerados ou melhorados no detalhe do lead, com restauração do texto original.
- A configuração aceita provedores de IA cadastrados na interface e geração pelo servidor com `GEMINI_API_KEY`.
- O Gemini usa a sequência de fallback `gemini-3.5-flash`, `gemini-2.5-flash` e `gemini-3.1-flash-lite`.
- Falhas transitórias recebem novas tentativas com espera progressiva antes da troca de modelo.
- A chave Gemini é enviada no cabeçalho `x-goog-api-key`, sem ser exposta na URL da requisição.
- **Testar Conexão da API** faz uma chamada real e mostra sucesso ou erro no cartão e no console do navegador. Quando há fallback, informa qual modelo respondeu.
- Chaves cadastradas pela interface ficam no armazenamento local do navegador; isso não equivale a um cofre criptografado.

## Nominatim e limites externos

- Digitar no modal de bairro não dispara consultas ao Nominatim.
- A busca externa acontece somente após a ação explícita do usuário.
- O proxy normaliza a chave de busca, mantém cache com TTL de 24 horas e até 500 entradas e limita as saídas externas a uma por segundo.
- Rate limit, timeout e falhas do serviço de origem retornam respostas específicas.

## Runtime local e Vercel

- O backend compartilhado é criado por `server/app.ts`; `server.ts` abre a porta apenas no runtime Node local e `api/index.ts` exporta o app como uma única Vercel Function.
- O `vercel.json` encaminha `/api/*` para a função antes do fallback de SPA para `index.html`. Rotas de API ausentes continuam retornando JSON, nunca HTML.
- A Vercel executa `npm run build:client`, publica apenas os assets do Vite e não expõe `dist/server.cjs`. O build Node completo continua disponível em `npm run build` para hospedagem tradicional.
- O runtime serverless está fixado em Node.js 22 LTS, com duração máxima de 60 segundos para acomodar fallbacks de IA e Overpass.
- `GEMINI_API_KEY` e `SITE_AI_ACCESS_TOKEN` devem ser configurados nas variáveis de ambiente da Vercel para o modo de credencial interna. BYOK continua funcionando sem essas variáveis.
- O cache e a fila do Nominatim vivem na memória de cada instância aquecida da Function; não constituem persistência distribuída entre instâncias.

## CRM e experiência de uso

- O **Radar Local** é o ponto de varredura; a grade apresenta os mesmos resultados OSM em outra visualização.
- O detalhe do lead reúne etapa do funil, valor de setup, MRR, contato, localização, scripts, notas e ações comerciais.
- O botão **Melhorar com IA** permanece disponível junto ao script inteligente.
- O botão **Buscar** e os atalhos `Ctrl + K` ou `Cmd + K` abrem a paleta global antes que o navegador consuma o atalho.
- Leads podem ser exportados para Excel (`.xlsx`) com dados e resumo comercial.
- Stores Zustand usam `safeStorage`, tentando `localStorage` e recorrendo a `sessionStorage` quando necessário.

## Organização dos testes

Os testes automatizados ficam separados do código de produção e espelham a estrutura correspondente:

```text
tests/
├── components/
│   └── designBriefControls.test.tsx
├── fixtures/
│   └── siteFixture.ts
├── services/
│   ├── aiService.test.ts
│   ├── designBrief.test.ts
│   ├── siteGenerationClient.test.ts
│   ├── siteGeneration.test.ts
│   ├── siteRoutes.test.ts
│   └── vercelRuntime.test.ts
└── utils/
    ├── commandPaletteShortcut.test.ts
    └── openGoogleMaps.test.ts
```

O script `npm test` executa `tests/**/*.test.ts`, e o `tsconfig.json` inclui `tests/**/*` na verificação de tipos. A suíte cobre:

- seleção, autenticação, retentativa e fallback do Gemini;
- parsing seguro de design systems, paletas e lentes de design;
- template automático versus escolha manual e precedência de cores explícitas;
- mensagens de backend indisponível, timeout e resposta inválida;
- estrutura acessível dos estados recomendado, personalizado e importado do briefing;
- retorno do teste real de conexão;
- captura de `Ctrl + K` pela busca global;
- composição da busca comercial no Google Maps;
- preservação das coordenadas exatas em Google Maps e OpenStreetMap.
- configuração, imports ESM e contrato HTTP da Function da Vercel.

## Comandos de verificação e produção

- `npm test`: executa a suíte automatizada.
- `npm run lint`: executa `tsc --noEmit`.
- `npm run build`: gera o frontend Vite e o backend em `dist/server.cjs`.
- `npm run build:client`: gera somente o frontend estático usado pela Vercel.
- `npm run build:server`: gera somente o servidor Node para hospedagem tradicional.
- `npm start`: inicia o bundle de produção previamente gerado.

O build atual pode emitir avisos não bloqueantes sobre o tamanho de alguns chunks e sobre `leadStore.ts` ser importado de forma estática e dinâmica.

## Convenção de documentação

Documentação humana fica em `docs/`. Specs, design e tarefas formais ficam em `openspec/`, exceção solicitada para esta fase. Links usam caminhos relativos ao documento.

- [README.md](README.md): apresentação, instalação, configuração e uso.
- [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md): resumo técnico do estado atual.
- [BRASILAPI_VIABILIDADE.md](BRASILAPI_VIABILIDADE.md): análise da integração com BrasilAPI.

## BrasilAPI

A análise em [BRASILAPI_VIABILIDADE.md](BRASILAPI_VIABILIDADE.md) conclui que a BrasilAPI pode enriquecer um CNPJ conhecido, mas não oferece descoberta empresarial por cidade, bairro, nicho, CNAE ou raio. Ela não participa das varreduras OSM.

Consulte o [README.md](README.md) para instalação, configuração, fluxo recomendado e comandos de uso.
