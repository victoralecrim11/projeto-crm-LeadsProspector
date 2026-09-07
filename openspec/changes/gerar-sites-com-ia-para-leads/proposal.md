# Why
O gerador atual simula sites e publicação. Precisamos de geração real, editável e exportável, preservando dados do lead.

# What Changes
- Blueprint versionado e validado, backend Gemini e Ollama opcional.
- ModelRegistry dinâmico, estratégias e seleção explícita sem fallback silencioso.
- Renderer único, edição, regeneração, persistência e ZIP estático.
- Toasts e busca de projetos/contratos na paleta existente.

# Capabilities
## New Capabilities
- ai-site-generation: geração backend e integridade
- site-blueprint: schema e contexto seguro
- site-preview: página responsiva
- site-editing: edição e regeneração
- ai-model-selection: catálogo e estratégias
- site-export: exportação estática
- global-search-extension: entidades CRM
- toast-feedback: feedback efêmero

# Impact
Evolução dos componentes/stores existentes. Sem deploy, billing, novos provedores, importação ou analytics.

