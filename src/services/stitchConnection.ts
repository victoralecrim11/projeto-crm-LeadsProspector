import { getSiteAiAuthHeaders } from './siteAiAuth';

export interface StitchConnection {
  mode: 'server' | 'apiKey';
  apiKey: string;
}
const storageKey = 'prospector.stitch.session';
const empty: StitchConnection = { mode: 'server', apiKey: '' };
let connection = { ...empty };
try {
  const saved = JSON.parse(sessionStorage.getItem(storageKey) || 'null');
  if (saved && ['server', 'apiKey'].includes(saved.mode)) {
    connection = { mode: saved.mode, apiKey: String(saved.apiKey || '') };
  }
} catch { /* Storage may be unavailable. Keep credentials in memory. */ }

export function getStitchConnection(): StitchConnection { return { ...connection }; }
export function setStitchConnection(value: StitchConnection) {
  connection = {
    mode: value.mode,
    apiKey: value.mode === 'apiKey' ? value.apiKey.trim() : '',
  };
  try {
    sessionStorage.setItem(storageKey, JSON.stringify(connection));
    return true;
  } catch {
    console.warn('[Stitch] Não foi possível atualizar as credenciais no armazenamento da sessão. A alteração vale apenas em memória; ao recarregar, uma configuração anterior pode ser restaurada.');
    return false;
  }
}

export function getStitchHeaders(value = getStitchConnection()): Record<string, string> {
  const headers = { ...getSiteAiAuthHeaders() };
  if (value.mode === 'apiKey' && value.apiKey.trim()) headers['x-stitch-api-key'] = value.apiKey.trim();
  return headers;
}
