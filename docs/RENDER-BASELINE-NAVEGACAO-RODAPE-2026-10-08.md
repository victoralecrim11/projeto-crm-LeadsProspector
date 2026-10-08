# Baseline de renderização — navegação e rodapé

Data da revisão: 2026-10-08.

## Motivo

As alterações intencionais de navegação mobile e rodapé integradas em `345a882b8965b1c3d1a10fc068480bce39f552d8` modificaram o HTML estático produzido pelas 40 combinações protegidas pelo baseline da Fase A. O fixture ainda continha os hashes anteriores e fazia a suíte falhar, embora as regressões específicas de navegação, rodapé, mídia e exportação estivessem cobertas por testes próprios.

## Atualização

`tests/fixtures/phaseARenderBaseline.json` foi regenerado com `npx.cmd tsx tests/updateHashes.ts`, usando o renderer atual e as mesmas 40 entradas validadas. Nenhuma entrada, ordem ou quantidade de combinações foi alterada; somente os hashes SHA-256 resultantes foram atualizados.

O teste `tests/services/siteFoundation.test.ts` continua exigindo exatamente 40 registros e comparando integralmente o HTML/CSS gerado. A atualização não reduz assertions nem transforma diferenças futuras em aprovação automática.

## Limites

Este ajuste comprova coerência determinística do renderer atual e restaura a trava de regressão. Ele não homologa fidelidade visual ao projeto Stitch Delta Burguer, não comprova autenticação Stitch ao vivo e não substitui revisão humana da mudança visual.
