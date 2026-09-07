# Briefing compacto para sites com IA

## Objetivo

Evoluir o modal **Gerar Site com IA** para receber uma direção visual útil sem aumentar demais a carga do formulário, melhorar o diagnóstico de falhas da geração e decidir com segurança quais integrações avançadas entram nesta entrega.

O termo “qualidade de CEO” do pedido é interpretado nesta especificação como **alto padrão visual, credibilidade executiva e boas práticas de SEO**, e não como uma certificação automática de qualidade.

## Decisão de produto

Será adotado o **Briefing compacto** aprovado no mockup:

- campos principais em duas colunas no desktop e uma coluna no celular;
- template com opção padrão **Deixar a IA decidir**;
- direção de design opcional, recolhida por padrão;
- paleta recomendada, paleta personalizada ou importação segura de tokens;
- estratégia de design calculada e exibida antes de gerar;
- controles avançados de modelo e token separados do briefing visual.

O fluxo completo, com todos os controles sempre expandidos, foi descartado porque torna o modal longo e mistura escolhas obrigatórias com ajustes especializados.

## Modelo de dados

`SitePreferences` passará a aceitar:

- `templateId`: um template existente ou `auto`;
- `designBrief.paletteMode`: `recommended`, `custom` ou `imported`;
- `designBrief.primaryColor` e `accentColor` para modo personalizado;
- `designBrief.designSystemInput` para tokens importados;
- `designBrief.motion`: `subtle`, `cinematic` ou `none`;
- `designBrief.referenceNotes`: texto curto opcional, tratado como dado não confiável.

O Blueprint persistido continuará contendo somente um `templateId` concreto e cores hexadecimais válidas. Projetos antigos permanecem compatíveis.

Tokens importados aceitarão JSON simples ou declarações de variáveis CSS. O parser extrairá apenas nomes de tokens e cores hexadecimais, limitará tamanho e quantidade e rejeitará CSS executável, URLs e conteúdo arbitrário. O texto bruto não será injetado diretamente no site exportado.

## Estratégia de design

O aplicativo não pode executar os arquivos `SKILL.md` do ambiente Codex em produção. Em vez de simular essa capacidade, o backend terá um resolvedor interno e testável de **lentes de design**, inspirado nos mesmos princípios:

- `local-conversion`: contato rápido, clareza e CTA dominante;
- `premium-editorial`: hierarquia sofisticada, respiro e animação cinematográfica com parcimônia;
- `trust-institutional`: credibilidade, conteúdo estruturado e acessibilidade;
- `appointment-flow`: foco em agendamento e redução de atrito.

A lente será escolhida por tipo, objetivo, categoria, estilo e preferência de movimento. Ela orientará template, paleta, hierarquia, densidade e movimento no prompt. Em modo automático, a IA poderá escolher entre os templates permitidos; em modo manual, a escolha do usuário prevalecerá.

## Pesquisa externa, imagens e MCP

Essas integrações não entram como chamadas reais nesta entrega:

- **Pesquisa externa automática:** exige provedor, política de fontes, proteção contra prompt injection, cache, timeout e registro de procedência. Adicionar agora aumentaria latência e risco sem uma camada de referências no Blueprint.
- **Geração de imagens:** exige contrato de assets, armazenamento, limites de custo, consentimento/licença, moderação e inclusão segura no ZIP. Embutir base64 no Blueprint ou depender de URL temporária não é aceitável.
- **MCPs:** a aplicação web atual não possui cliente MCP, sessão de consentimento nem lista confiável de servidores. MCPs deverão ser conectados no backend por adapters permitidos, nunca aceitos como endpoint arbitrário informado pelo navegador.

Nesta entrega, o schema e a UI não fingirão que essas integrações existem. O `PROJECT_SUMMARY` registrará a decisão e os pré-requisitos para uma fase futura de **pesquisa e assets**.

## Diagnóstico e tratamento de erros

Existem duas classes distintas observadas:

1. `Failed to fetch` e repetição de `WebSocket connection to ws://localhost:3000 failed`: o servidor de desenvolvimento estava indisponível; `/api/health` e `/api/ai/models` não aceitaram conexão. O cliente deve informar “Servidor local indisponível” e oferecer nova tentativa. A conexão HMR pertence ao Vite e volta quando o servidor inicia; não será mascarada com resposta falsa.
2. HTTP 502/503 durante `generateContent`: a requisição chegou ao backend, mas o provedor recusou ou estava indisponível. O adapter preservará categorias seguras (`401`, `429`, `502`, `503`, timeout), aplicará retentativa progressiva somente a falhas transitórias e continuará o fallback automático entre modelos.

Mensagens ao usuário não incluirão chaves, payloads do provedor ou detalhes sensíveis. Erros HTTP continuarão usando status não-2xx para não transformar falha em sucesso.

## Token de acesso do servidor

O campo é uma credencial temporária enviada como `Authorization: Bearer ...`. Ele autoriza o navegador a usar `GEMINI_API_KEY` ou `OLLAMA_BASE_URL` mantidos no servidor quando `NODE_ENV=production`.

Não é a chave Gemini, não é persistido pelo aplicativo e normalmente é dispensável no desenvolvimento local. Antes de uma exposição pública, esse token compartilhado deve ser substituído por autenticação individual e autorização por usuário.

## Componentes e fluxo

1. `SiteGeneratorModal` coleta preferências e briefing.
2. Um parser normaliza a paleta/tokens e o resolvedor seleciona a lente de design.
3. O backend monta instruções estruturadas e trata todo conteúdo do lead/briefing como dados não confiáveis.
4. O modelo retorna o Blueprint validado.
5. Em template automático, o template validado do modelo é preservado; em manual, o backend força o escolhido.
6. O editor, a prévia e o ZIP continuam consumindo o mesmo Blueprint.

## Acessibilidade e aparência

- altura visual dos selects e inputs reduzida no desktop, mantendo área de toque adequada no celular;
- labels, foco visível, contraste e estados disabled preservados;
- campos de cor exibem swatch e valor hexadecimal;
- `<details>` usa texto explicativo e não depende apenas de cor;
- mensagens de status usam `role=status` e erros usam `role=alert`;
- movimento “cinemático” respeita `prefers-reduced-motion` e não implica WebGL/3D nesta fase.

## Testes e critérios de aceite

- parser aceita JSON/variáveis CSS válidas e rejeita URLs, CSS arbitrário, excesso e cores inválidas;
- modo automático permite ao Blueprint escolher template; modo manual prevalece;
- a lente escolhida é determinística para as mesmas preferências;
- prompt inclui lente e paleta normalizadas, sem executar instruções importadas;
- falha de rede do backend gera mensagem específica de servidor indisponível;
- respostas 429/503 e timeout do provedor recebem retentativa/fallback; 401 não recebe retentativa;
- testes existentes, TypeScript e build permanecem aprovados;
- `PROJECT_SUMMARY` descreve a entrega e os itens adiados sem declarar integrações inexistentes.

## Fora do escopo

- crawler ou busca web autônoma;
- geração, upload ou armazenamento de imagens;
- renderização 3D/WebGL;
- cliente MCP configurável pelo usuário;
- autenticação multiusuário;
- alterações nos formulários fora do fluxo de sites.
