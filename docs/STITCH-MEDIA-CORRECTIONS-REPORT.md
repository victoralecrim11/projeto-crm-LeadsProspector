# Correções do fluxo Stitch e mídia

Atualização posterior: a [validação real de 23/09/2026](STITCH-LIVE-VALIDATION-2026-09-23.md) registra providers configurados, Groq sem fallback, fotos reais, novos testes e limites do Comfy Desktop. Os resultados abaixo descrevem o checkpoint anterior.

Data: 23/09/2026. Branch: main. HEAD preservado: a0323c714f9a6cadbcf214c79a8e6b68a06e4c90. Parent: 4ca8df284fe528780c448589c51b6d370fa53d01. A árvore já estava DIRTY antes desta etapa; nenhuma alteração anterior foi descartada. Sem commit/push.

## Resultado

Correções implementadas para os defeitos de aquisição/persistência, ligação do botão de geração, ComfyUI, paridade das prévias e exportação. O Stitch agora transfere evidência visual estruturada adicional ao consumidor e ao renderer. Isso melhora a adaptação, mas não comprova reprodução integral da composição remota. Homologação live e freeze continuam pendentes.

## Cobertura do review

| Achado | Implementação | Validação / limite |
|---|---|---|
| R1: perda visual | Contrato opcional versionado para fontes, tamanho do hero, espaçamento, raio, composição suportada e presença de imagens. Extração literal sem executar scripts. IDs de seções observados orientam a composição; seções sem evidência mantêm ordem da estratégia. | Replay real de produção persistida e renderer testados com evidência controlada. HTML previamente obtido da referência real extrai Bodoni Moda, Hanken Grotesk, hero 38 px, espaço 40 px, raio 4 px e 47 cores. Sem alegação de equivalência pixel a pixel. |
| R2: estado antigo / manifesto sobrescrito | Busca retorna candidatos; removido atraso de 100 ms; manifesto acumula operações usando referência atual; aquisição sem assetId não conta como sucesso. | Navegador: hero + about persistidos e recarregados; duas entradas mantidas. Slots preenchidos não são novamente resolvidos automaticamente. |
| R3: botão desconectado | Editor fornece generateMedia, candidatos/erro/loading; botão indisponível quando configuração de geração não existe. | Clique real no componente Gerar com IA → Gerar Imagem → Selecionar validado no navegador, com HTTP controlado. |
| R4: workflow incompleto | Grafo conectado com checkpoint, CLIP, latent, sampler, VAE e SaveImage; seed e proporção aplicados. Verifica checkpoint instalado; chamadas e polling limitados. | Grafo e respostas controladas testados. Execução em ComfyUI real NÃO realizada: endereço e checkpoint não configurados. |
| R5: incompatibilidade de mídia | Resultado canônico com provider comfyui, version 1 e origem generated. Backend baixa bytes por configuração própria; PNG/dimensões/limites/hash validados. Cliente usa referência temporária opaca; não escolhe URL privada para aquisição. Manifesto preserva origem e exige revisão. | generate → schema → acquire testado; adulteração de identidade rejeitada. Biblioteca do projeto usa somente assets referenciados no próprio manifesto. |
| R6: Redesenho | Aplica overrides e carrega blobs do manifesto via hook read-only, compartilhado com editor; rejeita manifesto de outro projeto. | Redesenho e Editor exibiram a mesma edição e imagens carregadas em navegador isolado. |
| R7: ZIP | Aplica overrides e inclui apenas mídia aprovada. Imagem aprovada sem bytes bloqueia exportação com MEDIA_ASSET_MISSING. Manifesto exportado contém somente entradas aprovadas. | ZIP contém headline editada, bytes e caminhos relativos; ausência de asset testada. Exportar sem imagens ainda não aprovadas continua sendo decisão explícita da interface existente. |
| R8: responsividade / ranking | Prompt inclui referência à tela vencedora, dispositivo, densidade, padrões e restrições; saída ordenada por solicitação. Evidência desktop participa do CSS e da variante de hero responsiva. Scores constantes de acessibilidade/performance/purpose/research sem avaliação foram zerados; ranking remanescente é heurístico. | Consumidor persistido mantém fontes, tamanhos mobile/desktop e variantes. Mismatch de viewport continua rejeitado; envelope de diagnóstico não imprime HTML/URLs/conteúdo. Sem nova tentativa remota de desktop nesta etapa. |
| R9: conclusão enganosa | Resultado informa referência mobile adaptada quando PARTIAL e imagens pendentes. Prévia/editor explicam adaptação ao catálogo e evidência histórica limitada. Mensagem de falha não imprime código técnico bruto ao usuário. | Testes de estado/fallback preservados; ausência de mídia não é apresentada como fidelidade comprovada. |
| R10: lacunas de testes | npm test agora inclui .test.tsx. Adicionados testes de busca retornada, aquisição falha, ZIP, extração segura, replay da aparência e provider desconhecido. Testes ComfyUI foram renomeados para indicar HTTP controlado. | 318 testes passam. Dois testes de navegador separados passam, com isolamento dos dados do usuário. |

## Verificações

| Comando / teste | Exit | Resultado |
|---|---:|---|
| npm test | 0 | 318 testes; 318 PASS; 0 FAIL; 0 skipped |
| npm run lint | 0 | tsc --noEmit, tsconfig.react-plugin e tsconfig.producer PASS |
| npm run build | 0 | build:client e build:server PASS |
| tests/services/vercelRuntime.test.ts, na suíte | 0 | imports ESM e invariantes do runtime PASS |
| tests/browser/mediaFlow.playwright.js | 0 | 2 buscas, 3 aquisições, 1 geração controlada; 2 entradas; reload IndexedDB, Redesenho, Editor e ZIP PASS |
| tests/browser/editorProjectIsolation.playwright.js | 0 | troca entre barbearia/salão, histórico, save e reload PASS |
| git diff --check | 0 | PASS |

A validação visual legada preservou os hashes das 40 combinações congeladas, sem atualizar snapshots. O build mantém avisos de chunks grandes e anotações de dependências; não houve falha de compilação. Dependências locais estavam ausentes e foram restauradas via npm ci, sem alterar o lockfile. Backend local reiniciado com watch para refletir o código corrigido.

## Fronteiras preservadas

Identidade persistida da produção continua sendo autoridade. Nenhuma produção/artifact histórico foi reescrito para acrescentar aparência. Não foram criadas alternativas sintéticas, removido alternatives.min(1), liberadas URLs arbitrárias de mídia ou disparadas novas gerações Stitch. Dados e screenshots remotos não são executados como HTML da aplicação. Aprovação humana de imagens para exportação continua necessária.

As imagens usadas no teste são fixtures explícitas em contexto isolado. Não foram apresentadas como imagens geradas pelo provedor real. Os testes de consumidor escrevem somente seus próprios artifacts temporários.

## Configuração e limitações restantes

Consulta real a /api/ai/media/providers retornou Pexels configured=false, Pixabay configured=false e imageGeneration/comfyui configured=false. Para geração local, configurar COMFYUI_BASE_URL e COMFYUI_CHECKPOINT com um checkpoint existente e compatível com o fluxo padrão CheckpointLoaderSimple. Para banco de imagens, configurar PEXELS_API_KEY ou PIXABAY_API_KEY. Variáveis documentadas em .env.example; não inserir chaves no frontend nem no relatório.

Implementação ComfyUI baseada no [exemplo oficial de workflow API](https://github.com/Comfy-Org/ComfyUI/blob/master/script_examples/basic_api_example.py). Não instala ComfyUI, não baixa checkpoints e não habilita cobrança. Políticas de custo existentes continuam aplicadas.

Candidatos de imagem gerada usam referências com validade de 30 minutos e limite de oito imagens pendentes em RAM; após aquisição, os bytes são persistidos no IndexedDB. Reiniciar o backend invalida candidatos ainda não adquiridos, com erro explícito; imagens já salvas no projeto não dependem desse cache. Fontes Google Fonts requerem conectividade; fallback local continua disponível.

Conversão visual continua limitada ao catálogo suportado. Não replica todo HTML/CSS, efeitos, grids ou fotos da tela Stitch. Imagens da referência não são automaticamente tratadas como fotos licenciadas/do negócio. Projetos antigos não recuperam detalhes descartados pelo pipeline antigo apenas com um reload; nenhum novo Stitch foi executado para esconder essa limitação.

**LIVE IMAGE GENERATION: NOT_AVAILABLE (configuração ausente). LIVE VISUAL FIDELITY: PENDENTE. POST-E.3.9: não declarar nova homologação/freeze com estes resultados. COMMIT: NO. WORKING TREE: DIRTY.**
