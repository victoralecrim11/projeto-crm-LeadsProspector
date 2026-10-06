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
- [ ] Revisar e integrar o novo PR; homologação exige repetição humana no navegador com os dados reais.
