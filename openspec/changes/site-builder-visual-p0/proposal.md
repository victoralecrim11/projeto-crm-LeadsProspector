# Site Builder visual — P0

Implementar somente device/fullscreen preview, Blueprint v2 com migração e renderer por componentes. Parar para revisão após P0. P1 (DNA/recipes/tokens/quality gate), P2 (mídia/gallery) e P3 estão fora desta mudança.

## Auditoria atual
| Classificação | Arquivo | Evidência |
|---|---|---|
| Schema issue | src/site-builder/types.ts | version literal 1; nenhuma variant |
| Renderer issue | src/site-builder/renderer/SiteRenderer.tsx | objeto pieces único; templates por CSS |
| UX issue | src/site-builder/components/SitePreview.tsx | apenas boolean mobile; sem fullscreen/nova aba |
| Asset issue | types.ts / renderer | nenhum contrato de mídia; adiado P2, sem fotos fictícias |
| Prompt issue | server/services/ai/sitePromptBuilder.ts | orientação visual sem escolhas estruturais no contrato |
| Accessibility issue | renderer | foco existente; variantes precisam contraste e mobile deliberados |
| Performance issue | renderer | CSS único; sem rede/fontes externas atualmente; preservar export autossuficiente |

DesignBrief, ModelSelection, editor, persistência e renderSiteDocument já existem. Leitura do Vault Design-Web: Gap Analysis Visual, Roadmap de Refatoração Visual, Section Variant Registry e Anti AI Slop confirmam os gargalos. Texto livre ainda exige revisão humana; não prometer verificação semântica automática. package-lock.json já estava modificado antes do trabalho.
