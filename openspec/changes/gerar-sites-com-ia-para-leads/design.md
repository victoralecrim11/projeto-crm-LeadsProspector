# Context
CRM React/Zustand com leads no navegador e Express sem banco de usuários.
# Goals / Non-Goals
Entregar Lead → IA → Blueprint → Editor → persistência → ZIP. Deploy e billing excluídos.
# Decisions
1. Zod compartilhado para requests/Blueprint; JSON estruturado e parse direto, sem regex de Markdown.
2. Snapshot mínimo do lead no POST; contatos e localização vêm apenas do contexto, nunca do modelo.
3. Serviços da IA sempre sugestões; aprovação manual explícita. Sem depoimentos/horários/preços sintetizados.
4. Gemini descobre modelos pelo catálogo oficial; Ollama é configurado somente pelo servidor. BYOK Gemini pode ser enviado no cabeçalho para o backend.
5. Escolha explícita fixa modelo; fallback somente auto, com metadata do modelo efetivo.
6. Renderer React estático compartilhado: iframe sandbox no editor e HTML/CSS idênticos no ZIP.
7. Projeto armazena snapshot, Blueprint, metadata e status; URL do editor carrega ID para reload.
8. Limites de corpo, timeout, limite de concorrência, origem e chave de servidor protegida por token de acesso em produção.
# Risks
Texto livre da IA requer revisão humana; schema não comprova alegações semânticas. Export bloqueia sugestões pendentes. Sem credencial válida, validação real do provedor fica pendente e será reportada.

