# 🎯 CRM Prospector de Sites & Radar Google Maps

**Uma plataforma full-stack completa para prospecção, auditoria de sites, CRM e gestão de vendas de desenvolvimento web — rodando diretamente no seu navegador.**

Encontrou → Auditou → Abordou → Ofertou → Acompanhou → Fechou → Contrato.

Desenvolvido para agências digitais e freelancers, o sistema centraliza e automatiza a prospecção de clientes locais. Ache negócios com nota alta no Google Maps que possuem sites ruins ou não têm site, faça a gestão de cada oportunidade em um funil inteligente e envie propostas completas.

## ✨ O que a plataforma faz

| Funcionalidade | O que acontece |
|---|---|
| **Radar Google Maps** | Varre a sua região de forma direcionada: encontra negócios por Categoria/Nicho, Bairro (integrado ao IBGE), Raio e Nota de Avaliação. |
| **Auditoria Técnica** | Diagnóstico instantâneo avaliando a existência de site, velocidade (PageSpeed) e gargalos (ex: falta de HTTPS, responsividade). |
| **Exportação Excel (.xlsx)** | Planilha completa gerada na hora! Conta com abas de Resumo Executivo (KPIs) e Base de Leads formatada, com filtros automáticos e colorização por "Temperatura" e "Saúde do Lead". |
| **CRM Kanban (Funil)** | Dashboard visual (drag & drop) para gerenciar leads: Prospecção → Reunião → Proposta → Negociação → Fechamento. |
| **Command Palette (Atalhos)** | Pressione `Ctrl + K` (ou `Cmd + K`) para abrir uma paleta universal de buscas, navegação e atalhos globais. |
| **Gerador de Propostas (PDF)** | Envie propostas comerciais padronizadas com a marca da sua agência, descritivo do projeto, valores de setup e recorrência (MRR). |
| **E-mails & Follow-up** | Textos e copys validadas para contato inicial e acompanhamento anti-vácuo com placeholders automáticos (`[Nome do Lead]`, etc). |
| **Gestão Financeira** | Acompanhe a projeção financeira: Total de Setup em pipeline e projeção de faturamento recorrente. |

## 📊 CRM Integrado (Dashboard)

Totalmente livre de mensalidades e bancos de dados complexos: as informações rodam de forma robusta localmente no seu navegador utilizando *Local Storage API* gerenciado via React Context, garantindo velocidade e privacidade. O painel inclui controle financeiro, funil de vendas, lista de tarefas para agendamentos e lista de clientes convertidos.

## 🚀 Como Instalar e Rodar

O projeto foi construído utilizando as mais modernas tecnologias web: **React 18**, **TypeScript**, **Vite** e **Tailwind CSS**.

1. **Faça o clone ou download deste repositório**
   ```bash
   git clone <url-do-repositorio>
   cd <nome-da-pasta>
   ```

2. **Instale as dependências essenciais**
   ```bash
   npm install
   ```

3. **Inicie o Servidor de Desenvolvimento**
   ```bash
   npm run dev
   ```

O sistema será iniciado (geralmente em `http://localhost:3000`). Basta acessar e começar a personalizar os dados da sua agência nas Configurações!

## 📦 Tecnologias & Bibliotecas Utilizadas

- **Core:** React, TypeScript, Vite.
- **Estilização & UI:** Tailwind CSS (glassmorphism premium, dark mode otimizado), Lucide React (Ícones).
- **Motor de Exportação de Dados:** `exceljs` e `file-saver` (Geração de `workbooks` reais do Microsoft Excel com formatação nativa client-side).
- **Geração de Documentos:** Utilitários JS para conversão em PDF (jsPDF / HTML2Canvas).

## 💡 Dicas de Uso & Hacks

1. **Integração com Bairros Reais:** No Radar Google Maps, após selecionar a cidade, aguarde o carregamento ou force a atualização no ícone IBGE ao lado de **"Bairro / Região"** para puxar bairros hiper-segmentados, otimizando muito a conversão de prospecção.
2. **Personalização Automática Excel:** Ao exportar em `.xlsx`, leads 'Quentes' sairão em destaque vermelho (alta prioridade), 'Mornos' em laranja e 'Frios' em azul, ajudando o time comercial de telemarketing a focar em quem tem mais propensão ao fechamento.
3. **Seu Logo na Proposta:** Acesse "Configurações" e preencha todos os campos da agência. Esses dados popularão automaticamente o cabeçalho e rodapé do documento gerado em PDF, transmitindo extrema credibilidade no momento do fechamento.

---

> Referência de workflow inspirada no projeto completo de prospecção do [ArrecheNeto (PROSPECTOR-DE-SITES)](https://github.com/ArrecheNeto/PROSPECTOR-DE-SITES).
