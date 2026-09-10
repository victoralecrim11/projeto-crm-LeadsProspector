import { authorizeWebsite, lookupForAddress, type Resolve, type Transport, WebsitePolicyError } from './safeWebsite.js';
import http from 'node:http';
import https from 'node:https';

export class SafeCssPolicyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SafeCssPolicyError';
  }
}

/**
 * Sanitizes CSS content deterministically:
 * - Strips all @import rules (prevents recursive network imports / SSRF chains)
 * - Strips url(...) references (prevents external tracking or asset exfiltration)
 * - Strips dangerous legacy execution vectors: expression(), -moz-binding, behavior:
 * - Strips script tags or unexpected HTML
 */
export function sanitizeCssContent(rawCss: string): string {
  return rawCss
    // 1. Remove HTML tags if mixed in
    .replace(/<[^>]+>/g, ' ')
    // 2. Remove @import statements
    .replace(/@import\b[^;]*;/gi, '/* [stripped-import] */')
    // 3. Remove url(...) expressions
    .replace(/url\s*\([^)]*\)/gi, '/* [stripped url] */')
    // 4. Remove IE/legacy active scripts: expression(...), behavior, -moz-binding
    .replace(/expression\s*\([^)]*\)/gi, 'none')
    .replace(/behavior\s*:[^;}]*/gi, '/* [stripped behavior] */')
    .replace(/-moz-binding\s*:[^;}]*/gi, '/* [stripped moz-binding] */');
}

const pinnedCssTransport: Transport = ({ url, address }, signal) => new Promise((resolve, reject) => {
  const request = (url.protocol === 'https:' ? https : http).get(url, {
    signal,
    agent: false,
    headers: {
      Accept: 'text/css, text/plain;q=0.9',
      'Accept-Encoding': 'identity',
      'User-Agent': 'ProspectorCRM-SafeCssAudit/1.0',
    },
    lookup: lookupForAddress(address) as never,
  }, response => {
    const status = response.statusCode ?? 0;
    const contentType = String(response.headers['content-type'] ?? '');
    if (status >= 300 && status < 400) {
      response.destroy();
      resolve({ status, location: response.headers.location, contentType, body: '' });
      return;
    }
    if (!/(?:text\/css|text\/plain)(?:;|$)/i.test(contentType) || (response.headers['content-encoding'] && response.headers['content-encoding'] !== 'identity')) {
      response.destroy();
      reject(new SafeCssPolicyError('Tipo de conteúdo CSS não permitido (exige text/css).'));
      return;
    }
    const chunks: Buffer[] = [];
    let size = 0;
    // Strict 256 KiB limit for CSS stylesheets
    const maxCssBytes = 256 * 1024;
    response.on('data', (chunk: Buffer) => {
      size += chunk.length;
      if (size > maxCssBytes) {
        response.destroy();
        reject(new SafeCssPolicyError('Stylesheet excede limite de 256 KiB.'));
      } else {
        chunks.push(chunk);
      }
    });
    response.on('error', reject);
    response.on('end', () => resolve({ status, contentType, body: Buffer.concat(chunks).toString('utf8') }));
  });
  request.on('error', reject);
});

export async function fetchSafeStylesheet(
  rawUrl: string,
  dependencies: { resolve?: Resolve; transport?: Transport } = {},
): Promise<string> {
  const signal = AbortSignal.timeout(5000);
  let current = rawUrl;
  for (let redirects = 0; redirects <= 2; redirects++) {
    const target = await authorizeWebsite(current, dependencies.resolve);
    signal.throwIfAborted();
    const page = await (dependencies.transport ?? pinnedCssTransport)(target, signal);
    if (page.status >= 300 && page.status < 400) {
      if (!page.location || redirects === 2) throw new SafeCssPolicyError('Limite de redirects excedido para CSS.');
      current = new URL(page.location, target.url).href;
      continue;
    }
    if (page.status < 200 || page.status >= 300) throw new SafeCssPolicyError('Stylesheet indisponível.');
    if (Buffer.byteLength(page.body) > 256 * 1024) throw new SafeCssPolicyError('Stylesheet excede limite de 256 KiB.');
    return sanitizeCssContent(page.body);
  }
  throw new SafeCssPolicyError('Falha ao obter stylesheet seguro.');
}

/**
 * Fetches and sanitizes external stylesheets for a reference page with bounded guarantees:
 * - Limited to at most 3 external stylesheets per reference
 * - Limited to at most 256 KiB total combined across all fetched stylesheets
 * - Enforces individual stylesheet SSRF validation, content-type checks, and sanitizer stripping
 */
export async function fetchReferenceStylesheets(
  urls: string[],
  dependencies: { resolve?: Resolve; transport?: Transport } = {},
): Promise<string[]> {
  const boundedUrls = urls.slice(0, 3);
  const results: string[] = [];
  let totalBytes = 0;
  const maxCombinedBytes = 256 * 1024;

  for (const url of boundedUrls) {
    try {
      const sanitized = await fetchSafeStylesheet(url, dependencies);
      const byteLen = Buffer.byteLength(sanitized, 'utf8');
      if (totalBytes + byteLen > maxCombinedBytes) {
        break;
      }
      totalBytes += byteLen;
      results.push(sanitized);
    } catch {
      // Individual stylesheet failure does not crash the reference analysis
      continue;
    }
  }

  return results;
}

