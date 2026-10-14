import type { Request } from 'express';
import { resolveStitchClientConfig } from '../../../tools/stitch-producer/clients/realStitchMcpClient.js';

// Public Stitch routes use only the caller's API key; never fall back to server credentials.
// Per-request credentials never enter process.env or persisted job artifacts.
export function stitchConfigForRequest(req: Request) {
  const apiKey = req.get('x-stitch-api-key')?.trim();
  return { apiKey, accessToken: undefined, projectId: undefined, timeout: 240000 };
}

export function stitchIsConfigured(config: ReturnType<typeof resolveStitchClientConfig>) {
  return Boolean(config.apiKey || (config.accessToken && config.projectId));
}
