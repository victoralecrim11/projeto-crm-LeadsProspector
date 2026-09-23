import { MediaProviderError } from '../mediaProvider.js';
import type { GeneratedMediaProvider, GeneratedMediaRequest, GeneratedMediaResult } from '../aiImageProviderRegistry.types.js';
import { buildAiImageIntent } from '../aiImageIntentBuilder.js';
import { registerGeneratedMedia } from '../generatedMediaStore.js';
import { createHash, randomUUID } from 'node:crypto';

export function buildComfyWorkflow(request: GeneratedMediaRequest, checkpoint: string) {
  const [width, height] = { '1:1': [1024,1024], '4:3': [1024,768], '3:4': [768,1024], '16:9': [1280,720] }[request.aspectRatio];
  const seed = createHash('sha256').update(request.requestId + request.section).digest().readUInt32BE(0);
  return {
    '3': { class_type: 'KSampler', inputs: { seed, steps: 20, cfg: 7, sampler_name: 'euler', scheduler: 'normal', denoise: 1, model: ['4',0], positive: ['6',0], negative: ['7',0], latent_image: ['5',0] } },
    '4': { class_type: 'CheckpointLoaderSimple', inputs: { ckpt_name: checkpoint } },
    '5': { class_type: 'EmptyLatentImage', inputs: { width, height, batch_size: 1 } },
    '6': { class_type: 'CLIPTextEncode', inputs: { text: buildAiImageIntent(request), clip: ['4',1] } },
    '7': { class_type: 'CLIPTextEncode', inputs: { text: 'text, words, logos, watermarks, identifiable real people, business names', clip: ['4',1] } },
    '8': { class_type: 'VAEDecode', inputs: { samples: ['3',0], vae: ['4',2] } },
    '9': { class_type: 'SaveImage', inputs: { filename_prefix: 'prospector', images: ['8',0] } },
  };
}

export class ComfyUiProvider implements GeneratedMediaProvider {
  id = 'comfyui'; displayName = 'ComfyUI Local';
  capabilities: ('image-generation')[] = ['image-generation'];
  costMode = 'local-free' as const;
  requiresApiKey = false; requiresBilling = false; isLocal = true; enabledByDefault = true;
  isConfigured() { return Boolean(process.env.COMFYUI_BASE_URL && process.env.COMFYUI_CHECKPOINT); }
  async generate(request: GeneratedMediaRequest): Promise<GeneratedMediaResult> {
    if (!this.isConfigured()) throw new MediaProviderError('MEDIA_PROVIDER_NOT_CONFIGURED', 'Configure o endereço e o checkpoint do ComfyUI.');
    const base = new URL(process.env.COMFYUI_BASE_URL!);
    if (!['http:', 'https:'].includes(base.protocol) || base.username || base.password) throw new MediaProviderError('MEDIA_PROVIDER_NOT_CONFIGURED', 'Configuração ComfyUI inválida.');
    const get = async (path: string, init?: RequestInit) => {
      try {
        const res = await fetch(new URL(path, base), { ...init, redirect: 'error', signal: AbortSignal.timeout(10000) });
        if (!res.ok) throw new MediaProviderError('MEDIA_PROVIDER_UNAVAILABLE', 'O provedor de imagens não está disponível.');
        return res;
      } catch (e) {
        if (e instanceof MediaProviderError) throw e;
        throw new MediaProviderError('MEDIA_PROVIDER_UNAVAILABLE', 'Não foi possível conectar ao provedor de imagens.');
      }
    };
    await get('/system_stats');
    const info = await (await get('/object_info/CheckpointLoaderSimple')).json();
    const checkpoints = info?.CheckpointLoaderSimple?.input?.required?.ckpt_name?.[0];
    if (!Array.isArray(checkpoints) || !checkpoints.includes(process.env.COMFYUI_CHECKPOINT)) throw new MediaProviderError('MEDIA_PROVIDER_NOT_CONFIGURED', 'O checkpoint configurado não está instalado no ComfyUI.');
    const queued = await (await get('/prompt', { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: buildComfyWorkflow(request, process.env.COMFYUI_CHECKPOINT!), client_id: randomUUID() }) })).json();
    if (typeof queued.prompt_id !== 'string' || !/^[a-zA-Z0-9-]{1,100}$/.test(queued.prompt_id)) throw new MediaProviderError('MEDIA_PROVIDER_INVALID_RESPONSE', 'Resposta de geração inválida.');
    const deadline = Date.now() + 180000;
    for (let i = 0; i < 180 && Date.now() < deadline; i++) {
      const history = await (await get(`/history/${queued.prompt_id}`)).json();
      const entry = history[queued.prompt_id];
      if (entry) {
        if (entry.status?.status_str === 'error') throw new MediaProviderError('MEDIA_PROVIDER_INVALID_RESPONSE', 'A execução da imagem falhou.');
        const output = entry.outputs?.['9']?.images?.[0];
        if (!output || typeof output.filename !== 'string') throw new MediaProviderError('MEDIA_PROVIDER_INVALID_RESPONSE', 'A geração terminou sem imagem.');
        const params = new URLSearchParams({ filename: output.filename, subfolder: output.subfolder || '', type: 'output' });
        const res = await get(`/view?${params}`);
        if (!res.body) throw new MediaProviderError('MEDIA_PROVIDER_INVALID_RESPONSE', 'Imagem ausente.');
        const reader = res.body.getReader(); const chunks: Uint8Array[] = []; let size = 0;
        try { while (true) {
          const next = await reader.read(); if (next.done) break;
          size += next.value.length;
          if (size > 5 * 1024 * 1024) throw new MediaProviderError('MEDIA_ASSET_TOO_LARGE', 'Imagem excede o limite permitido.');
          chunks.push(next.value);
        } } finally { await reader.cancel(); }
        const candidate = registerGeneratedMedia({ version: 1, candidateId: `comfyui_${randomUUID()}`, requestId: request.requestId,
          provider: 'comfyui', providerAssetId: queued.prompt_id, sourceType: 'generated', width: 1, height: 1,
          aspectRatio: request.aspectRatio, licenseLabel: 'Ilustração gerada — revisar termos do modelo', attributionRequired: false,
          retrievedAt: new Date().toISOString(), confidence: 0, metadata: { illustrative: true } }, Buffer.concat(chunks));
        return { ...candidate, previewUrl: candidate.previewUrl!, sourceType: 'generated' };
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    throw new MediaProviderError('MEDIA_PROVIDER_TIMEOUT', 'A geração de imagem excedeu o tempo limite.');
  }
}
