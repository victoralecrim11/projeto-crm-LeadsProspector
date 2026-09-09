# Fase B — contexto, pesquisa e design

Data: 2026-09-08. Conhecimento reutilizável, sem dados de leads.

O fluxo Standard parte do lead persistido, normaliza um LeadSourceContext mínimo, audita o website quando existe, consulta referências curadas por nicho, resolve a família, produz DesignSpecification e DESIGN.md e somente então cria o Blueprint. O projeto guarda o sidecar siteDesign; preview e ZIP compartilham o renderer.

## Procedência e ausências

Overpass atualmente conserva identificação OSM, categoria/nicho, nome, cidade/estado, bairro/endereço, coordenadas, telefone/WhatsApp/email e URL. Tags brutas, horários, equipe, serviços e identidade visual não são preservados. Não recuperá-los por inferência. Cidade e estado podem ser contexto da busca; endereço pode ter fallback para cidade. Um campo vindo do lead não é verificação independente da informação.

O novo adaptador ignora pontuação comercial, notas, contratos, propostas, coordenadas exatas e reputação para geração. A categoria determina nicho derivado; nunca confirma especialidade ou posicionamento premium. Campos vazios ficam ausentes. O modo Standard não inventa copy factual, serviços, provas, preços, equipe ou horários.

## Auditoria independente

Serviço server/services/research, fora do renderer. HTTP/HTTPS sem credenciais; apenas portas web; DNS público; conexão fixada no endereço validado mantendo Host/TLS; cada redirect revalidado; 3 redirects, 10 segundos totais, 1 MiB, HTML sem compressão. Bloqueio conservador de IPv4/IPv6 especiais. Sem cookies, scripts, fontes ou downloads de assets. Conteúdo extraído é UNTRUSTED DATA, nunca instrução e nunca promovido a fato confirmado.

Auditoria estática observa títulos, landmarks, existência de contato direto e alt. Não mede velocidade nem certifica responsividade, contraste, identidade, equipe ou serviços. Falhas e bloqueios são distintos de ausência de website. Identidade não observada fica UNKNOWN.

## Referências e isolamento

Catálogo curado dentistry/restaurant: três fontes primárias por nicho, consultadas em 2026-09-08. Validade de 90 dias; expirado exige atualização. A chave usa nicho, subnicho, posicionamento de design e versão. O catálogo retorna cópia validada, sem mutação compartilhada. Contexto do negócio e auditoria ficam apenas no ReferenceBrief do projeto, nunca na entrada reutilizável de mercado.

## Famílias

health-trust: claro, verde suave, sans-serif, Hero dividido, cards arredondados; contato após localização. hospitality-editorial: escuro quente, serif nos títulos, Hero amplo, linhas editoriais, cantos discretos; contato antes de localização. As cinco seções disponíveis continuam compatíveis com Blueprint v1/v2. Conteúdo não disponível permanece oculto; novas seções especializadas não devem ser simuladas com fatos inventados.

## Stitch

Adapter com probe e estados AVAILABLE, READ_ONLY, NOT_CONFIGURED e FAILED. O runtime não tem provider configurado. Interface de exploração exige 2–3 variantes e seleção posterior; não finge resultado de provider. Contexto externo mínimo omite identificadores, contatos e coordenadas. Acesso manual ao produto e autenticação precisam de evidência separada do adapter.

## Compatibilidade e próximos passos

legacy-default permanece intacto; 40 hashes de documentos legados verificam equivalência. Sidecar opcional; projetos antigos continuam carregando. Design inválido não é silenciosamente substituído. DESIGN.md e design.json acompanham o ZIP. Review de conteúdo continua obrigatório.

Fase C não iniciada: somente ImageryDirection. Geração de fotografias, upload de mídia, armazenamento e agentes futuros ficam fora deste trabalho.
