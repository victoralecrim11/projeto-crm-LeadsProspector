# Stitch: composição incompleta e recuperação do contrato

Data: 2026-09-30. Base: fb316f7f797197e3ecb7d333e3ddc3d69464a444.

## Problema e correção
Uma produção real FAILED/COMPLETED com SITE_DESIGN_CONTRACT_INVALID tinha referências com apenas hero/services/contact. O resolver copiava esses três IDs para composition, cujo contrato exige cinco IDs canônicos únicos.
A evidência observada agora reordena os slots canônicos existentes; os slots ausentes conservam a ordem da base. Nenhum conteúdo do negócio é inventado. Duplicatas continuam inválidas.
Os candidates brutos não mudam. O gate de coerência mantém essa referência incompleta como PARTIAL, nunca PAIRED.
O polling permite revalidar exclusivamente FAILED/COMPLETED/SITE_DESIGN_CONTRACT_INVALID pela preparação real após persist/reload. Recuperação exige paridade consumível; mantém identidade, referências, estratégia e terminalAt, sem renovar TTL nem gerar artifacts.

## Evidências
- Regressão nova antes da correção: arquivo direcionado com 17 testes, 15 pass/2 fail (falha filha e pai), exit 1, reproduziu SITE_DESIGN_CONTRACT_INVALID.
- Depois: arquivo direcionado 18/18 pass, exit 0; cobre ordem parcial, recuperação via serviço e HTTP, duplicatas e falhas não recuperáveis.
- Suíte final sob Node 22.23.3: 351/351 pass, 19 suites, 0 fail/skipped/cancelled, 27.53s, exit 0.
- npm.cmd run lint: exit 0. npm.cmd run build: cliente 34.01s/servidor 23ms, exit 0.
- npm.cmd audit: 0 vulnerabilidades, exit 0. git diff --check: exit 0.
- Replay read-only dos artifacts reais: contrato válido, composição hero/services/contact/about/location; consumer compartilhado PARTIAL, alternatives=3; duas leituras iguais, hashes do job e artifacts inalterados.

## Limites e aplicação
O replay real usou Node global 24.18.0; suíte/lint/build usaram Node portátil 22.23.3 apenas no PATH dos processos. Configuração global intacta; reinstalação limpa e CI não comprovadas.
Warnings de tamanho de chunks permanecem. Não houve LLM, geração externa paga, alteração de job real, homologação visual ou PAIRED end-to-end.
A correção requer integração e restart do backend. O checkout principal e o avanço mobile local do usuário foram preservados. Recuperação segue TTL e gates atuais; não estende sessões vencidas.
