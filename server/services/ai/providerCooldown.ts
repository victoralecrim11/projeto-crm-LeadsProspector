const cooldowns = new Map<string, number>();

function key(provider: string | undefined, model: string | undefined) {
  return `${provider ?? 'unknown'}:${model ?? 'unknown'}`;
}

export function setCooldown(provider: string | undefined, model: string | undefined, untilMs: number) {
  const k = key(provider, model);
  const until = Date.now() + untilMs;
  cooldowns.set(k, until);
}

export function getCooldownUntil(provider: string | undefined, model: string | undefined) {
  const k = key(provider, model);
  return cooldowns.get(k) ?? 0;
}

export function clearCooldown(provider: string | undefined, model: string | undefined) {
  const k = key(provider, model);
  cooldowns.delete(k);
}

export function isCooling(provider: string | undefined, model: string | undefined) {
  const until = getCooldownUntil(provider, model);
  return Date.now() < until;
}

function parseRetryAfterHeader(raw: string | null) {
  if (!raw) return 0;
  const trimmed = raw.trim();
  // If numeric seconds
  if (/^\d+$/.test(trimmed)) return parseInt(trimmed, 10) * 1000;
  // Try HTTP-date
  const parsed = Date.parse(trimmed);
  if (!isNaN(parsed)) return parsed - Date.now();
  return 0;
}

export function setCooldownFromRetryAfter(response: Response | { headers?: { get: (k: string) => string | null } }, provider: string | undefined, model: string | undefined, defaultMs = 60000) {
  try {
    const raw = response.headers?.get?.("retry-after") ?? null;
    const parsed = parseRetryAfterHeader(raw);
    const ms = parsed > 0 ? parsed : defaultMs;
    setCooldown(provider, model, ms);
  } catch (e) {
    setCooldown(provider, model, defaultMs);
  }
}

// Test helper
export function _resetCooldowns() {
  cooldowns.clear();
}

export function _dumpCooldowns() {
  return Array.from(cooldowns.entries()).map(([k, v]) => ({ key: k, until: v }));
}

export default {
  setCooldown,
  isCooling,
  getCooldownUntil,
  clearCooldown,
  setCooldownFromRetryAfter,
  _resetCooldowns,
  _dumpCooldowns,
};
