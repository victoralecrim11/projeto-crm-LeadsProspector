import { lookup } from 'node:dns/promises';
import { createHash } from 'node:crypto';
import http from 'node:http';
import https from 'node:https';
import {
  mediaCandidateSchema,
  type AcquiredMediaAsset,
  type MediaCandidate,
} from '../../../src/site-builder/contracts/media.js';
import { isPublicAddress, lookupForAddress } from '../research/safeWebsite.js';
import { MediaProviderError } from './mediaProvider.js';

const ALLOWED_HOST_PATTERNS = [
  /^(?:[a-zA-Z0-9-]+\.)*pexels\.com$/,
  /^(?:[a-zA-Z0-9-]+\.)*pixabay\.com$/,
];

const MAX_BYTES = 5 * 1024 * 1024; // 5 MiB
const MAX_REDIRECTS = 2;
const TIMEOUT_MS = 5000;

function isHostAllowed(hostname: string): boolean {
  return ALLOWED_HOST_PATTERNS.some((pattern) => pattern.test(hostname));
}

function detectMimeFromMagicBytes(buffer: Buffer): 'image/jpeg' | 'image/png' | 'image/webp' | null {
  if (buffer.length < 12) return null;

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'image/jpeg';
  }

  // PNG: 89 50 4E 47
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
    return 'image/png';
  }

  // WebP: RIFF ... WEBP
  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return 'image/webp';
  }

  return null;
}

export type DnsResolve = (host: string) => Promise<{ address: string; family: number }[]>;
export type MediaFetchTransport = (
  url: URL,
  address: { address: string; family: number },
) => Promise<{
  statusCode: number;
  location?: string;
  contentType?: string;
  buffer: Buffer;
}>;

export async function acquireMediaAsset(
  candidateInput: MediaCandidate,
  dependencies: { resolve?: DnsResolve; transport?: MediaFetchTransport } = {},
): Promise<AcquiredMediaAsset> {
  const candidate = mediaCandidateSchema.parse(candidateInput);

  let currentUrl = candidate.previewUrl;
  let redirects = 0;

  while (redirects <= MAX_REDIRECTS) {
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(currentUrl);
    } catch {
      throw new MediaProviderError('MEDIA_ACQUIRE_FAILED', 'URL de asset inválida.');
    }

    if (parsedUrl.protocol !== 'https:') {
      throw new MediaProviderError('MEDIA_ACQUIRE_FAILED', 'Apenas URLs HTTPS são permitidas.');
    }

    const hostname = parsedUrl.hostname.toLowerCase();
    if (!isHostAllowed(hostname)) {
      throw new MediaProviderError(
        'MEDIA_ACQUIRE_FAILED',
        `Host não autorizado para aquisição de mídia: ${hostname}`,
      );
    }

    // SSRF Check: Resolução de DNS e verificação de IP público
    let addresses: { address: string; family: number }[];
    try {
      addresses = dependencies.resolve
        ? await dependencies.resolve(hostname)
        : await lookup(hostname, { all: true });
    } catch (err: unknown) {
      throw new MediaProviderError(
        'MEDIA_PROVIDER_UNAVAILABLE',
        'Falha ao resolver DNS do asset: ' + (err instanceof Error ? err.message : String(err)),
      );
    }

    if (!addresses.length || addresses.some(({ address }) => !isPublicAddress(address))) {
      throw new MediaProviderError(
        'MEDIA_ACQUIRE_FAILED',
        'Endereço IP reservado ou rede privada bloqueada por segurança.',
      );
    }

    const pinnedAddress = addresses[0];

    // Download com limite e timeout
    const fetchResult = dependencies.transport
      ? await dependencies.transport(parsedUrl, pinnedAddress)
      : await new Promise<{
          statusCode: number;
          location?: string;
          contentType?: string;
          buffer: Buffer;
        }>((resolve, reject) => {
      const signal = AbortSignal.timeout(TIMEOUT_MS);
      const req = (parsedUrl.protocol === 'https:' ? https : http).get(
        parsedUrl,
        {
          signal,
          agent: false,
          headers: {
            Accept: 'image/jpeg, image/png, image/webp',
            'User-Agent': 'ProspectorCRM-MediaAcquisition/1.0',
          },
          lookup: lookupForAddress(pinnedAddress) as never,
        },
        (res) => {
          const status = res.statusCode ?? 0;
          if (status >= 300 && status < 400 && res.headers.location) {
            res.resume();
            return resolve({
              statusCode: status,
              location: res.headers.location,
              buffer: Buffer.alloc(0),
            });
          }

          if (status < 200 || status >= 300) {
            res.resume();
            return reject(
              new MediaProviderError(
                'MEDIA_ACQUIRE_FAILED',
                `Download de mídia respondeu HTTP ${status}`,
                status,
              ),
            );
          }

          const chunks: Buffer[] = [];
          let byteCount = 0;

          res.on('data', (chunk: Buffer) => {
            byteCount += chunk.length;
            if (byteCount > MAX_BYTES) {
              res.destroy();
              reject(
                new MediaProviderError(
                  'MEDIA_ASSET_TOO_LARGE',
                  `Asset excede o limite máximo permitido de ${MAX_BYTES / (1024 * 1024)} MiB.`,
                ),
              );
            } else {
              chunks.push(chunk);
            }
          });

          res.on('error', (err) =>
            reject(
              new MediaProviderError('MEDIA_ACQUIRE_FAILED', 'Erro durante download: ' + err.message),
            ),
          );
          res.on('end', () => {
            resolve({
              statusCode: status,
              contentType: res.headers['content-type'],
              buffer: Buffer.concat(chunks),
            });
          });
        },
      );

      req.on('error', (err) => {
        if (err.name === 'TimeoutError' || err.message.includes('timeout')) {
          reject(new MediaProviderError('MEDIA_PROVIDER_TIMEOUT', 'Timeout ao baixar asset de mídia.'));
        } else {
          reject(new MediaProviderError('MEDIA_ACQUIRE_FAILED', 'Erro de conexão: ' + err.message));
        }
      });
    });

    if (fetchResult.statusCode >= 300 && fetchResult.statusCode < 400 && fetchResult.location) {
      currentUrl = new URL(fetchResult.location, parsedUrl).href;
      redirects++;
      continue;
    }

    // Validação de Magic Bytes e MIME
    const detectedMime = detectMimeFromMagicBytes(fetchResult.buffer);
    if (!detectedMime) {
      throw new MediaProviderError(
        'MEDIA_INVALID_CONTENT_TYPE',
        'O arquivo baixado não é uma imagem JPEG, PNG ou WebP válida.',
      );
    }

    // Calcula Hash SHA-256 determinístico
    const contentHash = createHash('sha256').update(fetchResult.buffer).digest('hex');

    const ext = detectedMime === 'image/jpeg' ? 'jpg' : detectedMime === 'image/png' ? 'png' : 'webp';
    const originalFileName = `media-${candidate.provider}-${candidate.providerAssetId}.${ext}`;

    const acquired: AcquiredMediaAsset = {
      candidateId: candidate.candidateId,
      requestId: candidate.requestId,
      provider: candidate.provider,
      mimeType: detectedMime,
      width: candidate.width,
      height: candidate.height,
      byteLength: fetchResult.buffer.length,
      contentHash,
      binary: fetchResult.buffer,
      originalFileName,
    };

    return acquired;
  }

  throw new MediaProviderError('MEDIA_ACQUIRE_FAILED', 'Limite de redirecionamentos excedido.');
}
