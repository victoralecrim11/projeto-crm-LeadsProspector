# Retomada do Site Builder e registro de melhorias

Data: 14/10/2026. Base: `c692b63`. Estado: planejamento registrado; primeiro incremento implementado e testado, aguardando revisão visual.

## Evidências atuais

- A aba Stitch & Design aceita somente API key; teste e produção não exigem token interno do usuário. Commits `55dd258` e `c692b63` integrados à main.
- Última suíte completa da base: 424 testes aprovados; lint e build aprovados. Não representa testes novos deste plano.
- Usuário confirmou geração do restaurante Farroupilha e forneceu capturas desktop/mobile. A geração terminou PARTIAL/COHERENCE_FAILED: o artefato mobile reconheceu cinco seções, o desktop somente hero/location. Não equivale a PAIRED nem a fidelidade integral ao Stitch.
- Capturas mostram atendimento vazio, abertura sem ação, textos extensos e sugestões comerciais ainda pendentes. A ausência de contato/endereço não autoriza inventá-los.

## Ordem de trabalho

1. Corrigir atendimento vazio no rodapé; preservar contatos confirmados e avisos de demonstração.
2. Melhorar abertura e ações com base nos dados disponíveis, sem links falsos ou promessas comerciais inferidas.
3. Revisar conteúdo comercial e orientação de pendências no editor; manter procedência de sugestões e distinção demo/final.
4. Conferir prévia/exportação e responsividade com evidência da mesma geração Stitch.
5. Retomar o Site Studio conforme `docs/SITE-STUDIO-PLANO-2026-10-08.md`, depois de satisfazer suas dependências.

As tarefas executáveis e seus critérios estão em [todo.md](todo.md). Este plano complementa, sem substituir, os planos OpenSpec existentes e o roadmap do AI Brain.

## Features futuras já existentes na memória

| Frente | Dependência e tratamento |
|---|---|
| Repositórios de dados, persistência remota e estado de sincronização | Definir migração, isolamento e autenticação antes de escolher/provisionar serviços. |
| Busca reutilizável de leads e importação Excel/CSV | Inventariar funcionalidades existentes; preservar identidade e deduplicação. |
| Dashboard: navegação, gráficos e desempenho | Conferir entregas existentes antes de criar novas; medir antes de otimizar. |
| Mídia do negócio, mídia gerada e otimização | Reconciliar nomenclatura C.2–C.5: memória e documentos antigos divergem; não declarar fase homologada sem evidência atual. |
| Enriquecimento Apify/Bright Data e dados CNPJ | Reutilizar o plano multi-provider existente; manter OSM como fonte geográfica e procedência explícita. |
| Site Studio | Reutilizar blueprint, renderer e manifesto atuais; não duplicar editor nem contornar gates comerciais. |

## Limites e decisões

- Nenhuma nova geração externa é necessária para o ajuste do rodapé.
- Não relaxar coerência mobile/desktop para transformar PARTIAL em PAIRED.
- Conteúdo e contatos só podem vir de dados existentes ou revisão explícita.
- Mudanças visuais intencionais exigem revisar os 40 baselines e preservar entradas/asserções.
- O registro antigo de executor offline não descreve esta sessão local. Outros gates históricos permanecem até serem comprovados.

## Verificação por incremento

Testes focados, suíte completa, lint, build e `git diff --check`; comparar demonstração/final e prévia/exportação. Registrar evidências e limitações no mesmo incremento.
