# Diretrizes de Acessibilidade (a11y) & Inclusão

Este documento estabelece as regras e padrões de acessibilidade que a skill `ui-ux` e o orquestrador `react-dev` devem seguir na concepção e implementação de interfaces **Web (React/Next.js)** e **Mobile (React Native)**.

---

## 1. Princípios Fundamentais (WCAG 2.1 / 2.2)

Toda interface deve respeitar quatro pilares fundamentais:

1. **Perceptível:** A informação e os componentes da interface devem ser apresentados de maneira que os usuários possam percebê-los (visão, audição, tato).

2. **Operável:** Todos os controles e navegação devem ser operáveis por diferentes dispositivos de entrada (teclado, leitor de tela, switch controls).

3. **Compreensível:** A informação e a operação da interface devem ser previsíveis, intuitivas e livres de ambiguidades.

4. **Robusto:** O código deve ser semanticamente padronizado para ser interpretado confiavelmente por navegadores e tecnologias assistivas.

---

## 2. Contraste e Cores (Visual a11y)

* **Nível Mínimo Exigido:** WCAG AA, com foco em AAA para elementos de texto primário.

* **Texto Normal (< 18pt ou < 14pt bold):** Contraste mínimo de **4.5:1** em relação ao fundo.

* **Texto Grande (≥ 18pt ou ≥ 14pt bold):** Contraste mínimo de **3:1**.

* **Componentes de UI & Ícones Essenciais:** Contraste mínimo de **3:1** contra elementos adjacentes.

* **Não Depender Exclusivamente de Cores:** Mensagens de erro, status (sucesso, alerta, falha) e abas selecionadas devem conter ícones legíveis e/ou rótulos em texto complementar, nunca dependendo apenas da mudança de tom cromático.

---

## 3. Acessibilidade na Web (React & Next.js)

### 3.1. HTML Semântico em Primeiro Lugar

Evite usar tags genéricas (`<div>` ou `<span>`) com eventos de clique. Priorize elementos nativos:

* **Links de navegação:** `<a href="...">`
* **Ações em página / submits:** `<button type="...">`
* **Estrutura de página:** `<header>`, `<main>`, `<nav>`, `<aside>`, `<footer>`, `<section>`, `<article>`
* **Títulos hierárquicos:** `<h1>` até `<h6>` em ordem sequencial. Nunca pule níveis apenas para alterar o tamanho visual.

### 3.2. WAI-ARIA com Parcimônia

> **Regra primária:** Se um elemento nativo resolve, não use ARIA.

Para botões apenas com ícones, como botão de fechar modal ou menu hambúrguer, forneça um `aria-label` descritivo e oculte o ícone da tecnologia assistiva:

```tsx
<button type="button" aria-label="Fechar janela modal">
  <XIcon aria-hidden="true" className="h-5 w-5" />
</button>
```

#### Componentes Expansíveis

Para componentes como **Accordions**, **Drawers** e outras áreas expansíveis:

* Use `aria-expanded` para indicar se o conteúdo está aberto.
* Use `aria-controls` para associar o botão ao conteúdo controlado.
* O elemento controlado deve possuir um `id` único.
* Sempre que possível, utilize elementos HTML nativos em vez de implementar comportamentos complexos manualmente.

```tsx
<button
  type="button"
  aria-expanded={isOpen}
  aria-controls="faq-content-1"
  onClick={() => setIsOpen(!isOpen)}
>
  Como funciona o produto?
</button>

<div id="faq-content-1" hidden={!isOpen}>
  ...
</div>
```

### 3.3. Navegação por Teclado e Focus States

* **Focus Ring Visível:** Nunca remova o contorno de foco com `outline: none` sem fornecer uma alternativa evidente.

  Exemplo com Tailwind CSS:

  ```tsx
  <button className="focus-visible:ring-2 focus-visible:ring-primary">
    Continuar
  </button>
  ```

* **Ordem Lógica de Tabulação:** O fluxo do `Tab` deve acompanhar a ordem de leitura visual.

* **Evitar `tabIndex` positivo:** Não utilize `tabIndex` com valores positivos. Use:

  * `tabIndex={0}` para tornar um elemento focável quando necessário.
  * `tabIndex={-1}` para permitir foco programático sem inseri-lo na ordem natural de tabulação.

* **Skip Links:** Em layouts complexos com headers extensos, inclua um link no início do DOM para permitir que usuários de teclado pulem diretamente para o conteúdo principal.

  ```tsx
  <a
    href="#main-content"
    className="sr-only focus:not-sr-only"
  >
    Ir para o conteúdo
  </a>

  <main id="main-content">
    ...
  </main>
  ```

### 3.4. Formulários

Todo formulário deve possuir uma estrutura acessível:

* Todo `input` deve ter um `<label>` associado explicitamente por meio de `htmlFor`.
* Mensagens de validação inline devem estar conectadas ao campo usando `aria-describedby`.
* Campos inválidos devem utilizar `aria-invalid="true"`.
* Mensagens de erro devem explicar claramente o problema e, quando possível, indicar como corrigi-lo.

Exemplo:

```tsx
<label htmlFor="email">
  E-mail
</label>

<input
  id="email"
  name="email"
  type="email"
  aria-invalid={hasError}
  aria-describedby={hasError ? "email-error" : undefined}
/>

{hasError && (
  <p id="email-error">
    Informe um endereço de e-mail válido.
  </p>
)}
```

---

## 4. Acessibilidade Mobile (React Native)

### 4.1. Tamanho Mínimo de Toque (Touch Target Size)

* Botões, itens de lista e ícones clicáveis devem ter área mínima de toque de **48x48 dp/pt**.
* A Apple HIG recomenda **44pt**, enquanto o Material Design recomenda **48dp**.
* Sempre priorize uma área de interação confortável, especialmente em dispositivos móveis.
* Use a propriedade `hitSlop` para expandir a área de clique de ícones menores.

Exemplo:

```tsx
<TouchableOpacity
  accessibilityLabel="Voltar à tela anterior"
  accessibilityRole="button"
  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
  onPress={handleBack}
>
  <BackIcon />
</TouchableOpacity>
```

### 4.2. Propriedades Nativas de Acessibilidade

Utilize as propriedades nativas do React Native para fornecer informações às tecnologias assistivas.

#### `accessibilityRole`

Indique o papel do componente:

* `button`
* `header`
* `link`
* `image`
* `search`
* entre outros papéis suportados pela plataforma.

#### `accessibilityLabel`

Forneça uma descrição curta e clara do que o componente representa ou faz.

**Prefira:**

```text
Curtir publicação
```

**Evite:**

```text
Ícone coração
```

O objetivo é comunicar a **função**, e não a aparência visual do componente.

#### `accessibilityHint`

Descreva o resultado da ação quando ele não for óbvio para o usuário.

Exemplo:

```tsx
accessibilityHint="Abre a tela de detalhes do pagamento"
```

#### `accessibilityState`

Informe estados relevantes do componente, como:

* `selected`
* `disabled`
* `expanded`

Exemplo:

```tsx
<Pressable
  accessibilityLabel="Adicionar ao carrinho"
  accessibilityRole="button"
  accessibilityState={{
    disabled: isOutOfStock,
  }}
  disabled={isOutOfStock}
>
  <Text>Comprar</Text>
</Pressable>
```

### 4.3. Font Scaling e Responsividade ao Sistema

A interface deve respeitar as configurações de tamanho de fonte definidas pelo sistema operacional.

* Evite fixar alturas rígidas em containers de texto, como `height: 30`.
* Usuários com baixa visão podem aumentar a fonte do sistema.
* No iOS, isso está relacionado ao **Dynamic Type**.
* No Android, está relacionado ao **Font Scale**.
* Prefira `minHeight`, `paddingVertical` e layouts flexíveis.
* Garanta que o aumento da fonte não cause corte ou sobreposição de textos.

Exemplo:

```tsx
const styles = StyleSheet.create({
  container: {
    minHeight: 48,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
});
```

---

## 5. Imagens e Conteúdo Não Textual

Imagens devem possuir uma alternativa acessível sempre que transmitirem informação relevante.

### 5.1. Imagens Informativas

Na Web, utilize `alt` com uma descrição objetiva:

```tsx
<img
  src="/produto.png"
  alt="Notebook preto sobre uma mesa"
/>
```

A descrição deve comunicar o propósito da imagem, e não simplesmente listar suas características visuais.

### 5.2. Imagens Decorativas

Imagens puramente decorativas devem ser ignoradas pelas tecnologias assistivas:

```tsx
<img src="/decoracao.svg" alt="" />
```

Quando apropriado, elementos decorativos também podem utilizar:

```tsx
aria-hidden="true"
```

### 5.3. Ícones

Ícones que possuem função devem ter um nome acessível.

```tsx
<button type="button" aria-label="Excluir tarefa">
  <TrashIcon aria-hidden="true" />
</button>
```

Ícones meramente decorativos devem ser ocultados:

```tsx
<StarIcon aria-hidden="true" />
```

---

## 6. Leitores de Tela e Tecnologias Assistivas

A interface deve funcionar corretamente com as principais tecnologias assistivas.

### Web

Validar pelo menos:

* Navegação exclusivamente pelo teclado.
* Leitores de tela.
* Foco visível.
* Ordem de leitura.
* Anúncio de estados dinâmicos.
* Formulários e mensagens de erro.

### Mobile

Validar pelo menos:

* **VoiceOver** no iOS.
* **TalkBack** no Android.
* Navegação por gestos.
* Leitura correta dos elementos.
* Estados de componentes.
* Áreas de toque.

Componentes customizados não devem depender exclusivamente de gestos complexos ou interações que não possam ser executadas por tecnologias assistivas.

---

## 7. Estados da Interface

Todos os estados importantes da interface devem ser comunicados de maneira acessível.

Considere pelo menos:

* Estado normal.
* Hover.
* Focus.
* Active.
* Disabled.
* Loading.
* Success.
* Warning.
* Error.
* Selected.
* Expanded/Collapsed.

Não utilize apenas cor, transparência ou mudança visual sutil para comunicar um estado.

Exemplo de estado de erro:

```tsx
<div role="alert">
  <AlertCircle aria-hidden="true" />
  <span>Não foi possível salvar as alterações.</span>
</div>
```

O ícone e o texto trabalham juntos para comunicar o estado, em vez de depender exclusivamente da cor vermelha.

---

## 8. Componentes Interativos

Todo componente interativo deve:

1. Possuir uma função claramente identificável.
2. Ser acessível por teclado na Web.
3. Ser acessível por leitor de tela.
4. Possuir nome acessível.
5. Informar seu estado quando necessário.
6. Possuir área de toque adequada no Mobile.
7. Apresentar feedback visual e/ou textual para suas ações.
8. Permitir que a ação seja executada sem depender exclusivamente de mouse, toque ou gesto específico.

Evite transformar elementos puramente visuais em controles interativos sem necessidade.

**Prefira:**

```tsx
<button type="button" onClick={handleAction}>
  Salvar
</button>
```

**Evite:**

```tsx
<div onClick={handleAction}>
  Salvar
</div>
```

---

## 9. Modais, Dialogs e Overlays

Modais devem ser implementados considerando foco e tecnologias assistivas.

Ao abrir um modal:

* O foco deve ser movido para um elemento apropriado dentro do modal.
* O modal deve possuir um nome acessível.
* O botão de fechamento deve ser acessível.
* O usuário deve conseguir fechar o modal quando apropriado.
* Ao fechar, o foco deve retornar ao elemento que abriu o modal.
* O conteúdo fora do modal não deve ser apresentado indevidamente como parte da interação enquanto o modal estiver ativo.

Exemplo conceitual:

```tsx
<div
  role="dialog"
  aria-modal="true"
  aria-labelledby="dialog-title"
>
  <h2 id="dialog-title">
    Confirmar exclusão
  </h2>

  <p>
    Deseja realmente excluir esta tarefa?
  </p>

  <button type="button">
    Cancelar
  </button>

  <button type="button">
    Excluir
  </button>
</div>
```

---

## 10. Responsividade e Zoom

A interface deve continuar utilizável quando o usuário aumenta o tamanho do conteúdo.

### Web

* Não bloquear zoom do navegador.
* Evitar layouts que dependam de dimensões fixas desnecessárias.
* Permitir que textos quebrem naturalmente.
* Evitar conteúdo cortado horizontalmente.
* Garantir que controles continuem acessíveis em diferentes tamanhos de tela.

### Mobile

* Respeitar o dimensionamento de fonte configurado pelo sistema.
* Evitar alturas fixas para textos.
* Utilizar layouts flexíveis.
* Garantir que componentes possam crescer conforme o conteúdo.

---

## 11. Conteúdo e Linguagem

A acessibilidade também envolve a forma como as informações são apresentadas.

* Utilize linguagem clara e objetiva.
* Evite textos excessivamente técnicos para usuários finais.
* Descreva ações de maneira direta.
* Utilize mensagens de erro que expliquem o problema.
* Evite mensagens genéricas como `"Erro"` ou `"Algo deu errado"` quando for possível fornecer uma explicação melhor.
* Botões devem descrever a ação que executam.

**Evite:**

```text
Clique aqui
```

**Prefira:**

```text
Visualizar pedido
```

**Evite:**

```text
Erro
```

**Prefira:**

```text
Não foi possível concluir o pagamento. Verifique os dados do cartão e tente novamente.
```

---

## 12. Checklist Rápido Pré-Implementação

Antes de considerar uma interface pronta, verifique:

### Visual

* [ ] Todas as cores usadas passam no teste de contraste AA (**4.5:1 para texto normal e 3:1 para texto grande/componentes aplicáveis**)?
* [ ] Elementos importantes não dependem exclusivamente de cores?
* [ ] Estados de erro, sucesso e alerta possuem indicação textual e/ou visual complementar?
* [ ] O foco possui indicador visual claramente perceptível?

### Web

* [ ] HTML semântico está sendo utilizado?
* [ ] Links utilizam `<a>`?
* [ ] Ações utilizam `<button>`?
* [ ] Os títulos seguem uma hierarquia lógica?
* [ ] Elementos interativos podem ser utilizados pelo teclado?
* [ ] A ordem de tabulação é lógica?
* [ ] Não existem `tabIndex` positivos desnecessários?
* [ ] Existe Skip Link quando necessário?
* [ ] ARIA está sendo utilizado apenas quando necessário?
* [ ] Botões somente com ícones possuem `aria-label`?
* [ ] Ícones decorativos possuem `aria-hidden="true"`?

### Formulários

* [ ] Todos os inputs possuem `<label>` associado?
* [ ] Os campos inválidos utilizam `aria-invalid`?
* [ ] As mensagens de erro estão associadas aos campos através de `aria-describedby`?
* [ ] As mensagens de erro explicam como corrigir o problema?
* [ ] O formulário pode ser utilizado integralmente pelo teclado?

### Mobile

* [ ] Elementos clicáveis possuem pelo menos **48x48 dp/pt** ou `hitSlop` adequado?
* [ ] Componentes possuem `accessibilityRole` quando necessário?
* [ ] Componentes possuem `accessibilityLabel` adequado?
* [ ] `accessibilityHint` é utilizado quando a consequência da ação não é óbvia?
* [ ] `accessibilityState` representa corretamente estados como `disabled`, `selected` e `expanded`?
* [ ] A interface funciona corretamente com TalkBack?
* [ ] A interface funciona corretamente com VoiceOver?
* [ ] O aumento da fonte do sistema não quebra o layout?

### Imagens e conteúdo

* [ ] Imagens informativas possuem `alt` descritivo?
* [ ] Imagens decorativas são ignoradas pelas tecnologias assistivas?
* [ ] Ícones funcionais possuem nomes acessíveis?
* [ ] Textos e mensagens são claros e objetivos?

### Testes finais

* [ ] A interface foi testada somente com teclado?
* [ ] A interface foi testada com leitor de tela?
* [ ] A interface foi testada com diferentes tamanhos de fonte?
* [ ] A interface foi testada em diferentes tamanhos de tela?
* [ ] Componentes interativos continuam utilizáveis sem mouse?
* [ ] Modais e overlays possuem gerenciamento correto de foco?
* [ ] Estados de loading, erro e sucesso são comunicados de forma acessível?

---

## 13. Regra Geral para a Skill `ui-ux` e o Orquestrador `react-dev`

Ao projetar ou implementar qualquer componente, a acessibilidade deve ser considerada **desde o início**, e não adicionada como uma etapa posterior.

A ordem de prioridade deve ser:

1. **HTML/componentes nativos e semânticos**
2. **Comportamento acessível**
3. **Navegação por teclado e tecnologias assistivas**
4. **Contraste e legibilidade**
5. **Responsividade e adaptação ao sistema**
6. **ARIA somente quando necessário**
7. **Estética e refinamentos visuais**

> **Regra de ouro:** se a interface funciona apenas para quem utiliza mouse, possui visão perfeita ou não altera o tamanho da fonte, ela ainda não está pronta.

Acessibilidade não deve ser tratada como um recurso opcional. Ela faz parte dos requisitos funcionais e não funcionais da interface.
