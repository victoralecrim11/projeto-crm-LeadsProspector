# ProspectorCRM — resumo técnico atual

## Objetivo

CRM para prospecção local de negócios com dados obtidos no OpenStreetMap, sem depender do Google Maps Platform, Places API ou Geocoding.

## Fluxo de prospecção

1. O usuário abre o **Radar Local** e define cidade, bairro opcional, nicho e raio.
2. Ao clicar em **Escanear Área**, o frontend consulta o backend `/api/overpass`.
3. O backend encaminha a consulta ao Overpass; os resultados OSM `node`, `way` e `relation` são convertidos em leads rastreáveis.
4. Somente locais com procedência OSM completa (`tipo`, `id` e coordenadas válidas) são exibidos no mapa Leaflet e na grade.
5. Clicar em um marcador mantém o popup aberto com detalhes, inclusão no CRM, localização externa e, quando disponível, link de origem OSM.

O aplicativo inicia sem leads, projetos, agendamentos, ranking ou notificações de exemplo. Registros antigos marcados como sintéticos são descartados no carregamento local.

## Mapa e geodados

- Leaflet puro (`L.map`, `L.tileLayer`, `L.marker`, `L.circle`, `L.layerGroup`), sem `react-leaflet`.
- Provider de tiles configurável por `VITE_MAP_TILE_URL` e `VITE_MAP_TILE_ATTRIBUTION`; há fallback para o endpoint padrão do OpenStreetMap.
- O centro usado no Overpass, no círculo e no foco do mapa é o mesmo, inclusive para bairros com centróide conhecido.
- Resultados de uma varredura por bairro são vinculados aos IDs OSM retornados naquela consulta. Assim, a ausência de `addr:suburb` no OSM não elimina negócios realmente encontrados dentro do raio.
- A distância exibida é recalculada a partir do centro ativo da busca, inclusive após trocar cidade ou bairro.
- Coordenadas são verificadas quanto a tipo, finitude e intervalo geográfico antes de criar marcadores ou links externos.
- Uma pesquisa no Google Maps só ocorre quando o OSM oferece endereço de logradouro; sem isso, a interface abre o ponto exato no OpenStreetMap para evitar associar um nome ambíguo ao negócio errado.

## Procedência e integridade dos leads

- Leads OSM usam `osmType`, `osmId`, `osmLat`, `osmLng`, `geoLat` e `geoLng`.
- A badge **REAL OSM** só aparece para registros com procedência OSM completa.
- Não há fallback para nota, reviews, distância, WhatsApp, score ou auditoria.
- O score é determinístico e usa somente campos presentes no registro.
- Auditoria técnica não inventa métricas: quando ausente, a UI informa que não foi auditado.

## Nominatim e limites externos

- A digitação no modal de bairro não chama Nominatim.
- A busca externa só acontece ao clicar em **Buscar no OpenStreetMap**.
- O proxy usa chave normalizada, cache com TTL de 24 h, máximo de 500 entradas, limpeza e uma fila que limita saídas externas a uma por segundo.
- Erros de rate limit, timeout e upstream retornam respostas específicas.

## Estado atual de dados

- `src/data/defaultConfig.ts` contém somente configurações vazias padrão.
- Não há gerador de empresas, seed leads, fallback sintético ou modo demonstração.
- Registros locais antigos sem procedência verificável são descartados; entradas manuais novas são identificadas explicitamente como `manual`. Avaliações antigas sem a tag OSM correspondente também são removidas.
- Inclusão manual permanece possível, mas não inventa localização, WhatsApp, nota, avaliações, distância ou auditoria.

## Experiência de prospecção

- O **Radar Local** é o único ponto de varredura; o botão da grade apenas abre o radar com os filtros selecionados.
- A **Grade** é uma visualização alternativa dos mesmos resultados OSM, sem filtros ou diagnósticos baseados em dados não fornecidos pelo OSM.
- O raio começa em 10 km e seus atalhos refletem sempre o valor atual do controle deslizante.

## Verificações realizadas

- `npm run lint` executa `tsc --noEmit`.
- `npm run build` gera o frontend Vite e o backend compilado em `dist/server.cjs`.
- Overpass foi consultado com retornos reais de `node`, `way` e `relation`.
- No navegador, uma varredura em Belo Horizonte retornou 20 estabelecimentos reais e o popup de um marcador exibiu suas ações.
- Nominatim foi testado com requisições concorrentes; a segunda saída respeitou a fila de um pedido externo por segundo.

## Dívida técnica conhecida

O `strict` global do TypeScript ainda não está habilitado. Os campos opcionais ajustados nesta área são validados explicitamente; o plano de adoção gradual está em [TECHNICAL_DEBT.md](TECHNICAL_DEBT.md).

## Análise de BrasilAPI

A avaliação em [BRASILAPI_VIABILIDADE.md](BRASILAPI_VIABILIDADE.md) conclui que a BrasilAPI serve para enriquecer um CNPJ já conhecido, mas não oferece descoberta geográfica ou busca empresarial por cidade, bairro, nicho, CNAE ou raio. Ela não é chamada durante scans OSM.
