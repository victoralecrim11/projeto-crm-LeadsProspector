# PROSPECTOR CRM

CRM full-stack para prospecção local, geração de sites com IA, edição visual e acompanhamento comercial.

A documentação completa do projeto está em [docs/README.md](docs/README.md).

## Desenvolvimento local

Requisitos: Node.js 22 e npm.

```bash
npm install
npm run dev
```

A aplicação fica disponível em [http://localhost:3000](http://localhost:3000).

## Provedores de imagens

O servidor carrega primeiro `.env.local` e depois `.env`. O arquivo `.env.local` é ignorado pelo Git e deve guardar as credenciais reais.

```env
# Busca de fotografias licenciadas
PEXELS_API_KEY=sua_chave_pexels
PIXABAY_API_KEY=sua_chave_pixabay

# Geração local opcional com ComfyUI
AI_IMAGE_ZERO_COST_ONLY=true
COMFYUI_BASE_URL=http://127.0.0.1:8188
COMFYUI_CHECKPOINT=nome-exato-do-checkpoint.safetensors
```

- **Pexels** e **Pixabay** fornecem fotografias licenciadas para os slots de mídia do site. Obtenha as chaves nas documentações oficiais da [Pexels](https://www.pexels.com/api/documentation/) e da [Pixabay](https://pixabay.com/api/docs/).
- **ComfyUI** é opcional e gera ilustrações localmente. `COMFYUI_CHECKPOINT` deve ser exatamente o nome retornado pelo nó `CheckpointLoaderSimple`. Consulte o [repositório oficial do ComfyUI](https://github.com/Comfy-Org/ComfyUI).
- `AI_IMAGE_ZERO_COST_ONLY=true` impede o roteador de usar provedores classificados como pagos ou free-tier. Atualmente o adaptador de geração registrado é o ComfyUI local.
- Nunca use prefixo `VITE_` nas chaves desses provedores: elas devem permanecer somente no backend.

Depois de alterar `.env.local`, reinicie `npm run dev`. Confira o estado em **Configurações CRM → Provedores de mídia**. A seleção automática mantém as imagens como pendentes de revisão; aprove-as no Editor Visual antes de exportar.

### Comfy Desktop: instalação local e Cloud

Ter o aplicativo Comfy Desktop instalado ou uma sessão no Comfy Cloud não disponibiliza automaticamente uma API local. O adaptador deste CRM exige uma instalação **local em execução** e um checkpoint compatível com `CheckpointLoaderSimple` (workflow CLIP/KSampler/VAE). Não use `https://cloud.comfy.org` como `COMFYUI_BASE_URL` deste adaptador.

Após concluir a instalação local no aplicativo, consulte a URL exibida por ele. Verifique `GET <URL>/system_stats` e `GET <URL>/object_info/CheckpointLoaderSimple`. O segundo endpoint deve listar o arquivo instalado em `CheckpointLoaderSimple.input.required.ckpt_name[0]`; copie esse nome para `COMFYUI_CHECKPOINT`. A porta pode variar: `8188` é apenas um exemplo. Se a lista estiver vazia, instale um checkpoint compatível antes de habilitar a geração. A integração atual não implementa autenticação nem cobrança do Comfy Cloud.

### IA de conteúdo e validação real

A chave de um banco de imagens não habilita a IA que escreve o site. Configure Gemini ou Groq em **Configurações CRM → Inteligência Artificial**, ou use `GEMINI_API_KEY` / `GROQ_API_KEY` no backend. O modo automático do Groq considera modelos de geração de texto compatíveis; modelos de áudio e classificadores não entram nessa seleção.

Valide separadamente: produção Stitch (`PAIRED` ou `PARTIAL`), conteúdo com `fallbackUsed=false`, imagens carregadas em Redesenho/Editor e aprovação das imagens antes da exportação. `PARTIAL` mantém o mobile utilizável, mas não comprova paridade com o desktop. O renderer adapta a evidência visual ao catálogo disponível; sucesso de IA não comprova fidelidade integral ao Stitch.

## Validação

```bash
npm test
npm run lint
npm run build
```
