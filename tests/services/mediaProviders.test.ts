import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { buildLicensedMediaQueries } from '../../server/services/media/queryBuilder.js';
import { PexelsLicensedMediaProvider } from '../../server/services/media/pexelsProvider.js';
import { PixabayLicensedMediaProvider } from '../../server/services/media/pixabayProvider.js';
import { MediaFallbackChain } from '../../server/services/media/mediaFallbackChain.js';
import { MediaProviderError, type LicensedMediaSearchInput } from '../../server/services/media/mediaProvider.js';

test('LicensedMediaQueryBuilder: gera queries contextuais e sanitiza dados do CRM', () => {
  const queries = buildLicensedMediaQueries({
    niche: 'restaurant',
    subNiche: 'artisan pizza',
    section: 'hero',
    purpose: 'Mostrar o salão do restaurante e pratos principais',
    imageryDirection: 'warm atmospheric dining lighting',
    locale: 'pt-BR',
  });

  assert.ok(queries.length >= 1 && queries.length <= 3);
  assert.ok(queries.some((q) => q.includes('restaurant') || q.includes('dining')));

  // Teste de sanitização de dados sensíveis (email, telefone, endereço, CNPJ)
  const sensitiveQueries = buildLicensedMediaQueries({
    niche: 'barbearia',
    section: 'hero',
    purpose: 'Contato pelo email joao@barber.com ou tel 11 99999-8888 na Rua das Flores 123 CNPJ 12.345.678/0001-90',
    locale: 'pt-BR',
  });

  for (const q of sensitiveQueries) {
    assert.equal(q.includes('joao@barber.com'), false);
    assert.equal(q.includes('99999'), false);
    assert.equal(q.includes('Rua das Flores'), false);
    assert.equal(q.includes('12.345.678'), false);
  }
});

test('PexelsLicensedMediaProvider: trata configuração ausente e erros upstream', async () => {
  const unconfigured = new PexelsLicensedMediaProvider('');
  assert.equal(unconfigured.isConfigured(), false);

  const searchInput: LicensedMediaSearchInput = {
    requestId: 'req_test',
    niche: 'restaurant',
    section: 'hero',
    purpose: 'Hero image',
    aspectRatio: '16:9',
  };

  await assert.rejects(
    () => unconfigured.search(searchInput),
    (err: unknown) => {
      assert.ok(err instanceof MediaProviderError);
      assert.equal(err.code, 'MEDIA_PROVIDER_NOT_CONFIGURED');
      return true;
    },
  );

  // Mock server para simular Pexels
  const server = http.createServer((req, res) => {
    const auth = req.headers['authorization'];
    if (auth === 'invalid_key') {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Unauthorized' }));
      return;
    }
    if (auth === 'rate_limit_key') {
      res.writeHead(429, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Rate limit exceeded' }));
      return;
    }
    if (auth === 'server_error_key') {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Server error' }));
      return;
    }
    if (auth === 'malformed_key') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end('NOT_JSON{');
      return;
    }

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        total_results: 2,
        page: 1,
        per_page: 10,
        photos: [
          {
            id: 1001,
            width: 1920,
            height: 1080,
            url: 'https://www.pexels.com/photo/1001',
            photographer: 'Alice Smith',
            photographer_url: 'https://www.pexels.com/@alice',
            avg_color: '#333333',
            src: {
              original: 'https://images.pexels.com/photos/1001/original.jpg',
              large: 'https://images.pexels.com/photos/1001/large.jpg',
              medium: 'https://images.pexels.com/photos/1001/medium.jpg',
              small: 'https://images.pexels.com/photos/1001/small.jpg',
            },
          },
          // Candidato duplicado para testar deduplicação
          {
            id: 1001,
            width: 1920,
            height: 1080,
            url: 'https://www.pexels.com/photo/1001',
            photographer: 'Alice Smith',
            photographer_url: 'https://www.pexels.com/@alice',
            src: {
              original: 'https://images.pexels.com/photos/1001/original.jpg',
              large: 'https://images.pexels.com/photos/1001/large.jpg',
              medium: 'https://images.pexels.com/photos/1001/medium.jpg',
              small: 'https://images.pexels.com/photos/1001/small.jpg',
            },
          },
        ],
      }),
    );
  });

  await new Promise<void>((resolve) => server.listen(0, resolve));
  const port = (server.address() as { port: number }).port;

  // Substitui endpoint do Pexels temporariamente pelo mock local
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = async (url: string | URL | Request, init?: RequestInit) => {
      const urlStr = typeof url === 'string' ? url : url.toString();
      if (urlStr.startsWith('https://api.pexels.com')) {
        const localUrl = urlStr.replace('https://api.pexels.com', `http://127.0.0.1:${port}`);
        return originalFetch(localUrl, init);
      }
      return originalFetch(url, init);
    };

    // 1. Sucesso com deduplicação
    const validProvider = new PexelsLicensedMediaProvider('valid_key');
    const candidates = await validProvider.search(searchInput);
    assert.equal(candidates.length, 1);
    assert.equal(candidates[0].candidateId, 'pexels_1001');
    assert.equal(candidates[0].provider, 'pexels');
    assert.equal(candidates[0].attributionRequired, true);

    // 2. Erro 401
    const invalidProvider = new PexelsLicensedMediaProvider('invalid_key');
    await assert.rejects(
      () => invalidProvider.search(searchInput),
      (err: unknown) => {
        assert.ok(err instanceof MediaProviderError);
        assert.equal(err.code, 'MEDIA_PROVIDER_UNAUTHORIZED');
        return true;
      },
    );

    // 3. Erro 429
    const rateLimitProvider = new PexelsLicensedMediaProvider('rate_limit_key');
    await assert.rejects(
      () => rateLimitProvider.search(searchInput),
      (err: unknown) => {
        assert.ok(err instanceof MediaProviderError);
        assert.equal(err.code, 'MEDIA_PROVIDER_RATE_LIMITED');
        return true;
      },
    );

    // 4. Erro 500
    const serverErrProvider = new PexelsLicensedMediaProvider('server_error_key');
    await assert.rejects(
      () => serverErrProvider.search(searchInput),
      (err: unknown) => {
        assert.ok(err instanceof MediaProviderError);
        assert.equal(err.code, 'MEDIA_PROVIDER_UNAVAILABLE');
        return true;
      },
    );

    // 5. JSON malformado
    const malformedProvider = new PexelsLicensedMediaProvider('malformed_key');
    await assert.rejects(
      () => malformedProvider.search(searchInput),
      (err: unknown) => {
        assert.ok(err instanceof MediaProviderError);
        assert.equal(err.code, 'MEDIA_PROVIDER_INVALID_RESPONSE');
        return true;
      },
    );
  } finally {
    globalThis.fetch = originalFetch;
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});

test('PixabayLicensedMediaProvider: trata configuração e mapeia candidatos', async () => {
  const unconfigured = new PixabayLicensedMediaProvider('');
  assert.equal(unconfigured.isConfigured(), false);

  const searchInput: LicensedMediaSearchInput = {
    requestId: 'req_pixabay',
    niche: 'barbershop',
    section: 'about',
    purpose: 'Barber tools',
    aspectRatio: '1:1',
  };

  await assert.rejects(
    () => unconfigured.search(searchInput),
    (err: unknown) => {
      assert.ok(err instanceof MediaProviderError);
      assert.equal(err.code, 'MEDIA_PROVIDER_NOT_CONFIGURED');
      return true;
    },
  );

  const server = http.createServer((_req, res) => {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        total: 1,
        totalHits: 1,
        hits: [
          {
            id: 2002,
            pageURL: 'https://pixabay.com/photos/2002',
            type: 'photo',
            tags: 'barber, tools',
            previewURL: 'https://cdn.pixabay.com/photo/2002_150.jpg',
            webformatURL: 'https://cdn.pixabay.com/photo/2002_640.jpg',
            largeImageURL: 'https://cdn.pixabay.com/photo/2002_1280.jpg',
            imageWidth: 1280,
            imageHeight: 1280,
            imageSize: 450000,
            views: 100,
            downloads: 50,
            user: 'bob_barber',
            user_id: 888,
            userImageURL: 'https://cdn.pixabay.com/user.jpg',
          },
        ],
      }),
    );
  });

  await new Promise<void>((resolve) => server.listen(0, resolve));
  const port = (server.address() as { port: number }).port;

  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = async (url: string | URL | Request, init?: RequestInit) => {
      const urlStr = typeof url === 'string' ? url : url.toString();
      if (urlStr.startsWith('https://pixabay.com')) {
        const localUrl = urlStr.replace('https://pixabay.com', `http://127.0.0.1:${port}`);
        return originalFetch(localUrl, init);
      }
      return originalFetch(url, init);
    };

    const provider = new PixabayLicensedMediaProvider('test_pixabay_key');
    const candidates = await provider.search(searchInput);
    assert.equal(candidates.length, 1);
    assert.equal(candidates[0].candidateId, 'pixabay_2002');
    assert.equal(candidates[0].provider, 'pixabay');
    assert.equal(candidates[0].creator, 'bob_barber');
    assert.equal(candidates[0].attributionRequired, false);
  } finally {
    globalThis.fetch = originalFetch;
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});

test('MediaFallbackChain: executa Pexels -> Pixabay -> vazio com resiliência', async () => {
  const searchInput: LicensedMediaSearchInput = {
    requestId: 'req_fallback',
    niche: 'dentistry',
    section: 'hero',
    purpose: 'Dental office',
    aspectRatio: '16:9',
  };

  // Caso 1: Pexels disponível retorna Pexels
  const pexelsMock = {
    name: 'pexels' as const,
    isConfigured: () => true,
    search: async () => [
      {
        version: 1 as const,
        candidateId: 'pexels_1',
        requestId: 'req_fallback',
        provider: 'pexels' as const,
        providerAssetId: '1',
        sourceType: 'licensed' as const,
        previewUrl: 'https://images.pexels.com/photo1.jpg',
        sourcePageUrl: 'https://www.pexels.com/photo/1',
        width: 1920,
        height: 1080,
        aspectRatio: '16:9' as const,
        licenseLabel: 'Pexels License',
        attributionRequired: true,
        retrievedAt: new Date().toISOString(),
        confidence: 0.9,
        metadata: {},
      },
    ],
  };

  const pixabayMock = {
    name: 'pixabay' as const,
    isConfigured: () => true,
    search: async () => [],
  };

  const chain1 = new MediaFallbackChain(pexelsMock, pixabayMock);
  const res1 = await chain1.search(searchInput);
  assert.equal(res1.provider, 'pexels');
  assert.equal(res1.candidates.length, 1);

  // Caso 2: Pexels falha/vazio -> Pixabay responde
  const pexelsFailingMock = {
    name: 'pexels' as const,
    isConfigured: () => true,
    search: async () => {
      throw new Error('Pexels 500');
    },
  };

  const pixabaySuccessMock = {
    name: 'pixabay' as const,
    isConfigured: () => true,
    search: async () => [
      {
        version: 1 as const,
        candidateId: 'pixabay_2',
        requestId: 'req_fallback',
        provider: 'pixabay' as const,
        providerAssetId: '2',
        sourceType: 'licensed' as const,
        previewUrl: 'https://cdn.pixabay.com/photo2.jpg',
        sourcePageUrl: 'https://pixabay.com/photo/2',
        width: 1200,
        height: 800,
        aspectRatio: '16:9' as const,
        licenseLabel: 'Pixabay License',
        attributionRequired: false,
        retrievedAt: new Date().toISOString(),
        confidence: 0.85,
        metadata: {},
      },
    ],
  };

  const chain2 = new MediaFallbackChain(pexelsFailingMock, pixabaySuccessMock);
  const res2 = await chain2.search(searchInput);
  assert.equal(res2.provider, 'pixabay');
  assert.equal(res2.candidates.length, 1);

  // Caso 3: Ambos não configurados -> resultado limpo sem quebra
  const chain3 = new MediaFallbackChain(
    { name: 'pexels', isConfigured: () => false, search: async () => [] },
    { name: 'pixabay', isConfigured: () => false, search: async () => [] },
  );
  const res3 = await chain3.search(searchInput);
  assert.equal(res3.provider, 'none');
  assert.equal(res3.candidates.length, 0);
});
