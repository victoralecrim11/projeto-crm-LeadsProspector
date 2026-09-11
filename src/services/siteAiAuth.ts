let siteAiAccessToken = '';

export function setSiteAiAccessToken(value: string) {
  siteAiAccessToken = (value || '').toString().trim();
}

export function getSiteAiAccessToken(): string {
  return siteAiAccessToken;
}

export function getSiteAiAuthHeaders(): Record<string, string> {
  if (!siteAiAccessToken) return {};
  return { Authorization: `Bearer ${siteAiAccessToken}` };
}

// Do NOT export the raw secret or log it.
