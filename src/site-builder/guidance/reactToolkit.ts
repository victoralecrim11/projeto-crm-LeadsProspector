import type { VisualVariants } from "../types.js";

export const reactToolkitProfile = {
  id: "react-dev-toolkit-site-builder",
  version: 1,
  sourceVersion: "1.3.3",
  sourceRepository: "https://github.com/victoralecrim11/react-dev-toolkit-antigravity",
  sourceCommit: "3dabf36a9826a80d4b6f2404ed58295cb9557f6a",
  sources: ["skills/react-dev/references/react-core.md", "skills/react-dev/references/project-builder.md", "skills/ui-ux/references/design-routing.md", "skills/ui-ux/references/reasoning-rules.md", "skills/ui-ux/references/accessibility.md", "skills/ui-ux/references/responsive-design.md"],
  engineeringRules: [
    "Componentes funcionais, props tipadas e responsabilidades pequenas e explícitas.",
    "Clientes de API e regras de negócio ficam separados dos componentes visuais.",
    "Preferir composição de componentes reutilizáveis à duplicação de telas.",
    "Evoluir incrementalmente com verificação de tipos, erros, estado vazio e acessibilidade.",
  ],
  siteBuilderRules: [
    "Sua saída é Blueprint v2, nunca código React, HTML, CSS, imports ou scripts.",
    "Selecione componentes apenas pelo catálogo abaixo; considere composição desktop e comportamento mobile.",
    "Use títulos descritivos, hierarquia clara e conteúdo curto o suficiente para leitura em celular.",
    "Não simule formulários, menus interativos ou recursos que o renderer estático não implementa.",
    "Mantenha a identidade visual confirmada e não transforme sugestões em fatos comerciais.",
  ],
  designRules: [
    "Defina uma direção coerente de tema, tipografia e composição antes de escrever o conteúdo.",
    "Use superfícies semânticas do renderer, cores sólidas e contraste legível; não invente tokens CSS.",
    "Considere acessibilidade e usabilidade ao escolher o estilo; evite vidro e sombras que prejudiquem a leitura.",
    "Planeje leitura mobile, títulos que quebrem em linhas e CTA com foco visível.",
    "Use apenas movimento none/subtle; o renderer respeita prefers-reduced-motion.",
    "O handoff é o Blueprint validado: presentation, brand, visual e sectionOrder devem descrever uma composição coerente.",
  ],
} as const;

interface ComponentGuidance {
  composition: string;
  mobile: string;
}
type ComponentCatalog = { [Section in keyof VisualVariants]: Record<VisualVariants[Section], ComponentGuidance> };

// Project-specific descriptions, not templates supplied by the original plugin.
export const reactComponentCatalog: ComponentCatalog = {
  hero: {
    "full-bleed": { composition: "Título expansivo com texto e CTA separados na base; superfície sólida.", mobile: "Título, descrição e CTA empilhados." },
    split: { composition: "Título de um lado, monograma decorativo e conteúdo do outro; sem foto inventada.", mobile: "Colunas empilhadas; monograma omitido em telas pequenas." },
    minimal: { composition: "Identificação lateral e mensagem compacta; foco em clareza.", mobile: "Identificação acima da mensagem." },
  },
  about: {
    "editorial-split": { composition: "Título e prosa em duas colunas assimétricas.", mobile: "Título seguido da prosa com divisor." },
    "centered-story": { composition: "Narrativa centralizada de largura limitada.", mobile: "Texto fluido com margens de leitura." },
  },
  services: {
    "editorial-list": { composition: "Lista numerada com separadores, sem cards.", mobile: "Uma coluna de itens numerados." },
    "horizontal-cards": { composition: "Blocos em colunas, com títulos e descrições.", mobile: "Blocos empilhados; não é carrossel." },
  },
  contact: {
    "contact-minimal": { composition: "Título e canais confirmados.", mobile: "Links empilhados com área de toque." },
    "contact-split": { composition: "Nome do negócio e canais em colunas.", mobile: "Nome seguido dos canais confirmados." },
  },
  location: { "location-editorial": { composition: "Endereço confirmado e cidade; sem mapa inventado.", mobile: "Endereço quebra naturalmente em linhas." } },
  navigation: { inline: { composition: "Marca textual e âncoras das seções visíveis.", mobile: "Links quebram em linhas, sem menu JavaScript." } },
  footer: {
    minimal: { composition: "Nome e cidade em uma faixa compacta.", mobile: "Texto com quebra de linha." },
    editorial: { composition: "Nome em destaque, categoria, cidade e voltar ao início.", mobile: "Informações empilhadas." },
  },
};

export function buildReactToolkitGuidance(): string {
  return "Orientação de engenharia incorporada — React Dev Toolkit\n" + JSON.stringify({
    profile: reactToolkitProfile,
    components: reactComponentCatalog,
  });
}
