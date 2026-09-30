# Stitch — foto de fundo com texto centralizado

Data: 30/09/2026. Base: `468b261db4b9a99f87b434aae4e3b810ae8db177`.

## Problema e correção

`extractStitchVisuals` escolhia `minimal` ao encontrar `text-center`, mesmo quando o hero tinha uma imagem absoluta `inset-0` ou `background-image` explícito. O alinhamento do texto ocultava a evidência da composição fotográfica, e `applyStitchVisualEvidence` propagava o layout errado ao design.

A precedência agora é: colunas split explícitas, foto de fundo explícita e, por último, alinhamento central. O detector de foto editorial permanece intacto. A mudança afeta novas extrações; não reescreve designs ou ZIPs históricos.

## Evidência de regressão

- Teste novo no código da base: 7 PASS / 1 FAIL, exit 1; `minimal` recebido onde era esperado `full-bleed`.
- Após a correção: 8/8 testes do adapter PASS, exit 0. Casos: imagem absoluta, background-image e foto editorial centralizada; os dois primeiros também verificam a propagação ao consumidor.
- Suíte completa: 348/348 PASS, 19 suites, sem falhas/skips, exit 0; lint/TypeScript principal, React plugin e producer PASS, exit 0.
- Build cliente/servidor PASS, exit 0; cliente em 49.13 segundos. `git diff --check` PASS, exit 0. O processo de validação completo terminou em 118.26 segundos.

## Limites e próximos passos

Esta é uma regressão determinística com HTML de teste; não prova fidelidade visual do projeto Barbearia do Zequinha nem PAIRED com LLM real. Ainda falta referência exata em resolução útil e validação de integração. B.1 não foi reaberta; o incremento trata o backlog atual de extração visual.

Validação executada com Node v24.18.0, embora engines declare 22.x. `npm ci --ignore-scripts` no worktree isolado concluiu sem alterar dependências; audit encontrou 5 vulnerabilidades moderadas e 1 alta transitiva (`brace-expansion`, faixa <=1.1.20, correção disponível), sem críticas. Não foi aplicada atualização automática de dependências; essa revisão permanece pendente.

O commit local do usuário `5020388` de navegação mobile foi preservado no checkout principal e não integra esta branch baseada no remoto.
