# Project Builder

Use esta referência para transformar ideias e requisitos em software React, Next.js ou React Native/Expo funcional, incremental e manutenível.

Para mentoria aprofundada, carreira, revisão didática ou explicações arquiteturais longas, use `react-mentor.md`.

## Calibração

Calibre entre Beginner, Junior, Mid-Level e Senior lendo `devLevel` em `dashboard-config.json` via `GET /api/config`.

O nível é definido exclusivamente pelo `/setup`; não repergunte. Se o perfil não existir, aplique o fallback descrito em `./skills/react-dev/references/dashboard-projetos.md`.

O nível ajusta a explicação e o teto de complexidade sugerido, mas a arquitetura deve ser escolhida pelo tamanho real do projeto, regras de negócio, integrações, equipe, testes e expectativa de manutenção.

## Modos

Discovery: use para ideias vagas, requisitos incompletos, produto indefinido ou escopo incerto. Valide objetivo, público, problema, MVP, premissas, riscos, alternativas e viabilidade antes de gerar código.

Product Planner: use para roadmap, backlog, épicos, histórias, milestones, prioridades, dependências e riscos.

Solution Architect: use para stack, estrutura, boundaries, bibliotecas, escalabilidade e trade-offs. Prefira a arquitetura mais simples capaz de resolver o problema.

Project Builder: use para criar aplicações, features, telas, componentes, hooks, APIs, autenticação, integrações e testes. Entregue primeiro a menor versão útil e evolua por incrementos.

Pair Programming: use para trabalhar passo a passo, validar premissas e implementar uma mudança lógica por vez.

Refactoring: use para reduzir complexidade, duplicação e dívida técnica preservando comportamento.

Tutor: use para explicar decisões durante a construção.

Tech Lead: use para direção do projeto, CI/CD, padrões, riscos e decisões de longo prazo.

## Estruturas

Beginner: use em projetos acadêmicos, MVPs simples, portfólio e primeiros apps React Native.

```text
src/
├── components/
├── repositories/
├── screens/
├── theme/
└── types/
```

Junior: adicione `hooks` e `utils` quando houver mais telas, formulários, APIs ou reutilização frequente de lógica.

Mid-Level: adicione `features`, `store` e `shared` quando houver múltiplas funcionalidades, integrações, estado global complexo ou mais de uma pessoa desenvolvendo.

Senior: use domínio, casos de uso, inversão de dependência, modularização avançada, DDD ou Clean Architecture somente quando regras de negócio, equipe e longevidade justificarem.

Pastas devem existir por responsabilidade real. Não crie camadas porque um tutorial usa.

## Responsabilidades

`components`: UI reutilizável, sem regra de negócio e sem chamadas de API.

`screens` ou rotas: coordenam componentes, interação e consumo de hooks/repositories.

`hooks`: lógica stateful reutilizável, sem JSX.

`repositories` ou clients: REST APIs, SQLite, AsyncStorage e persistência, sem UI.

`theme`: cores, tipografia, espaçamento e constantes visuais.

`types`: DTOs, interfaces e modelos TypeScript compartilhados.

`utils`: funções puras como formatadores, máscaras e validadores simples.

`store`: estado global compartilhado e mutável.

`features`: agrupamento por funcionalidade quando o crescimento tornar isso natural.

`shared`: recursos compartilhados entre features quando duplicação começar a aparecer.

## Fluxo de entrega

1. Objetivo e premissas.
2. Requisitos e escopo do MVP.
3. Solução e arquivos envolvidos.
4. Plano de implementação.
5. Implementação TypeScript.
6. Verificação de comportamento, tipos, erros, loading, vazio e acessibilidade.
7. Justificativa técnica breve.
8. Próximos passos e registro no dashboard quando aplicável.

## Regras

Para ideias vagas, não codifique antes de validar objetivo, público, MVP, premissas, riscos e viabilidade.

Para implementação, priorize MVP funcional, estrutura clara, código manutenível e boas práticas. Depois considere refatoração, escalabilidade e arquitetura avançada.

Para recomendações de biblioteca, padrão, ferramenta ou arquitetura, explique motivo, alternativas, trade-offs e quando não usar.

Para reviews, avalie tipagem, tratamento de erro, loading, estados vazios, acessibilidade, nomes, responsabilidades, segurança, re-renderizações, cache, bundle e testes. Não refatore por preferência pessoal.

