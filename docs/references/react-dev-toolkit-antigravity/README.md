# React Dev Toolkit Antigravity

Este repositório contém uma vendorização local de um subconjunto selecionado das diretrizes (guidance) do React Dev Toolkit, utilizadas pelo ProspectorCRM para moldar o raciocínio da IA durante a geração de sites (Site Builder).

## Origem e Snapshot

- **Plugin:** `react-dev-toolkit-antigravity`
- **Versão Integrada:** 1.3.3
- **Commit Referenciado:** 3dabf36a9826a80d4b6f2404ed58295cb9557f6a
- **Modo de Snapshot:** CURATED GUIDANCE SNAPSHOT

O CRM copia estrategicamente os documentos de diretrizes fundamentais:
- `skills/react-dev/references/react-core.md`
- `skills/react-dev/references/project-builder.md`
- `skills/ui-ux/references/accessibility.md`
- `skills/ui-ux/references/responsive-design.md`
- `skills/ui-ux/references/design-routing.md`
- `skills/ui-ux/references/reasoning-rules.md`

**IMPORTANTE:**
- `integrationMode`: `guidance-snapshot`
- `runtimeAgents`: `false`
- `runtimeMcp`: `false`

Os subagents, scripts de runtime (`subagent-runtime.js`) e configurações MCP (`mcp_config.json`) presentes no repositório original (v1.3.x) **não são clonados nem executados** pelo ProspectorCRM no ambiente de produção. Eles permanecem como ferramentas exclusivas de desenvolvimento (development tooling) e não integram a pipeline de site-builder da Fase B.
`src/site-builder/guidance/reactToolkit.ts` contém a adaptação versionada: regras de engenharia, regras de design e descrições dos componentes realmente disponíveis. `buildSitePrompt()` inclui essa orientação em todas as gerações e regenerações. A metadata `generation.guidance` registra perfil, versão da fonte e commit para rastreabilidade.

O catálogo descreve hero, about, services, contact, location, navigation e footer, incluindo comportamento mobile. Um teste compara suas chaves com o registry do renderer para evitar orientar a IA a usar componentes inexistentes. O schema continua limitando o resultado a Blueprint v2.

Como aplicação concreta da separação de responsabilidades, `contactLinks.ts` centraliza as regras dos canais confirmados e do CTA; os componentes apenas apresentam esses links. A integração possui verificação TypeScript estrita em `tsconfig.react-plugin.json`, executada por `npm run lint`. Isso não significa que o repositório inteiro tenha sido migrado para strict.

## Adaptações deliberadas

| Referência | Aplicação no projeto |
|---|---|
| React Core / Project Builder | Componentes funcionais, tipos, catálogo reutilizável, regra de negócio fora do JSX |
| Design Routing | Handoff registrado em `.design/design-system.md`; Blueprint é o contrato por site |
| Reasoning Rules | Composição coerente, superfícies legíveis e estilo subordinado à usabilidade |
| Responsive Design | Descrições mobile por variante; sem prometer hamburger ou carrossel inexistentes |
| Accessibility | HTML semântico, foco, contraste e reduced motion preservados |

O upstream recomenda CVA e Framer Motion. Não foram introduzidos no export estático: o registry já resolve variantes e o documento exportado usa CSS sem runtime JavaScript. A sugestão de fontes externas foi adaptada a fontes locais para preservar o ZIP autossuficiente.

Não foram instalados MCPs, serviços de mídia, ferramentas de deploy ou comandos do Antigravity no CRM. O projeto incorpora conhecimento adaptado, não executa o plugin Antigravity como motor. Não há sincronização automática com GitHub: atualizações exigem revisar a nova referência, adaptar o perfil, atualizar o commit e rodar testes.

## Verificação

Testes cobrem envio da orientação ao provider em geração e regeneração, provenance na metadata, correspondência catálogo/registry, ausência de canais inventados, export e compatibilidade v1/v2. As chamadas de IA nesses testes são simuladas; não foi feita geração paga para medir ganho visual do modelo.
