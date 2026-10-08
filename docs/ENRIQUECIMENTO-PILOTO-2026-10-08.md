# Enriquecimento multi-provider — piloto proposto

Data: 2026-10-08. Estado: não integrado ao produto.

## Ordem de avaliação

1. Usar o lead rastreável de OSM/Overpass e seus campos existentes como ponto de partida, mantendo origem e data de cada informação.
2. Para um site oficial confirmado do negócio, testar extração própria de páginas públicas: HTTP, parsing de HTML e, apenas quando necessário, navegador com JavaScript. Aplicar cache, timeout, limite de páginas/tamanho, rate limit e bloqueio de destinos privados.
3. Comparar cobertura, qualidade e custo com Apify e Bright Data em casos que a extração própria não resolva. Cada provedor deve ser opcional, com orçamento explícito; ausência de credenciais ou saldo não bloqueia o fluxo gratuito.
4. Submeter dados coletados à revisão humana antes de usá-los no site. Informações e imagens de terceiros não viram fatos da empresa prospectada automaticamente.

## Piloto mensurável

Selecionar um pequeno conjunto de leads com URL oficial verificável e permissão de consulta, registrar campos encontrados (nome, endereço, horários, serviços, contatos), proveniência por campo, tempo, taxa de falha e custo por lead. Comparar o resultado com o cadastro OSM e marcar divergências; não sobrescrever o lead sem confirmação. Os plugins de prospecção e scraping servem como referência de fluxo, não como fonte de dados autoritativa nem autorização para copiar ativos de terceiros.

O ZIP Delta Burguer fornecido não contém URL oficial confirmada nem assets oficiais autorizados. Por isso, este incremento não aciona Apify/Bright Data e não afirma resultado de scraping desse estabelecimento. O teste ao vivo precisa de um alvo verificável e de limites definidos antes de conectar provedores pagos.
