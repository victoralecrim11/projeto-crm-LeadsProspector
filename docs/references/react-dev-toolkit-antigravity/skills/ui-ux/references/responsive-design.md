# Estratégia de Design Responsivo e Multiplataforma

Este documento orienta a skill `ui-ux` e o `project-builder` na estruturação de layouts adaptáveis, garantindo consistência visual, acessibilidade e usabilidade em telas **mobile, tablet, desktop e monitores ultrawide**, para aplicações Web e Mobile.

---

## 1. Filosofia: Mobile-First

### 1.1. Evolução Progressiva

Sempre projete e raciocine primeiro na viewport compacta (**mobile**).

O fluxo principal deve funcionar corretamente com espaço restrito. A partir disso, expanda progressivamente a interface para telas maiores.

O desenvolvimento deve seguir, sempre que possível:

```text
Mobile → Tablet → Desktop → Ultrawide
```

### 1.2. Evite Desktop-Centric Degradation

Não desenvolva primeiro uma interface desktop densa para depois tentar adaptá-la para dispositivos móveis.

Essa abordagem frequentemente causa:

- Retrabalho de layout.
- Componentes comprimidos.
- Textos cortados.
- Scroll horizontal desnecessário.
- Botões pequenos.
- Navegação ruim.
- Problemas de hierarquia visual.
- Experiência inconsistente entre dispositivos.

> **Regra:** o mobile não deve ser uma versão "espremida" do desktop. Ele deve ser tratado como uma experiência própria, que evolui naturalmente para telas maiores.

---

## 2. Breakpoints Padrão (Web / Next.js)

Utilize uma escala consistente e alinhada ao padrão do **Tailwind CSS** e de frameworks modernos.

| Breakpoint | Viewport Min | Aparelhos Típicos | Comportamento Recomendado |
|---|---:|---|---|
| **`xs` / base** | `< 640px` | Smartphones verticais | Layout em coluna única, menu hambúrguer ou bottom nav, cards full-width. |
| **`sm`** | `≥ 640px` | Smartphones horizontais, phablets | 1 a 2 colunas, grids simplificados, paddings laterais de aproximadamente 16px. |
| **`md`** | `≥ 768px` | Tablets verticais | 2 a 3 colunas, modais centralizados, sidebars recolhíveis. |
| **`lg`** | `≥ 1024px` | Tablets horizontais, laptops | 3 a 4 colunas, navegação horizontal aberta ou sidebar fixa. |
| **`xl`** | `≥ 1280px` | Desktops padrão | Layout completo, container com largura máxima contida (`max-w-7xl`). |
| **`2xl`** | `≥ 1536px` | Monitores ultrawide | Manter margens automáticas (`mx-auto`) e limitar a largura do conteúdo para evitar linhas de leitura excessivamente longas. |

### 2.1. Regras para Breakpoints

Breakpoints devem ser utilizados quando o **conteúdo precisar se adaptar**, e não apenas para atingir dimensões específicas de dispositivos.

Evite criar breakpoints excessivos como:

```text
375px
412px
430px
540px
600px
700px
```

Prefira os breakpoints existentes no sistema de design sempre que eles forem suficientes.

> **Regra:** crie um novo breakpoint apenas quando houver uma necessidade real de composição ou comportamento.

---

## 3. Estruturação Web (React & Next.js)

### 3.1. Tipografia Fluida e Escala Modular

Evite utilizar tamanhos rígidos em pixels para títulos grandes.

Sempre que apropriado, utilize `clamp()` ou classes responsivas para permitir que a tipografia se adapte ao tamanho da viewport.

Exemplo:

```css
.hero-title {
  font-size: clamp(1.75rem, 4vw + 1rem, 3rem);
}
```

Com `clamp()`, a fonte possui:

```text
tamanho mínimo → tamanho fluido → tamanho máximo
```

Isso evita títulos excessivamente grandes em telas pequenas ou pequenos demais em telas grandes.

### 3.2. Comprimento das Linhas

Limite o comprimento das linhas de leitura a aproximadamente **60–75 caracteres**.

Para conteúdos textuais, utilize uma largura máxima adequada:

```tsx
<p className="max-w-prose">
  Conteúdo textual...
</p>
```

Isso melhora significativamente a legibilidade em telas largas.

### 3.3. Grids e Flexbox Adaptativos

Prefira layouts que possam se reorganizar naturalmente.

Exemplo:

```tsx
<div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
  {/* Cards de produto / dashboard */}
</div>
```

Quando os itens puderem se organizar automaticamente, considere CSS Grid com `auto-fit` ou `auto-fill`:

```css
.cards-grid {
  display: grid;
  grid-template-columns: repeat(
    auto-fit,
    minmax(280px, 1fr)
  );
  gap: 1.5rem;
}
```

### 3.4. Evite Larguras Rígidas

Evite:

```css
width: 1200px;
```

Prefira:

```css
width: 100%;
max-width: 1200px;
margin-inline: auto;
```

Ou, utilizando Tailwind:

```tsx
<div className="mx-auto w-full max-w-7xl">
  ...
</div>
```

### 3.5. Containers

Utilize containers para impedir que o conteúdo se espalhe indefinidamente em monitores grandes.

Exemplo:

```tsx
<main className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
  ...
</main>
```

A largura máxima deve ser determinada de acordo com o conteúdo e não apenas pelo tamanho da tela.

---

## 4. Imagens e Mídia Responsiva

Imagens devem se adaptar ao tamanho disponível sem causar distorções ou carregar arquivos maiores que o necessário.

### 4.1. Next.js

No Next.js, utilize preferencialmente o componente `next/image`.

Defina `sizes` corretamente para que o navegador possa escolher uma imagem adequada ao espaço ocupado.

```tsx
import Image from "next/image";

<Image
  src="/hero.webp"
  alt="Visão geral da plataforma"
  fill
  className="rounded-xl object-cover"
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
/>
```

### 4.2. Aspect Ratio

Quando apropriado, utilize `aspect-ratio` para evitar mudanças bruscas de layout enquanto a mídia é carregada.

Exemplo:

```tsx
<div className="aspect-video overflow-hidden rounded-xl">
  <Image
    src="/dashboard.webp"
    alt="Dashboard da aplicação"
    fill
    className="object-cover"
  />
</div>
```

### 4.3. Imagens Decorativas

Imagens puramente decorativas não devem competir com o conteúdo principal.

Quando não possuírem valor informacional, devem ser ocultadas das tecnologias assistivas conforme as diretrizes de acessibilidade.

---

## 5. Responsividade no Mobile (React Native)

No mobile nativo, a adaptação não depende apenas do tamanho da tela.

Também devem ser considerados:

- Orientação (`Portrait` / `Landscape`).
- Densidade de pixels.
- Safe areas.
- Entalhes.
- Dynamic Island.
- Barras de navegação.
- Teclado virtual.
- Escalonamento de fontes.
- Diferentes tamanhos de dispositivos.

---

### 5.1. Safe Area Insets

Sempre respeite as áreas reservadas pelo sistema operacional, como:

- Notch.
- Dynamic Island.
- Barra de status.
- Barra de navegação.
- Home indicator.

Utilize `react-native-safe-area-context`.

```tsx
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

export function ScreenWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView
      style={{
        flex: 1,
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
        paddingLeft: insets.left,
        paddingRight: insets.right,
      }}
    >
      {children}
    </SafeAreaView>
  );
}
```

Quando possível, prefira `SafeAreaView` para casos simples e `useSafeAreaInsets()` quando for necessário controlar individualmente os espaçamentos.

---

### 5.2. Layouts Fluídos

Nunca utilize larguras fixas em pixels para representar a largura de uma tela inteira.

**Evite:**

```tsx
const styles = StyleSheet.create({
  container: {
    width: 375,
  },
});
```

Prefira:

- `flex: 1`
- Porcentagens.
- `maxWidth`.
- `minWidth`.
- `useWindowDimensions()`.
- Layouts baseados em Flexbox.

Exemplo:

```tsx
import {
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";

export function ResponsiveCards() {
  const { width } = useWindowDimensions();

  const isTablet = width >= 768;

  return (
    <View
      style={[
        styles.container,
        isTablet && styles.tabletContainer,
      ]}
    >
      {/* Conteúdo */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },

  tabletContainer: {
    paddingHorizontal: 32,
  },
});
```

---

### 5.3. Orientação da Tela

Interfaces devem funcionar tanto em:

- Portrait.
- Landscape.

Quando a aplicação não suportar determinada orientação, isso deve ser uma decisão consciente do produto e não uma consequência de um layout quebrado.

Componentes críticos devem ser testados em ambas as orientações quando aplicável.

---

### 5.4. Rolagem e Teclado

Em formulários, utilize `KeyboardAvoidingView` junto com `ScrollView` para evitar que o teclado sobreponha campos ou botões.

Exemplo:

```tsx
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
} from "react-native";

export function FormScreen() {
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* Formulário */}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  content: {
    flexGrow: 1,
    padding: 16,
  },
});
```

### 5.5. Conteúdo Rolável

Nunca esconda conteúdo importante simplesmente porque ele não cabe na viewport.

Se o conteúdo puder ultrapassar o tamanho da tela:

- Utilize `ScrollView`.
- Utilize `FlatList` para listas.
- Utilize `SectionList` para listas agrupadas.
- Evite `overflow: hidden` quando isso resultar em conteúdo inacessível.

---

## 6. Regras de Composição Visual

### 6.1. Espaçamento das Bordas

Utilize espaçamentos consistentes de acordo com o dispositivo.

| Plataforma | Espaçamento Lateral Recomendado |
|---|---:|
| Mobile | `16px`–`20px` |
| Tablet | `20px`–`32px` |
| Desktop | `24px`–`32px` |
| Ultrawide | Container centralizado com largura máxima |

O valor exato deve respeitar o sistema de design utilizado pelo projeto.

---

### 6.2. Densidade de Dados

A quantidade de informação apresentada deve variar conforme o espaço disponível.

#### Mobile

Priorize:

- Informações essenciais.
- Agrupamento vertical.
- Cards simplificados.
- Accordions.
- Paginação simplificada.
- Filtros em drawers ou modais.
- Scroll horizontal somente quando realmente necessário.

#### Desktop

É possível apresentar:

- Tabelas completas.
- Ordenação.
- Filtros laterais.
- Múltiplas métricas por linha.
- Colunas adicionais.
- Dashboards com maior densidade informacional.

> **Regra:** não tente simplesmente reduzir uma tabela desktop para caber no mobile. Reestruture a informação para o contexto móvel.

---

## 7. Padrões de Navegação

### 7.1. Mobile

Para aplicações com poucas áreas principais, considere:

- Bottom Tab Bar.
- Stack Navigation.
- Menu hambúrguer.
- Drawers.
- Navegação hierárquica.

Para uma aplicação com **3 a 5 áreas principais**, uma Bottom Tab Bar normalmente oferece uma experiência eficiente.

Evite colocar dezenas de opções diretamente na navegação principal.

---

### 7.2. Desktop

Para aplicações com muitas áreas funcionais, considere:

- Sidebar fixa.
- Sidebar expansível/recolhível.
- Topbar.
- Menu horizontal.
- Breadcrumbs.

Um padrão comum para sistemas administrativos é:

```text
┌──────────────────────────────────────────────┐
│                    Topbar                    │
├──────────────┬───────────────────────────────┤
│              │                               │
│   Sidebar    │           Conteúdo            │
│              │                               │
│              │                               │
└──────────────┴───────────────────────────────┘
```

---

## 8. Componentes Responsivos

Componentes devem possuir comportamento previsível em diferentes tamanhos de tela.

### Cards

Mobile:

```text
┌──────────────────┐
│      Imagem      │
├──────────────────┤
│ Título           │
│ Descrição        │
│ Preço            │
│ [ Ação ]         │
└──────────────────┘
```

Desktop:

```text
┌──────────┬──────────────────────────────┐
│  Imagem  │ Título                       │
│          │ Descrição                    │
│          │ Preço               [ Ação ] │
└──────────┴──────────────────────────────┘
```

O componente pode alterar sua composição, e não apenas seu tamanho.

### Modais

Em mobile, considere utilizar quase toda a largura disponível ou apresentar o conteúdo como uma tela dedicada.

Em desktop, o mesmo conteúdo pode utilizar um modal centralizado com largura limitada.

---

## 9. Tabelas Responsivas

Tabelas são um dos componentes que mais exigem atenção em telas pequenas.

Não reduza excessivamente o tamanho da fonte para tentar fazer todas as colunas caberem.

Considere:

1. Ocultar colunas secundárias.
2. Transformar cada linha em um card.
3. Permitir scroll horizontal controlado.
4. Utilizar um drawer para detalhes.
5. Mostrar somente os dados essenciais.
6. Permitir expansão da linha para informações adicionais.

Exemplo conceitual:

```text
Desktop:

| Cliente | Pedido | Status | Data | Valor | Ações |
|---------|--------|--------|------|-------|-------|

Mobile:

┌────────────────────────┐
│ João Silva             │
│ Pedido #1234           │
│ Status: Concluído      │
│ R$ 250,00              │
│                    >   │
└────────────────────────┘
```

---

## 10. Performance Responsiva

Responsividade não deve ser apenas visual.

A aplicação também deve adaptar seu consumo de recursos.

### Web

- Utilize imagens responsivas.
- Utilize `next/image` quando estiver usando Next.js.
- Evite carregar componentes pesados desnecessariamente.
- Utilize lazy loading quando apropriado.
- Evite enviar grandes quantidades de dados para dispositivos móveis sem necessidade.

### Mobile

- Utilize listas virtualizadas quando necessário.
- Prefira `FlatList` ou `SectionList` para grandes listas.
- Evite renderizações desnecessárias.
- Reduza o tamanho de imagens quando possível.
- Evite componentes excessivamente pesados em telas de baixo desempenho.

---

## 11. Acessibilidade e Responsividade

Responsividade e acessibilidade devem ser tratadas em conjunto.

A interface deve continuar utilizável quando:

- O usuário aumenta o tamanho da fonte.
- O dispositivo está em landscape.
- A viewport é pequena.
- O zoom do navegador é aumentado.
- O usuário utiliza leitor de tela.
- O conteúdo possui textos maiores que o esperado.
- Um campo recebe uma mensagem de erro.
- Um componente muda de estado.

### Regra Importante

Nunca utilize responsividade como justificativa para remover informações essenciais ou tornar controles inacessíveis.

---

## 12. Checklist de Validação

Antes de considerar uma interface responsiva como concluída, verifique:

### Layout

- [ ] A interface foi projetada seguindo uma abordagem Mobile-First?
- [ ] O layout funciona em smartphones?
- [ ] O layout funciona em tablets?
- [ ] O layout funciona em desktops?
- [ ] O layout funciona em monitores ultrawide?
- [ ] Não existe scroll horizontal acidental?
- [ ] Containers possuem largura máxima quando necessário?
- [ ] O conteúdo permanece centralizado em telas grandes?

### Tipografia

- [ ] Títulos se adaptam corretamente a diferentes larguras?
- [ ] `clamp()` ou classes responsivas são utilizadas quando apropriado?
- [ ] Linhas de texto não ficam excessivamente longas?
- [ ] O aumento da fonte não quebra o layout?
- [ ] Textos não são cortados?

### Imagens

- [ ] Imagens possuem comportamento responsivo?
- [ ] O Next.js utiliza `next/image` quando aplicável?
- [ ] O atributo `sizes` está configurado corretamente?
- [ ] Imagens mantêm sua proporção?
- [ ] Imagens não causam layout shift desnecessário?

### Mobile

- [ ] Safe areas são respeitadas?
- [ ] A interface funciona em Portrait?
- [ ] A interface funciona em Landscape quando aplicável?
- [ ] O teclado não cobre campos ou botões?
- [ ] Conteúdo extenso pode ser rolado?
- [ ] Elementos interativos possuem área adequada de toque?
- [ ] Não existem larguras de tela hardcoded?

### Navegação

- [ ] A navegação mobile é adequada ao número de opções?
- [ ] A navegação desktop utiliza o espaço disponível corretamente?
- [ ] Sidebars podem ser recolhidas quando necessário?
- [ ] Menus não ultrapassam a viewport?

### Dados

- [ ] Tabelas possuem estratégia para telas pequenas?
- [ ] Informações secundárias podem ser ocultadas ou agrupadas?
- [ ] Dashboards não ficam excessivamente densos no mobile?
- [ ] Filtros possuem uma experiência adequada em telas pequenas?

### Acessibilidade

- [ ] A interface continua utilizável com aumento de fonte?
- [ ] O foco continua visível?
- [ ] A ordem de leitura permanece lógica?
- [ ] Componentes continuam acessíveis em diferentes tamanhos de tela?
- [ ] Nenhuma informação importante depende exclusivamente do tamanho ou posição visual?

---

## 13. Regra Geral para a Skill `ui-ux` e o `project-builder`

Ao projetar ou implementar uma interface responsiva, siga esta ordem:

1. **Definir a experiência Mobile-First.**
2. **Garantir o funcionamento do fluxo principal em telas pequenas.**
3. **Adicionar adaptações para tablets.**
4. **Expandir o layout para desktop.**
5. **Controlar a largura em monitores ultrawide.**
6. **Adaptar componentes conforme o contexto, não apenas conforme o tamanho.**
7. **Validar tipografia, imagens, tabelas e navegação.**
8. **Validar acessibilidade em todas as resoluções.**
9. **Validar performance em dispositivos com recursos limitados.**

> **Regra de ouro:** responsividade não significa fazer tudo caber na tela. Significa apresentar o conteúdo e as interações da forma mais adequada para cada contexto de uso.

---

## 14. Estrutura dos Arquivos

Este documento deve ser salvo como:

```text
skills/
└── ui-ux/
    └── references/
        ├── accessibility.md
        └── responsive-design.md
```

Caso o diretório `references/` ainda não exista, ele deve ser criado antes de adicionar os arquivos.

O arquivo atual deve ser salvo em:

```text
skills/ui-ux/references/responsive-design.md
```

As diretrizes de acessibilidade devem permanecer em:

```text
skills/ui-ux/references/accessibility.md
```

Ambos os documentos devem ser considerados referências complementares pela skill `ui-ux` e pelo orquestrador responsável pela implementação das interfaces.