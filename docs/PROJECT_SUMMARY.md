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
├── services/
│   └── aiService.test.ts
└── utils/
    ├── commandPaletteShortcut.test.ts
    └── openGoogleMaps.test.ts
```

O script `npm test` executa `tests/**/*.test.ts`, e o `tsconfig.json` inclui `tests/**/*` na verificação de tipos. A suíte cobre:

- seleção, autenticação, retentativa e fallback do Gemini;
- retorno do teste real de conexão;
- captura de `Ctrl + K` pela busca global;
- composição da busca comercial no Google Maps;
- preservação das coordenadas exatas em Google Maps e OpenStreetMap.

## Comandos de verificação e produção

- `npm test`: executa a suíte automatizada.
- `npm run lint`: executa `tsc --noEmit`.
- `npm run build`: gera o frontend Vite e o backend em `dist/server.cjs`.
- `npm start`: inicia o bundle de produção previamente gerado.

O build atual pode emitir avisos não bloqueantes sobre o tamanho de alguns chunks e sobre `leadStore.ts` ser importado de forma estática e dinâmica.

## Convenção de documentação

Todos os arquivos Markdown do projeto são mantidos em `docs/`. Novos documentos `.md` devem ser criados diretamente nessa pasta, e links entre documentos devem usar caminhos relativos ao próprio diretório.

- [README.md](README.md): apresentação, instalação, configuração e uso.
- [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md): resumo técnico do estado atual.
- [BRASILAPI_VIABILIDADE.md](BRASILAPI_VIABILIDADE.md): análise da integração com BrasilAPI.

## BrasilAPI

A análise em [BRASILAPI_VIABILIDADE.md](BRASILAPI_VIABILIDADE.md) conclui que a BrasilAPI pode enriquecer um CNPJ conhecido, mas não oferece descoberta empresarial por cidade, bairro, nicho, CNAE ou raio. Ela não participa das varreduras OSM.

Consulte o [README.md](README.md) para instalação, configuração, fluxo recomendado e comandos de uso.
