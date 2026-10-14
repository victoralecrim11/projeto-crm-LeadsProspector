let siteAiAccessToken = '';
try { siteAiAccessToken = sessionStorage.getItem('prospector.site-ai.session') || ''; } catch { /* Memory fallback. */ }

export function setSiteAiAccessToken(value: string) {
  siteAiAccessToken = (value || '').toString().trim();
  try {
    if (siteAiAccessToken) sessionStorage.setItem('prospector.site-ai.session', siteAiAccessToken);
    else sessionStorage.removeItem('prospector.site-ai.session');
    return true;
  } catch {
    console.warn('[Prospector] Não foi possível atualizar o token de acesso no armazenamento da sessão. A alteração vale apenas em memória; ao recarregar, um token anterior pode ser restaurado.');
    return false;
  }
}

export function getSiteAiAccessToken(): string {
  return siteAiAccessToken;
}

export function getSiteAiAuthHeaders(): Record<string, string> {
  if (!siteAiAccessToken) return {};
  return { Authorization: `Bearer ${siteAiAccessToken}` };
}

// Do NOT export the raw secret or log it.
