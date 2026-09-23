import test from 'node:test';
import assert from 'node:assert/strict';
import { discoverModels, resolveModels } from '../../server/services/ai/modelRegistry.js';

test('Groq discovery excludes speech and classifiers from site generation and auto selection', async t => {
  const ids = ['whisper-large-v3-turbo', 'whisper-large-v3', 'meta-llama/llama-prompt-guard-2-22m', 'openai/gpt-oss-safeguard-20b', 'canopylabs/orpheus-v1-english', 'openai/gpt-oss-120b', 'openai/gpt-oss-20b', 'qwen/qwen3.8-27b'];
  t.mock.method(globalThis, 'fetch', async () => new Response(JSON.stringify({data:ids.map(id=>({id}))}), {status:200}));
  const {models} = await discoverModels({groqKey:'test-only', disabledModels:['groq:openai/gpt-oss-20b']});
  const compatible = models.filter(m=>m.supportsSiteBuilder).map(m=>m.model);
  assert.deepEqual(compatible, ['openai/gpt-oss-120b','openai/gpt-oss-20b','qwen/qwen3.8-27b']);
  assert.deepEqual(new Set(resolveModels(models,{mode:'auto'}).map(m=>m.model)),new Set(['openai/gpt-oss-120b','qwen/qwen3.8-27b']));
  assert.throws(()=>resolveModels(models,{mode:'explicit',modelId:'groq:whisper-large-v3'}),/incompatível/);
});
