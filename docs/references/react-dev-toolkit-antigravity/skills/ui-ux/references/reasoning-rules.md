# Reasoning Rules — Motor de Raciocínio UI/UX

Regras de cruzamento de dados para o passo 3 do Fluxo de Operação (Reasoning Engine). Consulte este documento após obter resultados de `search-uiux.py "<termo>" --domain reasoning`.

## 1. Contraste WCAG por Estilo Visual

Nem todo estilo visual atinge automaticamente os requisitos de contraste. Aplique estas regras de adequação:

| Estilo | Risco de Contraste | Ação Obrigatória |
|:--|:--|:--|
| Minimalism & Swiss Style | Baixo | Manter — design já favorece alto contraste |
| Neumorphism | **Alto** | Validar WCAG AA (4.5:1 texto, 3:1 UI). Sombras suaves tendem a reduzir percepção de borda. Usar bordas sutis como fallback |
| Glassmorphism | **Alto** | Texto sobre blur exige sombra de texto ou background semi-opaco. Validar contraste em ambos os modos |
| Flat Design | Baixo | Cores sólidas facilitam contraste — apenas verificar pares primary/onPrimary |
| Dark Mode Pro | Médio | Evitar branco puro (#FFF) sobre fundo escuro — preferir #E0E0E0 a #F5F5F5 para reduzir fadiga |
| Brutalismo | Baixo | Contraste extremo é intrínseco ao estilo |
| Soft UI Evolution | **Alto** | Similar ao Neumorphism — validar bordas e estados de foco |

**Regra:** Quando o estilo escolhido tem risco Alto, a skill **DEVE** calcular o contraste dos pares de cor (use a fórmula do `accessibility.md` §4) e ajustar a paleta antes de salvar o design system.

## 2. Cross-Reference entre Datasets

O domínio `reasoning` (`ui-reasoning.csv`) contém colunas que conectam diretamente a outros datasets:

| Coluna em `ui-reasoning.csv` | Dataset relacionado | Como cruzar |
|:--|:--|:--|
| `Style_Priority` | `styles.csv` → `Style Category` | Buscar o estilo por nome e extrair `CSS/Technical Keywords`, `Implementation Checklist` e `Design System Variables` |
| `Color_Mood` | `colors.csv` → `Product Type` | Filtrar a paleta pelo `Product Type` mais próximo e extrair tokens semânticos (Primary, Secondary, Accent, etc.) |
| `Typography_Mood` | `typography.csv` → `Mood/Style Keywords` | Buscar o par de fontes cujas keywords combinem com o mood retornado |
| `Anti_Patterns` | — | Anti-padrões são textuais e NÃO devem ser ignorados. Inclua-os como seção "Evitar" no design system |

## 3. Light Mode vs Dark Mode por Categoria

Regras de decisão extraídas dos campos `Preferred Mode` (styles.csv) e `Light Mode ✓` / `Dark Mode ✓`:

- **Auto (padrão do sistema):** Quando o estilo suporta ambos igualmente, ofereça ambos e defina `prefers-color-scheme` como default.
- **Light Mode preferido:** Produtos corporativos, SaaS B2B, dashboards de dados, e-commerce.
- **Dark Mode preferido:** Ferramentas de dev, apps de mídia/entretenimento, editores de código, apps de música/vídeo.
- **Conflito:** Se o nicho pede Light mas o estilo só tem Dark (`Dark Mode ✓` = supported, `Light Mode ✓` = conditional), documente a limitação e sugira adaptação no design system.

## 4. Resolução de Conflitos

Quando dois critérios se opõem, aplique esta ordem de precedência:

1. **Acessibilidade** (WCAG AA mínimo) — nunca é negociável
2. **Usabilidade** (UX Guidelines) — padrões de navegação, hierarquia de CTA, estados de interação
3. **Estilo Visual** — pode ser flexibilizado para acomodar os dois acima
4. **Preferência do usuário** — se o usuário insistir em um estilo que viola acessibilidade, documente o risco no design system e peça confirmação explícita

## 5. Regras de Composição

Ao consolidar as decisões para o Handoff (passo 4), verifique:

- [ ] Paleta de cores tem contraste AA em todos os pares `primary/onPrimary`, `secondary/onSecondary`, `accent/onAccent`
- [ ] Par de fontes é servido via Google Fonts (URL presente em `typography.csv`)
- [ ] O estilo escolhido tem `status: active` em `styles.csv` (estilos deprecated não devem ser usados)
- [ ] Anti-padrões do `reasoning` estão listados como "Evitar" no design system
- [ ] Se o produto tem `Dashboard Style` em `products.csv`, o design system inclui seção de layout de dashboard
- [ ] Regras de `responsive-design.md` (breakpoints, mobile-first) foram consideradas
- [ ] Regras de `accessibility.md` (foco, leitor de tela, redução de movimento) foram aplicadas
