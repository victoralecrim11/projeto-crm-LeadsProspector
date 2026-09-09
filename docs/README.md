# 🎯 PROSPECTOR CRM — Prospecção Local com OpenStreetMap

Plataforma full-stack para encontrar negócios locais, organizar oportunidades comerciais e conduzir a venda de sites e serviços recorrentes.

O fluxo principal reúne prospecção geográfica, auditoria, abordagem comercial, geração de propostas, follow-up, contratos e acompanhamento de receita em um único CRM.

## Estado atual

O gerador de sites evoluiu para uma nova **Fase B** de auditoria e um pipeline de renderização **Visual P0**. Utilizando um novo Blueprint validado (v2), o sistema usa IA real no backend precedida por curadoria de referências e uma auditoria independente, permitindo edição por seção com renderizações visuais variadas e suporte a viewports nativos, mantendo exportação totalmente estática.

| Área | Recursos disponíveis |
|---|---|
| **Radar local OSM** | Consulta negócios reais cadastrados no OpenStreetMap por cidade, bairro/região, nicho e raio de 5 a 50 km. As consultas passam pelo proxy Overpass do servidor, com fallback entre endpoints. |
| **Rastreabilidade geográfica** | Cada resultado OSM pode abrir a coordenada exata no Google Maps, o ponto exato no OpenStreetMap e o registro original (`node`, `way` ou `relation`). |
| **Busca comercial no Maps** | Ação separada que pesquisa nome, categoria e localização no Google Maps. Ela ajuda na conferência manual, mas não altera nem valida automaticamente o registro OSM. |
| **Mapa responsivo** | Mapa e popup adaptados para desktop e celular, com ações compactas, detalhes visíveis e altura limitada por breakpoint. |
| **CRM e funil** | Cadastro de leads, etapas comerciais, valores de setup e MRR, anotações, follow-up, contratos, projetos e agenda. |
| **Scripts com IA** | Geração e melhoria de textos de abordagem, follow-up e objeção diretamente nos detalhes do lead, com opção de restaurar o texto original. |
| **Integração Gemini & Site Builder** | Modelos estáveis com retentativas e fallback. O editor visual avançado possui visualizações flexíveis (variantes por seção). Exportação de arquivos de design e blueprints atualizados. |
| **Busca global** | O botão **Buscar** e o atalho `Ctrl + K` ou `Cmd + K` abrem a paleta de empresas, páginas e ações rápidas. |
| **Exportação** | Exportação da base de leads para Excel (`.xlsx`) com resumo e dados comerciais. |

## Origem e interpretação dos dados

O radar local usa **OpenStreetMap/Overpass** como fonte. O selo `REAL OSM` significa que o registro veio diretamente do OSM; ele não garante que o estabelecimento ainda esteja ativo, nem que os dados estejam completos.

- Avaliação, telefone, site e endereço só são exibidos quando existem nos dados disponíveis.
- “Site não informado no OSM” não prova que a empresa não possui site.
- A busca comercial no Google Maps é apenas uma conferência externa por texto.
- O botão de coordenada abre exatamente a latitude e longitude recebidas do OSM, mesmo quando o Google Maps não associa o ponto a uma ficha comercial.

## Tecnologias

- React 19, TypeScript 5.8 e Vite 6.
- Tailwind CSS 4 e Lucide React.
- Zustand para estado global e `safeStorage` para persistência no navegador.
- Express para servir a aplicação e os proxies locais; na Vercel, o mesmo app é uma única Function Node.js.
- Leaflet, OpenStreetMap, Overpass API, Nominatim e BrasilAPI/IBGE.
- Google GenAI e provedores configuráveis para recursos de inteligência artificial.
- ExcelJS, FileSaver, jsPDF e HTML2Canvas para exportações e documentos.

## Requisitos

- Node.js 22 LTS.
- npm compatível com a versão instalada do Node.js.
- Acesso à internet para consultas OSM, busca externa no Maps e provedores de IA em nuvem.

## Instalação rápida

```bash
git clone https://github.com/victoralecrim11/projeto-crm-LeadsProspector.git
cd projeto-crm-LeadsProspector
npm install
npm run dev
```

A aplicação fica disponível em [http://localhost:3000](http://localhost:3000).

## Configuração

### Inteligência artificial

**Sites:** o catálogo é consultado em `GET /api/ai/models`. Escolha Automático, Rápido, Qualidade, Premium ou Local; a seleção explícita não troca de modelo silenciosamente. Gemini é o provedor principal e Ollama é opcional. Modelos listados não garantem disponibilidade/cota no momento da geração.

Para credenciais da plataforma, configure no servidor:

```env
GEMINI_API_KEY=sua_chave
SITE_AI_ACCESS_TOKEN=um_segredo_longo
# Opcional, acessível apenas pelo backend:
# OLLAMA_BASE_URL=http://127.0.0.1:11434
# SITE_AI_DISABLED_MODELS=gemini:id-do-modelo
```

Em produção, o uso da chave interna/Ollama exige o token em **Conexão avançada** do gerador/editor. Ele fica somente em memória na sessão atual; não é incluído no bundle. Isso é proteção de MVP, não substitui autenticação individual e rate limiting distribuído. Use HTTPS e não exponha o Ollama publicamente. A chave BYOK Gemini cadastrada no CRM continua disponível como alternativa separada.

**Scripts comerciais (legado):** mantêm a integração existente descrita abaixo, separada do novo pipeline de sites.

Os provedores podem ser cadastrados em **Configurações → Inteligência Artificial**. Para o Gemini, a aplicação tenta modelos estáveis em ordem de fallback e não inclui a chave na URL da requisição.

Use **Testar Conexão da API** para executar uma chamada real. O resultado aparece no console e na interface, exibindo claramente também os limites de conexões estabelecidos para a conta (p. ex., limites OpenAI).

O endpoint de geração executado pelo servidor também aceita a variável abaixo em um arquivo `.env` local:

```env
GEMINI_API_KEY=sua_chave_do_google_ai_studio
```

As chaves cadastradas pela interface são persistidas no armazenamento local do navegador. Esse armazenamento não equivale a um cofre criptografado; evite usar chaves sensíveis em computadores compartilhados e aplique restrições de uso no provedor.

### Tiles do mapa

Por padrão, o mapa usa os tiles públicos do OpenStreetMap. Uma fonte compatível pode ser definida com:

```env
VITE_MAP_TILE_URL=https://seu-servidor/{z}/{x}/{y}.png
VITE_MAP_TILE_ATTRIBUTION=Texto de atribuição exigido pelo provedor
```

Mantenha sempre a atribuição exigida pelo fornecedor dos tiles.

## Fluxo recomendado

1. Abra **Radar de Prospecção Local**.
2. Escolha a cidade, o bairro/região, o nicho e o raio.
3. Execute a busca e confira os marcadores `REAL OSM`.
4. Use **Buscar empresa no Google Maps** para comparar o nome comercial.
5. Use os botões de coordenada e origem OSM para confirmar o ponto geográfico.
6. Abra **Ver detalhes**, adicione o lead ao CRM e prepare a abordagem.
7. Gere ou melhore o script com IA, registre o contato e avance o lead pelo funil.
8. Em **Gerar Site IA**, selecione lead, template, estilo, objetivo e estratégia/modelo.
9. O backend auditará (Fase B) e definirá um design com base em templates modulares (Renderer Visual P0). No editor, revise textos e sugestões, confira Desktop/Tablet/Mobile, ajuste componentes e seções, e salve.
10. Confirme a revisão e aceite ou remova os serviços sugeridos para exportar `site.zip`. Extraia e abra `index.html` fora do CRM. Exportar não publica o site.

Projetos persistem Blueprint v2, contexto e modelo utilizado. O salvamento acusa falhas de armazenamento em vez de confirmar dados não gravados. A paleta global também pesquisa projetos e contratos.

## Comandos disponíveis

| Comando | Finalidade |
|---|---|
| `npm run dev` | Inicia o servidor Express com Vite em modo de desenvolvimento. |
| `npm test` | Executa todos os testes automatizados da pasta `tests/`. |
| `npm run lint` | Valida a tipagem TypeScript sem gerar arquivos. |
| `npm run build` | Gera o frontend e o servidor de produção em `dist/`. |
| `npm run build:client` | Gera somente os arquivos estáticos do Vite, usado pela Vercel. |
| `npm run build:server` | Gera o bundle do servidor Node local em `dist/server.cjs`. |
| `npm start` | Inicia o bundle de produção previamente gerado. |

## Organização dos testes

Os testes ficam fora do código de produção e espelham as áreas verificadas:

```text
tests/
├── components/
├── fixtures/
├── manual/
├── services/
│   ├── phaseB.test.ts
│   ├── visualRenderer.test.ts
│   ├── visualBlueprint.test.ts
│   ├── vercelRuntime.test.ts
│   └── ...
└── utils/
```

A suíte cobre amplamente:
- Auditoria do sistema (Phase B) e resoluções de design-families.
- Blueprint estrito (v2), renderizações variantes nas seções modulares (Hero, About, etc).
- Seleção explícita/automática, falhas, regeneração parcial, persistência e export do ZIP com referências de design.
- Entrada HTTP inválida e proteção de origem.
- Autenticação e fallback de modelos.
- Resposta do teste real de conexão com provedores de IA.
- Busca global e integração Maps.

## Documentação do projeto

Documentos humanos são mantidos na pasta `docs/`; especificações formais desta fase ficam em `openspec/`:

- [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md): resumo técnico do estado atual do sistema;
- [BRASILAPI_VIABILIDADE.md](BRASILAPI_VIABILIDADE.md): análise do uso da BrasilAPI no fluxo de prospecção.
- [AI_SITE_IMPLEMENTATION.md](AI_SITE_IMPLEMENTATION.md): arquitetura, evidências e limitações do gerador visual.

Novos documentos humanos `.md` devem ser criados dentro de `docs/`. A exceção é o workflow OpenSpec em `openspec/`.

## Persistência local

Leads, configurações e rascunhos são gerenciados por stores Zustand e persistidos por `safeStorage`, que tenta `localStorage` e usa `sessionStorage` como alternativa. Limpar os dados do navegador pode remover essas informações; exporte a base regularmente quando os registros forem importantes.

## Build de produção

```bash
npm run build
```

Depois, inicie o servidor em modo de produção conforme o terminal utilizado:

```powershell
# PowerShell
$env:NODE_ENV = "production"
npm start
```

```bash
# Bash, zsh ou Git Bash
NODE_ENV=production npm start
```

O servidor entrega os arquivos compilados de `dist/` e mantém disponíveis as rotas locais usadas pelos proxies e pela geração via servidor.

### Deploy na Vercel

O deploy usa `api/index.ts` como uma única Vercel Function Express. O `vercel.json` encaminha `/api/*` para essa função e envia as demais rotas sem arquivo para `index.html`, preservando a navegação da SPA.

A Vercel executa apenas `npm run build:client`. Assim, `dist/server.cjs` continua disponível para hospedagem Node tradicional, mas não é publicado como arquivo estático. A Function usa Node.js 22 e duração máxima de 60 segundos.

Configure `GEMINI_API_KEY` e `SITE_AI_ACCESS_TOKEN` em **Vercel → Project Settings → Environment Variables** quando quiser oferecer a credencial interna do servidor. Sem essas variáveis, a geração continua disponível por BYOK configurado no CRM. Um `OLLAMA_BASE_URL` local (`127.0.0.1`) não é acessível a partir da Vercel.

Para reproduzir o empacotamento e as rotas antes de publicar:

```bash
vercel pull --yes
vercel build
vercel dev
```

---

Referência de workflow inspirada no projeto [PROSPECTOR-DE-SITES](https://github.com/ArrecheNeto/PROSPECTOR-DE-SITES), de ArrecheNeto.
