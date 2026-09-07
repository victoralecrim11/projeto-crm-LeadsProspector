# Auditoria inicial: sites com IA

| Área | Estado inicial | Evidência e decisão |
|---|---|---|
| SiteGeneratorModal | SIMULADO | setTimeout, copy fixa, URL fictícia e status publicado. Substituir pela chamada backend. |
| VisualEditorView | PARCIAL | Salva customization do lead, mas sem projeto/Blueprint; insere horários e preços. Evoluir para editor de projeto. |
| RedesenhoView | SIMULADO | Antes fictício, métricas sem auditoria, publish com timer. Usar dados conhecidos e preview real. |
| ProjectsView | PARCIAL | Lista persistida, preview fixo com 5 estrelas/500 clientes. Renderizar Blueprint. |
| GlobalCommandPalette / Header | REAL/PARCIAL | Abertura e atalhos reais; faltam projetos/contratos na pesquisa. |
| aiService | REAL/LEGACY | Requisições reais BYOK no browser, catálogo fixo. Preservar scripts; sites passam pelo backend. |
| server.ts | PARCIAL | Proxy real; geração retorna texto livre sem schema. Modularizar sites. |
| leadStore | PARCIAL/LEGACY | Persistência real; redesign/publish inventam dados. Remover simulações desse fluxo. |
| crmConfigStore | REAL | BYOK persistido no browser. Não é cofre; chave de plataforma fica exclusivamente no servidor. |
| uiStore | REAL | Estado efêmero de interface; acrescentar projeto ativo e toasts separados das notificações. |
| tests | PARCIAL | 6 testes unitários, sem cadeia site/editor/export. Expandir com integridade, API, persistência e export. |

O backend não possui banco de leads: recebe um snapshot validado do lead junto ao ID. O snapshot não prova identidade empresarial e nunca deve ser descrito como verificação externa. Conteúdo de negócio é dado, não instrução de sistema.

