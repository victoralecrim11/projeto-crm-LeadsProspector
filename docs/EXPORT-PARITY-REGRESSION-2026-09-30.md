# Regressões de paridade editor/exportação

Base: fa5f5fa020884dd473d9a5a8e44f11a27b0a430f (main remota após integração do PR #4).
Branch: automation/export-parity-regression. Data: 2026-09-30.

## Incremento
Três testes novos em tests/services/mediaExport.test.ts, sem alteração de código de produção:
- Exportação após serialização/reload conserva conteúdo, ordem e visibilidade, gera HTML igual ao renderer efetivo, mantém blueprint.json coerente e não modifica o blueprint/overrides originais. Exportações repetidas permanecem equivalentes.
- Escolha explícita de outra imagem aprovada sobrevive ao reload e incorpora os bytes corretos, sem retornar à primeira imagem do manifesto.
- __REMOVE__ oculta a imagem, mas não apaga o asset aprovado do store ou manifesto: hidden != deleted.

## Evidência e limites
O arquivo direcionado passou 8/8 testes em Node portátil 22.23.3, exit 0.
A suíte inicial passou 354/354, 19 suites, 0 fail/skipped/cancelled, exit 0 (26.89s).
Ver PR/diário para os resultados finais de suíte, lint e build após a última revisão de assertions.
São fixtures locais com bytes mínimos de teste, não fotos reais ou integração com provedores.
O reload coberto é JSON round-trip, não IndexedDB/browser; não prova interação React, fidelidade visual Stitch ou PAIRED com LLM real.
Nenhum bug de produção novo foi reproduzido, nenhum gate foi relaxado. O incremento protege comportamentos existentes contra regressões.
Node global 24.18.0 e npm 11.16.0 permanecem intactos. O PATH portátil é limitado aos processos de validação.
Checkout principal e avanço mobile local do usuário preservados; sem merge automático, deploy, secrets ou runtime commitados.
