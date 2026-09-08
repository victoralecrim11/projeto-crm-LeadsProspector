import assert from 'node:assert/strict';
import test from 'node:test';
import { generateAiContent, testAiProviderConnection } from '../../src/services/aiService';
import type { AIProvider, CrmSettingsConfig } from '../../src/types';

const settings = (provider: AIProvider): CrmSettingsConfig => ({
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
  aiProviders: [{ id: 'provider-test', provider, apiKey: 'test-secret-key' }],
});

test('provedores em nuvem são chamados pelo gateway interno', async () => {
  const originalFetch = globalThis.fetch;
  let requestUrl = '';
  let requestBody: Record<string, unknown> = {};

  globalThis.fetch = async (input, init) => {
    requestUrl = String(input);
    requestBody = JSON.parse(String(init?.body));
    return Response.json({ content: 'Conteúdo gerado', model: 'modelo-testado' });
  };

  try {
    const result = await generateAiContent(settings('nvidia'), 'Teste');
    assert.equal(result, 'Conteúdo gerado');
    assert.equal(requestUrl, '/api/ai/chat');
    assert.equal(requestBody.provider, 'nvidia');
    assert.equal(requestBody.apiKey, 'test-secret-key');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('teste de conexão mostra o modelo usado pelo backend', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => Response.json({ content: 'OK', model: 'openai/gpt-oss-20b' });

  try {
    const message = await testAiProviderConnection(settings('groq').aiProviders[0]);
    assert.match(message, /groq/);
    assert.match(message, /openai\/gpt-oss-20b/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('o cliente mantém o erro detalhado vindo do gateway', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => Response.json(
    { error: 'O provedor atingiu um limite de uso ou a conta não possui créditos disponíveis.' },
    { status: 429 },
  );

  try {
    await assert.rejects(
      generateAiContent(settings('openai'), 'Teste'),
      /limite de uso|créditos/i,
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});
