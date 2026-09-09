# Design Routing — Handoff Técnico

Especificação do Handoff Técnico (passo 4 do Fluxo de Operação). Este documento define **o que** a skill `ui-ux` deve entregar e **como** as skills técnicas (`react-dev`, `criar-projeto`, `criar-componente`) devem consumir.

## 1. Artefato de Saída

A skill `ui-ux` **DEVE** gravar o seguinte arquivo na raiz do projeto do usuário:

```
<projeto>/
└── .design/
    └── design-system.md
```

Este arquivo é a **única fonte de verdade** para tokens de design do projeto. As skills técnicas devem lê-lo antes de implementar qualquer interface.

## 2. Estrutura do `.design/design-system.md`

Use exatamente este template, preenchendo com os dados coletados nos passos 1–3:

```markdown
# Design System — [Nome do Projeto]

> Gerado pela skill `ui-ux` em [data]. Não edite manualmente — regenere via skill.

## Produto & Contexto
- **Nicho:** [ex: SaaS B2B]
- **Público-alvo:** [ex: gestores de equipes de tecnologia]
- **Objetivo de negócio:** [ex: converter trials em assinaturas]

## Estilo Visual
- **Estilo primário:** [ex: Glassmorphism + Flat Design]
- **Estilos secundários:** [ex: Minimalism & Swiss Style]
- **Modo preferido:** [auto | light | dark]
- **Era/Complexidade:** [ex: 2020s Modern / Medium]

## Paleta de Cores
| Token | Hex | Sobre |
|:--|:--|:--|
| Primary | [#hex] | [On Primary #hex] |
| Secondary | [#hex] | [On Secondary #hex] |
| Accent | [#hex] | [On Accent #hex] |
| Background | [#hex] | Foreground [#hex] |
| Card | [#hex] | Card Foreground [#hex] |
| Muted | [#hex] | Muted Foreground [#hex] |
| Border | [#hex] | — |
| Destructive | [#hex] | On Destructive [#hex] |
| Ring | [#hex] | — |

## Tipografia
- **Heading:** [fonte] ([categoria])
- **Body:** [fonte] ([categoria])
- **Google Fonts URL:** `[url]`
- **CSS Import:** `[import]`
- **Tailwind Config:** `[config snippet]`

## Padrão de Interface (Reasoning)
- **Layout recomendado:** [ex: Hero + Features + CTA]
- **Dashboard style:** [se aplicável]
- **Efeitos & Animação:** [ex: Subtle hover 200-250ms, smooth transitions]
- **Decision Rules:** [regras condicionais do ui-reasoning.csv]

## Evitar (Anti-padrões)
- [anti-padrão 1]
- [anti-padrão 2]

## Acessibilidade
- **Contraste mínimo:** [AA ou AAA]
- **Contraste Primary/OnPrimary:** [ratio calculado]
- **Foco visível:** [estratégia]
- **Redução de movimento:** respeitada via `prefers-reduced-motion`

## Responsividade
- **Abordagem:** mobile-first
- **Breakpoints:** [conforme responsive-design.md]

## Implementação
- **Framework CSS:** [Tailwind CSS | styled-components | CSS Modules | StyleSheet]
- **Component library:** [shadcn/ui | Radix | nenhuma]
- **Design System Variables (CSS custom properties):**
  ```css
  :root {
    --primary: [#hex];
    --on-primary: [#hex];
    --secondary: [#hex];
    --on-secondary: [#hex];
    --accent: [#hex];
    --on-accent: [#hex];
    --background: [#hex];
    --foreground: [#hex];
    --card: [#hex];
    --card-foreground: [#hex];
    --muted: [#hex];
    --muted-foreground: [#hex];
    --border: [#hex];
    --destructive: [#hex];
    --on-destructive: [#hex];
    --ring: [#hex];
    --radius: [valor do estilo];
    --font-heading: '[fonte]', [fallback];
    --font-body: '[fonte]', [fallback];
  }
  ```
```

## 3. Mapeamento de Tokens por Framework

Quando a skill `react-dev` ou `criar-projeto` consumir o design system, use este mapeamento:

### Tailwind CSS (v3+)
Os tokens do design system devem ser mapeados em `tailwind.config.js > theme.extend.colors` e `theme.extend.fontFamily`. Se o projeto usar **shadcn/ui**, os tokens já seguem o padrão de CSS custom properties acima.

### styled-components / CSS Modules
Exporte os tokens como objeto JS em `src/styles/tokens.ts` ou use as CSS custom properties diretamente.

### React Native StyleSheet
Mapeie para um arquivo `src/theme/tokens.ts` com constantes tipadas:
```typescript
export const colors = {
  primary: '#hex',
  onPrimary: '#hex',
  // ...
} as const;

export const fonts = {
  heading: 'FontName-Bold',
  body: 'FontName-Regular',
} as const;
```

## 4. Checklist de Validação (antes do Handoff)

Antes de salvar o `.design/design-system.md`, a skill `ui-ux` deve confirmar:

- [ ] Todos os tokens de cor estão preenchidos (sem `[#hex]` placeholder)
- [ ] Contraste AA calculado e registrado para pares primários
- [ ] Par de fontes validado com URL do Google Fonts funcional
- [ ] Anti-padrões documentados
- [ ] Seção de implementação preenchida conforme a stack do projeto
- [ ] Breakpoints definidos conforme `responsive-design.md`

## 5. Fluxo de Consumo pelas Skills Técnicas

```
ui-ux (gera)
    └── .design/design-system.md
            │
            ├── criar-projeto (lê para scaffolding de tema)
            ├── criar-componente (lê para tokens e estados visuais)
            ├── review (valida aderência)
            ├── analisar-projeto-gsd (checa tokens vs spec)
            ├── gerar-midia (extrai paleta e estética)
            └── arquitetura (garante desacoplamento de tokens)
```

Se o arquivo `.design/design-system.md` **não existir**, as skills devem fazer fallback para consulta direta via `python skills/ui-ux/scripts/search-uiux.py` nos CSVs.
