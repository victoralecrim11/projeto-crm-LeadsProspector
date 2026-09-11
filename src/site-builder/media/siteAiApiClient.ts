import { getSiteAiAuthHeaders } from '../../services/siteAiAuth';

function authHeaders(): Record<string, string> {
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  const auth = getSiteAiAuthHeaders();
  return { ...h, ...auth };
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
