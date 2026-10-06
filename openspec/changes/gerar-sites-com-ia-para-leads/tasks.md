# Tasks
- [x] 1. Contexto, schema e política de integridade
- [x] 2. Backend, catálogo e adapters existentes
- [x] 3. Modal real e renderer compartilhado
- [x] 4. Editor, regeneração, persistência e export
- [x] 5. Toast e busca global
- [x] 6. Testes, runtime e relatório de evidências

Limitações de validação e integridade semântica registradas em `docs/AI_SITE_IMPLEMENTATION.md`: revisão humana permanece obrigatória; Ollama e contratos sem dados no perfil não foram exercitados em runtime.

## Regressão — lead inicial e filtro canônico (06/10/2026)

- [x] Reproduzir o caso em que o lead escolhido permanece no estado, mas some do seletor por divergência entre categoria legada e nicho canônico.
- [x] Inicializar filtro e lead com a mesma resolução canônica e cobrir lead inexistente.
- [x] Revisar e integrar o PR #11; a integração não equivale à homologação do fluxo em navegador.

## Regressão residual — seleção explícita prevalece no filtro (06/10/2026)

- [x] Registrar a evidência visual em que “Júlia Cabeleireira” continua ausente das opções após a integração inicial.
- [x] Garantir que o ID explicitamente selecionado permaneça no seletor durante divergência transitória de categoria.
- [x] Preservar a limpeza da seleção quando o usuário troca manualmente para categoria incompatível.
- [x] Cobrir a divergência entre classificação canônica persistida e filtro com teste automatizado.
- [x] Revisar e integrar o PR #12; a repetição humana confirmou que a regressão ainda ocorre.

## Regressão residual — sincronização tardia do lead explícito (06/10/2026)

- [x] Confirmar no fluxo real que o dropdown de Redesenho altera corretamente o card antes de abrir o gerador.
- [x] Reiniciar o orquestrador pela identidade explícita do lead recebido do card.
- [x] Sincronizar categoria e ID quando o store ou a lista de leads terminarem de atualizar após a montagem.
- [x] Cobrir chegada tardia e estabilidade da mesma seleção com testes automatizados.
- [ ] Revisar e integrar o novo PR; homologação exige repetição humana em `localhost:3000/redesenhar` com os dados reais.
