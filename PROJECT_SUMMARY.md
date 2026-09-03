# 📋 PROSPECTOR - Relatório Completo do Projeto & Histórico de Evolução

> **Versão:** 2.1  
> **Status:** Operacional / Em Produção (Compilação & Tipagem 100% Validadas)  
> **Responsável / Closer Líder:** Victor Alecrim  

---

## 🎯 1. Visão Geral e Objetivo do Projeto

### O que é o PROSPECTOR?
O **PROSPECTOR** é uma plataforma full-stack e CRM de vendas de alta conversão projetado especificamente para **Agências de Desenvolvimento Web, Web Designers e Closers de Soluções Digitais**. 

### O Problema do Mercado
Milhões de pequenas e médias empresas locais (como barbearias, clínicas odontológicas, restaurantes, escritórios de advocacia e mecânicas) possuem sites desatualizados dos anos 2000, lentos, sem certificado SSL, sem botão de WhatsApp e completamente incompatíveis com dispositivos móveis — ou sequer possuem um site, dependendo unicamente de páginas incompletas no Google Meu Negócio. 

Ao mesmo tempo, web designers enfrentam dificuldades para:
1. Encontrar e auditar leads locais em escala;
2. Demonstrar o valor e o contraste entre o "site velho" e uma nova solução moderna;
3. Gerar propostas comerciais rápidas com rapport e personalização;
4. Criar contratos de manutenção mensal recorrente (**MRR**) para garantir estabilidade financeira.

### O Objetivo do Sistema
O PROSPECTOR resolve essa cadeia de ponta a ponta em um único ambiente integrado:
- **Prospecção Ativa:** Mapeia negócios locais diretamente via Google Maps em qualquer raio geográfico.
- **Diagnóstico Técnico Automático:** Identifica falhas críticas (Mobile, SSL, Velocidade, SEO, CTA WhatsApp).
- **Fechamento Visual com IA:** Gera e exibe uma comparação interativa em tempo real ("Antes e Depois") com barra deslizante para encantar o cliente na call de vendas.
- **Proposta Irrecusável:** Emite propostas comerciais estruturadas com cálculo de ROI e ancoragem de preço.
- **Gestão de Pipeline & MRR:** Acompanha o lead no funil Kanban e faz a transição para contratos de recorrência mensal (hospedagem, suporte, backups e manutenção técnica).

---

## 🏗️ 2. Arquitetura e Stack Técnica

| Camada | Tecnologia | Descrição & Propósito |
| :--- | :--- | :--- |
| **Frontend Core** | React 18+ (Vite) | Arquitetura modular de componentes funcionais com TypeScript rígido. |
| **Linguagem** | TypeScript | Tipagem estática integral (`src/types.ts`) para leads, propostas, contratos e estados. |
| **Estilização** | Tailwind CSS v4 | Utilitários modernos, variáveis de tema e suporte a variantes de tema customizadas. |
| **Ícones** | Lucide React | Biblioteca consistente de ícones vetoriais padronizados em toda a UI. |
| **Gerenciamento de Estado** | React Context API | `CrmContext.tsx` centralizado com sincronização e persistência no `localStorage`. |
| **Backend & Servidor** | Node.js + Express | Servidor preparado para integrações de API seguras (`server.ts`). |
| **Build & Deploy** | Vite + esbuild | Bundle otimizado com compilação direta e validação via `tsc --noEmit`. |

---

## 🧩 3. Módulos e Funcionalidades do Sistema

### 🗺️ 3.1. Google Maps Prospector (`GoogleMapsProspector.tsx` / `LeadsProspectorView.tsx`)
- **Varredura Geográfica Inteligente:** Simula e conecta varreduras por nicho (Barbearias, Clínicas, Odontologia, Restaurantes, etc.) e localidade.
- **Filtro de Raio Paramétrico:** Controle dinâmico de raio com atalhos rápidos (5 km, 10 km, **19 km**, 30 km).
- **Auditoria Instantânea de Oportunidades:** Cada negócio encontrado exibe selos de diagnóstico (Sem SSL, Não Responsivo, Carregamento Lento, Ausência de WhatsApp).
- **Conversão em 1 Clique:** Envio imediato do lead qualificado para o CRM com estimativa de valor de fechamento.

### 📊 3.2. Dashboard Estratégico (`DashboardView.tsx`)
- **Métricas Chave (KPIs):** Faturamento Projetado, MRR Estimado (Receita Recorrente Mensal), Total de Leads Ativos e Taxa de Fechamento (%).
- **Velocidade de Negócios:** Indicadores de tempo médio de fechamento e ticket médio.
- **Ações Rápidas & Feed de Atividades:** Acesso imediato à criação de propostas, simulação de sites e registro de novos contatos.

### 📌 3.3. Funil de Vendas Kanban (`CrmPipelineView.tsx`)
- **Estágios do Funil:**
  1. *Prospecção*
  2. *Primeiro Contato Feito*
  3. *Auditoria Enviada*
  4. *Redesenho Apresentado*
  5. *Proposta Comercial*
  6. *Fechado / Ganho*
  7. *Perdido*
- **Ações Rápidas no Card:** Botão direto para WhatsApp com mensagem personalizada de pitch, envio de e-mail e abertura de detalhes do lead.
- **Totalizador por Estágio:** Cálculo em tempo real do valor financeiro acumulado em cada coluna do funil.

### ⚡ 3.4. Comparador Interativo Antes & Depois (`RedesenhoView.tsx`)
- **Tela Dividida com Slider Interativo:** Apresenta visualmente o contraste chocante entre o site antigo do cliente (amador, sem responsividade) e a nova versão premium criada pela agência.
- **Alternância de Dispositivo:** Simulação imediata em modo **Desktop** e **Mobile**.
- **Manipulação Tátil e Fluida:** Divisor central arrastável por mouse ou toque na tela, com feedback visual em tempo real.
- **Publicação & Link de Demonstração:** Botão para gerar link compartilhável direto para envio no WhatsApp do tomador de decisão.

### 📄 3.5. Gerador de Propostas Comerciais (`PropostasView.tsx`)
- **Estruturação Personalizada:** Inclusão de dados da empresa, diagnóstico de perda de clientes e escopo de entrega técnica.
- **Simulador de Retorno (ROI):** Cálculo de quantos clientes a mais o novo site precisa gerar para pagar o investimento.
- **Visualizador de PDF Integrado:**
  - Controles de Zoom (+10% / -10%).
  - Alternador de modo Claro/Escuro dedicado para o documento.
  - Formatação com quebra de palavras segura (`break-words`) para evitar estouro de margem na impressão.

### 🔄 3.6. Gestão de Contratos Recorrentes / MRR (`ContratosView.tsx`)
- Gestão de planos de hospedagem gerenciada, backup em nuvem, manutenção preventiva e SEO local.
- Status de renovação e alertas de vencimento de fatura.

### 📡 3.7. Radar de Follow-up & Agendamentos (`FollowUpRadarView.tsx` / `AppointmentsView.tsx`)
- Alertas inteligentes para leads sem contato há mais de 48h/72h.
- Roteiros pré-formatados para contornar objeções comuns ("já tenho sobrinho que faz", "agora não tenho verba").
- Agenda integrada de reuniões de fechamento.

### ⚙️ 3.8. Setup & Infraestrutura (`SetupConfigView.tsx` / `CrmSettingsView.tsx`)
- Configuração de integração com servidores de hospedagem (HostGator, cPanel, Cloud).
- Definição de metas financeiras do closer e personalização de dados da agência.

---

## 🛠️ 4. Histórico Completo de Correções e Melhorias Implementadas

Abaixo está o registro cronológico detalhado de todas as intervenções técnicas realizadas na aplicação:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ HISTÓRICO DE EVOLUÇÃO & CORREÇÕES                                           │
├─────────────────────────────────────────────────────────────────────────────┤
│ [Fase 1] Correção do Scanner do Google Maps (TypeError MouseEvent)          │
│ [Fase 2] Sincronização do Raio de Busca & Presets (19km)                    │
│ [Fase 3] Deduplicação Automática de IDs no LocalStorage (React Keys)        │
│ [Fase 4] Acessibilidade & Zoom no Visualizador de Proposta (PDF)            │
│ [Fase 5] Desacoplamento do Modo Escuro do Sistema Operacional (Tailwind v4) │
│ [Fase 6] Redesenho e Correção de Contraste no Rodapé da Barra Lateral       │
│ [Fase 7] Ocultação do Menu Hambúrguer em Resoluções Desktop (lg:hidden)     │
│ [Fase 8] Implementação do Slider Físico Interativo no "Antes e Depois"      │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Detalhamento das Etapas:

#### 1. Correção do Botão de Varredura do Google Maps
- **Causa Raiz:** O evento `MouseEvent` do botão "Escanear Google Maps Agora" estava sendo passado implicitamente para a função de busca, disparando erro ao executar métodos de string como `.trim()`.
- **Solução:** Aplicada tipagem defensiva (`typeof query === 'string'`) com valor padrão de fallback e isolamento do clique em arrow function `() => handleSimulateScan()`.

#### 2. Sincronização do Raio de Busca e Presets
- **Causa Raiz:** O contador de oportunidades apresentava divergência numérica com a listagem visível e os leads gerados podiam ultrapassar o raio selecionado.
- **Solução:** Unificação da lógica de filtragem, calibração matemática do gerador de distâncias em relação ao raio selecionado e adição do botão de preset rápido para **19 km**.

#### 3. Eliminação do Erro "Duplicate Key" no React
- **Causa Raiz:** Sessões salvas no `localStorage` geravam itens com o mesmo ID base (`lead-custom-...`), provocando avisos de duplicação no console e comportamento inconsistente de renderização.
- **Solução:** Implementação de sanitizador automático no ciclo de hidratação do `CrmContext.tsx`, que rastreia IDs via `Set` e anexa sufixos randômicos exclusivos a registros clonados.

#### 4. Reformulação do Visualizador de Propostas (PDF)
- **Causa Raiz:** Textos longos vazavam das bordas do documento e faltavam controles de contraste e escala para apresentação ao vivo.
- **Solução:** Adicionadas regras de quebra estrita de linha (`break-words`, `whitespace-pre-wrap`), controles interativos de Zoom (+10% / -10%) e toggle independente de tema claro/escuro da folha.

#### 5. Desacoplamento de Tema do Sistema no Tailwind CSS v4
- **Causa Raiz:** O Tailwind CSS v4 avalia nativamente a media query `@media (prefers-color-scheme: dark)`. Usuários com modo escuro no celular (Android/iOS) viam componentes escuros mesmo alternando o app para o Modo Claro.
- **Solução:** Configurada a regra `@custom-variant dark (&:where(.dark, .dark *));` em `src/index.css`. Agora o tema é estritamente controlado pelo estado da aplicação (`html.light` vs `html.dark`), eliminando conflitos com o sistema operacional do usuário.

#### 6. Correção de Contraste e Visual no Rodapé da Barra Lateral
- **Causa Raiz:** O bloco inferior do menu lateral (`Victor Alecrim - Closer Top #1`, plano Pro e botão de configurações) ficava ilegível e com fundo escuro incompatível no modo claro.
- **Solução:**
  - Criação do seletor dedicado `#sidebar-footer` com regras específicas para `html.light` (`background-color: #f8fafc !important`).
  - Atualização das cores tipográficas: Nome em `text-slate-900` / `dark:text-white` e cargo em `text-emerald-600` / `dark:text-emerald-400`.
  - Remoção de filtros de desfoque conflitantes no Chrome móvel e ampliação da área de clique da engrenagem de configurações.

#### 7. Ajuste de Responsividade do Menu Hambúrguer
- **Causa Raiz:** O botão hambúrguer aparecia no cabeçalho em resoluções desktop, duplicando o controle de expansão já existente na barra lateral.
- **Solução:** Adicionada a classe utilitária `lg:hidden`. O botão agora permanece oculto em computadores e monitores grandes (`>= 1024px`), tornando-se visível exclusivamente em telas de celulares e tablets (`< 1024px`).

#### 8. Implementação do Deslize Interativo no Comparador "Antes e Depois"
- **Causa Raiz:** A barra central divisora do comparador exibia apenas um indicador visual estático da porcentagem, sem permitir que o usuário a movesse diretamente com o mouse ou dedo.
- **Solução:**
  - Adicionados ouvintes globais de ponteiro (`PointerEvents` para mouse, caneta e touch) via `onPointerDown`, `pointermove` e `pointerup`.
  - Implementada zona de toque invisível e ergonômica de 48px com `touch-none` para evitar conflito com o scroll nativo do celular.
  - Adicionado efeito visual dinâmico com brilho azul celeste, escala ampliada (`scale-115`) e anel de foco durante o arraste.
  - Implementada funcionalidade de clique direto em qualquer ponto do comparador para reposicionar a barra instantaneamente, além de controle via teclado (setas para esquerda e direita).

#### 9. Blindagem de Persistência para Chaves de API e Configurações do CRM
- **Causa Raiz:** Ao recarregar a página por inteiro, caso o objeto serializado de configurações gerais sofresse qualquer inconsistência de parse no ambiente sandboxed do navegador, o estado retornava para os padrões mockados (`INITIAL_CRM_SETTINGS`), exigindo que o usuário reconfigurasse as credenciais do Google Maps e provedores de IA. Ademais, faltavam botões de salvar individuais e salvamento automático por perda de foco nas abas.
- **Solução:**
  - **Camada Resiliente `safeStorage`:** Utilitário que opera com fallback inteligente (`localStorage` -> `sessionStorage` -> memória volátil) e tratamento de erros de cota e bloqueio de cookies em iframes.
  - **Persistência Dupla e Chaves Isoladas:** As credenciais críticas (`GOOGLE_MAPS_API_KEY`, `GOOGLE_MAPS_MAP_ID`, `AI_PROVIDERS`, etc.) agora são gravadas tanto no objeto mestre quanto em chaves dedicadas independentes. No boot do app, se o objeto principal não contiver as chaves, os backups dedicados são lidos e injetados de forma transparente.
  - **Auto-Save no `onBlur`:** O campo da chave do Google Maps grava automaticamente a chave assim que o usuário digita ou clica fora do campo de texto.
  - **Botões de Salvar Dedicados por Aba:** Implementados botões individuais de salvar nas abas de Perfil/Closer, Provedores de IA, Funil, Precificação, Google Maps e Email.
  - **Barra Flutuante de Alterações Não Salvas (`isDirty`):** Exibição de barra flutuante inferior com opção de Descartar ou Salvar, além do atalho global de teclado `Ctrl+S` / `Cmd+S`.
  - **Validação e Teste Instantâneo:** Ferramenta de teste de formato e conectividade para a chave de API do Google Maps com feedback visual em tempo real.

#### 10. Correção de Layout e Espaçamento do Botão de Exclusão (Lixeira) nos Provedores de IA
- **Problema:** O ícone de lixeira para remover o provedor de IA estava com posicionamento absoluto (`absolute top-3 right-3`) no card, ficando encostado/colado sobre a borda superior do campo de entrada da Chave de API (que contém o botão de visibilidade de senha com o ícone de olho).
- **Solução:**
  - O botão de remoção foi retirado do posicionamento absoluto e integrado a um cabeçalho estruturado próprio para cada card de provedor (`flex items-center justify-between border-b border-white/5 pb-3`).
  - Adicionada identificação visual de slot (ex: `#1`, `#2`) e o botão agora possui rótulo claro de texto "Remover" com hover e área de toque ergonômica.
  - O grid de campos de formulário (Provedor e Chave de API) agora fica completamente abaixo do cabeçalho com espaçamento generoso, eliminando qualquer sobreposição ou proximidade inadequada.

#### 11. Bairros no Dropdown do Google Maps Prospector ('Caiçaras' e 'Alto Caiçaras' e Novo Bairro Dinâmico)
- **Origem dos Dados no Dropdown (Esclarecimento):**
  - O Google Maps JavaScript API / Places API por padrão não possui um endpoint simples que retorne uma lista exaustiva de todos os bairros de uma cidade em um dropdown estático sem cobrar centenas de requisições geocodificadas e com latência.
  - Por isso, a lista de bairros do seletor é estruturada a partir de um **catálogo curado de alta fidelidade** (`CITY_NEIGHBORHOODS`), somada **dinamicamente aos bairros dos leads já cadastrados no CRM**, e agora complementada pela adição personalizada do próprio usuário.
- **Implementação Realizada:**
  - **Inclusão de 'Alto Caiçaras' e 'Caiçaras':** Ambos os bairros foram adicionados ao catálogo principal de Belo Horizonte - MG, bem como dezenas de outros bairros populares (Alípio de Melo, Carlos Prates, Castelo, Padre Eustáquio, Santa Tereza, Prado, etc.).
  - **Botão `Novo Bairro` e Modal Interativo:** Ao lado do label do filtro de bairro, foi implementado um botão estilo *pill/badge* refinado em tom ciano translúcido (`bg-sky-500/10 border-sky-500/30 text-sky-400`) com ícone único e micro-animação ao passar o mouse, permitindo cadastrar qualquer bairro ou micro-região para a cidade selecionada em segundos sem quebras de layout.
  - **Persistência dos Novos Bairros:** Qualquer bairro adicionado é salvo no navegador via `safeStorage` (`leadsite_custom_neighborhoods_v1`), ficando disponível imediatamente em futuros acessos.
  - **Geração Realista de Endereços Locais:** Na prospecção por radar/scan para o Caiçaras e Alto Caiçaras, o sistema gera endereços coerentes com a região (ex: Av. Dom Pedro II, Rua Belmiro Braga, Rua Rosinha Sigaud).

#### 12. Integração Global de Bairros & Regiões via API Dinâmica (`neighborhoodService.ts`)
- **Arquitetura Híbrida em Tempo Real:**
  - **API Oficial do IBGE (Governo Federal):** Consulta automática aos endpoints de distritos e subdistritos municipais (`https://servicodados.ibge.gov.br/api/v1/localidades/municipios/{id}/distritos` e `/subdistritos`), trazendo divisões administrativas oficiais em segundo plano sem qualquer custo de requisição e com cache inteligente (`leadsite_cached_ibge_neighborhoods_v1`).
  - **Google Places Autocomplete & OpenStreetMap (Nominatim):** Ao digitar no modal de "Novo Bairro", o sistema pesquisa sugestões em tempo real via `google.maps.places.AutocompleteService` (quando a chave de API estiver ativa) e via OpenStreetMap Nominatim como fallback de busca rápida de bairros/regiões.
  - **Catálogo Base de Resiliência Instantânea:** Garante zero latência e experiência fluida caso o usuário esteja offline ou com oscilações de rede.
  - **Bairros do CRM & Personalizados:** Novos bairros adicionados pelo usuário ou importados em leads entram automaticamente no seletor.
- **Preservação Integral da Prospecção:**
  - A assinatura do valor selecionado (`selectedNeighborhood`) e a normalização de strings permanecem 100% idênticas, garantindo que o radar geográfico, as buscas no mapa, os filtros por raio e a geração dinâmica de novos leads continuem funcionando com total precisão.
- **Implementação Global nos Dropdowns:**
  - `GoogleMapsProspector.tsx`: seletor de bairro com indicador visual de status da API (`✓ API Ativa` / `Sincronizando IBGE...`), botão de atualização direta e busca assistida por API.
  - `LeadsProspectorView.tsx`: adicionado o seletor `ResponsiveSelect` de Bairro / Região também na visualização em Grade (Grid View), permitindo filtrar leads por bairro em qualquer modo de exibição.

#### 13. Exportação de Base em Planilha Excel Nativa
- **Causa Raiz:** A necessidade de compartilhar ou processar a base de leads externamente, e o formato JSON era útil apenas para backup entre instâncias.
- **Solução:** 
  - Adicionado suporte a exportação `.xlsx` no painel de configurações do CRM, convertendo os dados estruturados do sistema em abas de "Resumo Executivo" e "Base Completa de Leads".
  - Refinamento visual: Alinhamento de botões de exportação (JSON e Excel) utilizando `mt-auto` em containers de altura completa (`flex-col h-full`) para garantir simetria independente do tamanho do texto das descrições.

#### 14. Validação e Workflow de Rascunho para E-mails
- **Causa Raiz:** O disparo acidental de e-mails de prospecção com informações incompletas ou não revisadas.
- **Solução:**
  - Implementado mecanismo de dupla checagem (`EmailDispatchModal.tsx`). O botão de disparo definitivo foi ocultado na etapa inicial.
  - Criado o fluxo "Validar Rascunho", que salva a versão atual do e-mail no CRM sob o status de `'rascunho'` (identificável visualmente em amarelo no Histórico de E-mails).
  - Somente após a validação explícita do rascunho o botão de disparo principal (`Enviar Definitivo`) torna-se disponível.
  - Sistema reativo: qualquer alteração textual no corpo do e-mail, assunto ou destinatário revoga o status de validação instantaneamente, exigindo nova aprovação.

#### 15. Melhorias Gerais de UI e Acessibilidade (Responsividade e Cursores)
- **Solução:**
  - Os labels de todos os filtros de prospecção (Cidade, Bairro, Nicho, Raio) receberam alturas fixas rigorosas (`h-6`) e os blocos foram definidos como `flex-col justify-end`, alinhando de forma milimétrica os inputs de busca, ignorando elementos sobressalentes como modais de bairro.
  - Correção no estilo de ponteiros do mouse (`cursor-pointer`) nas tabelas, itens clicáveis e modais, fortalecendo as micro-interações da plataforma.
  - Varredura e exclusão de arquivos de debug e temporários que poluíam a árvore de projeto, assegurando a organização estrutural.

---

## 📈 5. Estado Atual e Qualidade de Código

- **Build / Compilação:** 100% aprovado (`npm run build` executado com sucesso).
- **Linter & Tipagem:** 0 erros (`tsc --noEmit` aprovado sem nenhuma violação de tipos).
- **Acessibilidade:** Suporte a toque ergonômico no mobile (alvos de toque >= 44px), navegação por teclado e contraste de cores validado nos modos Claro e Escuro.
- **Integridade dos Dados:** Todas as alterações no CRM (leads, propostas, notas) são persistidas localmente de forma resiliente.

---

*Documento consolidado e atualizado conforme especificações do projeto PROSPECTOR.*
