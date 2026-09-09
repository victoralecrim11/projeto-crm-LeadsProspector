# Fase A — Fundação e validação da infraestrutura

Data: 2026-09-08. Escopo limitado à Fase A aprovada. Fase B não iniciada.

## Obsidian — VALIDADO: READ_WRITE

Vault: `C:/Users/victor.alecrim/Documents/victor/Desenvolvimento/Obsidian Vaults`.
Integração utilizada: ObsidianMCP. Diretórios e arquivos foram efetivamente listados/lidos.

| Nota isolada | Operação | Status | Evidência |
| --- | --- | --- | --- |
| `prospector-fase-a-access-check-20260908-01a08167.md` | CREATED | SUCCESS | vault_write retornou OK; releitura mostrou CREATED |
| mesma nota | UPDATED | SUCCESS | vault_write retornou OK; releitura mostrou UPDATED e novo mtime |
| mesma nota | REMOVED_TO_TRASH | SUCCESS | vault_delete(permanent=false) retornou OK; listagem confirmou ausência |
| notas relevantes/históricas | UNCHANGED | SUCCESS | Nenhuma escrita realizada |

Criação, atualização e leitura após ambas as escritas comprovadas. A remoção usa a lixeira configurada do Obsidian; não se afirma exclusão permanente.

## Antigravity — PARCIALMENTE VALIDADO

- CLI 1.1.27; chamada mínima retornou `AUTH_OK`, status SUCCESS. Autenticação comprovada nesta chamada.
- Desktop 2.11.0 e IDE 2.5.5 detectados na auditoria anterior. Autenticação da IDE não foi comprovada separadamente e não é inferida da CLI.
- Pedido de invocar apenas subagente já existente retornou que estava aguardando resultado. Isso NÃO comprova conclusão operacional.
- Retomada da conversa foi rejeitada pela revisão automática de aprovação por risco de reenviar contexto potencialmente sensível a serviço externo. Não foi contornada.
- Custom Agents/Subagents: formato documentado; execução completa NÃO VALIDADA. Nenhum arquivo/definição de agente criado nesta fase.
- Formato definido para uma futura implementação: `.agents/agents/<nome>/agent.md`, Markdown com frontmatter YAML (`name`, `description`, permissões explícitas de `tools`, `mainAgent`/`subagent`). Bundles poderão usar `agents/<nome>/agent.md`. Escolha de ferramentas precisa de confirmação na instalação em execução.
- Fonte: https://www.antigravity.google/docs/subagents/ . Suporte documental não equivale à homologação operacional de cada superfície/plano.

## React Dev Toolkit — comparação local efetiva

Global inspecionado: `C:/Users/victor.alecrim/.gemini/config/plugins/plugin-react-dev-toolkit`, versão 1.2.6, commit `257eb836195aeea581b5087cb7c23334e3d133aa`.
Referência: `scratch/react-dev-toolkit-antigravity`, versão 1.2.8, commit `36bab26c247b547c749008798bda04f6f900fd88`.
Comparação de arquivos ignora apenas `.git` e diferenças CRLF/LF. Não é uma suposição baseada apenas no changelog.

| Arquivo | Diferença 1.2.6 → snapshot 1.2.8 | Impacto neste projeto |
| --- | --- | --- |
| `plugin.json` | Nome e versão | Não atualiza automaticamente a Guidance incorporada |
| `README.md`, `manual.html` | Documentação, identificação e manual | Consultar formato correspondente à instalação |
| `scripts/atualizar-plugin.ps1`, `.sh` | Nome padrão passa a react-dev-toolkit-antigravity | Atualização deve considerar mudança de identidade; não executar cegamente |
| `scripts/bump-version.py` | Ajuste da expressão de identificação do índice | Processo de release; sem efeito no CRM |
| `skills/arquitetura/SKILL.md` | Orienta execução do analisador | Útil para auditorias futuras |
| `skills/arquitetura/scripts/analyze-architecture.py` | Novo analisador | Ferramenta de desenvolvimento; não necessária ao runtime |
| `skills/qa-engineer/SKILL.md` | Nova skill de QA | Útil para revisão; não equivale a novos testes no CRM |
| `skills/ui-ux/scripts/search-uiux.py` | Busca por relevância, domínio automático, JSON e interpretação de condições; compatibilidade com modo anterior | Pode ajudar a pesquisar famílias na Fase B; não é chamado pelo CRM |
| `skills/react-dev/references/project-hub/dashboard-server.py` | Renomear projeto atualiza referências de componentes e reviews | Corrige consistência de registros no Hub; sem efeito no Site Builder |
| `skills/react-dev/references/project-hub/dashboard-template.html` | Interface do Hub ampliada | Afeta painel de desenvolvimento, não páginas geradas |

Os demais arquivos comuns comparados, incluindo `mcp_config.json`, regras de segurança/TypeScript e referências centrais, não diferem após normalizar fins de linha. Nenhum arquivo removido no snapshot comparado. A distribuição Codex 1.5.5 é outro pacote e não foi usada como versão equivalente.

**Recomendação:** manter global 1.2.6 temporariamente durante a Fase A e manter o snapshot 1.2.8 já utilizado pelo projeto. Instalação local adicional não traz benefício imediato ao runtime. Antes da Fase B, considerar atualização global controlada para o pacote Antigravity, após aprovação e verificação do nome/registro e configurações. Nenhuma atualização ou instalação foi executada.

## Implementação

Contratos independentes: BusinessContext, ReferenceBrief, DesignSpecification, DesignTokens e MediaPlan em `src/site-builder/contracts/index.ts`.

Não se alteraram schemas Blueprint v1/v2, payloads do provider, prompts, armazenamento de projetos, revisão ou export. Os contratos não prometem pipelines ainda ausentes. A apresentação atual foi extraída para `guidance/design-families/legacy-default.ts`; o caminho anterior reexporta a interface existente.

Estrutura:

```text
src/site-builder/guidance/
  README.md
  index.ts
  reactToolkit.ts                   [preservado]
  foundations/index.ts
  niches/index.ts                   [sem regras pesquisadas]
  design-families/legacy-default.ts
  generation/index.ts               [capacidades declaradas, não executadas]
  quality/index.ts
```

## Validações

- `npm run lint`: PASS; verificação geral e strict ampliado aos novos contratos/Guidance. O restante do projeto não foi convertido integralmente para strict.
- `npm test`: PASS, 69 testes, zero falhas.
- `npm run build`: PASS, frontend e backend.
- Compatibilidade: 40 combinações de v1/v2, quatro templates, apresentação ausente ou explícita, temas, tipografias e movimento. HTML/CSS idênticos aos hashes capturados antes da extração.
- Persistência/migração v1 → v2: testes existentes passaram; adaptação de DesignSpecification não modifica entradas.
- Preview/export: testes de equivalência com renderer compartilhado, conteúdo do ZIP e revisão obrigatória passaram.
- ZIP real de fixture fictícia criado e extraído em `scratch/phase-a-export/` (ignorado pelo Git). Documento abriu no navegador; mobile 390 px sem overflow horizontal, aparência conferida por screenshot, CTA navegou para `#contact`. Inspeção desktop 1440 px realizada.
- Não foi homologado novamente fullscreen/Blob no browser: mantém a limitação da ferramenta documentada anteriormente. Não se afirma um novo E2E completo da interface de edição.
- Build mantém avisos de anotações Zod, imports mistos de leadStore e chunks grandes. Não houve erro de compilação nem regressão de conteúdo detectada.

## Changelog desta fase

| Arquivo | Operação | Validação |
| --- | --- | --- |
| `src/site-builder/contracts/index.ts` | CREATED | strict + schemas/testes |
| `src/site-builder/guidance/index.ts` | CREATED | strict + composição do catálogo |
| `src/site-builder/guidance/README.md` | CREATED | documentação dos contratos e precedência |
| `src/site-builder/guidance/foundations/index.ts` | CREATED | adaptador testado |
| `src/site-builder/guidance/niches/index.ts` | CREATED | ausência de classificação declarada |
| `src/site-builder/guidance/design-families/legacy-default.ts` | CREATED / conteúdo de apresentação extraído | hashes de 40 documentos |
| `src/site-builder/guidance/generation/index.ts` | CREATED | escopo não implementado explícito |
| `src/site-builder/guidance/quality/index.ts` | CREATED | critérios da fundação |
| `src/site-builder/renderer/presentation.ts` | UPDATED | fachada compatível, sem alteração visual |
| `tsconfig.react-plugin.json` | UPDATED | strict dos novos módulos |
| `tests/services/siteFoundation.test.ts` | CREATED | quatro novos testes |
| `tests/fixtures/phaseARenderBaseline.json` | CREATED | captura anterior à mudança |
| `docs/reviews/phase-a/RELATORIO.md` | CREATED | relatório desta fase |
| `.design/design-system.md` | UPDATED | localização canônica da apresentação |
| `reactToolkit.ts`, Blueprint, notas históricas, plugins/configurações | UNCHANGED | preservados nesta fase |

Arquivos permanentes criados: 11. Arquivos existentes atualizados: 3. Artefatos temporários de teste adicionais: nota removida para lixeira; ZIP/HTML em scratch ignorado. Alterações anteriores do repositório foram preservadas. Sem imagens, Stitch, nova pesquisa por nicho ou Custom Agents.

## Riscos e proposta para Fase B — NÃO INICIADA

1. Escolher dois nichos piloto e critérios de conversão. Pesquisa comparativa com 3–5 referências por nicho, URLs/datas/motivos, sem copiar textos, identidade ou assets.
2. Implementar persistência e validade do ReferenceBrief por nicho/contexto/versão; limite de fontes, timeout, política de URLs e isolamento de instruções externas antes de automatizar pesquisa.
3. Definir duas Design Families com DESIGN.md, tokens e composição próprios; adaptar consumo dos tokens incrementalmente e preservar legacy-default como fallback.
4. Validar acesso/autenticação Stitch antes de chamadas; explorar variantes apenas no modo Premium, mantendo Standard sem dependência externa. Sem prometer integração antes do teste real.
5. Validar desktop/tablet/mobile, contraste, equivalência preview/export e migração com fixtures. Comparar famílias com critérios observáveis, não apenas nomes diferentes.
6. Decidir separadamente sobre atualizar o plugin global. Retomar validação bloqueada do Antigravity somente com aprovação específica para a chamada externa.

Riscos atuais: tokens descrevem apenas parte da apresentação legada; não há storage de novos sidecars nem consumo arbitrário de tokens no renderer; validação sintática de URLs não protege sozinha contra SSRF; IDE e subagentes não homologados; integrações de pesquisa/Stitch/mídia seguem ausentes. Novos contratos exigirão migração explícita quando integrados aos projetos.

PARADA: aguardar aprovação antes de iniciar a Fase B.
