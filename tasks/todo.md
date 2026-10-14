# Tarefas — qualidade comercial do Site Builder

## 1. Rodapé sem atendimento vazio
Dependências: nenhuma. Escopo: pequeno.
Arquivos: `src/site-builder/sections/footer/index.tsx`, `tests/services/footerConversion.test.ts`, baseline de renderização.
- [x] Omitir coluna e título Atendimento no modo final quando não houver contatos válidos.
- [x] Preservar contatos confirmados e o aviso de canais em confirmação no modo demonstração.
- [x] Ajustar colunas conforme blocos presentes, sem espaço reservado vazio.
Verificação automatizada concluída: 5 testes focados, 425 na suíte completa, lint e build aprovados. Inspeção visual do incremento em desktop/mobile ainda pendente.

## 2. Abertura com ação útil
Dependência: tarefa 1. Escopo: médio; identificar variante do hero e seus testes antes da edição.
- [ ] Usar contato confirmado quando disponível; sem contato, permitir navegação para seção existente, sem simular reserva ou WhatsApp.
- [ ] Manter nome e descrição rastreáveis ao negócio; não inferir horários, especialidades ou diferenciais.
- [ ] Preservar a mesma ação no preview e no HTML exportado.
Arquivos prováveis: variantes de hero, `contactLinks`, testes de renderização/exportação.
Verificação: cenários com/sem contato, teclado, 390/1440 px e exportação.

## Checkpoint após tarefas 1–2
- [ ] Suíte e build aprovados; revisão visual do mesmo projeto nos dois tamanhos.
- [ ] Evidências registradas sem afirmar homologação PAIRED.

## 3. Conteúdo e dados pendentes
Dependência: tarefa 2. Escopo: médio, dividido por editor e geração se necessário.
- [ ] Editor identifica contato/endereço ausentes e conteúdo sugerido que precisa de confirmação.
- [ ] Sugerir texto mais conciso sem remover fatos verificados ou rótulos de revisão.
- [ ] Exportação final conserva gates; demonstração apresenta pendências sem inventar dados.
Arquivos prováveis: editor existente, `publicationGates`, testes `demoExport`.
Verificação: persistência após reload, demonstração/final e ausência de contatos fictícios.

## 4. Comparação visual e próximo marco
Dependência: tarefa 3 e referência Stitch acessível da mesma geração. Escopo: revisão delimitada por nicho.
- [ ] Comparar fonte, prévia e exportação nos tamanhos desktop/mobile.
- [ ] Registrar diferenças e resultado PAIRED/PARTIAL real, sem alterar gates.
- [ ] Atualizar dependências do Site Studio antes de iniciar sua implementação.
Arquivos: relatórios em `docs/`, plano existente do Site Studio e fixtures somente quando justificadas.
Verificação: evidências rastreáveis; não substituir validação ao vivo por fixtures.

## Registro do backlog
- [x] Reconciliar commits da sessão e geração Farroupilha com a memória histórica.
- [x] Registrar melhorias observadas e sequência, sem duplicar roadmap de features futuras.
- [ ] Reconciliar numeração histórica das fases de mídia antes de executá-las.
