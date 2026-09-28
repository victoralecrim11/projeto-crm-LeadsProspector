import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import JSZip from 'jszip';
import { SectionInspector } from '../../src/components/editor/SectionInspector';
import { createSiteZip } from '../../src/site-builder/exportSite';
import { blueprint, context, project } from '../fixtures/siteFixture';
import type { GeneratedSiteBlueprint } from '../../src/site-builder/types';

function findConfirmButton(node: React.ReactNode): React.ReactElement | undefined {
  if (!React.isValidElement(node)) return undefined;
  if (node.type === 'button' && node.props &&
      (node.props as { children?: React.ReactNode }).children === 'Confirmar serviço') return node;
  const children = (node.props as { children?: React.ReactNode }).children;
  let found: React.ReactElement | undefined;
  React.Children.forEach(children, (child) => { found ??= findConfirmButton(child); });
  return found;
}

test('serviço sugerido pode ser confirmado individualmente e o ZIP é exportável', async () => {
  const suggestion: GeneratedSiteBlueprint = {
    ...blueprint,
    services: [{ title: 'Corte de Cabelo', description: 'Serviço de corte de cabelo.', source: 'ai_suggestion' }],
    sections: { ...blueprint.sections, services: true },
  };
  await assert.rejects(
    createSiteZip({ ...project, siteBlueprint: suggestion, siteContext: context, contentReviewed: true }),
    /Aceite ou remova os serviços sugeridos/,
  );

  let confirmed: GeneratedSiteBlueprint | undefined;
  let preservedReview = false;
  const tree = SectionInspector({
    sectionId: 'services',
    effectiveBlueprint: suggestion,
    draftBlueprint: suggestion,
    overrides: {},
    busy: false,
    onChangeBlueprint: (next, preserveReview) => {
      confirmed = next;
      preservedReview = preserveReview === true;
    },
    onChangeOverrides: () => {},
  }) as React.ReactNode;
  const button = findConfirmButton(tree);
  assert.ok(button, 'o inspetor deve oferecer confirmação por serviço sugerido');
  assert.equal((button.props as { disabled?: boolean }).disabled, false);
  (button.props as { onClick: () => void }).onClick();

  assert.equal(preservedReview, true);
  assert.equal(confirmed?.services[0].source, 'known');
  const zip = await JSZip.loadAsync(await createSiteZip({
    ...project,
    siteBlueprint: confirmed,
    siteContext: context,
    contentReviewed: true,
  }));
  assert.equal(JSON.parse(await zip.file('blueprint.json')!.async('string')).services[0].source, 'known');
});
