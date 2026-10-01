# Relevância na seleção automática de mídia — 01/10/2026

Na main fa29e27f60fed9e74a8f0ad728d7eaa254dd9848, a diversificação introduzida em 014c6c8 recalculava a maior confiança depois de remover fotos já usadas. Quando a única foto relevante já estava no site, uma alternativa de confiança 0.1 passava a ser a melhor restante, apesar da foto original ter 0.9. Isso contrariava a regra de preservar relevância antes de diversificar.

A correção calcula a confiança de referência sobre todos os candidatos retornados, mantendo a janela existente de 0.05. A escolha continua restrita a fotos ainda não usadas; sem outra foto dentro dessa janela, o item é ignorado e mantém o fallback existente. Não há duplicação, alteração de revisão/licença ou exclusão de assets.

Regressão: duas seções, foto relevante já presente no manifesto do projeto e alternativa irrelevante. Critérios: resolved=0, failed=0, skipped=2, nenhuma aquisição e progresso [1,2]. Na base: 5/6 pass, 1 fail, exit 1. Após correção: 6/6, exit 0.

Suíte completa: 366/366, 19 suites, zero fail/skipped/cancelled/todo, 22.44s, exit 0. Lint completo exit 0. Node portátil 22.23.3 no PATH de validação; global 24.18.0/npm11.16.0 preservados.

Limites: fixtures sintéticas e manager mock; não há prova de provider ao vivo, fotos reais ou fidelidade Stitch/PAIRED. Nenhuma geração externa, cobrança, secret/env, job ou artifact foi alterado. Sem mudanças de dependências.

Build cliente 16.52s/servidor 43ms e diff --check: exit 0. A primeira tentativa de captura em PowerShell com ErrorActionPreference=Stop foi interrompida por NativeCommandError em stderr (warning Zod); exit 1 do wrapper, sem exit code completo do build. Processos remanescentes foram conferidos e a execução direta foi repetida com sucesso. Warnings de chunks >500kB, import misto e anotações PURE permanecem.

Fonte/testes validados na árvore modificada sobre a base acima e commitados sem outra alteração; apenas este relatório foi incluído depois dos checks. Checkout principal limpo/sincronizado na base, móvel 5020388 e PR #6 já incorporados por avanço do usuário. Nenhum checkout/pull/merge no principal foi executado neste ciclo.
