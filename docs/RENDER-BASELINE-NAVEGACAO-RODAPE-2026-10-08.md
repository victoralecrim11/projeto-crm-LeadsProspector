# Baseline de renderização — navegação e rodapé

Data da revisão: 2026-10-08.

## Motivo

As alterações intencionais de navegação mobile e rodapé integradas em `345a882b8965b1c3d1a10fc068480bce39f552d8` modificaram o HTML estático produzido pelas 40 combinações protegidas pelo baseline da Fase A. O fixture ainda continha os hashes anteriores e fazia a suíte falhar, embora as regressões específicas de navegação, rodapé, mídia e exportação estivessem cobertas por testes próprios.

## Atualização

`tests/fixtures/phaseARenderBaseline.json` foi regenerado com `npx.cmd tsx tests/updateHashes.ts`, usando o renderer atual e as mesmas 40 entradas validadas. Nenhuma entrada, ordem ou quantidade de combinações foi alterada; somente os hashes SHA-256 resultantes foram atualizados.

O teste `tests/services/siteFoundation.test.ts` continua exigindo exatamente 40 registros e comparando integralmente o HTML/CSS gerado. A atualização não reduz assertions nem transforma diferenças futuras em aprovação automática.

## Limites

Este ajuste comprova coerência determinística do renderer atual e restaura a trava de regressão. Ele não homologa fidelidade visual ao projeto Stitch Delta Burguer, não comprova autenticação Stitch ao vivo e não substitui revisão humana da mudança visual.

## Atualização após a integração do PR #18

O PR #18 integrou os gates comerciais na `main`, mas a correção visual da demonstração Delta Burguer foi enviada à branch depois do merge. Em 2026-10-08, essa correção foi aplicada em uma nova branch. O rodapé passou a incluir navegação e atendimento, alterando o HTML das 40 combinações legadas. Os 40 hashes foram recalculados a partir das mesmas entradas, sem mudar a quantidade, a ordem ou as asserções. Os testes direcionados e a suíte completa passaram (390/390). A correção do hero móvel com mídia afeta apenas sites com design Stitch e não justifica alterar os hashes legados.
