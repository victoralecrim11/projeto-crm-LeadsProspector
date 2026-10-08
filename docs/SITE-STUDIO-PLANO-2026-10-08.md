# Site Studio — plano após estabilizar a demonstração

Data: 2026-10-08. Estado: planejamento; o Site Studio ainda não foi desenvolvido.

## Objetivo

Permitir que o usuário personalize um site gerado em uma interface com controles de conteúdo, seções, blocos e estilo à esquerda e prévia interativa à direita, inspirada no exemplo compartilhado. O editor deve operar sobre o mesmo blueprint, design e manifesto de mídia usados na prévia e na exportação.

## Primeiro incremento

1. Abrir um projeto existente e selecionar uma seção pela prévia ou por uma lista de seções.
2. Editar textos e imagens permitidos, reordenar e ativar/desativar seções, ajustar tokens de marca e desfazer/refazer alterações.
3. Mostrar prévia desktop e celular, estados de dados pendentes e comparação antes/depois.
4. Salvar alterações por projeto com indicação clara de estado salvo, alterações pendentes e opção de restaurar.
5. Baixar demonstração com avisos ou exportar versão final somente após os gates comerciais; garantir que o HTML baixado corresponda à prévia do mesmo modo.

## Critérios de aceite

- Trocar entre dois projetos não mistura conteúdo, histórico, imagens nem alterações não salvas.
- Navegação, Contato e Localização aparecem somente quando pedidos e coerentes com o modo demo/final.
- Editar uma seção atualiza a prévia em ambos os tamanhos; salvar e recarregar preserva o resultado.
- Desfazer/refazer, restaurar e exportar mantêm o mesmo documento e não perdem proveniência da mídia.
- O editor indica quais campos vieram de fonte verificada, de sugestão ou estão pendentes de confirmação. Não preenche fatos comerciais por inferência.

## Dependências

Antes da implementação, concluir a revisão visual do renderer com captura Stitch da mesma geração e um conjunto de demonstrações por nicho. O editor poderá ajustar um design estável, mas não corrigirá sozinho a conversão parcial Stitch → Blueprint → SiteRenderer.
