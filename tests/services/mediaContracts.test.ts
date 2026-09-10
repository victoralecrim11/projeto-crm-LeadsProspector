import test from 'node:test';
import assert from 'node:assert/strict';
import {
  mediaCandidateSchema,
  acquiredMediaAssetSchema,
  storedMediaAssetSchema,
  mediaManifestSchema,
  type MediaCandidate,
  type MediaManifest,
} from '../../src/site-builder/contracts/media.js';

const validCandidate: MediaCandidate = {
  version: 1,
  candidateId: 'cand_123',
  requestId: 'req_456',
  provider: 'pexels',
  providerAssetId: 'pexels_789',
  sourceType: 'licensed',
  previewUrl: 'https://images.pexels.com/photos/789/pexels-photo-789.jpeg',
  sourcePageUrl: 'https://www.pexels.com/photo/789',
  width: 1920,
  height: 1080,
  aspectRatio: '16:9',
  creator: 'John Doe',
  creatorUrl: 'https://www.pexels.com/@johndoe',
  licenseLabel: 'Pexels License',
  licenseUrl: 'https://www.pexels.com/license',
  attributionText: 'Photo by John Doe on Pexels',
  attributionRequired: true,
  retrievedAt: new Date().toISOString(),
  confidence: 0.95,
  metadata: { avgColor: '#2b2b2b' },
};

test('MediaCandidate: valida candidato estrito e rejeita anomalias', () => {
  const parsed = mediaCandidateSchema.safeParse(validCandidate);
  assert.equal(parsed.success, true);

  // Rejeita HTTP (não-HTTPS)
  const httpCandidate = { ...validCandidate, previewUrl: 'http://images.pexels.com/photo.jpg' };
  assert.equal(mediaCandidateSchema.safeParse(httpCandidate).success, false);

  // Rejeita dimensões inválidas (zero ou negativo)
  assert.equal(mediaCandidateSchema.safeParse({ ...validCandidate, width: 0 }).success, false);
  assert.equal(mediaCandidateSchema.safeParse({ ...validCandidate, height: -10 }).success, false);

  // Rejeita campos desconhecidos (strict)
  assert.equal(mediaCandidateSchema.safeParse({ ...validCandidate, unknownProp: 'bad' }).success, false);

  // Rejeita confiança fora da faixa [0, 1]
  assert.equal(mediaCandidateSchema.safeParse({ ...validCandidate, confidence: 1.5 }).success, false);
});

test('AcquiredMediaAsset: valida mime permitido, hash e limite de 5 MiB', () => {
  const validAcquired = {
    candidateId: 'cand_123',
    requestId: 'req_456',
    provider: 'pexels' as const,
    mimeType: 'image/jpeg' as const,
    width: 1200,
    height: 800,
    byteLength: 1024 * 500, // 500 KB
    contentHash: 'a'.repeat(64),
    binary: Buffer.from('fake-jpeg-data'),
    originalFileName: 'hero-123.jpg',
  };

  assert.equal(acquiredMediaAssetSchema.safeParse(validAcquired).success, true);

  // Rejeita SVG
  assert.equal(
    acquiredMediaAssetSchema.safeParse({ ...validAcquired, mimeType: 'image/svg+xml' }).success,
    false,
  );

  // Rejeita HTML
  assert.equal(
    acquiredMediaAssetSchema.safeParse({ ...validAcquired, mimeType: 'text/html' }).success,
    false,
  );

  // Rejeita tamanho superior a 5 MiB
  assert.equal(
    acquiredMediaAssetSchema.safeParse({
      ...validAcquired,
      byteLength: 5 * 1024 * 1024 + 1,
    }).success,
    false,
  );

  // Rejeita hash inválido (tamanho diferente de 64 caracteres hex)
  assert.equal(
    acquiredMediaAssetSchema.safeParse({ ...validAcquired, contentHash: 'not-sha256' }).success,
    false,
  );
});

test('StoredMediaAsset: valida registro estruturado de persistência', () => {
  const validStored = {
    assetId: 'asset_abc',
    requestId: 'req_456',
    provider: 'pixabay' as const,
    storageKey: 'media_asset_abc',
    mimeType: 'image/webp' as const,
    width: 800,
    height: 600,
    byteLength: 204800,
    contentHash: 'b'.repeat(64),
    createdAt: new Date().toISOString(),
  };

  assert.equal(storedMediaAssetSchema.safeParse(validStored).success, true);

  // Rejeita campos extras
  assert.equal(
    storedMediaAssetSchema.safeParse({ ...validStored, extraField: 'invalid' }).success,
    false,
  );
});

test('MediaManifest: valida ciclo de revisão, proveniência e regras de alt', () => {
  const validManifest: MediaManifest = {
    version: 1,
    projectId: 'proj_123',
    generatedAt: new Date().toISOString(),
    entries: [
      {
        id: 'hero-img-1',
        requestId: 'req_456',
        section: 'hero',
        sourceType: 'licensed',
        provider: 'pexels',
        providerAssetId: '789',
        sourcePageUrl: 'https://www.pexels.com/photo/789',
        licenseLabel: 'Pexels License',
        attributionText: 'Photo by John Doe on Pexels',
        retrievedAt: new Date().toISOString(),
        contentHash: 'c'.repeat(64),
        assetId: 'asset_789',
        assetPath: 'media-hero-789.jpg',
        mimeType: 'image/jpeg',
        width: 1920,
        height: 1080,
        byteLength: 350000,
        alt: 'Ambiente moderno de restaurante com iluminação acolhedora',
        decorative: false,
        realBusinessMedia: false,
        licensed: true,
        aiGenerated: false,
        reviewStatus: 'reviewed',
      },
      {
        id: 'about-img-1',
        requestId: 'req_456',
        section: 'about',
        sourceType: 'licensed',
        provider: 'pixabay',
        providerAssetId: '101',
        sourcePageUrl: 'https://pixabay.com/photos/101',
        licenseLabel: 'Pixabay Content License',
        retrievedAt: new Date().toISOString(),
        contentHash: 'd'.repeat(64),
        assetId: 'asset_101',
        assetPath: 'media-about-101.webp',
        mimeType: 'image/webp',
        width: 800,
        height: 600,
        byteLength: 150000,
        alt: '',
        decorative: true,
        realBusinessMedia: false,
        licensed: true,
        aiGenerated: false,
        reviewStatus: 'exportable',
      },
    ],
  };

  assert.equal(mediaManifestSchema.safeParse(validManifest).success, true);

  // Rejeita IDs duplicados
  const duplicateManifest = {
    ...validManifest,
    entries: [validManifest.entries[0], validManifest.entries[0]],
  };
  assert.equal(mediaManifestSchema.safeParse(duplicateManifest).success, false);

  // Rejeita aiGenerated: true na Fase C.1
  const aiGeneratedManifest = {
    ...validManifest,
    entries: [{ ...validManifest.entries[0], aiGenerated: true as never }],
  };
  assert.equal(mediaManifestSchema.safeParse(aiGeneratedManifest).success, false);

  // Rejeita mídia informativa com alt vazio
  const emptyInformativeAlt = {
    ...validManifest,
    entries: [{ ...validManifest.entries[0], decorative: false, alt: '' }],
  };
  assert.equal(mediaManifestSchema.safeParse(emptyInformativeAlt).success, false);

  // Rejeita mídia decorativa com alt preenchido
  const filledDecorativeAlt = {
    ...validManifest,
    entries: [{ ...validManifest.entries[1], decorative: true, alt: 'Imagem decorativa' }],
  };
  assert.equal(mediaManifestSchema.safeParse(filledDecorativeAlt).success, false);

  // Rejeita reviewStatus inválido
  const invalidStatus = {
    ...validManifest,
    entries: [{ ...validManifest.entries[0], reviewStatus: 'auto-approved-fake' as never }],
  };
  assert.equal(mediaManifestSchema.safeParse(invalidStatus).success, false);
});
