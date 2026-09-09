# Guidance operacional — Fase A

Esta pasta é a fonte operacional do Site Builder. Não há outra pasta Guidance.

| Módulo | Responsabilidade | Uso atual |
| --- | --- | --- |
| `reactToolkit.ts` | Engenharia e catálogo de componentes, procedência do toolkit | Consumido pelos prompts existentes; preservado |
| `index.ts` | Catálogo interno que compõe as responsabilidades | Fundação para próximas fases; não altera o prompt |
| `foundations/` | Princípios e adaptação de LeadSiteContext para BusinessContext | Adaptador puro, sem classificação inferida |
| `niches/` | Estado das regras de nicho | Explicitamente não pesquisado; nenhum perfil inventado |
| `design-families/legacy-default.ts` | Apresentação legada e adaptação para DesignSpecification | CSS, paletas e fallback existentes consumidos pelo renderer |
| `generation/` | Ordem alvo e capacidades implementadas/ausentes | Declaração; não executa pesquisa, agentes ou mídia |
| `quality/` | Critérios da fundação | Compatibilidade, integridade e equivalência preview/export |

## Contratos

`../contracts/index.ts` exporta schemas Zod strict e tipos inferidos. Contratos independentes (sidecars), versão 1, não adicionados ao Blueprint persistido nem ao JSON Schema solicitado à IA:

- **BusinessContext**: reutiliza o contexto atual em `lead`; complementos opcionais em `confirmed` só para informações confirmadas pelo usuário. O adaptador inicia complementos vazios.
- **ReferenceBrief**: identificação, nicho, data, referências HTTPS com motivos, padrões e restrições. Não constitui autorização de acesso à URL: proteção contra SSRF e política de pesquisa serão necessárias no futuro adapter.
- **DesignTokens**: cores semânticas atuais, seleção tipográfica modern/editorial, espaçamento das seções, raios e movimento. Não aceita CSS livre nem promete um sistema tipográfico completo.
- **DesignSpecification**: família/versionamento, template, variantes, apresentação e tokens resolvidos. Movimento e tipografia devem concordar nos dois contratos.
- **MediaPlan**: lista de solicitações por seção existente, finalidade, preferência de origem, proporção e alt. IDs únicos; decorativas com alt vazio. Não contém arquivos gerados, providers, URLs ou status de sucesso. Lista vazia é válida.

Não foram adicionados campos de modelo comercial, equipe, prova social ou features sem consumidor atual. A Fase B poderá ampliar contratos mediante necessidade concreta e testes de compatibilidade.

## Família legada

`legacyDesignSpecification(input)` valida Blueprint v1/v2, aplica a migração v1 existente e devolve uma especificação separada. Não modifica o objeto de entrada, o armazenamento ou a revisão do projeto. Não há Blueprint v3 nem migração em massa.

`legacy-default` v1 preserva quatro templates, variantes, duas superfícies (light/dark), fontes locais, cores de marca e movimento. `renderer/presentation.ts` é uma fachada de compatibilidade. O CSS foi extraído sem alteração da saída; 40 hashes de HTML/CSS foram capturados antes da extração e verificados depois.

Tokens são uma descrição parcial resolvida da família, não uma API de temas arbitrários já consumida pelo renderer. O CSS legado continua definindo detalhes específicos das seções. Próximas famílias precisarão de um contrato de aplicação explícito, sem ifs de nicho no renderer.

## Fonte canônica

- SOURCE_OF_TRUTH: código operacional desta pasta e schemas em `contracts/`.
- DERIVED_FROM: snapshot do toolkit registrado por `reactToolkit.ts`, decisões locais e aparência previamente validada.
- SYNC_DIRECTION: regras aprovadas → código/contratos → documentação; Obsidian mantém pesquisa e histórico.
- Documentação explica regras; não é executada ou sincronizada automaticamente.

O relatório de infraestrutura, comparação das instalações e validação está em `docs/reviews/phase-a/RELATORIO.md`.
