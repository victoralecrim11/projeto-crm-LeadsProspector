# Stitch, Groq e mídia — validação real de 23/09/2026

## Estado e escopo

Branch `main`, HEAD `a0323c714f9a6cadbcf214c79a8e6b68a06e4c90`. A árvore já estava modificada; alterações anteriores foram preservadas. Não houve commit/push. Este relatório complementa o review e o relatório de correções de mídia. **Não representa homologação integral nem freeze de POST-E.3.9.**

O usuário autorizou executar os testes reais, continuar as correções e registrar os resultados na memória. Configurou Groq na interface durante o teste. Nenhuma chave foi copiada para logs, relatórios, memória ou código.

## Defeitos reproduzidos e corrigidos

1. **Seleção automática do Groq:** o catálogo classificava todos os modelos como compatíveis com Site Builder. A seleção real era `whisper-large-v3-turbo`, `whisper-large-v3`, `qwen/qwen3.8-27b`. Os dois primeiros são de transcrição. `modelRegistry.ts` agora restringe as famílias de geração de texto suportadas, exclui áudio/classificadores e entradas inativas, mantendo os modelos desabilitados fora da seleção. O teste de regressão falhou antes e passou depois da correção.
2. **Imagem full-bleed fora de posição:** `.hero-full-bleed>*` sobrescrevia a posição absoluta e o z-index da camada de fundo. A regra agora exclui `.hero-bg-media`. O teste de geometria reproduziu `position:relative`, cobertura falsa e z-index igual ao título; após a correção, a camada cobre todo o hero em 390/768/1440 px, fica atrás do título e não causa overflow.
3. **Projeto incompleto no retry:** o wizard persistia um projeto antes de receber/validar o standard-AI. Uma falha 503 deixava um registro incompleto. Agora a criação acontece após validar resultado e plano de mídia. Teste: zero projetos após a falha; um após sucesso; uma produção Stitch; duas chamadas de conteúdo com os mesmos IDs.
4. **Estado PARTIAL perdido:** o estado da produção era sobrescrito com `SAVING_PROJECT`. Agora a informação de design parcial é mantida separadamente, inclusive quando a produção retorna terminal imediatamente. O aviso de desktop ausente permanece visível após retry. Progresso de conteúdo usa `GENERATING_CONTENT` e limpa a etapa antiga.

O helper de plano de mídia aceita apenas os campos de projeto de que precisa, permitindo validá-lo antes de persistir. Nenhuma invariante de identidade, alternativas ou contrato foi afrouxada.

## Produção Stitch real

- generationRequestId / designProductionId: `72580aa7-d84b-4c87-9e55-5a27c21c3121`.
- Identidade persistida: `strategy-v1:cae074827a41`.
- Resultado: **PARTIAL**, `COHERENCE_FAILED`, provider `AVAILABLE`, cerca de 431 segundos.
- Três candidatos mobile e um desktop foram persistidos.
- Mobile vencedor: `2969dda6e61d4d9da2e3e78f73b00ce8`; desktop: `ceafd5304e004df3aa6bfb561c796c15`.
- Ambos trazem Playfair Display + Hanken Grotesk e hero full-bleed. Mobile registra tamanho 36; desktop, 48.
- Ordem extraída do mobile: `hero, services, location, about, contact`; desktop: `hero, services, about, contact, location`.
- Essa divergência continua rejeitada pela coerência. O desktop não foi anexado artificialmente e o job não foi promovido para PAIRED. A validação não prova que todo HTML remoto foi interpretado; a projeção permanece limitada ao catálogo e aos IDs observáveis.

A geração começou pelo wizard de Redesenho. Durante a execução, as configurações foram abertas para cadastrar Groq. Após concluir Stitch, o consumidor real foi chamado com os IDs persistidos usando o cliente `generateStandardAiBlueprint`; o resultado foi salvo pelo store real, uma única vez. Não se apresenta esse teste como uma execução ininterrupta do wizard completo.

## Conteúdo real, projeto e imagens

- `/sites/standard-ai`: sucesso com Groq `qwen/qwen3.8-27b`, `mode=standard-ai`, **fallbackUsed=false**, três alternativas válidas.
- Projeto salvo: `proj-fa0f0517-db2f-403f-ab7b-5524fc5115e6`, título `Validação real Stitch + Groq`.
- Abrir: `http://localhost:3000/editor?project=proj-fa0f0517-db2f-403f-ab7b-5524fc5115e6` no navegador que contém o storage deste teste.
- Plano de mídia: hero + about. Editor buscou e adquiriu duas fotos reais do Pexels (126415 e 82130 bytes), persistidas no IndexedDB e referenciadas no manifesto do projeto.
- Ambas carregaram na prévia; o hero full-bleed usa a imagem como fundo. Editor testado em 390/768/1440 px, sem overflow horizontal. Redesenho exibiu o mesmo hero e duas imagens, sem aviso de fallback de IA.
- Fotos permanecem `reviewStatus=selected`, não aprovadas automaticamente para exportação. São ilustrações licenciadas, não fotos confirmadas do estabelecimento.
- Evidência local de screenshot: `scratch/live-stitch-groq-editor.png` (ignorada pelo Git).

Aquisição real por nicho (não são três novas produções Stitch):

| Nicho | Provider | Candidatos | Busca / aquisição | Bytes |
|---|---|---:|---|---:|
| barbershop | Pexels | 10 | 200 / 200 | 126415 |
| hair-salon | Pixabay | 10 | 200 / 200 | 278264 |
| restaurant | Pexels | 10 | 200 / 200 | 156640 |

## Restart e repetição do consumidor

O watcher e seu filho foram identificados antes de parar, e apenas esses processos foram encerrados. Novo watcher iniciado em background; servidor voltou a responder na porta 3000. Não há produção Stitch pendente iniciada por este teste.

Após restart completo, o mesmo consumidor foi chamado com os mesmos IDs e overrides de cores diferentes. Resultado: Groq real sem fallback, strategy canônica preservada, mesma referência mobile, três alternativas. A contagem de projetos permaneceu 4 antes/depois dessa chamada. Não houve POST de produção Stitch adicional no replay.

Hashes SHA-256 dos arquivos antes e depois foram idênticos:

| Arquivo | SHA-256 |
|---|---|
| Job | `5492213C9E47363719CC5F25B4B6A1260DEF40414D3A201E3BE66D66952F79C4` |
| Mobile artifact | `4FCC61E3D4267B36BEBB2C6BF0F29E586F007DF7CCF5B1C0050D87F23033E3EB` |
| Desktop artifact | `1C06DC606898D097856B7AA607D9D24FB90F424766B81EB4A1EFD54B99B18BEE` |

## Comfy Desktop e configuração

Pexels e Pixabay estão configurados no `.env.local` e responderam às chamadas reais. As chaves permaneceram preservadas e o arquivo é ignorado pelo Git. Groq foi configurado pelo usuário no navegador; não foi migrado silenciosamente ao `.env.local`.

Comfy Desktop está instalado. O registro de instalações contém apenas **Comfy Cloud**, `sourceId=cloud`, `remoteUrl=https://cloud.comfy.org/`. Não foi encontrada instalação local nem API ouvindo nas portas locais usuais. Portanto `COMFYUI_BASE_URL` e `COMFYUI_CHECKPOINT` continuam vazios. Abrir o aplicativo Cloud não equivale a instalar um backend local.

**Geração real ComfyUI: NOT_AVAILABLE.** Os testes do workflow e do botão de gerar usam respostas controladas e não são prova de geração remota/local real. Não foram baixados checkpoints, contratados serviços nem modificada a política `AI_IMAGE_ZERO_COST_ONLY=true`.

README da raiz e docs/README foram atualizados com requisitos de API local, descoberta do checkpoint e diferença entre banco de imagens, geração de imagens e IA de conteúdo.

## Validação

| Verificação | Resultado |
|---|---|
| `npm test` | exit 0; **323 testes / 19 suites / 323 PASS / 0 FAIL / 0 skipped** |
| `npm run lint` | exit 0; TypeScript principal, React plugin e producer |
| `npm run build` | exit 0; client e server; avisos existentes de dependências/chunks grandes |
| `git diff --check` | exit 0 |
| `tests/browser/generationRetry.playwright.js` | PASS; PAIRED polled e PARTIAL imediato; falha 503 controlada; sem duplicação |
| `tests/browser/heroMediaLayout.playwright.js` | PASS; geometria real do renderer em 390/768/1440; foto fixture |
| `tests/browser/mediaFlow.playwright.js` | PASS; respostas controladas; seleção, geração, aprovação, persistência, Redesenho/Editor e ZIP |
| `tests/browser/editorProjectIsolation.playwright.js` | PASS; troca salão/barbearia, histórico, save e reload |
| Rotas reais | dashboard, projetos, redesenhar, editor, configurações: sem pageerror nem HTTP local >=400 |
| Stitch real | PARTIAL consumível; não PAIRED |
| Groq real + restart | PASS; duas chamadas sem fallback, identidade preservada |
| Fotos reais | PASS; três nichos e dois providers |
| Fidelidade integral Stitch | PENDENTE; sem comparação pixel a pixel |
| ComfyUI real | NOT_AVAILABLE; apenas Cloud configurado no Desktop |

Logs de comandos em `scratch/validation-20260923-tests.log` e `scratch/validation-20260923-build.log` (ignorados pelo Git).

## Próximos passos e limites

1. Finalizar a instalação **local** do ComfyUI, instalar checkpoint compatível e validar os dois endpoints documentados antes de configurar o CRM.
2. Investigar a diferença de ordem entre telas geradas e a cobertura da extração de seções; preservar a rejeição de incoerência. Não transformar PARTIAL em PAIRED apenas para passar o gate.
3. Fazer nova validação completa de PAIRED com LLM real e comparação visual das duas telas. A execução atual comprova o consumidor real de PARTIAL.
4. Ampliar gradualmente os componentes/evidências suportados pelo renderer. Fontes, cores, hero e fotos já passam pelo fluxo, mas o Blueprint não representa toda composição do Stitch.

**Status: PARCIAL. Homologação/freeze pendentes. Commit: NO. Working tree: DIRTY.**

Fontes oficiais consultadas: [Groq Models](https://console.groq.com/docs/models), [Groq Structured Outputs](https://console.groq.com/docs/structured-outputs) e [Speech to Text](https://console.groq.com/docs/speech-to-text).

## Atualização de memória após publicação — 23/09/2026

O estado Git no início deste relatório era `a0323c714f9a6cadbcf214c79a8e6b68a06e4c90`; as linhas de commit/árvore suja acima descrevem aquele momento histórico. As alterações revisadas foram publicadas em `main`:

- Código: `dec852b2c8da040364fee338aa6bf0cb78825d97` — `fix: estabiliza geração Stitch, mídia e editor visual`.
- Parent: `a0323c714f9a6cadbcf214c79a8e6b68a06e4c90`.
- Destino: `origin/main`; push concluído.
- O teste completo final ficou em 323 PASS / 0 FAIL; lint e builds cliente/servidor passaram.
- `.env.local` permanece local e ignorado pelo Git.

A preparação standard-ai com Groq real e fallback desligado passou após restart. A produção Stitch mais recente segue PARTIAL por incoerência real na ordem de seções; a integridade não foi afrouxada para produzir PAIRED. Comparação visual integral e geração real pelo ComfyUI local continuam pendentes. Portanto este push registra código e documentação, não uma homologação ou freeze da fase.
