import { createHash, randomBytes } from 'node:crypto';
import { mediaCandidateSchema, type MediaCandidate, type AcquiredMediaAsset } from '../../../src/site-builder/contracts/media.js';
import { MediaProviderError } from './mediaProvider.js';

// Short-lived capability references, never client-supplied filesystem or network locations.
// Acquired bytes are durably stored by the client asset store before selection is committed.
const pending = new Map<string, { expires: number; candidate: MediaCandidate; asset: AcquiredMediaAsset }>();
function prune() {
  for (const [key, value] of pending) if (value.expires < Date.now()) pending.delete(key);
}
export function registerGeneratedMedia(input: Omit<MediaCandidate, 'previewUrl'>, binary: Buffer): MediaCandidate {
  prune();
  if (binary.length > 5 * 1024 * 1024) throw new MediaProviderError('MEDIA_ASSET_TOO_LARGE', 'Imagem excede o limite permitido.');
  if (binary.length < 33 || !binary.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10])) || binary.toString('ascii', 12, 16) !== 'IHDR') {
    throw new MediaProviderError('MEDIA_INVALID_CONTENT_TYPE', 'O gerador não retornou uma imagem PNG válida.');
  }
  const width = binary.readUInt32BE(16), height = binary.readUInt32BE(20);
  if (!width || !height || width > 8192 || height > 8192) throw new MediaProviderError('MEDIA_PROVIDER_INVALID_RESPONSE', 'Dimensões de imagem inválidas.');
  const token = randomBytes(32).toString('hex');
  const candidate = mediaCandidateSchema.parse({ ...input, width, height, previewUrl: `/api/ai/media/generated/${token}` });
  const asset: AcquiredMediaAsset = { candidateId: candidate.candidateId, requestId: candidate.requestId, provider: candidate.provider,
    mimeType: 'image/png', width, height, byteLength: binary.length, binary,
    contentHash: createHash('sha256').update(binary).digest('hex'), originalFileName: 'generated.png' };
  while (pending.size >= 8) pending.delete(pending.keys().next().value!);
  pending.set(token, { expires: Date.now() + 30 * 60 * 1000, candidate, asset });
  return candidate;
}
export function readGeneratedPreview(token: string) {
  prune();
  const value = pending.get(token);
  if (!value) throw new MediaProviderError('MEDIA_ASSET_MISSING', 'A imagem temporária expirou. Gere novamente a imagem.');
  return value;
}
export function readGeneratedMedia(candidate: MediaCandidate): AcquiredMediaAsset {
  const token = /^\/api\/ai\/media\/generated\/([a-f0-9]{64})$/.exec(candidate.previewUrl)?.[1];
  if (!token) throw new MediaProviderError('MEDIA_ACQUIRE_FAILED', 'Referência de geração inválida.');
  const saved = readGeneratedPreview(token);
  if (JSON.stringify(candidate) !== JSON.stringify(saved.candidate)) throw new MediaProviderError('MEDIA_ACQUIRE_FAILED', 'Identidade da imagem divergente.');
  return saved.asset;
}
