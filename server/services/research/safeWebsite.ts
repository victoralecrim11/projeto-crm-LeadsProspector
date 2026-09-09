import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';
import http from 'node:http';
import https from 'node:https';

export class WebsitePolicyError extends Error {}
export function isPublicAddress(ip: string): boolean {
  if (isIP(ip) === 4) {
    const [a, b, c] = ip.split('.').map(Number);
    return !(a === 0 || a === 10 || a === 127 || a >= 224 || (a === 100 && b >= 64 && b <= 127)
      || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && (b === 168 || b === 0 || (b === 2)))
      || (a === 198 && (b === 18 || b === 19 || (b === 51 && c === 100))) || (a === 203 && b === 0 && c === 113));
  }
  // Conservative IPv6 policy: global unicast only, excluding transition/documentation space.
  if (isIP(ip) === 6) return /^[23][0-9a-f]{3}:/i.test(ip) && !/^200[12]:/i.test(ip) && !/^3fff:/i.test(ip);
  return false;
}
export type Resolve = (host: string) => Promise<{ address: string; family: number }[]>;
export async function authorizeWebsite(raw: string, resolve: Resolve = host => lookup(host, { all: true })) {
  let url: URL;
  try { url = new URL(raw); } catch { throw new WebsitePolicyError('URL inválida.'); }
  const host = url.hostname.replace(/^\[|\]$/g, '').replace(/\.$/, '');
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || (url.port && !['80', '443'].includes(url.port))
    || host === 'localhost' || host.endsWith('.localhost') || !host.includes('.') && !isIP(host)) throw new WebsitePolicyError('Destino não permitido.');
  const addresses = isIP(host) ? [{ address: host, family: isIP(host) }] : await resolve(host);
  if (!addresses.length || addresses.some(({ address }) => !isPublicAddress(address))) throw new WebsitePolicyError('Rede privada ou reservada bloqueada.');
  url.hash = '';
  return { url, address: addresses[0] };
}
export type PageResponse = { status: number; location?: string; contentType: string; body: string };
export type Transport = (target: Awaited<ReturnType<typeof authorizeWebsite>>, signal: AbortSignal) => Promise<PageResponse>;
export function lookupForAddress(address: { address: string; family: number }) {
  return (_hostname: string, options: { all?: boolean }, callback: (error: null, result: string | { address: string; family: number }[], family?: number) => void) =>
    options.all ? callback(null, [address]) : callback(null, address.address, address.family);
}
const pinnedRequest: Transport = ({ url, address }, signal) => new Promise((resolve, reject) => {
  const request = (url.protocol === 'https:' ? https : http).get(url, {
    signal, agent: false, headers: { Accept: 'text/html', 'Accept-Encoding': 'identity', 'User-Agent': 'ProspectorCRM-SiteAudit/1.0' },
    // Pin the validated address; preserve hostname for Host and TLS certificate validation.
    lookup: lookupForAddress(address) as never,
  }, response => {
    const status = response.statusCode ?? 0;
    const contentType = String(response.headers['content-type'] ?? '');
    if (status >= 300 && status < 400) { response.destroy(); resolve({ status, location: response.headers.location, contentType, body: '' }); return; }
    if (!/^text\/html(?:;|$)/i.test(contentType) || response.headers['content-encoding'] && response.headers['content-encoding'] !== 'identity') {
      response.destroy(); reject(new WebsitePolicyError('Tipo de conteúdo não permitido.')); return;
    }
    const chunks: Buffer[] = []; let size = 0;
    response.on('data', (chunk: Buffer) => {
      size += chunk.length;
      if (size > 1024 * 1024) { response.destroy(); reject(new WebsitePolicyError('Página excede 1 MiB.')); }
      else chunks.push(chunk);
    });
    response.on('error', reject);
    response.on('end', () => resolve({ status, contentType, body: Buffer.concat(chunks).toString('utf8') }));
  });
  request.on('error', reject);
});
export async function fetchWebsite(raw: string, dependencies: { resolve?: Resolve; transport?: Transport } = {}) {
  const signal = AbortSignal.timeout(10000);
  const work = async () => {
    let current = raw;
    for (let redirects = 0; redirects <= 3; redirects++) {
      const target = await authorizeWebsite(current, dependencies.resolve);
      signal.throwIfAborted();
      const page = await (dependencies.transport ?? pinnedRequest)(target, signal);
      if (page.status >= 300 && page.status < 400) {
        if (!page.location || redirects === 3) throw new WebsitePolicyError('Limite de redirects.');
        current = new URL(page.location, target.url).href; continue;
      }
      if (page.status < 200 || page.status >= 300) throw new Error('Website indisponível.');
      if (!/^text\/html(?:;|$)/i.test(page.contentType) || Buffer.byteLength(page.body) > 1024 * 1024) throw new WebsitePolicyError('Conteúdo inválido.');
      return { url: target.url.href, html: page.body };
    }
    throw new WebsitePolicyError('Limite de redirects.');
  };
  let abort: () => void = () => {};
  try { return await Promise.race([work(), new Promise<never>((_, reject) => {
    abort = () => reject(new Error('Tempo de auditoria excedido.'));
    signal.addEventListener('abort', abort, { once: true });
  })]); } finally { signal.removeEventListener('abort', abort); }
}
