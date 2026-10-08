# Delta Burguer — validação da demonstração

Data: 2026-10-08. Base: ZIP enviado pelo usuário `site-delta-burguer.zip`.

## Resultado observado

- A demonstração preserva Contato e Localização com aviso de dados pendentes. Não inventa endereço, telefone, WhatsApp ou e-mail.
- O rodapé inclui marca, navegação e atendimento. A navegação aponta para seções existentes.
- No celular, a imagem do hero e a descrição agora ocupam áreas separadas; o texto deixou de ficar comprimido sobre a fotografia.
- O ZIP validado contém HTML, manifesto e dois arquivos de imagem. O manifesto identifica ambas como imagens ilustrativas do Pexels, com licença registrada. O aviso `DEMONSTRACAO.txt` explicita que não representam o estabelecimento.
- O site ainda parece genérico: título, texto institucional e cartões de serviços têm pouca identidade própria. Esta entrega corrige legibilidade e integridade da demo; não homologa padrão visual premium.

## Evidência e limites

O design exportado informa composição Stitch parcial e aponta para o projeto `lead-custom-1791426016860-7yoruue`. A consulta somente leitura desse ID à API Stitch retornou entidade inexistente. O projeto anteriormente compartilhado (`15578285944113209869`) é outro conceito, com telas “Brasa & Pão” e “Carvão & Malte”; compará-lo como se fosse a geração Delta Burguer produziria uma conclusão falsa. Não houve regeneração nem chamada paga nessa verificação.

O browser testou o HTML exportado em 375 px e 1440 px: Contato e Localização presentes, duas imagens carregadas, sem conteúdo ultrapassando a largura do viewport. O único erro de console foi a ausência de `favicon.ico` no servidor temporário de teste. A extração do ZIP confirmou igualdade byte a byte entre o HTML validado e o HTML empacotado.

`npm run lint`, `npm test` (390/390) e `npm run build` passaram. O build emitiu avisos de tamanho de bundle e de importação dinâmica preexistentes; não impedem a exportação.

## Próxima homologação visual

Para afirmar fidelidade à mesma geração, recuperar a captura ou o ID real da tela Stitch que originou o ZIP, comparar desktop e mobile lado a lado e registrar diferenças de tipografia, composição, imagens, espaçamento e seções. Só então definir a revisão de direção visual e regenerar a demo. Como os dados oficiais da Delta Burguer ainda não estão autorizados, a demo pode seguir com imagens ilustrativas identificadas e contatos/endereço em confirmação.
