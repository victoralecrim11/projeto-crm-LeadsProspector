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

## Pesquisa Independente & Design Dinâmico (Fase B + Fase B.3 Homologada)

- O serviço de backend possui um módulo de auditoria (`server/services/research`) que visita a URL fornecida de forma estática (HTTP/HTTPS nativo, máximo de 3 redirects, limite de 1 MiB e timeout rigoroso), sem executar headless browsers.
- O sistema observa criticamente o conteúdo estrutural do website (landmarks, títulos, contatos) para formar um contexto real do lead sem alucinações ("UNTRUSTED DATA").
- **Fase B.3 (Dynamic Design Research — Homologada):** introduz pesquisa de design dinâmica por nicho com abstração `SearchProvider` (SearXNG self-hosted como primário, Brave Search como fallback, e catálogo curado de contingência).
- **Precedência estrita auditada (6 níveis):** `USER_CONFIRMED` > `CONFIRMED / CURRENT BUSINESS BRAND` > `FRESH DYNAMIC RESEARCH` > `STALE DYNAMIC RESEARCH` > `CURATED PILOTS` (`health-trust`, `hospitality-editorial`, `heritage-craft`) > `LEGACY_DEFAULT`. Nenhuma pesquisa de mercado pode sobrepor a marca real confirmada do negócio ou overrides explícitos do usuário.
- **Ambiente de produção:** `SearXNGSearchProvider` em `NODE_ENV === 'production'` exige `SEARXNG_URL` explícita; sem env, o provider é marcado como `NOT_CONFIGURED` com 0 ms de atraso, sem tentar `localhost:8080` na Vercel.
- **Proteção do endpoint de refresh:** `POST /api/ai/research/niche` é protegido por token em produção, validação Zod strict (rejeita campos arbitrários como `query`), limite de concorrência (`researchActive >= 1` retorna 429) e cooldown de 15 segundos em `forceRefresh`.
- **Persistência de snapshots:** abstração `DesignResearchSnapshotStore` com `LocalStorageSnapshotStore` para o frontend (com revalidação Zod strict, sem HTML bruto ou dados pessoais) e cache em memória / tmp best-effort no backend.
- **Safe CSS e integridade de rede:** política `safeCss.ts` com limite de 256 KiB, neutralização de `@import` e `url(...)`, além de `fetchReferenceStylesheets` que limita a no máximo 3 stylesheets e 256 KiB combinados com revalidação de SSRF a cada redirect.
- **Proveniência de barbearias:** família `heritage-craft` / `classic-heritage` sustentada por referências reais documentadas (Murdock London, Fellow Barber, Barbearia Corleone) com padrões visuais agregados e zero cópia de marca.
- **Geração desacoplada:** rotas Standard e Standard AI consomem somente cache rápido ou catálogo curado; o refresh dinâmico é estritamente separado e assíncrono.


## IA e Google Gemini

### Sites: pipeline novo (Visual Renderer - P0)

- O sistema utiliza um schema `GeneratedSiteBlueprint` atualizado para **v2**. O parse realiza migrações dinâmicas de v1.
- `SiteGeneratorModal` aciona o backend. O contexto provido via auditoria e pesquisa molda o JSON exigido pelo provider.
- O antigo renderer monolítico foi substituído por uma **arquitetura de componentes modulares**. Cada seção (Hero, About, Services, Contact, etc.) suporta múltiplas variantes (ex: `full-bleed` vs `split`, `editorial-list` vs `horizontal-cards`), rompendo a limitação de estruturas DOM idênticas.
- Estilos base e tipografia são encapsulados de forma performática. O preview aceita validação de viewports nativos simulados (Desktop 1440, Tablet 768, Mobile 390) usando URLs via Blob para garantir sandboxing seguro e navegação interna realística no preview.
- O modal usa um briefing compacto: campos principais com direção de design opcional. O template pode ser decidido pela IA.
- Paletas de cor podem ser recomendadas ou customizadas. Lentes internas de branding influenciam o prompt.
- Exportação estática com `index.html`, `blueprint.json`, `design.json` e arquivos de contexto; a apresentação exportada corresponde byte-a-byte à renderização visual do preview local.
- Projetos salvam contexto, Blueprint v2, status, revisão e metadata IA no navegador.

### Pesquisa, imagens, movimento e MCP

- Geração de imagens e movimento não estão implementados (adiados para P1/P2/P3). Qualquer intenção informada no design briefing não resultará em inserção de placeholders irreais.
- O MCP não está integrado ao runtime do CRM.

### Scripts comerciais: integração preservada

- Os scripts de abordagem, follow-up e objeção podem ser gerados ou melhorados no detalhe do lead, com restauração do texto original.
- A configuração aceita provedores de IA cadastrados na interface e geração pelo servidor com `GEMINI_API_KEY`.
- O Gemini usa a sequência de fallback `gemini-3.5-flash`, `gemini-2.5-flash` e `gemini-3.1-flash-lite`.
- **Testar Conexão da API** faz uma chamada real e mostra sucesso ou erro, com aviso explícito dos limites do provedor.
- Chaves cadastradas ficam no armazenamento local do navegador.

## Nominatim e limites externos

- Digitar no modal de bairro não dispara consultas ao Nominatim. A busca externa acontece somente após a ação explícita.
- O proxy normaliza a chave de busca, mantém cache (TTL de 24 horas, até 500 entradas) e limita as saídas a 1/seg. Rate limits e falhas retornam tratamento específico.

## Runtime local e Vercel

- O backend compartilhado é criado por `server/app.ts`; `server.ts` abre a porta apenas no runtime Node local e `api/index.ts` exporta o app como uma única **Vercel Function**.
- O `vercel.json` encaminha `/api/*` para a função antes do fallback de SPA para `index.html`. Rotas de API ausentes continuam retornando JSON.
- A Vercel executa `npm run build:client`, publica assets Vite e não expõe o runtime clássico na Vercel (este continua disponível para instâncias tradicionais via `build:server`).
- O runtime serverless fixa-se em Node.js 22 LTS (duração máx de 60s). `GEMINI_API_KEY` e `SITE_AI_ACCESS_TOKEN` precisam existir no ambiente da Vercel para o modo "credencial interna". O cache e a fila vivem na memória de cada instância da Function.

## CRM e experiência de uso

- O detalhe do lead reúne etapa do funil, valor de setup, MRR, contato, scripts e localização.
- O botão **Melhorar com IA** permanece disponível.
- O botão **Buscar** (`Ctrl + K` / `Cmd + K`) abre a paleta global de busca unificada (inclui projetos e contratos).
- Leads podem ser exportados para `.xlsx`.
- Stores Zustand usam `safeStorage` (localStorage c/ fallback para sessionStorage).

## Pipeline de Mídia Licenciada (Fase C.0 + C.1 — Homologadas)

- **Fase C.0 (Media Contracts & Architecture):**
  - O `MediaPlan` permanece estritamente como **Contrato de Intenção** (seção, propósito, proporção de aspecto, decorativa vs informativa e alt esperado). Não recebe URLs de provedores nem binários.
  - Novos contratos Zod estritos: `MediaCandidate`, `AcquiredMediaAsset`, `StoredMediaAsset` e `MediaManifest`.
  - Abstração `MediaAssetStore` com implementação nativa `IndexedDbMediaAssetStore` para navegadores (`prospector_media_db`) e `InMemoryMediaAssetStore` para testes.
  - Binários pesados residem exclusivamente no IndexedDB; o localStorage armazena apenas JSON leve (`MediaManifest` e referências).
  - Ciclo de revisão humana obrigatório: `candidate` → `selected` → `reviewed` → `exportable` / `rejected`.

- **Fase C.1 (Licensed Media MVP):**
  - Provedor primário `PexelsLicensedMediaProvider` consultando `https://api.pexels.com/v1/search` com chave protegida no servidor (`PEXELS_API_KEY`), respeitando rate limits e gerando atribuição ao fotógrafo com link de volta.
  - Provedor de fallback `PixabayLicensedMediaProvider` consultando `https://pixabay.com/api/` com chave no servidor (`PIXABAY_API_KEY`).
  - `LicensedMediaQueryBuilder` que gera termos de busca objetivos utilizando `ResolvedDesign.imageryDirection` e nicho, com filtro rigoroso que remove emails, telefones, CNPJ e endereços do CRM.
  - Camada de aquisição segura (`mediaAcquisitionService`) com proteção SSRF, resolução DNS e verificação de IP público, bloqueio estrito de redes privadas/loopback, limite de 5 MiB por asset, limite de 2 redirects, validação de magic bytes (JPEG/PNG/WebP) e bloqueio de SVG e HTML disfarçado.
  - Componente de UI `MediaPanel` permitindo busca contextual, seleção, aprovação para exportação e aviso de "Imagem licenciada ilustrativa".
  - `SiteRenderer` integra imagens por URLs de objeto efêmeras revogadas no unmount, renderiza componente `MediaCredits` com créditos obrigatórios e degrada graciosamente para fallbacks visuais CSS caso o asset esteja ausente.
  - `exportSite.ts` gera ZIPs estáticos independentes (air-gapped) gravando binários reais em `assets/media-...`, referenciando caminhos relativos no `index.html`, exportando `media/media-manifest.json` e preservando créditos de imagem, sem vazar URLs `blob:` ou `localhost`.

## Organização dos testes

Os testes automatizados (em `tests/`) refletem rigorosamente serviços e componentes. Novas suítes foram implementadas para garantir a estabilidade do fluxo Phase B e Phase C:
- `visualRenderer.test.ts`, `visualBlueprint.test.ts`, `phaseB.test.ts`, `reactToolkit.test.ts`, `dynamicResearch.test.ts`, `mediaContracts.test.ts`, `mediaStore.test.ts`, `mediaProviders.test.ts`, `mediaAcquisition.test.ts`, `mediaExport.test.ts`, `mediaRoutes.test.ts`, entre outros.
- O script `npm test` valida **121 testes (100% PASS)**, cobrindo todos os cenários legados de Phase A (40 hashes exatos de baseline), migrações v1->v2, busca dinâmica B.3, pipeline completo de mídia C.0/C.1 e os rigorosos testes de Observabilidade do Backend.

## Checkpoints de Homologação

- **VISUAL_EDITOR_PATCH (2026-09-10):** Correção do bloqueio de CORS (`allow-same-origin`) do Editor Visual, mitigação do `net::ERR_FILE_NOT_FOUND` por *premature revocation* de object URLs, e resolução de dependências circulares nos contratos de mídia. 121/121 testes PASS.
- **PHASE_C_0_C_1_COMPLETE (2026-09-09):** Conclusão e homologação das Fases C.0 (Media Contracts + Media Architecture) e C.1 (Licensed Media MVP). Adicionado o Patch Obrigatório de Observabilidade do Backend. 112/112 testes PASS, lint 0 erros, build OK, audit OK, providers Pexels e Pixabay integrados com segurança SSRF e exportação estática standalone. Parada estrita sem início de C.2.
- **PHASE_B_3_HOMOLOGATED (2026-09-09):** Homologação final da Fase B.3 com 95/95 testes aprovados.

## Comandos de verificação e produção

- `npm test`: executa a suíte automatizada.
- `npm run lint`: executa `tsc --noEmit`.
- `npm run build`: gera frontend Vite e backend em `dist/server.cjs`.
- `npm run build:client`: gera frontend estático (usado na Vercel).
- `npm run build:server`: gera backend isolado.
- `npm start`: inicia o bundle de produção.

## Convenção de documentação

Documentação humana fica em `docs/`. Specs, design e tarefas formais ficam em `openspec/`. Guias do React Toolkit encontram-se em `docs/references/react-dev-toolkit-antigravity/`.

- [README.md](README.md): apresentação, instalação, configuração e uso.
- [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md): resumo técnico do estado atual.
- [BRASILAPI_VIABILIDADE.md](BRASILAPI_VIABILIDADE.md): análise da integração com BrasilAPI.

## BrasilAPI

A análise em [BRASILAPI_VIABILIDADE.md](BRASILAPI_VIABILIDADE.md) conclui que a BrasilAPI pode enriquecer um CNPJ conhecido, mas não oferece descoberta empresarial por cidade, bairro, nicho, CNAE ou raio. Ela não participa das varreduras OSM.

Consulte o [README.md](README.md) para instalação, configuração, fluxo recomendado e comandos de uso.
