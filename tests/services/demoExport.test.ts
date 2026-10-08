import test from 'node:test';
import assert from 'node:assert/strict';
import JSZip from 'jszip';
import { blueprint, context, project } from '../fixtures/siteFixture';
import { createSiteZip } from '../../src/site-builder/exportSite';
import { evaluatePublicationReadiness } from '../../src/site-builder/publicationGates';
import { renderSiteDocument } from '../../src/site-builder/renderer/SiteRenderer';

const requestedSections = {
  ...blueprint,
  sections: { ...blueprint.sections, contact: true, location: true },
};

test('demonstração mantém Contato e Localização sem inventar dados comerciais', () => {
  const finalHtml = renderSiteDocument(requestedSections, context);
  const demoHtml = renderSiteDocument(requestedSections, context, undefined, undefined, undefined, false, true);

  assert.doesNotMatch(finalHtml, /<section id="contact"/);
  assert.doesNotMatch(finalHtml, /<section id="location"/);
  assert.match(demoHtml, /<section id="contact"/);
  assert.match(demoHtml, /<section id="location"/);
  assert.match(demoHtml, /Canais de atendimento em confirmação/);
  assert.match(demoHtml, /Endereço em confirmação/);
  assert.match(demoHtml, /href="#contact"/);
  assert.match(demoHtml, /href="#location"/);
  assert.match(demoHtml, /Projeto de demonstração/);
  assert.doesNotMatch(demoHtml, /wa\.me|href="tel:|href="mailto:/);
});

test('ZIP de demonstração preserva a prévia e informa que os dados dependem de confirmação', async () => {
  const siteProject = { ...project, siteBlueprint: requestedSections };
  const readiness = evaluatePublicationReadiness({
    blueprint: requestedSections,
    context,
    contentReviewed: true,
  });
  assert.equal(readiness.canExport, false);
  assert.equal(readiness.canExportDemo, true);

  const zip = await JSZip.loadAsync(await createSiteZip(siteProject, undefined, { mode: 'demo' }));
  const html = await zip.file('index.html')?.async('string');
  const notice = await zip.file('DEMONSTRACAO.txt')?.async('string');
  assert.equal(html, renderSiteDocument(requestedSections, context, undefined, undefined, undefined, false, true));
  assert.match(notice ?? '', /Projeto de demonstração/);
  assert.match(html ?? '', /<section id="contact"/);
  assert.match(html ?? '', /<section id="location"/);
});
