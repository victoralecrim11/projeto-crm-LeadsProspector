# React Core

Use em qualquer projeto React web, Next.js ou React Native. Priorize aprendizagem, entrega e manutenção; adapte a explicação ao nível do desenvolvedor.

## Regras

- TypeScript estrito é obrigatório; tipar props, retornos públicos, DTOs e estados.
- Use componentes funcionais e Hooks. Nunca introduza class components ou APIs legadas.
- Estado local fica no componente; Context serve para dependências globais estáveis; Zustand é indicado para estado global compartilhado e mutável; TanStack Query gerencia cache, loading, erro e sincronização de dados remotos.
- Não use Zustand para dados remotos nem Redux sem uma justificativa concreta.
- Acesse APIs por clients/repositories; telas coordenam a UI, hooks encapsulam lógica reutilizável e componentes não carregam regra de negócio.

## Hooks

Use `useState` para estado local simples, `useEffect` para efeitos externos e sincronização, `useContext` para dependências globais estáveis, `useRef` para referências persistentes que não disparam render, `useMemo` para cálculos caros, `useCallback` para callbacks estáveis quando isso evita renderizações relevantes, `useReducer` para estado local com transições complexas, `useLayoutEffect` apenas quando a medição ou ajuste visual precisa acontecer antes da pintura, `useImperativeHandle` raramente para expor uma API controlada via ref, e `useId` para acessibilidade e IDs estáveis.

Crie custom hooks quando a lógica stateful se repetir ou quando separar lógica melhorar leitura e teste. Não esconda regra de negócio complexa em hooks genéricos demais.

## Implementação de UI

- **Componentização e Variantes:** Estruture variações de componentes de UI utilizando `class-variance-authority` (CVA). Em projetos com Tailwind CSS, previna colisões de especificidade encapsulando a união de classes num utilitário padronizado, como `cn()` (combinando `clsx` e `tailwind-merge`).
- **Grid vs Flexbox:** Adote Flexbox como padrão primário para alinhamentos unidirecionais (barras de navegação, pilhas, centralização). Reserve CSS Grid estritamente para layouts bidirecionais modulares ou estruturas de alta precisão. Utilize a propriedade `gap` para espaçamento em vez de aplicar margens diretamente nos nós filhos.
- **Animações e Microinterações:** No ecossistema web (React/Next.js), utilize Framer Motion para orquestrar transições de estado, layout e gestos. Em React Native, aplique exclusivamente o React Native Reanimated para garantir a execução matemática nativa fora da thread do JS. Ambas as plataformas devem condicionar as animações às preferências do sistema operacional (`prefers-reduced-motion`).

## Evolução de pastas

O nível de calibração vem de `devLevel` em `dashboard-config.json`, gravado exclusivamente pelo `/setup`. Leia-o em vez de perguntar.

Beginner: `src/{components,screens,repositories,theme,types}`. Junior adiciona `hooks` e `utils`. Mid-Level organiza `features`, `store` e `shared`. Senior só adota domínio/casos de uso quando regras, equipe e longevidade justificarem.

Sempre explique: por que a escolha atende ao caso, alternativa, trade-off e quando evitá-la. Antes de propor arquitetura avançada, entregue um MVP funcional.