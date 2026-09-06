# BrasilAPI e OpenStreetMap no ProspectorCRM

## Decisão

| Uso | Decisão |
| --- | --- |
| Enriquecer lead OSM com CNPJ já conhecido | RECOMENDADO COM LIMITAÇÕES |
| Descobrir empresas | NÃO RECOMENDADO |
| Deduplicação por CNPJ já confirmado | RECOMENDADO COM LIMITAÇÕES |
| Confirmação cadastral de CNPJ já conhecido | RECOMENDADO COM LIMITAÇÕES |
| Alimentar automaticamente o OpenStreetMap | NÃO RECOMENDADO |

## O que a BrasilAPI oferece

| Recurso | Existe? | Endpoint | Uso no Prospector |
| --- | --- | --- | --- |
| Consulta por CNPJ exato | Sim | `GET /api/cnpj/v1/{cnpj}` | Dados cadastrais após obter um CNPJ confiável |
| Razão social e nome fantasia | Sim | CNPJ por número | Matching manual ou confirmação posterior |
| Situação cadastral e CNAEs | Sim | CNPJ por número | Qualificação de lead confirmado |
| Endereço, CEP, município e UF | Sim | CNPJ por número | Comparar com OSM, sem sobrescrever dados |
| Telefones cadastrados | Sim, quando presentes | CNPJ por número | Dado complementar com proveniência |
| Consulta por CEP | Sim | `GET /api/cep/v1/{cep}` ou v2 | Normalização de endereço, não descoberta empresarial |
| Busca por nome, cidade, bairro ou CNAE | Não | — | Não disponível para descobrir empresas |
| Busca por coordenadas ou raio | Não | — | Não disponível |

O endpoint público de CNPJ recebe um CNPJ como parâmetro e retorna dados cadastrais como razão social, nome fantasia, situação, CNAE, endereço e telefones quando disponíveis. A amostra oficial confirma esses campos. Fontes: [documentação de CNPJ](https://github.com/BrasilAPI/BrasilAPI/blob/main/pages/docs/doc/cnpj.json) e [resposta pública de exemplo](https://brasilapi.com.br/api/cnpj/v1/19131243000197).

## Limites para descoberta

A BrasilAPI não consegue descobrir empresas próximas, buscar empresas por bairro/nicho, nem substituir o Overpass. O fluxo de descoberta deve permanecer:

```text
Cidade / bairro / nicho / raio
  -> Overpass
  -> locais OSM verificáveis
```

BrasilAPI só entra depois de haver um CNPJ informado pelo usuário, presente de forma confiável na fonte de origem ou confirmado por outra base autorizada. Ela não deve ser chamada durante cada scan: isso elevaria a latência e não produziria candidatos, pois não há endpoint de pesquisa empresarial geográfica.

## Arquitetura futura recomendada

```text
Overpass -> lead OSM -> CNPJ conhecido ou candidato externo autorizado
         -> matcher -> backend ProspectorCRM -> BrasilAPI -> enriquecimento
```

O matcher nunca deve atribuir CNPJ só pelo nome. Para um conjunto de candidatos fornecido por outra fonte, usar nome (35%), CEP/endereço (30%), telefone (20%), cidade/UF (10%) e outros sinais (5%). Associar automaticamente apenas com score >= 0,90; de 0,70 a 0,89 marcar como provável para revisão; abaixo disso não associar.

Campos futuros mínimos: `cnpj`, `cnpjStatus`, `cnpjMatchScore`, `cnpjMatchedAt` e uma estrutura de proveniência por campo, por exemplo `phoneSources`, `addressSources` e `cnpjSource`. Valores OSM e BrasilAPI divergentes devem coexistir com uma indicação de divergência.

## Backend e cache futuros

Uma integração futura deve ficar no backend, por exemplo `server/services/brasilApiService.ts`, com timeout, normalização, logs sem dados sensíveis e cache por `cnpj:{14-digitos}`. TTL inicial: 7 dias para respostas de CNPJ e 24 horas para CEP; máximo de 5.000 entradas com LRU. Consultar somente por ação explícita de enriquecimento ou após confirmação do CNPJ, nunca no scan.

## OpenStreetMap

É aceitável enriquecer o CRM com dados públicos associados a um CNPJ confirmado, mantendo a origem de cada campo. Não é aceitável automatizar criação ou alteração de registros OpenStreetMap a partir da BrasilAPI: licença, qualidade, elegibilidade da fonte e revisão humana devem ser avaliadas pelo processo de contribuição do OSM antes de qualquer edição.
