import type { Request } from 'express';
import { resolveStitchClientConfig } from '../../../tools/stitch-producer/clients/realStitchMcpClient.js';

// Called only after the application's production authorization check.
// Per-request credentials never enter process.env or persisted job artifacts.
export function stitchConfigForRequest(req: Request) {
  const apiKey = req.get('x-stitch-api-key')?.trim();
  if (apiKey) return { apiKey, accessToken: undefined, projectId: undefined, timeout: 240000 };
  return resolveStitchClientConfig();
}

export function stitchIsConfigured(config: ReturnType<typeof resolveStitchClientConfig>) {
  return Boolean(config.apiKey || (config.accessToken && config.projectId));
}
