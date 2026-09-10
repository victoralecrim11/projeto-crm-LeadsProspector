import { z } from 'zod';
import { sectionIds } from '../types.js';

export const mediaErrorCodeSchema = z.enum([
  'MEDIA_PROVIDER_NOT_CONFIGURED',
  'MEDIA_PROVIDER_UNAUTHORIZED',
  'MEDIA_PROVIDER_RATE_LIMITED',
  'MEDIA_PROVIDER_TIMEOUT',
  'MEDIA_PROVIDER_UNAVAILABLE',
  'MEDIA_PROVIDER_INVALID_RESPONSE',
  'MEDIA_NO_RESULTS',
  'MEDIA_ACQUIRE_FAILED',
  'MEDIA_INVALID_CONTENT_TYPE',
  'MEDIA_ASSET_TOO_LARGE',
  'MEDIA_ASSET_STORE_FAILED',
  'MEDIA_ASSET_MISSING',
]);
export type MediaErrorCode = z.infer<typeof mediaErrorCodeSchema>;

const httpsUrl = z.string().url().max(2048).refine((v) => {
  try {
    return new URL(v).protocol === 'https:';
  } catch {
    return false;
  }
}, 'URLs devem usar HTTPS.');

export const mediaCandidateSchema = z.object({
  version: z.literal(1),
  candidateId: z.string().min(1).max(120),
  requestId: z.string().min(1).max(120),
  provider: z.enum(['pexels', 'pixabay']),
  providerAssetId: z.string().min(1).max(120),
  sourceType: z.literal('licensed'),
  previewUrl: httpsUrl,
  sourcePageUrl: httpsUrl,
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  aspectRatio: z.enum(['1:1', '4:3', '3:4', '16:9']),
  creator: z.string().trim().max(180).optional(),
  creatorUrl: httpsUrl.optional(),
  licenseLabel: z.string().trim().min(1).max(120),
  licenseUrl: httpsUrl.optional(),
  attributionText: z.string().trim().max(300).optional(),
  attributionRequired: z.boolean(),
  downloadTrackingUrl: httpsUrl.optional(),
  retrievedAt: z.string().datetime(),
  confidence: z.number().min(0).max(1),
  metadata: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).default({}),
}).strict();
export type MediaCandidate = z.infer<typeof mediaCandidateSchema>;

export const acquiredMediaAssetSchema = z.object({
  candidateId: z.string().min(1).max(120),
  requestId: z.string().min(1).max(120),
  provider: z.enum(['pexels', 'pixabay']),
  mimeType: z.enum(['image/jpeg', 'image/png', 'image/webp']),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  byteLength: z.number().int().positive().max(5 * 1024 * 1024, 'Asset excede o limite de 5 MiB.'),
  contentHash: z.string().regex(/^[a-f0-9]{64}$/, 'Content hash deve ser SHA-256.'),
  binary: z.any(),
  originalFileName: z.string().regex(/^[a-zA-Z0-9_.-]{1,120}$/).optional(),
});
export type AcquiredMediaAsset = z.infer<typeof acquiredMediaAssetSchema>;

export const storedMediaAssetSchema = z.object({
  assetId: z.string().min(1).max(120),
  requestId: z.string().min(1).max(120),
  provider: z.enum(['pexels', 'pixabay']),
  storageKey: z.string().min(1).max(120),
  mimeType: z.enum(['image/jpeg', 'image/png', 'image/webp']),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  byteLength: z.number().int().positive().max(5 * 1024 * 1024),
  contentHash: z.string().regex(/^[a-f0-9]{64}$/),
  createdAt: z.string().datetime(),
}).strict();
export type StoredMediaAsset = z.infer<typeof storedMediaAssetSchema>;

export const mediaReviewStatusSchema = z.enum([
  'candidate',
  'selected',
  'reviewed',
  'exportable',
  'rejected',
]);
export type MediaReviewStatus = z.infer<typeof mediaReviewStatusSchema>;

export const mediaManifestEntrySchema = z.object({
  id: z.string().min(1).max(80),
  requestId: z.string().min(1).max(120),
  section: z.enum(sectionIds),
  sourceType: z.literal('licensed'),
  provider: z.enum(['pexels', 'pixabay']),
  providerAssetId: z.string().min(1).max(120),
  sourcePageUrl: httpsUrl,
  licenseLabel: z.string().trim().min(1).max(120),
  licenseUrl: httpsUrl.optional(),
  attributionText: z.string().trim().max(300).optional(),
  creator: z.string().trim().max(180).optional(),
  creatorUrl: httpsUrl.optional(),
  retrievedAt: z.string().datetime(),
  contentHash: z.string().regex(/^[a-f0-9]{64}$/),
  assetId: z.string().min(1).max(120),
  assetPath: z.string().regex(/^[a-zA-Z0-9_.-]{1,120}$/),
  mimeType: z.enum(['image/jpeg', 'image/png', 'image/webp']),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  byteLength: z.number().int().positive().max(5 * 1024 * 1024),
  alt: z.string().trim().max(300),
  decorative: z.boolean(),
  realBusinessMedia: z.literal(false),
  licensed: z.literal(true),
  aiGenerated: z.literal(false),
  reviewStatus: mediaReviewStatusSchema,
}).strict().refine((item) => (item.decorative ? item.alt === '' : item.alt.length > 0), {
  message: 'Mídia decorativa usa alt vazio; mídia informativa exige descrição.',
});
export type MediaManifestEntry = z.infer<typeof mediaManifestEntrySchema>;

export const mediaManifestSchema = z.object({
  version: z.literal(1),
  projectId: z.string().min(1).max(120),
  generatedAt: z.string().datetime(),
  entries: z.array(mediaManifestEntrySchema).max(20),
}).strict().refine((m) => new Set(m.entries.map((e) => e.id)).size === m.entries.length, {
  message: 'IDs no manifesto de mídia devem ser únicos.',
});
export type MediaManifest = z.infer<typeof mediaManifestSchema>;

export const mediaPlanSchema = z.object({
  version: z.literal(1),
  // Requests only: no provider, URL or claim of generated/approved assets.
  items: z.array(z.object({
    id: z.string().regex(/^[a-z][a-z0-9-]{0,79}$/), 
    section: z.enum(sectionIds), 
    purpose: z.string().trim().min(1).max(1600),
    sourcePreference: z.enum(['business', 'client', 'licensed', 'generated-illustration']),
    aspectRatio: z.enum(['1:1', '4:3', '3:4', '16:9']),
    decorative: z.boolean(), 
    alt: z.string().trim().max(300),
  }).strict().refine((item) => item.decorative ? item.alt === '' : item.alt.length > 0,
    'Mídia decorativa usa alt vazio; mídia informativa exige descrição.')).max(20),
}).strict().refine((value) => new Set(value.items.map((item) => item.id)).size === value.items.length,
  'IDs de mídia devem ser únicos.');

export type MediaPlan = z.infer<typeof mediaPlanSchema>;
