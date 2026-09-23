# Review do fluxo Stitch, imagens e publicação

Data: 22/09/2026. Branch: main. HEAD: a0323c714f9a6cadbcf214c79a8e6b68a06e4c90.
Escopo: código atual, incluindo alterações locais ainda não commitadas; produção dbf59a9d-7d00-44bd-90cb-01a86414b086 (Subway). Revisão pela skill code-review-and-quality. Esta revisão não altera a aplicação nem cria designs/imagens remotos.

## Conclusão

O fluxo ainda não entrega fidelidade visual ao Stitch. Ele gera referências remotas, extrai principalmente cores, escolhe um componente do catálogo local e usa o LLM para conteúdo. A cadeia de imagens tem interrupções reais, além de provedores de fotografia não configurados. Corrigir somente a disponibilidade do Gemini ou melhorar seu prompt não resolve essas perdas.

Nesta produção, o Gemini teve sucesso: siteai_6e0bc453-bc42-407b-b6e1-5696101d0c1f, modelo gemini-3.8-flash, 34.330 ms. Portanto, o resultado genérico desta captura não deve ser atribuído ao fallback do LLM. O Stitch terminou PARTIAL, com erro do desktop. A etapa de design levou aproximadamente 6 minutos.

## Fluxo observado

1. Wizard transforma o lead em sourceContext, preferências e DesignStrategy.
2. Producer solicita três direções mobile abstratas ao Stitch; persiste artifacts e escolhe um vencedor.
3. Companion solicita uma tela desktop no mesmo projeto; validação e consumer replay determinam PAIRED/PARTIAL/FAILED.
4. Consumer resolve artifacts pela identidade persistida e traduz o candidato em ResolvedDesign/família local.
5. Gemini gera Blueprint de conteúdo; preserveDesign substitui layout, apresentação, cores e ordem pelo design local resolvido.
6. Wizard cria um MediaPlan e declara geração concluída. Ele não adquire nem gera as imagens nesse momento.
7. Editor tenta buscar imagens de banco em segundo plano; mídia aprovada é persistida no IndexedDB e no manifesto.
8. Prévia e ZIP usam o renderer React de componentes limitados; atualmente não recebem/aplicam todos os mesmos dados.

## Achados priorizados

### R1 — P1: a composição real do Stitch é descartada

Evidência: tools/stitch-producer/clients/realStitchMcpClient.ts:78–81, clients/stitchScreenAdapter.ts:15–35, producerMapper.ts:41–53; src/site-builder/stitchVisualEvidence.ts:5; server/services/research/standardAiService.ts:58–63.

O adaptador extrai identidade, screenshot e cores literais do HTML. Não extrai fontes, grade, hierarquia, margens, bordas, imagens, recortes ou estrutura. O mapper preenche split/standard/grid; arrays vazios também impedem os fallbacks escritos com `||`, pois [] é truthy. Os três artifacts desta produção têm exatamente esses padrões, arrays de layout/tipografia/espaçamento vazios e 47 cores cada.

O renderer resolve só componentes predefinidos. preserveDesign impede que o LLM altere essa composição, mesmo quando sua chamada tem sucesso. O monograma S é o fallback explícito de hero/index.tsx:23 quando não há mídia.

Correção recomendada: um contrato visual estruturado, validado e versionado, derivado da tela escolhida (tipografia, composição, tokens, slots e tratamento de imagens, variações responsivas). Renderer e export devem consumir esse contrato. Preservar IDs originais; não executar HTML externo nem fabricar sinais ausentes. Declarar perda de conversão quando um recurso não é suportado.

### R2 — P1: seleção automática lê candidatos antigos e pode perder entradas de mídia

Evidência: src/site-builder/media/autoResolveService.ts:29–40; useMediaManager.ts:131,208–218.

searchMedia atualiza estado React e retorna void. autoResolveEligibleMedia espera 100 ms e consulta o objeto manager capturado antes da atualização. Uma nova renderização cria outro objeto; o atraso não atualiza a referência antiga. Reproduzido: busca publica um candidato no novo estado, mas auto-resolve retorna resolved=0/skipped=1 e nunca chama selectCandidate.

Além disso, selectCandidate reconstrói o manifesto a partir de `manifest` capturado. Um laço com o mesmo callback selecionando hero e about pode substituir uma entrada pela outra. Erros de aquisição são capturados e retornam undefined, porém auto-resolve incrementa resolved mesmo assim.

Correção: searchMedia retornar candidatos explicitamente; selectCandidate retornar resultado discriminado; atualizar/acumular manifesto por operação com estado atual, sem timeouts de sincronização. Testar busca e aquisição reais com dependências externas controladas, duas imagens e uma falha intermediária.

### R3 — P1: “Gerar Imagem” não está ligado a uma implementação no editor

Evidência: src/site-builder/components/MediaPicker.tsx:214; src/components/VisualEditorView.tsx:576; src/site-builder/media/useMediaManager.ts.

MediaPicker mostra o botão e executa `generateMedia?.(...)`. A prop é opcional; o editor não a fornece e o hook não oferece essa operação. O endpoint /api/ai/media/generate existe, mas não há ligação completa a partir desse botão. A presença da tela e do endpoint não comprova uma geração funcional.

Correção: ligar a ação a um serviço tipado com estado, erro e candidato resultante; desabilitar/explicar indisponibilidade enquanto não houver provedor pronto.

### R4 — P1: ComfyUI envia um workflow incompleto

Evidência: server/services/media/providers/comfyui.ts:56–72.

O payload contém dois CLIPTextEncode apenas. Faltam entradas clip, carregamento do modelo e conexões até amostragem/decodificação/saída. O próprio comentário indica payload para mock/configuração específica. w/h e seed calculados não chegam a um grafo executável. isConfigured retorna true incondicionalmente, sem demonstrar que há serviço e modelo utilizáveis.

O exemplo oficial usa um grafo conectado com carregamento de checkpoint, latent, sampler, codificação, decodificação e SaveImage: https://github.com/Comfy-Org/ComfyUI/blob/master/script_examples/basic_api_example.py.

Correção: aceitar um workflow API validado para a instalação/modelo reais, aplicar prompt/seed/dimensões a nós conhecidos e verificar saída de imagem. Separar configurado, disponível e capaz de gerar. Não homologar usando somente um mock que aceita qualquer payload.

### R5 — P1: imagem gerada é incompatível com aquisição e persistência

Evidência: comfyui.ts:142–156; src/site-builder/contracts/media.ts:28–50; server/services/media/mediaAcquisitionService.ts:13–16,71–92; useMediaManager.ts:183–205.

ComfyUI retorna provider=dall-e, sem version=1, confidence=100, URL HTTP local e dimensões 1024x1024 mesmo para pedido 16:9. Reproduzi a validação: falha em version, previewUrl e confidence. A rota de aquisição aceita apenas HTTPS e hosts Pexels/Pixabay. Mesmo que gerasse um arquivo, a cadeia atual não o adquiriria. A persistência também marca sempre licensed=true, aiGenerated=false e sourceType=licensed.

Correção: contrato canônico com provider real e proveniência correta. Adquirir binário do provedor local no backend por adaptador dedicado e configurado; não liberar URLs arbitrárias ou remover a proteção SSRF do banco de imagens. Validar MIME, bytes, dimensões e hash antes de persistir. Confirmar generate → acquire → store → render → export.

### R6 — P1: Redesenho não recebe mídia nem overrides do projeto

Evidência: src/components/RedesenhoView.tsx:145–149; src/site-builder/components/SitePreview.tsx:10–32.

SitePreview suporta mediaManifest e assetUrls, mas Redesenho passa somente blueprint/context/design e não resolve os blobs do IndexedDB. Também não aplica siteOverrides. Assim, imagens/edições visíveis no editor podem desaparecer nessa tela mesmo depois de salvas.

Correção: compartilhar uma resolução read-only do projeto efetivo (blueprint + overrides + design + manifesto + assets) entre editor, Redesenho e export, sem disparar buscas/gerações ao visualizar.

### R7 — P1: o ZIP perde alterações do editor e aceita ausência de arquivo aprovado

Evidência: src/site-builder/exportSite.ts:13,30–48; src/components/VisualEditorView.tsx:save/exportSite.

save mantém siteBlueprint e siteOverrides separados; createSiteZip renderiza somente siteBlueprint. Reproduzi com headline editada: preview efetivo contém o texto, index.html do ZIP não contém. O mesmo afeta visibilidade, ordem e escolha de mídia via overrides. Além disso, quando um asset aprovado não está no store, o ZIP prossegue sem imagem, mantendo o manifesto.

Correção: exportar o mesmo projeto efetivo da prévia e retornar MEDIA_ASSET_MISSING quando um arquivo necessário estiver ausente, em vez de concluir uma exportação visualmente diferente. Manter aprovação explícita das imagens; não torná-las exportáveis automaticamente para ocultar o problema.

### R8 — P2: companion e ranking não estabelecem fidelidade responsiva

Evidência: tools/stitch-producer/responsiveCompanion.ts:17–40; realStitchMcpClient.ts:37–44; src/site-builder/designPipeline.ts:116–124; server/services/research/stitch/stitchCandidateRanker.ts:11–54.

O companion recebe sinais abstratos, sem screenshot/HTML nem referência à tela vencedora. Diversos campos do request sequer são incluídos no prompt final. O resolved design usa o mobile como candidato efetivo; o desktop entra essencialmente na coerência/proveniência, sem produzir layout desktop próprio. O ranking usa constantes e padrões, não avaliação de screenshot, contraste ou performance medidos.

Nesta produção o desktop falhou com STITCH_SCREEN_IDENTITY_INVALID. A listagem remota read-only retornou somente uma tela MOBILE nesta consulta; os artifacts locais contêm três IDs mobile. Sem a resposta bruta sanitizada da tentativa desktop não é possível afirmar se houve ausência de tela, retorno incompleto ou formato diferente. Não relaxar deviceType nem declarar MOBILE como DESKTOP.

Correção: handoff explícito da referência vencedora quando suportado pelo SDK, envelope diagnóstico sanitizado para respostas incompletas e decisões responsivas persistidas realmente consumidas pelo renderer. Ranking deve usar evidência extraída e não pontuar ausência como qualidade comprovada.

### R9 — P2: conclusão do wizard não inclui prontidão visual e de mídia

Evidência: src/site-builder/components/wizard/GenerationFlowOrchestrator.tsx:305–325; src/site-builder/media/mediaPlanBuilder.ts:104–119.

O wizard salva um plano de imagens e em seguida marca completed. Imagens ainda não foram adquiridas. O plano padrão cobre somente hero/about e solicita banco licenciado; não aproveita slots da composição Stitch e não pede geração de imagem. Pexels e Pixabay retornaram configured=false no endpoint atual. A geração de imagem por Gemini não está implementada nesse registro: apenas ComfyUI é registrado.

Correção: distinguir conteúdo gerado, design adaptado, mídia pendente e pronto para revisar/exportar. Exibir PARTIAL com sua consequência de forma compreensível. Esses estados devem ser observabilidade do resultado real, sem forçar sucesso ou nova geração Stitch.

### R10 — P2: testes verdes ainda deixam lacunas de integração

Evidência: tests/services/aiImageGeneration.test.ts:173 em diante; package.json:test.

O teste chamado “ComfyUI Real Generation Flow” substitui global.fetch; não executa ComfyUI nem valida um grafo. Seus resultados não passam pelo mediaCandidateSchema nem pela aquisição. Os testes estáticos de componente não clicam no botão desconectado. npm test inclui .test.ts e deixa .test.tsx fora; executei os seis testes de componente separadamente.

Correção: manter testes unitários, adicionando testes de navegador com atualizações React reais, contrato cruzado entre provedor e aquisição, persistência/reload, paridade entre as duas prévias e ZIP; comparação visual mobile/desktop com uma referência conhecida. Uma checagem live pequena deve registrar a imagem binária real produzida, sem confundir simulação com prova live.

## Outros riscos e observações

- getProjectAssets chama store.list() sem filtrar projeto (useMediaManager.ts:274); o nome da API sugere escopo que a implementação não garante. Definir claramente biblioteca global versus assets do projeto, preservando a proveniência ao reutilizar.
- A verificação de mídia pendente compara entry.requestId com item.id, mas a busca constrói requestId com prefixo projectId. Rever para não buscar novamente slots já preenchidos.
- As fontes efetivas continuam presets Segoe UI/Georgia; um typographyProfile no contrato não basta sem carregamento e aplicação pelo renderer.
- O prompt Stitch solicita “Não gerar imagens reais”; a extração não importa as imagens da composição. Isso é diferente de um fluxo de geração e aquisição de imagens ilustrativas autorizado e validado.
- O aviso de iframe allow-scripts + allow-same-origin é real, porém não explica o layout genérico. O código atual renderiza componentes controlados. Se a arquitetura passar a aceitar HTML remoto, não o colocar nessa mesma combinação de permissões; isso mudaria a fronteira de confiança.
- Os erros recentes de identidade numérica, estado compartilhado do editor e Vite foram corrigidos, mas não resolvem R1–R10. A correção de cores desta sessão foi parcial e não deveria ser considerada equivalência visual.

## Evidências e validação executadas

| Verificação | Resultado |
|---|---|
| npm test | 303 testes, 19 suites; 303 pass, 0 fail/skip |
| tsx --test tests/components/*.test.tsx | 6 pass, 0 fail/skip |
| Replay controlado de estado antigo na seleção de mídia | Bug reproduzido: candidato existe no novo estado; zero selecionados |
| Preview efetivo versus index.html exportado | Bug reproduzido: override desaparece no ZIP |
| Saída ComfyUI simulada versus contrato real de candidato | Bug reproduzido: três violações de contrato |
| /api/ai/media/providers | Pexels/Pixabay não configurados |
| Log da geração real mostrada | Gemini success; Stitch PARTIAL |
| list_screens do projeto remoto 5608262826498305567 | Consulta read-only; uma tela MOBILE retornada |
| Nova geração de imagem ou Stitch nesta revisão | Não executada |
| Alteração de código da aplicação nesta revisão | Nenhuma; apenas diagnóstico e relatório |

Probes reproduzíveis locais: scratch/review-flow-probes.mts. Logs: scratch/full-flow-review-tests.log e scratch/full-flow-review-components.log. Scratch é material diagnóstico, não uma suíte homologatória.

## Ordem recomendada de correção e critérios de aceite

1. Paridade do projeto efetivo: mesma headline, ordem, cores e imagem em editor, Redesenho e ZIP. Resolver R6/R7 e cobrir reload e edição.
2. Fluxo real de mídia: retornar resultados da busca, corrigir atualização do manifesto, ligar botão e normalizar proveniência. Cobrir dois slots sem perda, falha parcial e asset ausente. Configurar um provedor disponível sem instalar/cobrar serviços implicitamente.
3. Contrato visual do Stitch: extração estruturada e renderer capaz de representar a composição, com referência e limitações explícitas. Comparar fonte, espaçamento, posição/recorte de imagens, hierarquia e estrutura em 390/768/1440 px. Não usar nome da família ou PAIRED como prova de semelhança.
4. Companion e conclusão: resolver causa exata do retorno desktop com observabilidade segura; terminar com estados distintos de conteúdo/design/mídia. Reutilizar a mesma produção em retries, sem chamadas Stitch adicionais quando artifacts válidos existem.
5. Homologação: um caso salão, um barbearia e um restaurante, com evidência live de conteúdo LLM, assets reais, restart, paridade de prévia/export e ausência de contaminação entre projetos.

Status da revisão: mudanças necessárias. Há evidência live de sucesso do LLM nesta produção; a fidelidade visual e o fluxo de imagens continuam não homologados. Não houve commit, freeze nem regeneração automática.
