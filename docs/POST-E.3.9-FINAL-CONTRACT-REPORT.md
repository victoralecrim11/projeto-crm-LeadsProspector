# PROSPECTORCRM
# POST-E.3.9 — FINAL CONTRACT RECONCILIATION
# REAL CONSUMER PARITY — FINAL HOMOLOGATION & FREEZE REPORT

Data: 2026-09-22. Evidências desta execução; memória histórica não foi tratada como comprovação de código ou testes.

## Git Truth

- Branch: `main`; detached: NO.
- Initial HEAD / Final HEAD: `a0323c714f9a6cadbcf214c79a8e6b68a06e4c90`.
- Parent: `4ca8df284fe528780c448589c51b6d370fa53d01`.
- Subject: `fix(stitch): garante a paridade de consumo e invariante de design responsivo`.
- GitHub: `git ls-remote origin HEAD refs/heads/main` confirmou o mesmo hash.
- Checkpoint histórico `edcb77b` existe; o diff desse checkpoint ao HEAD para provider e teste original é vazio.
- Working tree inicial: seis arquivos modificados, preparação não rastreada e diretório de fixture não rastreado. As alterações existentes foram preservadas e completadas.
- Working tree final: DIRTY, aguardando gates de homologação; nenhum reset, amend ou push.

## Original Blocker

- Test: `tests/services/stitchProducer.test.ts`, três casos E2E por nicho.
- Failure: `ArtifactMcpProvider must return the artifact`; expected objeto válido, actual `null`, helper `e2eNicheTest`, linha original 327.
- Baseline behavior: worktree separado no HEAD inicial, 29 testes, 26 PASS, 3 FAIL, exit 1. Worktree removido após a verificação.
- Pre-existing: YES, comprovado no HEAD inicial; isso não justificou deixar a falha aberta.
- Root cause: writer recebe base directory e grava em `.stitch/runtime`; provider recebe runtime root. O teste passava base directory diretamente.
- A remoção local de `unlink` era uma segunda regressão semântica, independente da falha que retornava `null`.
- Correction: raiz explícita correta; assertions existentes mantidas; adicionadas leitura dupla, igualdade do conteúdo, remoção explícita e segundo consumo retornando `null`.
- Final isolated result: 29 PASS, 0 FAIL.

## Artifact API Contract

| Call site / função | Intenção | Preservar artifact | API correta |
|---|---|---|---|
| `siteGenerationDesignResolver / resolveSiteGenerationDesign` | Preparar design | YES | readArtifact |
| `siteGenerationResponsiveResolver / resolveRuntimeResponsiveDesign` | Mobile/desktop | YES | readArtifact |
| `stitchProductionService / executeProductionJob` | Verificar disponibilidade | YES | readArtifact |
| `stitchProductionService / validateConsumerParity` | Replay persistido pelo consumer real | YES | preparação compartilhada → readArtifact |
| `standardAiService / generateStandardAiSite` | Geração e retry | YES | preparação compartilhada → readArtifact |
| `stitch/index / explorePremium` | Exploração/revisão de candidatos | YES | readArtifact, corrigido nesta execução |
| `ArtifactMcpProvider / consumeArtifact` | Consumo destrutivo explicitamente solicitado | NO | consumeArtifact |
| `ArtifactMcpProvider / explore` | Compatibilidade legada destrutiva | NO | consumeArtifact; sem caller de produção atual |
| `stitchProducer.test / e2eNicheTest` | Provar ambos os contratos | Ambos | readArtifact duas vezes, consumeArtifact explicitamente |
| `stitch.test / Boundary validations` | Contrato legado | NO | explore |
| `producerOrchestrator / client.explore` | API externa Stitch, não leitura de arquivo | N/A | API distinta do provider de artifacts |
| `artifactWriter / unlink` | Limpar arquivo temporário de escrita malsucedida | N/A | Apenas temporário |
| `snapshotCache / unlink` | Limpeza de cache de pesquisa | N/A | Não pertence à cadeia persistida de preparação |

Result: PASS. Runtime de geração não chama consumeArtifact ou explore destrutivo.

## ArtifactMcpProvider

- `readArtifact`: não destrutivo, repetível; valida também as identidades dos bytes retornados após o probe.
- `consumeArtifact`: read → validate → unlink da referência concreta → return. Não remove artifact incompatível.
- `latest` não substitui referência explícita. Consumo legado de latest remove a identidade efetivamente lida.
- TTL: 60 minutos preservados. Teste antigo de stale em 10 minutos atualizado para 61 minutos.
- Result: PASS.

## Consumer Preparation

- Function: `prepareStandardAiDesignContext`.
- Read-only: carga direta do disco sem alimentar Map, alterar job/status/refs, consumir artifact ou chamar LLM.
- First/second execution: PASS, igualdade profunda, bytes de job e artifacts preservados.
- Inputs reais de produção persistidos em `preparationInput` (source + current). Nenhum dummy current/source/design.
- Horário determinístico de resolução derivado de `production.createdAt`.
- Contrato validado antes e depois de aplicar contexto/cores permitidos downstream.
- Jobs históricos sem os inputs necessários são rejeitados com `SITE_DESIGN_JOB_INVALID`; nenhum contexto é fabricado para validá-los.
- Result: PASS automatizado.

## Persisted Strategy Identity

- Production/artifact/lookup strategy: identidade persistida da produção.
- Runtime calculated strategy: sem autoridade sobre lookup. Teste demonstra uma strategy B diferente e artifact A ainda resolvido corretamente.
- Audit e cores de runtime: aplicados após a preparação canônica; refs e identidade permanecem iguais.
- True mismatch: `SITE_DESIGN_ARTIFACT_MISMATCH`; referências do job divergentes: `SITE_DESIGN_STRATEGY_MISMATCH`.
- Observação: no resolver atual, mudar apenas os campos de audit não necessariamente muda o hash; o teste B utiliza contexto de nicho diferente com o mesmo leadId para provar a separação de identidades. Audit e overrides também são testados separadamente.
- Result: PASS.

## Producer Terminal Gate

- Mock/dummy consumer: removidos.
- Persist: schema explícito, arquivo temporário e rename; erro de gravação não é ignorado.
- Windows: retry limitado para bloqueio transitório EPERM/EACCES/EBUSY no rename, observado durante a suíte.
- Desktop ref persistida antes do replay; consumer recarrega produção via repository.
- PAIRED: somente depois da preparação real; status vem da resolução responsiva, não do status anterior em RAM.
- PARTIAL: validação real do mobile; ausência/invalidez impede consumo.
- Timestamp terminal persistido, chamadas de transition aguardadas.
- Result: PASS automatizado.

## Fresh Consumer

- Producer state cleared: YES.
- Fresh repository/provider/consumer: YES, em novo processo Node.
- Production reload: disco, sem referência ao objeto do producer.
- Preparation 1 / 2: PASS / PASS.
- Artifact preserved: YES, comparação de bytes.
- Result: PASS automatizado; provedor externo é fixture somente nos testes.

## Retry

- Same generationRequestId/designProductionId/strategyId/refs: YES.
- Downstream failure seguido de standard-ai success: PASS com provedor de blueprint simulado.
- Additional Stitch calls: 0.
- Project duplication: NO, nenhuma chamada ao Stitch durante retry.
- Result: PASS automatizado; não confundir sucesso de teste com sucesso de LLM ao vivo.

## Error Taxonomy

- Unavailable: arquivo ausente/inacessível.
- Artifact mismatch: identidade de artifact, papel viewport ou par inconsistente.
- Strategy mismatch: identidade de referência persistida diverge do job.
- Invalid / stale / empty / contract: códigos distintos preservados.
- Client authority: HTTP 400 para strategyId, refs e artifactRoot adicionais.
- UI: mensagens em português e códigos seguros; sem necessidade de expor JSON/Zod/path para explicar inconsistência.
- Result: PASS nos casos automatizados.

## Test Accounting

- Test files: 41.
- Before (suite após correção do blocker, antes dos novos testes): 278 testes; inicialmente 274 PASS e 4 FAIL, depois reconciliados para 278 PASS.
- Added: 12 testes contabilizados pelo Node (um teste pai e 11 subtestes).
- Modified test files: stitchProducer, stitch, stitchOnDemand, e1_homologation.
- Final: 290 tests, 19 suites, 290 PASS, 0 FAIL, 0 skipped/cancelled/todo.
- Duration: 16184.6875 ms na última suíte completa.
- Testes antigos corrigidos: raiz runtime explícita; TTL alinhado; await de API assíncrona; persistência real no teste de expiração.

## Validation

No Windows, executáveis npm/npx/tsc/tsx foram chamados via `.cmd` quando necessário.

| Command | Exit Code | Result |
|---|---:|---|
| tsx --test tests/services/stitchProducer.test.ts | 0 | PASS, 29 testes |
| tsx --test tests/services/stitchConsumerPreparation.test.ts | 0 | PASS, 12 testes |
| npm test | 0 | PASS, 290 testes |
| npx --no-install tsc --noEmit | 0 | PASS |
| tsc -p tsconfig.react-plugin.json | 0 | PASS |
| npm run lint | 0 | PASS, inclui producer TS |
| npm run build:client | 0 | PASS; warnings de bundle/dependências |
| npm run build:server | 0 | PASS |
| tsx --test tests/services/vercelRuntime.test.ts | 0 | PASS, 4 testes |
| git diff --check | 0 | PASS |

A Vercel CLI não está instalada. Recomenda-se `npm i -g vercel` para operações futuras de ambiente/deploy/logs; a CLI não foi necessária para os testes ESM/Vercel existentes e não houve deploy.

## Manual Runtime

Execução real iniciada em processo novo, usando credencial Stitch configurada, sem fixtures de provider:

- generationRequestId/designProductionId: `live-e39-cb2c2db9-16a2-4212-a2d7-d1f796ceeb7e`.
- Niche: hair-salon, negócio piloto sem contatos pessoais.
- Persisted strategy: `strategy-v1:0985e7460a6f`.
- Fresh generation: PASS, artifacts mobile e desktop produzidos pelo Stitch real.
- PAIRED: PASS, persistido e consumível; nenhuma simulação de provider no fluxo ao vivo.
- Double preparation: PASS, antes e depois de encerrar o processo produtor.
- Backend restart: PASS em processo novo, novo `createApiApp`, repository e provider recriados.
- `POST /api/ai/sites/standard-ai` após restart: HTTP 200, PAIRED, 3 alternativas, duas preparações idênticas.
- Site generated: YES, `generation.mode=standard-fallback`, fallbackUsed=true. Esse é o fallback preexistente de conteúdo; os artifacts Stitch são reais e foram consumidos corretamente.
- Additional Stitch calls no replay: 0.
- Standard-AI com LLM externo: NOT_AVAILABLE / PROVIDER_BLOCKED por falta de credenciais de conteúdo. Não foi afirmado sucesso de LLM com base no fallback.
- UI visual em navegador: NOT_AVAILABLE nesta execução; o caminho HTTP real foi exercitado.
- Gemini/Groq: credenciais ausentes no ambiente local; não declarar geração LLM validada com fallback.

## Previous Phase Regression

POST-E.3.8 / E.3.7 / E.3.6 / E.3.5 / E.3.4 / E.3.3 / E.3.2 / E.3.1 / D.5: PASS nos testes existentes da suíte. Isso não substitui homologação manual de cada fase histórica.

## Security

- Secrets/env: nenhum segredo ou arquivo de ambiente adicionado; somente `.env.example` já rastreado.
- PII/raw artifacts/runtime jobs: não adicionados ao Git. Inputs persistidos permanecem no armazenamento de runtime já ignorado.
- Raw Zod/local paths: novos erros de preparação usam mensagens seguras; dumps técnicos não são enviados pela função.
- Debug: evidência de paridade limitada ao ambiente não produtivo.
- Result: PASS na revisão das alterações, sem alegação de auditoria completa do repositório.

## Acceptance Matrix

| Bloco | Itens | Resultado |
|---|---|---|
| 79 Artifact API | read não destrutivo; duas leituras; consume destrutivo; runtime sem consume | PASS |
| 80 Test blocker | reproduzido no baseline; raiz provada; teste/produção corrigidos; isolado verde | PASS |
| 81 Strategy | persistida autoritativa; runtime separado; mismatch rejeitado; override seguro | PASS |
| 82 Real consumer | dummy removido; shared preparation; read-only; primeira/segunda execução | PASS |
| 83 Fresh consumer | Map limpo; repository/provider/consumer em novo processo; carga disco | PASS |
| 84 Terminal | persist/reload/prep antes de PAIRED; sobrevivência a processo novo | PASS automatizado |
| 85 Retry | mesmos IDs/strategy/refs; zero Stitch calls; sem duplicação | PASS automatizado |
| 86 Regression | contratos existentes na suíte completa | PASS automatizado |
| 87 Global | targeted/full/TS/lint/builds/Vercel/security | PASS |
| 87 Live | Stitch real, PAIRED e preparação após restart por HTTP | PASS |
| 87 Live LLM | conteúdo por Gemini/Groq, além do fallback existente | PROVIDER_BLOCKED; usuário exige validação real |

# FINAL STATUS

POST-E.3.9 = PARCIAL. IMPLEMENTATION = COMPLETE para os contratos automatizados; HOMOLOGATION = PENDING.

## Remaining Blockers

Validar conteúdo com um LLM real configurado. Stitch real, consumer replay e restart já passaram. O usuário decidiu explicitamente: **"Manter homologação pendente até validar com LLM real"**. Fallback não foi aceito como substituto; não commitar/homologar/congelar enquanto esse gate estiver aberto.

## Commit

Executed: NO. Hash/subject: nenhum commit novo. HEAD permanece o baseline.

## Working Tree

DIRTY, alterações preservadas para revisão. Não foi usado commit para contornar o gate de homologação.

# POST-E.3.9 FROZEN

NO.

## Ready for Next Phase

NO. Nenhuma POST-E.3.10 ou feature nova iniciada.

## Atualização de memória e publicação — 23/09/2026

Este suplemento atualiza o estado do checkpoint acima após a execução real documentada em [STITCH-LIVE-VALIDATION-2026-09-23.md](STITCH-LIVE-VALIDATION-2026-09-23.md). O relato anterior de credenciais LLM ausentes era verdadeiro naquele checkpoint, mas foi superado: o standard-ai real usou Groq `qwen/qwen3.8-27b`, retornou HTTP 200, três alternativas e `fallbackUsed=false`, inclusive após reiniciar o backend.

A homologação total continua **PARCIAL**. A produção Stitch real mais recente terminou `PARTIAL / COHERENCE_FAILED` porque as ordens de seção mobile e desktop divergiram; a rejeição foi preservada corretamente. Essa execução comprova o replay real consumível de PARTIAL com Groq, mas não comprova o gate final de produção `PAIRED` com LLM real nem fidelidade visual pixel a pixel. ComfyUI local também permanece `NOT_AVAILABLE`; Pexels e Pixabay foram validados em chamadas reais. Não declarar E.3.9 homologada ou congelada.

Publicação do código solicitada pelo usuário:

- Commit: `dec852b2c8da040364fee338aa6bf0cb78825d97` (`fix: estabiliza geração Stitch, mídia e editor visual`).
- Parent: `a0323c714f9a6cadbcf214c79a8e6b68a06e4c90`.
- Push: concluído para `origin/main`, sem force push.
- Validação no commit: `npm test` — 323 PASS, 0 FAIL; `npm run lint` — PASS; `npm run build` — PASS para cliente e servidor; `git diff --check` — PASS.
- `.env.local` continua ignorado e não foi publicado. Nenhuma credencial foi incluída.
- A revisão atual corrige o teste responsivo obsoleto do painel de mídia: verifica agora o layout empilhado sem as classes largas antigas.

O suplemento registra o histórico publicado; a decisão de manter a homologação pendente e os limites ao vivo continuam valendo.
