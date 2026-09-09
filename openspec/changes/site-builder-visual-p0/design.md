# Decisões

1. Preview com viewport real 1440/768/390, escalado ao espaço disponível. Fullscreen nativo e fallback em portal com diálogo, Escape e restauração de foco. Blob usa exatamente renderSiteDocument, sem scripts adicionais no documento.
2. Manter schema v1 para leitura; schema v2 explícito para geração. Parser compartilhado migra v1 deterministicamente. Consumidores recebem v2; normalizar também persistência. Variantes ausentes/inválidas no renderer recebem defaults por template (recipes somente P1); schema v2 estrito rejeita variantes inválidas na geração.
3. visual contém seleção das variantes efetivamente renderizadas. Hero: full-bleed, split, minimal; About: editorial-split, centered-story; Services: editorial-list, horizontal-cards. Navigation, Contact, Location e Footer entram no registry com componentes suportados. Sem Gallery/CTA independente ainda.
4. Layouts textuais deliberados enquanto não existe mídia: full-bleed usa superfície sólida de ponta a ponta, split divide título e conteúdo. Nenhuma foto ou espaço de imagem fictício. CSS base separado dos estilos das variantes; HTML estático único para preview/ZIP/nova aba.
5. Preservar integridade factual, escaping React, sandbox e revisão antes de exportar. Contraste calculado para superfícies personalizadas; mobile empilha explicitamente os layouts; sem fontes externas nem motion avançado.

## Ajuste durante validação
O browser demonstrou que âncoras em srcDoc navegavam para a página do CRM dentro do iframe. Preview passou a usar Blob URL com o mesmo HTML estático. Sandbox continua sem scripts e sem acesso à origem. A ferramenta de browser bloqueou Blob por política; o preview final e a abertura de nova aba precisam de homologação manual. Controles de fullscreen foram testados separadamente; HTMLs exportados foram inspecionados via HTTP local, sem tentar contornar o bloqueio de Blob.
