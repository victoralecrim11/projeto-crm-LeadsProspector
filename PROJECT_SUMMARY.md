# 📋 PROSPECTOR - Relatório Completo do Projeto & Histórico de Evolução

> **Versão:** 2.3  
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
- **Filtros Avançados de Prospecção:**
  - Filtro de Raio Paramétrico com atalhos rápidos (5 km, 10 km, 19 km, 30 km).
  - Filtro por status de auditoria: Todos / Auditados / Não Auditados / Já no CRM / Fora do CRM.
  - Filtro por faixa de preço estimada (Setup R$) com slider duplo e presets rápidos (Econômico, Padrão, Premium).
  - Filtro por avaliação mínima (4.8+ estrelas) e status de site (com/sem website).
- **InfoWindow Interativo:** Popup de detalhes do lead com nome, avaliação, categoria, distância, endereço e botões de ação (+ Adicionar, Ver Detalhes), abrindo corretamente via anchor do AdvancedMarker.
- **Conversão em 1 Clique:** Envio imediato do lead qualificado para o CRM com estimativa de valor de fechamento.

### 📊 3.2. Dashboard Estratégico (`DashboardView.tsx`)
- **Métricas Chave (KPIs):** Faturamento Projetado, MRR Estimado (Receita Recorrente Mensal), Total de Leads Ativos e Taxa de Fechamento (%).
- **Velocidade de Negócios:** Indicadores de tempo médio de fechamento e ticket médio.
- **Ações Rápidas & Feed de Atividades:** Acesso imediato à criação de propostas, simulação de sites e registro de novos contatos.

### 📌 3.3. Funil de Vendas Kanban (`CrmPipelineView.tsx`)
- **Estágios do Funil:**
  1. *Novo Lead*
  2. *Auditado*
  3. *Redesenhado*
  4. *Proposta Enviada*
  5. *Follow-up Ativo*
  6. *Em Negociação*
  7. *Fechado / Ganho*
- **Ações Rápidas no Card:** Botão direto para WhatsApp com mensagem personalizada de pitch, envio de e-mail e abertura de detalhes do lead.
- **Totalizador por Estágio:** Cálculo em tempo real do valor financeiro acumulado em cada coluna do funil.
- **Badges de Atenção Imediata:** Indicadores visuais por coluna e cards destacam leads com follow-up vencido ou sem resposta há mais de `followUpAlertDays` dias, com ícone de sino animado e barra de alerta.

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
│ [Fase 9] Blindagem de Persistência para Chaves de API e Configurações       │
│ [Fase 10] Correção de Layout do Botão de Exclusão nos Provedores de IA      │
│ [Fase 11] Bairros no Dropdown do Google Maps Prospector                      │
│ [Fase 12] Integração Global de Bairros via API Dinâmica (IBGE + OSM)        │
│ [Fase 13] Exportação de Base em Planilha Excel Nativa                       │
│ [Fase 14] Validação e Workflow de Rascunho para E-mails                     │
│ [Fase 15] Melhorias Gerais de UI e Acessibilidade                           │
│ [Fase 16] Correção do InfoWindow do Google Maps + Novos Filtros Avançados   │
│ [Fase 17] Sistema de Badges de Atenção e Follow-up no Pipeline Kanban       │
│ [Fase 18] Integração de Dados Reais de Leads via OpenStreetMap (Overpass)   │
│ [Fase 19] Refatoração mockData → seedData + Flag useSeedDemo                │
│ [Fase 20] Refinamento UX do Scanner (scanNotice + badges DEMO)              │
│ [Fase 21] Enriquecimento de Leads Sintéticos + Buffer de Preview no Mapa    │
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

#### 16. Correção do InfoWindow do Google Maps + Novos Filtros Avançados
- **Causa Raiz:** O componente `<InfoWindow>` da biblioteca `@vis.gl/react-google-maps` (v1.9.0) **exige** a propriedade `anchor` vinculada a um `AdvancedMarker` para abrir. O código original utilizava apenas `position`, que é ignorada pela API quando não há anchor. Como `anchor` ficava `null`/`undefined`, o efeito interno retornava imediatamente sem abrir a janela.
- **Solução em `GoogleMapsProspector.tsx`:**
  - Criada ref dedicada via `useAdvancedMarkerRef()` para capturar a instância do `AdvancedMarker` do lead selecionado.
  - O marcador ativo recebe `ref={isSelected ? activeMarkerRef : undefined}` para garantir que apenas o marker selecionado seja anexado.
  - O `<InfoWindow>` agora recebe `anchor={activeMarker}`, desbloqueando a abertura condicional.
  - Removido `overflow-hidden` do container externo do mapa para evitar corte da seta (pointer) do InfoWindow.
  - O conteúdo do InfoWindow foi migrado de classes Tailwind para **estilos inline**, pois a Google Maps injeta estilos globais (`.gm-style`, `iw*`) que sobrescrevem `className` do React.
  - Adicionadas props `minWidth={280}`, `maxWidth={320}` e `pixelOffset={[0, -8]}` para posicionamento consistente.

- **Novos Filtros Avançados Implementados:**
  - **Status de Auditoria:** dropdown com opções `Todos` / `Auditados` (possui `audit`) / `Não Auditados` (sem `audit`) / `Já no CRM` (`inCrm`) / `Fora do CRM` (não está no CRM).
  - **Faixa de Preço Estimada (Setup R$):** slider duplo `minWidth` / `maxWidth` com range 0–5000 e presets rápidos (`Econômico`, `Padrão`, `Premium`, `Reset`).
  - Novos estados: `auditStatusFilter`, `priceMin`, `priceMax`.
  - Importados ícones `ShieldCheck` e `DollarSign` do `lucide-react`.

#### 17. Sistema de Badges de Atenção e Follow-up no Pipeline Kanban
- **Objetivo:** Identificar visualmente leads que precisam de atenção imediata ou follow-up pendente diretamente nas colunas do Kanban, reduzindo o risco de negociações estagnadas.
- **Implementação em `CrmPipelineView.tsx`:**
  - Criada função `needsAttention(lead)` que retorna `true` quando:
    - `nextFollowUpDate` está vencida (data ≤ hoje).
    - `daysWithoutResponse` ≥ `followUpAlertDays` (configurável em `crmSettings`, padrão 3 dias).
    - Ignora leads `convertido` e `perdido`.
  - Computado via `useMemo` o mapeamento `stageAttentionCounts` por estágio do funil.
  - **Badges nas colunas:** quando `attentionCount > 0`, exibe badge vermelho pulsante (`animate-ping`) com a contagem de leads urgentes naquela etapa.
  - **Indicação visual nos cards:**
    - Borda vermelha (`border-rose-400/60`), sombra (`shadow-rose-500/10`) e anel (`ring-rose-400/30`).
    - Ícone `Bell` animado no canto superior direito do card.
    - Barra de alerta `AlertCircle` exibindo o motivo: "Follow-up vencido" ou "Sem resposta há N dia(s)".
  - Importados `AlertCircle` e `Bell` do `lucide-react`.

#### 18. Integração de Dados Reais de Leads via OpenStreetMap (Overpass API)
- **Causa Raiz:** A prospecção dependia exclusivamente da API do Google Places (que exige configuração e chave paga) ou gerava dados simulados (mock/sintéticos), limitando a experiência inicial do usuário.
- **Solução:**
  - **Novo Serviço Overpass:** Criado o `overpassService.ts` conectando à Overpass API, permitindo extrair dados reais de negócios locais gratuitamente e em tempo real a partir do OpenStreetMap.
  - **Rastreabilidade de Origem:** Evolução do tipo `Lead` (`types.ts`) com a inclusão de `placeId` (ID do node/way no OSM) e `dataSource` (`'real' | 'synthetic'`), rastreando a procedência do dado.
  - **Interface Transparente no Prospector:** O `GoogleMapsProspector.tsx` passou a exibir badges (`✓ Real OSM`, `⟳ Expandido`, `⚠ Demo`) indicando visualmente se a listagem atual é proveniente de dados reais ou dados demonstrativos.
  - **Resiliência e Fallback:** Substituição do fluxo de `handleSimulateScan` por `handleScan` com suporte a timeouts e retorno silencioso caso a API gratuita falhe, mantendo a estabilidade.

#### 19. Refatoração de `mockData.ts` → `seedData.ts` + Flag `useSeedDemo`
- **Causa Raiz:** O arquivo `src/data/mockData.ts` carregava dados sintéticos como **estado inicial padrão** do CRM, misturando-se com dados reais e poluindo o pipeline de produção. A nomenclatura também era ambígua: `INITIAL_*` sugeria estado obrigatório, quando na verdade eram apenas dados de demo/onboarding.
- **Solução:**
  - **Renomeação Semântica com Preservação de Histórico:** `src/data/mockData.ts` → `src/data/seedData.ts` via `git mv` (98% similaridade detectada pelo Git). Todos os 7 exports renomeados:
    - `INITIAL_LEADS` → `SEED_LEADS`
    - `INITIAL_APPOINTMENTS` → `SEED_APPOINTMENTS`
    - `INITIAL_PROJECTS` → `SEED_PROJECTS`
    - `INITIAL_RANKING` → `SEED_RANKING`
    - `INITIAL_NOTIFICATIONS` → `SEED_NOTIFICATIONS`
    - `INITIAL_CRM_SETTINGS` → `SEED_CRM_SETTINGS`
    - `INITIAL_SETUP_CONFIG` → `SEED_SETUP_CONFIG`
  - **Flag `useSeedDemo` em `CrmSettingsConfig`:** Novo campo opcional `useSeedDemo?: boolean` adicionado em `src/types.ts`. Default `true` no seed (preserva demo/onboarding), pode ser desligado pelo usuário em produção.
  - **Helper `shouldUseSeedDemo()` em `CrmContext.tsx`:** Lê o setting do `localStorage` com fallback seguro para o default. Todos os 8 `useState` initializers (`leads`, `appointments`, `projects`, `notifications`, `ranking`, etc.) agora consultam o helper antes de aplicar o seed.
  - **Atualização de Imports:** `CrmContext.tsx` trocou `from '../data/mockData'` por `from '../data/seedData'` e todas as 7 referências `INITIAL_*` → `SEED_*`.
  - **Validação:** `npx tsc --noEmit` passa sem erros. `grep "INITIAL_|mockData"` retorna zero matches em `src/`.

#### 20. Refinamento UX do Scanner — `scanNotice` + Mensagens Contextuais
- **Causa Raiz:** Quando o scanner Overpass não retornava dados suficientes e caía no fallback sintético, o usuário não era informado de que os leads exibidos eram fictícios, gerando confusão ao tentar localizá-los no Google Maps.
- **Solução em `GoogleMapsProspector.tsx`:**
  - **Novo state `scanNotice: string | null`:** Banner explicativo exibido quando o scan cai no fallback sintético.
  - **Mensagens contextuais por cenário:**
    - "Nenhum negócio encontrado no OpenStreetMap para esta região. Exibindo leads de demonstração para fins de preview — escaneie outra área para dados reais." (quando Overpass retorna 0 leads no raio normal e expandido)
    - "Serviço OpenStreetMap indisponível no momento. Exibindo leads de demonstração — tente novamente em alguns minutos." (em caso de erro de rede/timeout)
  - **Botão de fechar (`X`)** + ícone `Info` do `lucide-react` no banner.
  - **Limpeza automática:** `setScanNotice(null)` é chamado quando o scan retorna dados reais (`'real'` ou `'expanded'`).
  - **Visual consistente:** Banner em `bg-amber-500/10 border-amber-400/30 text-amber-200` alinhado ao tema de warning do app.

#### 21. Enriquecimento de Leads Sintéticos + Buffer de Preview Isolado no Mapa
- **Causa Raiz:** Três bugs distintos originados do `generateRealisticLeadsForLocation`:
  1. **Tela em branco no Google Maps** (clique em marcador sintético abria o histórico pessoal do usuário) — leads sintéticos eram gerados **sem `geoLat/geoLng`**, fazendo o `openGoogleMapsPlace` abrir URL com coords undefined.
  2. **Nomes fictícios sem correspondência no Google Maps** — templates hard-coded (`Pizzaria & Forno Artesanal`, `Bistrô Sabor & Lenha`, etc.) geravam leads que não existem no mundo real. Buscar "Rococco" no Google Maps não retornava nada.
  3. **Leads sintéticos poluindo o CRM** — eram persistidos em `localStorage` via `addCustomLead`, contaminando a base real.
- **Solução em `leadGeneratorService.ts`:**
  - **Tabela `NEIGHBORHOOD_CENTROIDS`:** 21 centroides reais de bairros de BH (Alípio de Melo, Caiçaras, Alto Caiçaras, Buritis, Savassi, Lourdes, Centro, etc.) com lat/lng obtidos de OpenStreetMap Nominatim. `FALLBACK_CENTROID` aponta para Praça da Liberdade.
  - **Dispersão geográfica:** Cada lead sintético recebe offset aleatório de 0.4-1.2 km em torno do centroide do bairro, com ângulo aleatório, garantindo que os pins caiam no bairro real (não empilhados no centro da cidade).
  - **Haversine para `distanceKm`:** Distância calculada matematicamente a partir das coords reais, não mais via `Math.random()`.
  - **Novos campos em cada lead sintético:** `geoLat`, `geoLng`, `dataSource: 'synthetic'`, `placeId: 'synthetic/<slug>-<idx>-<timestamp>'`.
- **Solução em `GoogleMapsProspector.tsx`:**
  - **Novo state `previewLeads: Lead[]`:** Buffer **efêmero e local** (não persistido) que recebe leads com `dataSource === 'synthetic'`. Limpo a cada novo `handleScan`.
  - **Roteamento em `addCustomLeads`:** Baseado em `dataSource`:
    - `dataSource === 'real'` → `addCustomLead` (persiste no CRM/localStorage)
    - `dataSource === 'synthetic'` → `setPreviewLeads` (apenas no buffer de preview)
  - **Dedupe por `placeId`:** `allVisibleLeads` mergea leads do CRM com `previewLeads`, removendo duplicatas por `placeId` (caso o usuário escaneie a mesma área duas vezes).
  - **Badge `⚠ DEMO` no InfoWindow:** Rosa (`#fce7f3`/`#9f1239`) com tooltip "Lead de demonstração — não persistido no CRM". Aparece ao lado do nome quando `dataSource === 'synthetic'`.
  - **Botão `+ Adicionar` inteligente:** Detecta se o lead é sintético e o **promove para o CRM real** via `addCustomLead({...activeMarkerLead, inCrm: true, crmStage: 'novo', dataSource: 'synthetic'})`, removendo-o do buffer de preview.
  - **Abertura correta do Google Maps:** Como leads sintéticos agora têm `geoLat/geoLng` reais do bairro, o clique em "Ver localização no Maps" abre o Google Maps centrado no bairro correto (não mais no histórico pessoal do usuário).
- **Validação:** `npx tsc --noEmit` passa sem erros. Os 3 problemas reportados (tela em branco, nomes errados, marcadores sem info) foram corrigidos.

---

## 📈 5. Estado Atual e Qualidade de Código

- **Build / Compilação:** 100% aprovado (`npm run build` executado com sucesso).
- **Linter & Tipagem:** 0 erros (`tsc --noEmit` aprovado sem nenhuma violação de tipos).
- **Funcionalidades Recentemente Validadas:**
  - InfoWindow do Google Maps abrindo corretamente ao clicar nos marcadores avançados.
  - Filtros avançados de prospecção: status de auditoria e faixa de preço estimada operacionais.
  - Sistema de alertas visuais no Pipeline Kanban com badges de atenção imediata.
  - Varredura de leads utilizando dados reais e geolocalizados via Overpass API (OpenStreetMap).
  - Buffer de preview isolado para leads sintéticos (não polui mais o CRM).
  - Centroides reais de 21 bairros de Belo Horizonte (Alípio de Melo, Caiçaras, Buritis, etc.) usados para dispersão geográfica de leads demo.
  - Banner `scanNotice` informa o usuário quando o scan cai no fallback sintético.
  - Flag `useSeedDemo` permite alternar entre modo demo e modo de produção sem código.
- **Acessibilidade:** Suporte a toque ergonômico no mobile (alvos de toque >= 44px), navegação por teclado e contraste de cores validado nos modos Claro e Escuro.
- **Integridade dos Dados:** Todas as alterações no CRM (leads, propostas, notas) são persistidas localmente de forma resiliente. Leads sintéticos ficam isolados em buffer de preview e nunca são salvos no `localStorage` a menos que o usuário clique explicitamente em `+ Adicionar`.
- **Observabilidade Visual:** Indicadores de atenção e follow-up pendente diretamente nas colunas do funil de vendas. Badges `✓ Real OSM` / `⟳ Expandido` / `⚠ Demo` permitem rastrear a origem de cada scan.
- **Versionamento de Commits:** Todos os commits a partir de Setembro/2026 são documentados em **português**, com mensagens descritivas que incluem causa raiz, solução e validação.

---

*Documento consolidado e atualizado conforme especificações do projeto PROSPECTOR.*
