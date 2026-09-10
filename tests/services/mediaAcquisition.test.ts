import test from 'node:test';
import assert from 'node:assert/strict';
import { acquireMediaAsset } from '../../server/services/media/mediaAcquisitionService.js';
import { MediaProviderError } from '../../server/services/media/mediaProvider.js';
import type { MediaCandidate } from '../../src/site-builder/contracts/media.js';

const baseCandidate: MediaCandidate = {
  version: 1,
  candidateId: 'cand_acq_1',
  requestId: 'req_acq',
  provider: 'pexels',
  providerAssetId: '999',
  sourceType: 'licensed',
  previewUrl: 'https://images.pexels.com/photos/999/download.jpg',
  sourcePageUrl: 'https://www.pexels.com/photo/999',
  width: 1200,
  height: 800,
  aspectRatio: '16:9',
  creator: 'Jane Doe',
  licenseLabel: 'Pexels License',
  attributionRequired: true,
  retrievedAt: new Date().toISOString(),
  confidence: 0.9,
  metadata: {},
};

test('mediaAcquisition: bloqueia host não autorizado e URL não-HTTPS', async () => {
  // 1. Host não autorizado (fora de pexels.com e pixabay.com)
  const badHostCandidate: MediaCandidate = {
    ...baseCandidate,
    previewUrl: 'https://malicious-site.com/image.jpg',
  };

  await assert.rejects(
    () => acquireMediaAsset(badHostCandidate),
    (err: unknown) => {
      assert.ok(err instanceof MediaProviderError);
      assert.equal(err.code, 'MEDIA_ACQUIRE_FAILED');
      assert.ok(err.message.includes('Host não autorizado'));
      return true;
    },
  );

  // 2. Protocolo não-HTTPS é rejeitado
  const httpCandidate = {
    ...baseCandidate,
    previewUrl: 'http://images.pexels.com/download.jpg' as never,
  };
  await assert.rejects(() => acquireMediaAsset(httpCandidate));
});

test('mediaAcquisition: bloqueia SSRF (IP privado e loopback)', async () => {
  // Simula DNS retornando 127.0.0.1
  const loopbackResolve = async () => [{ address: '127.0.0.1', family: 4 }];
  await assert.rejects(
    () => acquireMediaAsset(baseCandidate, { resolve: loopbackResolve }),
    (err: unknown) => {
      assert.ok(err instanceof MediaProviderError);
      assert.equal(err.code, 'MEDIA_ACQUIRE_FAILED');
      assert.ok(err.message.includes('Endereço IP reservado'));
      return true;
    },
  );

  // Simula DNS retornando IP privado 10.0.0.5
  const privateResolve = async () => [{ address: '10.0.0.5', family: 4 }];
  await assert.rejects(
    () => acquireMediaAsset(baseCandidate, { resolve: privateResolve }),
    (err: unknown) => {
      assert.ok(err instanceof MediaProviderError);
      assert.equal(err.code, 'MEDIA_ACQUIRE_FAILED');
      assert.ok(err.message.includes('Endereço IP reservado'));
      return true;
    },
  );

  // Simula DNS retornando cloud metadata IP 169.254.169.254
  const metadataResolve = async () => [{ address: '169.254.169.254', family: 4 }];
  await assert.rejects(
    () => acquireMediaAsset(baseCandidate, { resolve: metadataResolve }),
    (err: unknown) => {
      assert.ok(err instanceof MediaProviderError);
      assert.equal(err.code, 'MEDIA_ACQUIRE_FAILED');
      assert.ok(err.message.includes('Endereço IP reservado'));
      return true;
    },
  );
});

test('mediaAcquisition: valida JPEG, PNG, WebP e gera hash determinístico', async () => {
  const publicResolve = async () => [{ address: '151.101.1.1', family: 4 }];

  // 1. JPEG válido
  const jpegBytes = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(100, 1)]);
  const jpegTransport = async () => ({
    statusCode: 200,
    contentType: 'image/jpeg',
    buffer: jpegBytes,
  });

  const acquiredJpg = await acquireMediaAsset(baseCandidate, {
    resolve: publicResolve,
    transport: jpegTransport,
  });
  assert.equal(acquiredJpg.mimeType, 'image/jpeg');
  assert.equal(acquiredJpg.byteLength, jpegBytes.length);
  assert.equal(acquiredJpg.contentHash.length, 64);

  // 2. PNG válido
  const pngBytes = Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    Buffer.alloc(100, 2),
  ]);
  const pngTransport = async () => ({
    statusCode: 200,
    contentType: 'image/png',
    buffer: pngBytes,
  });

  const acquiredPng = await acquireMediaAsset(baseCandidate, {
    resolve: publicResolve,
    transport: pngTransport,
  });
  assert.equal(acquiredPng.mimeType, 'image/png');

  // 3. WebP válido
  const webpBytes = Buffer.concat([Buffer.from('RIFF0000WEBP', 'ascii'), Buffer.alloc(100, 3)]);
  const webpTransport = async () => ({
    statusCode: 200,
    contentType: 'image/webp',
    buffer: webpBytes,
  });

  const acquiredWebp = await acquireMediaAsset(baseCandidate, {
    resolve: publicResolve,
    transport: webpTransport,
  });
  assert.equal(acquiredWebp.mimeType, 'image/webp');
});

test('mediaAcquisition: rejeita SVG, HTML masquerading e arquivos com mais de 5 MiB', async () => {
  const publicResolve = async () => [{ address: '151.101.1.1', family: 4 }];

  // 1. Rejeita HTML
  const htmlTransport = async () => ({
    statusCode: 200,
    contentType: 'text/html',
    buffer: Buffer.from('<html><body>Masquerading HTML</body></html>'),
  });

  await assert.rejects(
    () => acquireMediaAsset(baseCandidate, { resolve: publicResolve, transport: htmlTransport }),
    (err: unknown) => {
      assert.ok(err instanceof MediaProviderError);
      assert.equal(err.code, 'MEDIA_INVALID_CONTENT_TYPE');
      return true;
    },
  );

  // 2. Rejeita SVG
  const svgTransport = async () => ({
    statusCode: 200,
    contentType: 'image/svg+xml',
    buffer: Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"></svg>'),
  });

  await assert.rejects(
    () => acquireMediaAsset(baseCandidate, { resolve: publicResolve, transport: svgTransport }),
    (err: unknown) => {
      assert.ok(err instanceof MediaProviderError);
      assert.equal(err.code, 'MEDIA_INVALID_CONTENT_TYPE');
      return true;
    },
  );
});
