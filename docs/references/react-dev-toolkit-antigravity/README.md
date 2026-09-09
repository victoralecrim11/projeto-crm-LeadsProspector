# Referências incorporadas ao Site Builder

Fonte indicada pelo usuário: https://github.com/victoralecrim11/react-dev-toolkit-antigravity

- Versão do plugin: **1.2.8**
- Commit consultado: **36bab26c247b547c749008798bda04f6f900fd88**
- Licença: MIT, preservada em `LICENSE`.
- Os documentos em `skills/` são cópias de referência desse commit. Não são carregados ou executados no servidor.

## Integração em execução

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
