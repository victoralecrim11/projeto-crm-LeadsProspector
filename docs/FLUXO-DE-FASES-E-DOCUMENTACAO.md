# Desenvolvimento por fases, revisão e documentação

## Regra de execução

Siga as fases, dependências e critérios de aceite registrados no AI Brain e nos documentos versionados. Divida cada fase em incrementos pequenos, com objetivo e evidências verificáveis. Um incremento deve ser implementado, testado e enviado em branch própria e PR draft para revisão humana. Retome PRs próprios existentes antes de iniciar trabalho equivalente.

O PR identifica fase/incremento, problema, critérios de aceite, mudança de comportamento, testes reais, SHA validado e limites. Não faça merge automático, push na main ou deploy de produção. Um PR aberto significa proposta publicada; um merge significa integração. Homologação da fase exige todos os seus critérios e evidências, inclusive validação ao vivo quando prevista.

## Documentação em cada alteração

Inventarie README, guias, arquitetura, contratos/API, fases, checklists, exemplos e comentários/JSDoc pertinentes. Atualize no mesmo PR todos os documentos impactados ou desatualizados pela mudança. Registre quais foram revisados e atualizados e o que ainda falta. Preserve o histórico, identificando datas e separando resultados antigos do estado atual.

Documentação autoral e comentários explicativos devem ser escritos em português brasileiro. Converta o acervo restante em incrementos próprios revisados por PR. Preserve identificadores, comandos, caminhos, schemas e conteúdo de terceiros quando a tradução alterar precisão ou funcionamento. Fixtures e dados funcionais não são documentação; não modifique seu comportamento para traduzir texto.

## Evidências e continuidade

Antes de publicar mudanças, execute a suíte e os checks exigidos pelos scripts atuais, incluindo lint e build de cliente/servidor quando apropriados. Registre exit codes, contagens, SHA e limitações. Fixtures não comprovam integrações ao vivo. Nunca enfraqueça gates para declarar conclusão.

Após cada incremento, grave diário único no AI Brain e atualize plano, pendências e checkpoint sem apagar histórico. Trabalhe no worktree isolado com lock exclusivo; preserve alterações e commits do checkout principal do usuário.

## Primeiro inventário — 06/10/2026

A base `da649b9344994e0797ac28b111bf746b391ae621` contém 73 arquivos rastreados com extensões `.md`, `.mdx` ou `.txt`. Essa contagem inclui referências e registros históricos; não comprova que todos foram revisados ou traduzidos. Neste incremento, foram revisados os READMEs da raiz e de `docs/`, o resumo técnico e os comentários do seletor automático de mídia. A tradução completa do acervo permanece pendente; revisar também comentários/JSDoc dos módulos alterados em cada próximo PR.
