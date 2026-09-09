# DESIGN.md

Família hospitality-editorial v1; resolução 2026-09-08T22:37:27.830Z.

## Purpose

Facilitar contato para consultar reservas; não simular disponibilidade.

## Brand Personality

hospitality-editorial / editorial-dining; direção de design, não característica confirmada do negócio.

## Visual Principles

Composição editorial com título amplo e ritmo assimétrico.
- Menu confirmado antes de narrativa longa; contato para reserva no fechamento.
- Ambiente e gastronomia dependem de imagens reais autorizadas, pendentes para Fase C.

## Brand Elements to Preserve

Identidade existente não confirmada: direção provisória, sem substituir logo ou alegar branding oficial.

## Colors

background: #1e1915
surface: #29221c
surfaceElevated: #352b22
text: #fcf3e4
textMuted: #d4c2ad
border: #8e7961
primary: #422a21
accent: #e7b777
primaryForeground: #ffffff
accentForeground: #000000

## Typography

Georgia nos títulos; Segoe UI/system-ui no corpo.

## Spacing

Seções 104px; compacto 64px.

## Radius

Cards 2px; botões 2px.

## Shadows

Sombra discreta nos controles; sem profundidade decorativa excessiva.

## Layout

hero → about → services → contact → location

## Grid

Contêiner fluido; máximo 1200px; empilhar abaixo de 800px.

## Hero

full-bleed

## Cards

editorial-list

## Navigation

Links apenas para seções presentes; skip link.

## Buttons

Contato confirmado no lead; rótulos não simulam conclusão de reserva.

## Forms

Sem formulário sem backend. Usar canais de contato disponíveis.

## Imagery

Fase C: fotografias autorizadas de pratos e ambiente; ilustrações devem ser identificadas.

## Motion

subtle; respeitar prefers-reduced-motion.

## Responsive

Desktop 1440: composição da família. Tablet 768 e mobile 390: colunas empilhadas, CTA acessível, sem rolagem horizontal; movimento reduzido respeitado.

## Accessibility

Contraste AA para textos; foco visível; landmarks semânticos; não depender apenas de cor.

## Patterns to Avoid

Não copiar pratos, preços, chef, prêmios ou horários.
- Não simular reserva confirmada em um link de contato.
- Não inventar ambiente ou fotografias reais.

## Provenance

Nome, contatos e localização: Lead overpass; dados ausentes omitidos
Nicho: Classificação derivada de categoria/nicho persistidos
Composição e CTA: restaurant-market-v1 + Guidance
Paleta e tipografia: hospitality-editorial@1
Direção visual Premium: Stitch: https://stitch.withgoogle.com/projects/16495453154449814409; seleção editorial-dining. Mapeamento para componentes suportados; copy externa não importada.
