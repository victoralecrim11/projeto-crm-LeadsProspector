# Seleção explícita de mídia: revisão e ausência

Data: 2026-09-30. Base: fa5f5fa020884dd473d9a5a8e44f11a27b0a430f.
Branch: automation/explicit-media-selection; independente do PR #5 aberto.

## Problema reproduzido
findSectionMedia procurava o assetId explícito sem verificar reviewStatus. Isso permitia renderizar candidate/rejected. Se o ID não existisse, substituía silenciosamente a intenção por outra imagem da seção, tanto em preview quanto em exportação.
Novos testes antes da correção: 3 testes, 1 pass/2 fail, exit 1; falhas de mídia sem revisão e substituição por referência ausente.

## Correção
O resolver compartilhado aceita seleção explícita somente nos estados selected/reviewed/exportable. Uma escolha ausente, candidate ou rejected retorna sem imagem; não escolhe outra automaticamente.
Sem ID explícito, a seleção automática conserva os estados já permitidos. __REMOVE__ continua explícito e não destrutivo.
selected continua permitido para revisão no preview; a exportação ainda exige aprovação e mantém seu bloqueio atual.
Nenhuma exclusão de assets/manifestos, alteração de baseline ou mudança na aquisição/licença de mídia.

## Validação e limites
Arquivo novo + mediaExport.test.ts: 8/8 pass, exit 0, Node portátil 22.23.3.
Suíte: 354/354 pass, 19 suites, zero fail/skipped/cancelled, exit 0 (30.14s).
Resultados de lint/build e SHA final estão registrados no PR e diário AI Brain.
Fixtures locais com metadados/bytes sintéticos; nenhuma chamada a provedor ou foto real. ZIP real criado em memória; isso não comprova UI React/browser ou integração de mídia ao vivo.
PR #5 não faz parte desta base: seus três testes são outro incremento independente. Não confundir contagens iguais entre as branches.
Fidelidade integral Stitch e PAIRED real continuam pendentes. Runtime local segue sem HTML exato útil; B.1 não foi reativada.
Node global 24.18.0/npm11.16.0 intactos; PATH portátil limitado aos processos. Checkout principal e commit mobile preservados.


## Revalidação conjunta — 01/10/2026

O PR #5 foi integrado à main remota bacf2debb09404b54d1661dbc21409be82883a40. O PR #6 continua aberto. A própria branch automation/explicit-media-selection recebeu origin/main por merge normal, sem conflitos, para validar as duas mudanças juntas; nenhum merge na main foi executado nesta retomada.

SHA combinado testado: bd7cc32b23390ab105fba16910cf761eff7e2e09. Fonte/testes permaneceram inalterados após os checks; esta seção foi acrescentada depois.

- npm.cmd test: 357/357, 19 suites, zero fail/skipped/cancelled/todo, 21.16s, exit 0.
- npm.cmd run lint: exit 0 (todos os projetos TypeScript, incluindo producer).
- npm.cmd run build: cliente 38.70s, servidor 43ms, exit 0.
- git diff --check: exit 0; árvore testada limpa.
- Node portátil 22.23.3 só no PATH do processo; Node global 24.18.0/npm11.16.0 preservados.

Warnings do build: chunks maiores que 500 kB, import estático/dinâmico misto de leadStore e anotações PURE de Zod removidas pelo Rollup. Nenhuma dependência mudou; audit não repetido.

O checkout principal continua limpo em 5020388, ahead 1/behind 10, com avanço mobile do usuário preservado e não publicado. Não houve restart, deploy, LLM, geração externa, UI real ou homologação Stitch/PAIRED. Os limites das fixtures e do reload JSON acima continuam válidos.
