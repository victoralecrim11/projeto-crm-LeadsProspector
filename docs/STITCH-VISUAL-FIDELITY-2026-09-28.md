# Fidelidade visual Stitch — comparação do projeto Barbearia do Zequinha

Comparação iniciada em 28/09/2026 com o ZIP exportado pelo usuário após a correção de imagens e a produção Stitch `b5afacdd-755f-438a-94dd-812328369d77`. A tela escolhida é `ff5864dfccf249f58716b13f442e4ad5` (mobile); o companion desktop é `104153c92c524f6cab1b50883106ded3`. Não houve nova geração Stitch nem alteração dos artifacts persistidos.

## Evidência observada

- O `site (1).zip` contém hero e Sobre com imagens incorporadas e os mesmos binários em `assets/`. O site foi aberto isoladamente em HTTP local e capturado a 1440 px e 390 px; a imagem do hero carrega em ambos. A imagem de Sobre tem carregamento lazy e carrega após rolagem.
- A miniatura desktop da tela selecionada mostra uma abertura editorial com texto à esquerda, foto à direita, superfície clara e destaques verde-lima. O ZIP usa foto de fundo em largura total, título sobreposto e cartões de serviços cinza sem esses destaques. A miniatura mobile também tem estrutura diferente do hero do ZIP.
- O design persistido registra fontes `Anton`/`Space Grotesk`, mas classifica os dois heroes como `full-bleed` e não registra `serviceCardStyle`. O token `accent` é `#506600`; o candidato Stitch contém `secondary-container:#cef06d`, compatível com o destaque claro da miniatura. Não alterar automaticamente essa paleta histórica sem saber onde cada papel de cor é usado.
- A referência Stitch mostra mais blocos de serviços, contato e localização. O ZIP contém apenas dois serviços confirmados e não tem contato/localização confirmados. O renderer não deve copiar conteúdo, preços ou controles fictícios da referência.

As imagens remotas disponíveis para esta produção são miniaturas de 48×512 (mobile) e 159×512 (desktop). A consulta read-only ao HTML da tela selecionada não o retornou: `list_screens` respondeu objeto vazio e `get_screen` respondeu argumento inválido. Isso limita qualquer medição de composição pixel a pixel e impede atribuir com certeza a causa da classificação incorreta específica dessa produção.

## Primeiro ajuste com evidência reproduzível

O extrator antigo tratava qualquer elemento `absolute` em uma seção com `<img>` como prova de foto de fundo. Um HTML real de referência já salvo localmente usa uma foto em quadro editorial, com um gradiente absoluto sobre a imagem e o título *depois* do quadro; esse caso era classificado incorretamente como `full-bleed`.

`extractStitchVisuals` agora só identifica `full-bleed` quando a própria imagem é absoluta e ocupa o quadro (`inset-0`) ou quando há `background-image` explícito. Também reconhece colunas responsivas arbitrárias `grid-cols-[..._...]` como `split`. Composição sem esse sinal permanece sem classificação em vez de receber um layout inventado. Uma regressão cobre quadro editorial, split responsivo e foto absoluta. A leitura local do HTML real deixou de alegar `full-bleed` nesse caso.

Validação: 347/347 testes, lint e build cliente/servidor aprovados. A mudança afeta novas extrações, não reescreve o design já salvo no projeto nem transforma o ZIP antigo. Fidelidade visual integral e paridade pixel a pixel seguem pendentes; o próximo incremento requer HTML/screenshot em resolução útil da mesma tela ou nova produção autorizada, seguida de comparação desktop/mobile sem misturar conteúdo não confirmado.
