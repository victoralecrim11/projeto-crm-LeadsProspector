# Briefing Compacto para Sites com IA Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adicionar um briefing visual compacto e seguro ao gerador de sites, permitir seleção automática de template, melhorar o diagnóstico de backend/provedor e documentar por que pesquisa web, imagens e MCP ficam para uma fase própria.

**Architecture:** O contrato compartilhado continuará em `src/site-builder/types.ts`; normalização de tokens e escolha da lente visual ficarão em um módulo puro e testável. O backend enviará somente briefing normalizado ao modelo e continuará produzindo o mesmo Blueprint v1 consumido por editor, prévia e ZIP. Erros de transporte local e erros transitórios do provedor serão classificados separadamente.

**Tech Stack:** React 19, TypeScript, Zod 4, Express 4, Tailwind CSS 4/CSS escopado, Node test runner, Gemini REST e Ollama opcional.

---

## Estrutura de arquivos

- Criar `src/site-builder/designBrief.ts`: parser seguro de tokens, paletas recomendadas e resolvedor determinístico de lente visual.
- Criar `src/site-builder/components/DesignBriefControls.tsx`: controles opcionais do briefing compacto.
- Criar `tests/services/designBrief.test.ts`: contrato do parser, paletas e lentes.
- Criar `tests/services/siteGenerationClient.test.ts`: mensagens de transporte e respostas inválidas do backend.
- Modificar `src/site-builder/types.ts`: preferência `auto` e schema do briefing.
- Modificar `src/components/SiteGeneratorModal.tsx`: grade compacta, template automático e novo componente.
- Modificar `src/site-builder/components/ModelControls.tsx`: estado de servidor mais claro e nova tentativa acessível.
- Modificar `src/site-builder/workspace.css`: densidade responsiva e acabamento dos campos.
- Modificar `server/services/ai/sitePromptBuilder.ts`: incluir somente direção normalizada no prompt.
- Modificar `server/services/ai/siteGeneratorService.ts`: respeitar template automático, cores explícitas e política de retentativa.
- Modificar `server/services/ai/providers/siteProviders.ts`: classificar autenticação, limite, indisponibilidade e timeout.
- Modificar `server/routes/siteGeneration.ts`: preservar status seguro e `Retry-After` em falhas transitórias.
- Modificar `src/services/siteGenerationService.ts`: distinguir servidor inacessível, timeout, JSON inválido e erro HTTP.
- Modificar `tests/services/siteGeneration.test.ts` e `tests/services/siteRoutes.test.ts`: regressões de template e erro.
- Modificar `docs/PROJECT_SUMMARY.md`: registrar entrega e adiamentos reais.

### Task 1: Contrato e normalização do briefing visual

**Files:**
- Create: `src/site-builder/designBrief.ts`
- Modify: `src/site-builder/types.ts`
- Test: `tests/services/designBrief.test.ts`

- [ ] **Step 1: Escrever os testes que falham para tokens e lente visual**

```ts
import test from "node:test";
import assert from "node:assert/strict";
import { context } from "../fixtures/siteFixture";
import {
  normalizeDesignBrief,
  parseDesignSystemInput,
  resolveDesignLens,
} from "../../src/site-builder/designBrief";

test("importa apenas tokens de cor de JSON ou variáveis CSS", () => {
  assert.deepEqual(
    parseDesignSystemInput('{"primary":"#112233","nested":{"accent":"#AABBCC"}}'),
    { primary: "#112233", "nested.accent": "#AABBCC" },
  );
  assert.deepEqual(
    parseDesignSystemInput("--brand-primary: #123456; --brand-accent: #abcdef;"),
    { "brand-primary": "#123456", "brand-accent": "#abcdef" },
  );
});

test("rejeita CSS executável, URLs e entrada excessiva", () => {
  for (const value of ["url(https://evil.example)", "@import 'x.css'", "x".repeat(4001)])
    assert.throws(() => parseDesignSystemInput(value));
});

test("lente e briefing são determinísticos e não preservam texto bruto", () => {
  const preferences = {
    siteType: "landing-page" as const,
    templateId: "auto" as const,
    style: "premium" as const,
    goal: "contact" as const,
    designBrief: {
      paletteMode: "imported" as const,
      primaryColor: "#111827",
      accentColor: "#f59e0b",
      designSystemInput: "--brand: #102030; --accent: #fedcba;",
      motion: "cinematic" as const,
      referenceNotes: "Credibilidade executiva",
    },
  };
  assert.equal(resolveDesignLens(context, preferences), "premium-editorial");
  assert.deepEqual(normalizeDesignBrief(context, preferences).colors, ["#102030", "#fedcba"]);
  assert.equal("designSystemInput" in normalizeDesignBrief(context, preferences), false);
});
```

- [ ] **Step 2: Executar o teste e confirmar a falha por módulo/exports ausentes**

Run: `rtk npx tsx --test tests/services/designBrief.test.ts`

Expected: FAIL informando que `designBrief` ou seus exports ainda não existem.

- [ ] **Step 3: Estender o schema de preferências sem alterar o schema do Blueprint**

Em `src/site-builder/types.ts`, adicionar:

```ts
export const templatePreferences = ["auto", ...templates] as const;
export const designBriefSchema = z.object({
  paletteMode: z.enum(["recommended", "custom", "imported"]).default("recommended"),
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).default("#153a50"),
  accentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).default("#d8aa63"),
  designSystemInput: z.string().trim().max(4000).default(""),
  motion: z.enum(["subtle", "cinematic", "none"]).default("subtle"),
  referenceNotes: z.string().trim().max(600).default(""),
}).strict();

export const preferencesSchema = z.object({
  siteType: z.enum(["landing-page", "institutional"]).default("landing-page"),
  templateId: z.enum(templatePreferences),
  style: z.enum(tones),
  goal: z.enum(["contact", "phone", "whatsapp", "none"]),
  designBrief: designBriefSchema.default({
    paletteMode: "recommended",
    primaryColor: "#153a50",
    accentColor: "#d8aa63",
    designSystemInput: "",
    motion: "subtle",
    referenceNotes: "",
  }),
}).strict();
```

- [ ] **Step 4: Implementar parser, paletas e lentes no módulo puro**

`src/site-builder/designBrief.ts` deverá exportar os três métodos testados. O parser deve achatar JSON com no máximo duas camadas, aceitar somente strings `#RRGGBB`, extrair no máximo 12 variáveis CSS `--nome: #RRGGBB`, normalizar hex para minúsculas e lançar `Error("Design system inválido…")` para `url(`, `@import`, `<script`, entrada acima de 4000 caracteres ou nenhuma cor no modo importado.

O retorno de `normalizeDesignBrief` deve ter exatamente:

```ts
type NormalizedDesignBrief = {
  lens: "local-conversion" | "premium-editorial" | "trust-institutional" | "appointment-flow";
  colors: string[];
  motion: "subtle" | "cinematic" | "none";
  referenceNotes: string;
  templateCandidates: typeof templates[number][];
};
```

Regras: template `appointment-focused` escolhe `appointment-flow`; institucional escolhe `trust-institutional`; estilo premium ou movimento cinematográfico escolhe `premium-editorial`; demais landing pages escolhem `local-conversion`. Paleta custom usa as duas cores explícitas; importada usa os valores extraídos; recomendada usa uma paleta conservadora por categoria e cai em `#153a50/#d8aa63`.

- [ ] **Step 5: Executar o teste e a verificação de tipos**

Run: `rtk npx tsx --test tests/services/designBrief.test.ts && rtk npm run lint`

Expected: testes PASS e `tsc --noEmit` com exit 0.

- [ ] **Step 6: Commitar o contrato isoladamente**

```bash
rtk git add src/site-builder/types.ts src/site-builder/designBrief.ts tests/services/designBrief.test.ts
rtk git commit -m "feat: adicionar briefing visual seguro"
```

### Task 2: Aplicar lente, paleta e template automático na geração

**Files:**
- Modify: `server/services/ai/sitePromptBuilder.ts`
- Modify: `server/services/ai/siteGeneratorService.ts`
- Modify: `tests/services/siteGeneration.test.ts`

- [ ] **Step 1: Acrescentar testes de regressão para automático e manual**

Adicionar a `tests/services/siteGeneration.test.ts`:

```ts
test("template automático preserva escolha válida da IA e manual prevalece", async () => {
  const deps = {
    discoverModels: async () => ({ models: [model], warnings: [] }),
    requestBlueprint: async () => ({ ...blueprint, templateId: "minimal-professional" as const }),
    delay: async () => {},
  };
  const base = {
    context,
    preferences: {
      siteType: "landing-page" as const,
      templateId: "auto" as const,
      style: "moderno" as const,
      goal: "none" as const,
      designBrief: {
        paletteMode: "recommended" as const,
        primaryColor: "#153a50",
        accentColor: "#d8aa63",
        designSystemInput: "",
        motion: "subtle" as const,
        referenceNotes: "",
      },
    },
    modelSelection: { mode: "auto" as const },
  };
  assert.equal((await generateSite(base, {}, deps)).blueprint.templateId, "minimal-professional");
  const manual = await generateSite({
    ...base,
    preferences: { ...base.preferences, templateId: "premium-service" as const },
  }, {}, deps);
  assert.equal(manual.blueprint.templateId, "premium-service");
});

test("paleta personalizada prevalece sobre as cores retornadas pela IA", async () => {
  const result = await generateSite({
    context,
    preferences: {
      siteType: "landing-page",
      templateId: "auto",
      style: "moderno",
      goal: "none",
      designBrief: {
        paletteMode: "custom",
        primaryColor: "#112233",
        accentColor: "#aabbcc",
        designSystemInput: "",
        motion: "subtle",
        referenceNotes: "",
      },
    },
    modelSelection: { mode: "auto" },
  }, {}, {
    discoverModels: async () => ({ models: [model], warnings: [] }),
    requestBlueprint: async () => blueprint,
    delay: async () => {},
  });
  assert.equal(result.blueprint.brand.primaryColor, "#112233");
  assert.equal(result.blueprint.brand.accentColor, "#aabbcc");
});
```

- [ ] **Step 2: Executar somente o teste de geração e confirmar a falha**

Run: `rtk npx tsx --test tests/services/siteGeneration.test.ts`

Expected: FAIL porque `auto` ainda não é aceito/aplicado e `delay` ainda não pertence às dependências.

- [ ] **Step 3: Normalizar o briefing no prompt**

Em `sitePromptBuilder.ts`, importar `normalizeDesignBrief` e substituir o JSON final por:

```ts
const design = normalizeDesignBrief(context, preferences);
return [
  // regras de segurança já existentes
  "Escolha somente um template listado em design.templateCandidates quando preferences.templateId for auto.",
  "A direção visual é orientação de composição, não autorização para inventar conteúdo comercial.",
  JSON.stringify({ task, preferences: { ...preferences, designBrief: undefined }, design, leadData: context }),
].join("\n");
```

Construir o objeto sem a chave `designBrief`, em vez de depender de serialização de `undefined`, para garantir que o texto bruto importado nunca entre no prompt.

- [ ] **Step 4: Aplicar precedência do usuário após validar a resposta**

Em `generateSite`, depois de `constrainBlueprint`, calcular o briefing normalizado:

```ts
const design = normalizeDesignBrief(input.context, input.preferences);
if (input.preferences.templateId !== "auto")
  blueprint.templateId = input.preferences.templateId;
if (input.preferences.designBrief.paletteMode !== "recommended") {
  blueprint.brand.primaryColor = design.colors[0];
  blueprint.brand.accentColor = design.colors[1] ?? design.colors[0];
}
blueprint.brand.tone = input.preferences.style;
```

Manter `mergeSection` usando o template e as preferências já persistidos no editor.

- [ ] **Step 5: Rodar testes de geração e tipos**

Run: `rtk npx tsx --test tests/services/siteGeneration.test.ts tests/services/designBrief.test.ts && rtk npm run lint`

Expected: PASS e exit 0.

- [ ] **Step 6: Commitar o pipeline de direção visual**

```bash
rtk git add server/services/ai/sitePromptBuilder.ts server/services/ai/siteGeneratorService.ts tests/services/siteGeneration.test.ts
rtk git commit -m "feat: orientar geracao por estrategia visual"
```

### Task 3: Classificar falhas locais e transitórias

**Files:**
- Modify: `src/services/siteGenerationService.ts`
- Modify: `server/services/ai/modelRegistry.ts`
- Modify: `server/services/ai/providers/siteProviders.ts`
- Modify: `server/services/ai/siteGeneratorService.ts`
- Modify: `server/routes/siteGeneration.ts`
- Create: `tests/services/siteGenerationClient.test.ts`
- Modify: `tests/services/siteGeneration.test.ts`
- Modify: `tests/services/siteRoutes.test.ts`

- [ ] **Step 1: Escrever testes para rede local, timeout e política de retry**

No teste do cliente, substituir temporariamente `globalThis.fetch` por rejeições `TypeError("fetch failed")` e `DOMException("timed out", "TimeoutError")`; afirmar mensagens “Servidor local indisponível” e “A solicitação excedeu o tempo limite”. Também simular resposta 502 com JSON inválido e afirmar “resposta inválida do servidor”. Restaurar `fetch` em `finally`.

No teste do gerador, criar `SiteAiError` com `{ status: 503, retryable: true }`, contar chamadas e usar `delay: async () => {}`; afirmar duas tentativas. Criar erro 401 não retentável e afirmar uma chamada.

- [ ] **Step 2: Executar os testes e confirmar as falhas esperadas**

Run: `rtk npx tsx --test tests/services/siteGenerationClient.test.ts tests/services/siteGeneration.test.ts tests/services/siteRoutes.test.ts`

Expected: FAIL nas novas mensagens, propriedade `retryable` e cabeçalho transitório.

- [ ] **Step 3: Tornar o cliente resiliente a fetch e JSON inválido**

Estruturar `api()` assim:

```ts
let response: Response;
try {
  response = await fetch(url, options);
} catch (error) {
  if (error instanceof DOMException && error.name === "TimeoutError")
    throw new Error("A solicitação excedeu o tempo limite. Tente novamente.");
  throw new Error("Servidor local indisponível. Inicie ou reinicie o aplicativo e tente novamente.");
}
let data: unknown;
try { data = await response.json(); }
catch { throw new Error("O servidor retornou uma resposta inválida."); }
if (!response.ok) {
  const message = typeof (data as { error?: unknown })?.error === "string"
    ? String((data as { error: string }).error)
    : "A operação de IA falhou.";
  throw new Error(message);
}
return data;
```

- [ ] **Step 4: Classificar status do provedor sem vazar corpo da resposta**

Estender `SiteAiError` com `retryable: boolean`. Em `requestBlueprint`, mapear: 401/403 → status 401, não retentável; 429 → 429, retentável; 503/504 → 503, retentável; demais 4xx → 400, não retentável; demais 5xx → 502, retentável. Timeout deve virar 503 retentável; JSON inválido deve virar 502 retentável.

Em `generateSite`, interromper imediatamente 401 e 400; repetir o mesmo modelo apenas quando `retryable`; usar `dependencies.delay(250 * 2 ** attempt)` no runtime e `async () => {}` nos testes. O modo automático continua para o próximo candidato após esgotar o atual.

- [ ] **Step 5: Preservar status e indicar nova tentativa**

Em `siteGenerationRouter`, quando `SiteAiError.status` for 429 ou 503, definir `Retry-After: 2`. Manter JSON `{ error: e.message }` e status não-2xx.

- [ ] **Step 6: Rodar os testes direcionados**

Run: `rtk npx tsx --test tests/services/siteGenerationClient.test.ts tests/services/siteGeneration.test.ts tests/services/siteRoutes.test.ts`

Expected: todos PASS; rede local, timeout, 401 e 503 cobertos.

- [ ] **Step 7: Commitar o tratamento de falhas**

```bash
rtk git add src/services/siteGenerationService.ts server/services/ai/modelRegistry.ts server/services/ai/providers/siteProviders.ts server/services/ai/siteGeneratorService.ts server/routes/siteGeneration.ts tests/services/siteGenerationClient.test.ts tests/services/siteGeneration.test.ts tests/services/siteRoutes.test.ts
rtk git commit -m "fix: distinguir falhas do servidor e do provedor"
```

### Task 4: Construir o formulário compacto e acessível

**Files:**
- Create: `src/site-builder/components/DesignBriefControls.tsx`
- Modify: `src/components/SiteGeneratorModal.tsx`
- Modify: `src/site-builder/components/ModelControls.tsx`
- Modify: `src/site-builder/workspace.css`

- [ ] **Step 1: Criar o componente de direção visual controlado**

O componente deve receber `value: SitePreferences["designBrief"]`, `onChange` e `disabled`. Renderizar um `<details className="design-brief">` com:

```tsx
<summary>Direção de design <span>opcional</span></summary>
<div className="design-brief-grid">
  <label>Paleta<select value={value.paletteMode}>...</select></label>
  <label>Movimento<select value={value.motion}>...</select></label>
</div>
```

Para `custom`, renderizar dois `input type="color"` com valor textual. Para `imported`, renderizar `textarea` com ajuda “JSON de cores ou variáveis CSS; URLs e CSS executável não são aceitos”. Renderizar `referenceNotes` com máximo 600. Não incluir botões de pesquisa web, imagem ou MCP nesta fase.

- [ ] **Step 2: Integrar o componente e a opção automática ao modal**

Inicializar `prefs.templateId` como `auto` e incluir o objeto `designBrief` com os defaults do schema. Agrupar Lead/Tipo/Template/Estilo/Objetivo em `.site-generator-grid`; o campo Lead ocupa a linha inteira. Adicionar a opção:

```tsx
<option value="auto">✨ Deixar a IA decidir</option>
```

Inserir `DesignBriefControls` entre os campos principais e `ModelControls`.

- [ ] **Step 3: Melhorar o estado de modelos**

Em `ModelControls`, usar `role="alert"` quando `getSiteModels` falhar, manter a mensagem de servidor indisponível e exibir `Tentar novamente` fora do campo do token. Renomear o label do token para “Token do servidor — não é a chave Gemini” e adicionar texto curto explicando que ele só é necessário quando o servidor de produção exige autorização.

- [ ] **Step 4: Aplicar densidade responsiva no CSS escopado**

Adicionar:

```css
.site-generator-grid,
.design-brief-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}
.site-generator-grid .generator-field-wide { grid-column: 1 / -1; }
.site-generator-panel :is(select, input:not([type="color"]), textarea) {
  min-height: 40px;
  margin-top: 6px;
  padding: 8px 11px;
  border-radius: 10px;
}
.design-brief {
  border: 1px solid var(--border-color, #334155);
  border-radius: 12px;
  padding: 0 12px 12px;
  background: #0f172a80;
}
.design-brief summary span { color: #94a3b8; font-weight: 400; }
@media (max-width: 640px) {
  .site-generator-grid,
  .design-brief-grid { grid-template-columns: minmax(0, 1fr); }
  .site-generator-panel :is(select, input:not([type="color"]), textarea) { min-height: 44px; }
}
```

Preservar as regras globais de foco, contraste e `prefers-reduced-motion` já existentes.

- [ ] **Step 5: Verificar tipos e build do frontend**

Run: `rtk npm run lint && rtk npm run build`

Expected: ambos exit 0; avisos já documentados de chunks podem permanecer.

- [ ] **Step 6: Commitar a UI compacta**

```bash
rtk git add src/site-builder/components/DesignBriefControls.tsx src/components/SiteGeneratorModal.tsx src/site-builder/components/ModelControls.tsx src/site-builder/workspace.css
rtk git commit -m "feat: compactar briefing do gerador de sites"
```

### Task 5: Atualizar o resumo técnico e decisões adiadas

**Files:**
- Modify: `docs/PROJECT_SUMMARY.md`

- [ ] **Step 1: Atualizar a seção Sites com IA**

Registrar, em linguagem factual:

- briefing compacto, template automático, paleta custom/importada e lentes internas;
- tokens importados são dados validados, nunca CSS executado;
- `Failed to fetch`/WebSocket observado quando o servidor local está parado;
- categorias 401/429/502/503/timeout e fallback automático;
- token do servidor não é chave Gemini e não é autenticação multiusuário;
- pesquisa web, imagens, 3D e MCP não foram implementados e quais pré-requisitos bloqueiam cada um.

- [ ] **Step 2: Conferir que a documentação não afirma integrações inexistentes**

Run: `rtk rg -n "pesquisa web|geração de imagens|MCP|template automático|token do servidor" docs/PROJECT_SUMMARY.md`

Expected: ocorrências descrevem estado real e itens adiados explicitamente.

- [ ] **Step 3: Commitar a documentação**

```bash
rtk git add docs/PROJECT_SUMMARY.md
rtk git commit -m "docs: atualizar resumo do briefing de sites"
```

### Task 6: Verificação integral e inspeção visual

**Files:**
- Verify only; fix only files already listed if a regression is found.

- [ ] **Step 1: Executar a suíte completa**

Run: `rtk npm test`

Expected: todos os testes PASS, zero falhas.

- [ ] **Step 2: Executar TypeScript e build de produção**

Run: `rtk npm run lint && rtk npm run build`

Expected: ambos exit 0.

- [ ] **Step 3: Iniciar o servidor e verificar saúde/modelos**

Run: `rtk npm run dev`

Em outro processo:

```bash
rtk curl -i http://localhost:3000/api/health
rtk curl -i http://localhost:3000/api/ai/models
```

Expected: health 200; models 200 com lista ou aviso de configuração, sem `Failed to fetch`. Não imprimir chaves no terminal.

- [ ] **Step 4: Inspecionar o modal em desktop e mobile**

Confirmar no navegador: grade de duas colunas no desktop, uma coluna no celular, nenhum overflow horizontal, foco visível, briefing recolhido por padrão, campos custom/imported condicionais, explicação do token e retry de modelos.

- [ ] **Step 5: Verificar o diff final e ausência de instrumentação**

Run: `rtk git diff --check`

Run: `rtk rg -n "\[DEBUG-" src server tests`

Expected: o primeiro comando termina com exit 0; o segundo não imprime correspondências e termina com exit 1, indicando ausência de instrumentação temporária.

- [ ] **Step 6: Registrar correções finais somente se necessárias**

Se a verificação exigir ajuste, limitar a correção aos arquivos deste plano, repetir os comandos afetados e criar um commit `fix: concluir verificacao do briefing de sites`. Se nada mudar, não criar commit vazio.
