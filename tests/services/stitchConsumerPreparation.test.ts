import { renderSiteDocument } from '../../src/site-builder/renderer/SiteRenderer.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { StitchDesignProductionServiceImpl, stitchDesignProductionService, resolveStitchRuntimeRoot, designProductionSchema } from '../../server/services/research/stitchProductionService.js';
import { prepareStandardAiDesignContext } from '../../server/services/research/stitchConsumerPreparation.js';
import { RealStitchMcpClient } from '../../tools/stitch-producer/clients/realStitchMcpClient.js';
import { FixtureStitchMcpClient, getMockResolvedDesign } from '../fixtures/stitchProducerFixtures.js';
import { generateStandardAiSite } from '../../server/services/research/standardAiService.js';
import express from 'express';
import { siteGenerationRouter } from '../../server/routes/siteGeneration.js';
import { resolveDesignStrategy } from '../../server/services/research/designStrategy/designStrategyResolver.js';
import { resolveStandardDesign, blueprintFromDesign } from '../../src/site-builder/designPipeline.js';
import { SiteAiError } from '../../server/services/ai/modelRegistry.js';

test('POST-E.3.9 persisted real consumer replay and contract lock', async t => {
  const originalKey = process.env.STITCH_API_KEY;
  process.env.STITCH_API_KEY = 'fixture-no-network';
  const source = getMockResolvedDesign('barbershop').referenceBrief.business.source;
  const generationRequestId = `replay-${crypto.randomUUID()}`;
  source.leadId = generationRequestId;
  const originalExplore = RealStitchMcpClient.prototype.explore;
  let stitchCalls = 0;
  RealStitchMcpClient.prototype.explore = async function(request) {
    stitchCalls++;
    return new FixtureStitchMcpClient().explore(request);
  };
  const service = new StitchDesignProductionServiceImpl();
  const root = resolveStitchRuntimeRoot();
  const jobPath = path.join(root, 'jobs', `${generationRequestId}.json`);
  const projectPath = path.join(root, source.leadId);
  t.after(async () => {
    if (originalKey === undefined) delete process.env.STITCH_API_KEY;
    else process.env.STITCH_API_KEY = originalKey;
    RealStitchMcpClient.prototype.explore = originalExplore;
    assert.equal(path.dirname(projectPath), root);
    await fs.rm(projectPath, { recursive: true, force: true });
    await fs.rm(jobPath, { force: true });
  });
  const production = await service.getOrCreateProduction(generationRequestId, source.leadId, source);
  await service['activeJobs'].get(generationRequestId);
  assert.equal(production.status, 'PAIRED', production.errorCode);
  const jobBytes = await fs.readFile(jobPath, 'utf8');
  const persisted = designProductionSchema.parse(JSON.parse(jobBytes));
  assert.deepEqual(persisted, JSON.parse(JSON.stringify(production)));
  assert.ok(persisted.desktopReference);
  service['store'].clear();
  stitchDesignProductionService['store'].clear();
  const params = { generationRequestId, designProductionId: persisted.designProductionId };
  const first = await prepareStandardAiDesignContext(params);
  const second = await prepareStandardAiDesignContext(params);
  assert.deepEqual(first, second);
  assert.notEqual(first.production, production);
  assert.ok(first.alternatives.length >= 1);
  assert.equal(await fs.readFile(jobPath, 'utf8'), jobBytes);
  const mobilePath = path.join(projectPath, `${generationRequestId}-mob`, 'candidates.json');
  const desktopPath = path.join(projectPath, `${generationRequestId}-desk`, 'candidates.json');
  const mobileBytes = await fs.readFile(mobilePath, 'utf8');
  const desktopBytes = await fs.readFile(desktopPath, 'utf8');

  await t.test('persisted visual evidence reaches the real consumer and responsive renderer', async () => {
    const mobile = JSON.parse(mobileBytes), desktop = JSON.parse(desktopBytes);
    for (const candidate of mobile.candidates) candidate.appearance = { version: 1, headingFont: 'Bodoni Moda', bodyFont: 'Hanken Grotesk', heroSize: 38, heroLayout: 'minimal', imageryPresent: true, limitations: [] };
    for (const candidate of desktop.candidates) candidate.appearance = { version: 1, headingFont: 'Bodoni Moda', bodyFont: 'Hanken Grotesk', heroSize: 68, heroLayout: 'split', imageryPresent: true, limitations: [] };
    try {
      await fs.writeFile(mobilePath, JSON.stringify(mobile));
      await fs.writeFile(desktopPath, JSON.stringify(desktop));
      const prepared = await prepareStandardAiDesignContext(params);
      const design = prepared.finalDesign;
      assert.equal(design.stitch?.appearance?.mobile.headingFont, 'Bodoni Moda');
      assert.equal(design.stitch?.appearance?.desktop?.heroSize, 68);
      const html = renderSiteDocument(blueprintFromDesign(design), design.referenceBrief.business.lead, design);
      assert.match(html, /Bodoni%20Moda/);
      assert.match(html, /stitch-mobile-layout/);
      assert.match(html, /stitch-desktop-layout/);
      assert.match(html, /min-width:801px/);
      assert.match(design.designMarkdown, /Bodoni Moda/);
      assert.equal(prepared.production.strategyId, persisted.strategyId);
    } finally {
      await fs.writeFile(mobilePath, mobileBytes);
      await fs.writeFile(desktopPath, desktopBytes);
    }
  });

  await t.test('numeric provider screen IDs remain canonical while internal family IDs are valid', async () => {
    const mobile = JSON.parse(mobileBytes);
    const desktop = JSON.parse(desktopBytes);
    for (const artifact of [mobile, desktop]) {
      artifact.candidates.forEach((candidate: any, i: number) => {
        candidate.candidateId = `822880ec8533493fbe40635049a5596${i}`;
        candidate.screenId = candidate.candidateId;
      });
    }
    try {
      await fs.writeFile(mobilePath, JSON.stringify(mobile));
      await fs.writeFile(desktopPath, JSON.stringify(desktop));
      const prepared = await prepareStandardAiDesignContext(params);
      assert.match(prepared.finalDesign.specification.family.id, /^stitch-822880/);
      assert.match(prepared.finalDesign.stitch!.selected, /^822880/);
      assert.equal(prepared.production.strategyId, persisted.strategyId);
    } finally {
      await fs.writeFile(mobilePath, mobileBytes);
      await fs.writeFile(desktopPath, desktopBytes);
    }
  });

  await t.test('fresh process recreates repository provider and consumer with no RAM', () => {
    const script = `import { prepareStandardAiDesignContext } from './server/services/research/stitchConsumerPreparation.ts';
      const p = ${JSON.stringify(params)}; const a = await prepareStandardAiDesignContext(p); const b = await prepareStandardAiDesignContext(p);
      if (a.alternatives.length < 1 || JSON.stringify(a) !== JSON.stringify(b)) process.exit(2);`;
    const result = spawnSync(process.execPath, ['--import', 'tsx', '--input-type=module', '-e', script], { encoding: 'utf8', timeout: 30000 });
    assert.equal(result.status, 0, result.stderr);
  });
  await t.test('audit and override drift preserve identity and retry makes no Stitch calls', async () => {
    const current = structuredClone(persisted.preparationInput.current);
    current.status = 'audited';
    current.structure = ['A new runtime layout'];
    const overrides = { primary: '#123456', accent: '#abcdef' };
    const beforeCalls = stitchCalls;
    for (let attempt = 0; attempt < 2; attempt++) {
      const result = await generateStandardAiSite(source, { mode: 'auto' }, overrides, {}, {
        ...params, audit: async () => current,
        discoverModels: async () => ({ models: [], warnings: [] }),
      });
      assert.equal(result.design.stitch.strategyId, persisted.strategyId);
      assert.deepEqual(result.design.stitch.viewportAnchors, first.anchors);
      assert.equal(result.design.specification.tokens.color.primary, overrides.primary);
    }
    assert.equal(stitchCalls, beforeCalls);
    assert.equal(await fs.readFile(jobPath, 'utf8'), jobBytes);
  });
  await t.test('true artifact mismatch remains distinct from unavailable', async () => {
    const wrong = JSON.parse(mobileBytes);
    wrong.strategyId = 'wrong-strategy';
    await fs.writeFile(mobilePath, JSON.stringify(wrong));
    await assert.rejects(prepareStandardAiDesignContext(params), { code: 'SITE_DESIGN_ARTIFACT_MISMATCH' });
    await fs.writeFile(mobilePath, mobileBytes);
  });
  await t.test('downstream failure then successful standard-ai retry reuses persisted design', async () => {
    const model = { id: 'gemini:test', model: 'fixture', provider: 'gemini' as const,
      label: 'Fixture', description: 'Fixture', tier: 'fast' as const, enabled: true,
      supportsSiteBuilder: true, capabilities: { structuredOutput: true, coding: true, vision: false } };
    const deps = { ...params, audit: async () => persisted.preparationInput.current,
      discoverModels: async () => ({ models: [model], warnings: [] }) };
    const before = stitchCalls;
    await assert.rejects(generateStandardAiSite(source, { mode: 'auto' }, undefined, {}, {
      ...deps, requestBlueprint: async () => { throw new SiteAiError('Provider indisponível para este teste.', 401, false, 'SITE_AI_PROVIDER_AUTH'); },
    }), { code: 'SITE_AI_PROVIDER_AUTH' });
    const success = await generateStandardAiSite(source, { mode: 'auto' }, undefined, {}, {
      ...deps, requestBlueprint: async () => blueprintFromDesign(first.finalDesign),
    });
    assert.equal(success.generation.mode, 'standard-ai');
    assert.equal(stitchCalls, before);
    assert.equal(await fs.readFile(jobPath, 'utf8'), jobBytes);
  });
  await t.test('recalculated runtime strategy B cannot replace persisted A', async () => {
    const runtimeSource = getMockResolvedDesign('dentistry').referenceBrief.business.source;
    runtimeSource.leadId = source.leadId;
    const current = persisted.preparationInput.current;
    const runtimeStrategy = resolveDesignStrategy(resolveStandardDesign(runtimeSource, current));
    assert.notEqual(runtimeStrategy.strategyId, persisted.strategyId);
    const prepared = await prepareStandardAiDesignContext({ ...params, runtimeContext: { source: runtimeSource, current } });
    assert.equal(prepared.finalDesign.stitch.strategyId, persisted.strategyId);
  });
  await t.test('explicit production ref wins over a newer artifact', async () => {
    const neighbour = path.join(projectPath, 'newer-artifact');
    await fs.mkdir(neighbour);
    await fs.writeFile(path.join(neighbour, 'candidates.json'), JSON.stringify({ ...JSON.parse(mobileBytes), requestId: 'newer-artifact', strategyId: 'other' }));
    assert.deepEqual((await prepareStandardAiDesignContext(params)).anchors, first.anchors);
  });
  await t.test('missing, corrupt, empty artifacts and wrong viewport are distinct failures', async () => {
    await fs.rm(mobilePath);
    await assert.rejects(prepareStandardAiDesignContext(params), { code: 'SITE_DESIGN_ARTIFACT_UNAVAILABLE' });
    await fs.writeFile(mobilePath, '{');
    await assert.rejects(prepareStandardAiDesignContext(params), { code: 'SITE_DESIGN_ARTIFACT_INVALID' });
    const mobile = JSON.parse(mobileBytes);
    await fs.writeFile(mobilePath, JSON.stringify({ ...mobile, candidates: [] }));
    await assert.rejects(prepareStandardAiDesignContext(params), { code: 'SITE_DESIGN_NO_USABLE_ALTERNATIVES' });
    mobile.candidates.forEach(c => { c.viewport = 'desktop'; });
    await fs.writeFile(mobilePath, JSON.stringify(mobile));
    await assert.rejects(prepareStandardAiDesignContext(params), { code: 'SITE_DESIGN_ARTIFACT_MISMATCH' });
    await fs.writeFile(mobilePath, mobileBytes);
  });
  await t.test('client cannot supply strategy refs or filesystem root', async () => {
    const app = express(); app.use(express.json()); app.use(siteGenerationRouter());
    const server = app.listen(0, '127.0.0.1');
    await new Promise<void>(resolve => server.once('listening', resolve));
    try {
      for (const extra of [{ strategyId: 'fake' }, { mobileReference: persisted.mobileReference }, { artifactRoot: 'fake' }]) {
        const response = await fetch(`http://127.0.0.1:${(server.address() as { port: number }).port}/sites/standard-ai`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...params, source, selection: { mode: 'auto' }, ...extra }),
        });
        assert.equal(response.status, 400);
        assert.equal((await response.json()).code, 'SITE_AI_PROVIDER_INVALID_REQUEST');
      }
    } finally { await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve())); }
  });
  await t.test('invalid explicit desktop never silently falls back', async () => {
    const wrong = JSON.parse(desktopBytes);
    wrong.strategyId = 'wrong-strategy';
    await fs.writeFile(desktopPath, JSON.stringify(wrong));
    await assert.rejects(prepareStandardAiDesignContext(params), { code: 'SITE_DESIGN_ARTIFACT_MISMATCH' });
    await fs.writeFile(desktopPath, desktopBytes);
  });
  await t.test('PARTIAL mobile works and missing mobile is rejected even pre-terminal', async () => {
    const partial = { ...persisted, status: 'PARTIAL', desktopReference: undefined };
    await fs.writeFile(jobPath, JSON.stringify(partial));
    assert.equal((await prepareStandardAiDesignContext(params)).resolution.status, 'PARTIAL');
    await fs.writeFile(jobPath, JSON.stringify({ ...partial, mobileReference: undefined }));
    await assert.rejects(prepareStandardAiDesignContext({ ...params, allowPreTerminal: true }), { code: 'SITE_DESIGN_REF_MISSING' });
    await fs.writeFile(jobPath, jobBytes);
  });
  await t.test('pre-terminal only bypasses status and persisted ref strategy mismatch is rejected', async () => {
    await fs.writeFile(jobPath, JSON.stringify({ ...persisted, status: 'DESKTOP_GENERATING' }));
    await assert.rejects(prepareStandardAiDesignContext(params), { code: 'SITE_DESIGN_NOT_READY' });
    assert.ok((await prepareStandardAiDesignContext({ ...params, allowPreTerminal: true })).alternatives.length);
    await fs.writeFile(jobPath, JSON.stringify({ ...persisted, strategyId: 'wrong' }));
    await assert.rejects(prepareStandardAiDesignContext({ ...params, allowPreTerminal: true }), { code: 'SITE_DESIGN_STRATEGY_MISMATCH' });
    await fs.writeFile(jobPath, jobBytes);
  });
  assert.equal(await fs.readFile(mobilePath, 'utf8'), mobileBytes);
  assert.equal(await fs.readFile(desktopPath, 'utf8'), desktopBytes);
});
