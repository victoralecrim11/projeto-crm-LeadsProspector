import assert from 'node:assert/strict';
import test from 'node:test';
import { generateAiContent, testAiProviderConnection } from '../../src/services/aiService';
import type { CrmSettingsConfig } from '../../src/types';

const settingsWithGemini = (apiKey: string): CrmSettingsConfig => ({
  closerName: '',
  closerTitle: '',
  closerEmail: '',
  closerPhone: '',
  monthlyRevenueGoal: 0,
  closerCommissionPercent: 0,
  defaultSetupPrice: 0,
  defaultMrrPrice: 0,
  maxDiscountPercent: 0,
  followUpAlertDays: 0,
  googleMapsApiKey: '',
  googleMapsMapId: '',
  emailProvider: 'direct',
  autoEnrichLeads: false,
  notifyOnLeadStall: false,
  aiProviders: [{ id: 'gemini-test', provider: 'gemini', apiKey }],
});

test('Gemini usa modelo atual e não expõe a chave na URL', async () => {
  const originalFetch = globalThis.fetch;
  let requestedUrl = '';
  let requestedHeaders: HeadersInit | undefined;

  globalThis.fetch = async (input, init) => {
    requestedUrl = String(input);
    requestedHeaders = init?.headers;
    return new Response(JSON.stringify({
      candidates: [{ content: { parts: [{ text: 'OK' }] } }],
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  };

  try {
    const result = await generateAiContent(settingsWithGemini('AIza-test-secret'), 'Teste');
    const headers = new Headers(requestedHeaders);

    assert.equal(result, 'OK');
    assert.match(requestedUrl, /models\/gemini-3\.5-flash:generateContent/);
    assert.equal(new URL(requestedUrl).searchParams.has('key'), false);
    assert.equal(headers.get('x-goog-api-key'), 'AIza-test-secret');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('teste de conexão informa o modelo que respondeu após um fallback', async () => {
  const originalFetch = globalThis.fetch;

  globalThis.fetch = async (input) => {
    const url = String(input);
    if (url.includes('gemini-3.5-flash')) {
      return new Response(JSON.stringify({ error: { message: 'Service unavailable' } }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    if (url.includes('gemini-2.5-flash')) {
      return new Response(JSON.stringify({
        candidates: [{ content: { parts: [{ text: 'OK' }] } }],
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    return new Response(JSON.stringify({ error: { message: 'Modelo inesperado' } }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  };

  try {
    const message = await testAiProviderConnection({
      id: 'gemini-test',
      provider: 'gemini',
      apiKey: 'AIza-test-secret',
    });
    assert.match(message, /gemini-2\.5-flash/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('OpenAI informa cota esgotada sem tentar outro modelo', async () => {
  const originalFetch = globalThis.fetch;
  const requestedModels: string[] = [];

  globalThis.fetch = async (_input, init) => {
    requestedModels.push(JSON.parse(String(init?.body)).model);
    return new Response(JSON.stringify({
      error: {
        message: 'You exceeded your current quota, please check your plan and billing details.',
        type: 'insufficient_quota',
        code: 'insufficient_quota',
      },
    }), {
      status: 429,
      headers: { 'Content-Type': 'application/json' },
    });
  };

  try {
    await assert.rejects(
      testAiProviderConnection({
        id: 'openai-test',
        provider: 'openai',
        apiKey: 'sk-test-secret',
      }),
      /cota.*créditos|créditos.*cota/i,
    );
    assert.deepEqual(requestedModels, ['gpt-4o-mini']);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('OpenAI orienta aguardar quando a API informa Retry-After', async () => {
  const originalFetch = globalThis.fetch;

  globalThis.fetch = async () =>
    new Response(JSON.stringify({
      error: {
        message: 'Rate limit reached for requests.',
        type: 'rate_limit_error',
        code: 'rate_limit_exceeded',
      },
    }), {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': '17',
      },
    });

  try {
    await assert.rejects(
      testAiProviderConnection({
        id: 'openai-test',
        provider: 'openai',
        apiKey: 'sk-test-secret',
      }),
      /aguarde 17 segundos/i,
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});
