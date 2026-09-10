# Guidance operacional — Fase A + Fase B

Esta pasta é a fonte operacional do Site Builder. Não há outra pasta Guidance.

| Módulo | Responsabilidade | Estado |
| --- | --- | --- |
| `reactToolkit.ts` | Engenharia e catálogo de componentes, procedência do toolkit | Consumido pelos prompts existentes; preservado |
| `index.ts` | Catálogo interno que compõe as responsabilidades | Registra legacy-default e pilotFamilies |
| `foundations/` | Princípios e adaptação de LeadSiteContext para BusinessContext | Adaptador puro, sem classificação inferida |
| `niches/index.ts` | Estado das regras de nicho e pilotos conhecidos | Pilotos (dentistry, restaurant) com pesquisa curada |
| `niches/market.ts` | Referências de mercado curadas para nichos piloto | Pesquisa verificada 2026-09-08; expira em 90 dias |
| `design-families/legacy-default.ts` | Apresentação legada e adaptação para DesignSpecification | CSS, paletas e fallback existentes consumidos pelo renderer |
| `design-families/pilots.ts` | Famílias de design para nichos piloto | health-trust (dentistry), hospitality-editorial (restaurant) |
| `generation/` | Ordem alvo e capacidades implementadas/ausentes | Pesquisa implementada para pilotos; mídia não implementada |
| `quality/` | Critérios da fundação | Compatibilidade, integridade e equivalência preview/export |

## Funcionalidades implementadas na Fase B

| Funcionalidade | Estado | Módulo principal |
| --- | --- | --- |
| LeadSourceContext | Implementado | `../leadSource.ts` |
| SourcedBusinessContext | Implementado | `../leadSource.ts` |
| Current Site Audit | Implementado | `server/services/research/currentSiteAudit.ts` |
| SSRF protections | Implementado | `server/services/research/safeWebsite.ts` |
| CurrentBusinessReference | Implementado | `../contracts/research.ts` |
| Market References | Implementado para pilotos | `niches/market.ts` |
| Design Families (pilot) | Implementado | `design-families/pilots.ts` |
| DesignSpecification | Implementado | `../contracts/index.ts` |
| ResolvedDesign | Implementado | `../contracts/research.ts`, `../designPipeline.ts` |
| Standard Design-First | Implementado | `../designPipeline.ts` |
| DESIGN.md export | Implementado | `../designPipeline.ts`, `../exportSite.ts` |
| Stitch abstraction | Implementado (provider opcional) | `server/services/research/stitch.ts` |
| Media pipeline | **NÃO IMPLEMENTADO** (Fase C) | — |

## Contratos

`../contracts/index.ts` exporta schemas Zod strict e tipos inferidos. Contratos independentes (sidecars), versão 1, não adicionados ao Blueprint persistido nem ao JSON Schema solicitado à IA:

- **BusinessContext**: reutiliza o contexto atual em `lead`; complementos opcionais em `confirmed` só para informações confirmadas pelo usuário. O adaptador inicia complementos vazios.
- **ReferenceBrief**: identificação, nicho, data, referências HTTPS com motivos, padrões e restrições. Não constitui autorização de acesso à URL: proteção contra SSRF e política de pesquisa serão necessárias no futuro adapter.
- **DesignTokens**: cores semânticas atuais, seleção tipográfica modern/editorial, espaçamento das seções, raios e movimento. Não aceita CSS livre nem promete um sistema tipográfico completo.
- **DesignSpecification**: família/versionamento, template, variantes, apresentação e tokens resolvidos. Movimento e tipografia devem concordar nos dois contratos.
- **MediaPlan**: lista de solicitações por seção existente, finalidade, preferência de origem, proporção e alt. IDs únicos; decorativas com alt vazio. Não contém arquivos gerados, providers, URLs ou status de sucesso. Lista vazia é válida.

`../contracts/research.ts` estende com:

- **LeadSourceContext**: fonte normalizada do lead (overpass, manual, other).
- **SourcedBusinessContext**: fatos derivados com provenance rastreada.
- **CurrentBusinessReference**: auditoria do site atual com problemas e oportunidades.
- **ResolvedDesign**: direção visual completa incluindo reference brief combinado, specification, composition, trace e markdown.

## Família legada

`legacyDesignSpecification(input)` valida Blueprint v1/v2, aplica a migração v1 existente e devolve uma especificação separada. Não modifica o objeto de entrada, o armazenamento ou a revisão do projeto. Não há Blueprint v3 nem migração em massa.

`legacy-default` v1 preserva quatro templates, variantes, duas superfícies (light/dark), fontes locais, cores de marca e movimento. `renderer/presentation.ts` é uma fachada de compatibilidade. O CSS foi extraído sem alteração da saída; 40 hashes de HTML/CSS foram capturados antes da extração e verificados depois.

## Famílias piloto e Pesquisa Dinâmica (Fase B.3)

`health-trust` (dentistry), `hospitality-editorial` (restaurant) e `heritage-craft` (barbershop) são resolvidas por `familyResolver.ts` e `pilotSpecification()`.
Na Fase B.3, a pesquisa de mercado dinamicamente extrai evidências de sites reais via `NicheDesignResearchService` (SearXNG / Brave / Curated Fallback), com cache em memória Vercel-safe (TTL 60 dias) e política segura para CSS (`safeCss.ts`). As famílias piloto curadas permanecem ativas como `CURATED_PILOT` fallback determinístico.

## Stitch

Provider opcional em `server/services/research/stitch.ts`. Requer API key não fornecida. Estado padrão: `STITCH_NOT_CONFIGURED`. Não é erro nem blocker.

## Fonte canônica

- SOURCE_OF_TRUTH: código operacional desta pasta e schemas em `contracts/`.
- DERIVED_FROM: snapshot do toolkit registrado por `reactToolkit.ts`, decisões locais e aparência previamente validada.
- SYNC_DIRECTION: regras aprovadas → código/contratos → documentação; Obsidian mantém pesquisa e histórico.
- Documentação explica regras; não é executada ou sincronizada automaticamente.

O relatório de infraestrutura, comparação das instalações e validação está em `docs/reviews/phase-a/RELATORIO.md`.
