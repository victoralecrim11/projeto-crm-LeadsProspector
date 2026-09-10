/**
 * Centralized API client for Site AI endpoints.
 * Reuses the access token managed by siteGenerationService.
 * Never logs the token. Never exposes it to VITE_* env vars.
 */

let accessToken = '';

export function setMediaAccessToken(value: string) {
  accessToken = value;
}

export function getMediaAccessToken(): string {
  return accessToken;
}

function authHeaders(): Record<string, string> {
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  if (accessToken) {
    h['Authorization'] = `Bearer ${accessToken}`;
  }
  return h;
}

export async function authorizedJsonFetch<T = unknown>(
  url: string,
  body: unknown,
  signal?: AbortSignal,
): Promise<T> {
  const response = await fetch(url, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(body),
    signal: signal ?? AbortSignal.timeout(30000),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(
      typeof data.error === 'string' ? data.error : `Erro na requisição (${response.status})`,
    );
  }

  return response.json() as Promise<T>;
}

export async function authorizedBinaryFetch(
  url: string,
  body: unknown,
  signal?: AbortSignal,
): Promise<Response> {
  const response = await fetch(url, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(body),
    signal: signal ?? AbortSignal.timeout(30000),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(
      typeof data.error === 'string' ? data.error : 'Falha ao adquirir asset de mídia do servidor.',
    );
  }

  return response;
}
