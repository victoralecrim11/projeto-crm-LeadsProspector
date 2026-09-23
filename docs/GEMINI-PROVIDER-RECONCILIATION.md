# Gemini — correção do teste de conexão (2026-09-22)

## Causa e histórico verificados

O HTTP 404 da captura vem do modelo consultado pelo backend, não da ausência de `/api/ai/chat`.

- `7836dba`: migrou a integração de providers para o gateway backend.
- `5c50f46`: adicionou tratamento de cooldown; preservava Gemini 2.5 Flash/Flash Lite.
- `6158fae`: alterou os defaults para Gemini 2.0 Flash/1.5 Flash. Essa lista ainda estava ativa no HEAD `a0323c7`, confirmado também no GitHub.
- A memória de 2026-09-14 registrava o incidente como resolvido sem hash comprobatório; a inspeção desta execução comprovou que a lista legada permanece no checkout.

## Correção

`server/routes/aiProvider.ts` agora consulta `models.list` com a chave recebida, segue paginação, filtra modelos estáveis de texto com `supportedGenerationMethods` contendo `generateContent` e prefere Flash. Não existem IDs de versões fixas no modo automático.

Modelo explícito é preservado, normalizando o prefixo opcional `models/`; nenhum modelo alternativo é escolhido silenciosamente nesse caso. Em automático há até duas tentativas com modelos descobertos; 401/403/429 interrompem tentativas. Descoberta e geração compartilham orçamento de timeout de 30 segundos. Mensagem de 404 orienta seleção automática sem repassar detalhes internos do provedor.

O catálogo do site builder já usa descoberta dinâmica; o fluxo de teste/chat era o que continuava usando a lista fixa. Nenhum endpoint/default de outro provider foi modificado.

## Documentação oficial consultada

- [Models API: models.list, paginação e supportedGenerationMethods](https://ai.google.dev/api/models)
- [generateContent: endpoint, contents e systemInstruction](https://ai.google.dev/api/generate-content)

## Validação

- Provider route + client: 13/13 PASS.
- Novos testes Gemini: 7 (paginação/filtro, 404/alternativa, modelo explícito/segurança, 401, 403, 429 e catálogo vazio).
- Suíte completa: 297 testes, 19 suites, 297 PASS, 0 FAIL/skipped, 18788.1473 ms.
- TypeScript: PASS.
- Lint (incluindo React plugin e producer): PASS.
- Build do servidor: PASS.
- Backend de localhost:3000 reiniciado para carregar a alteração.
- Chave salva na UI não foi extraída nem registrada. O browser de automação disponível não está conectado à aba do usuário; validação real com essa chave requer repetir “Testar conexão” na tela aberta.
- Nenhum commit feito. A decisão de manter POST-E.3.9 pendente até validar com LLM real continua vigente.
