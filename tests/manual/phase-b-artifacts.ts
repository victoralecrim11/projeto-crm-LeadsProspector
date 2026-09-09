import { mkdir, writeFile } from 'node:fs/promises';
import { pilotLead } from '../fixtures/phaseB';
import { normalizeLeadSource } from '../../src/site-builder/leadSource';
import { generateStandardSite } from '../../server/services/research/designService';
import { renderSiteDocument } from '../../src/site-builder/renderer/SiteRenderer';
import { resolvePremiumSelection, blueprintFromDesign } from '../../src/site-builder/designPipeline';

for (const niche of ['dentistry', 'restaurant'] as const) {
  const source = normalizeLeadSource(pilotLead(niche));
  const result = await generateStandardSite(source);
  const out = `docs/reviews/phase-b/${niche}`;
  await mkdir(out, { recursive: true });
  await writeFile(`${out}/DESIGN.md`, result.design.designMarkdown);
  await writeFile(`${out}/design.json`, JSON.stringify(result.design, null, 2));
  await writeFile(`${out}/index.html`, renderSiteDocument(result.blueprint, source.context, result.design));
  console.log(`${niche}: generated from resolved design`);
  const premium = resolvePremiumSelection(result.design, {
    projectUrl: 'https://stitch.withgoogle.com/projects/16495453154449814409',
    alternatives: niche === 'dentistry' ? ['minimal-clinical', 'warm-premium'] : ['editorial-dining', 'warm-contemporary'],
    selected: niche === 'dentistry' ? 'minimal-clinical' : 'editorial-dining',
    review: 'Seleção técnica após exploração visual manual no Stitch em 2026-09-08. Mantém hierarquia e paleta compatíveis; usa fontes locais e componentes existentes. Afirmações inventadas e controles sem destino rejeitados. Aprovação comercial do usuário pendente.',
  });
  await mkdir(`${out}/premium`, { recursive: true });
  await writeFile(`${out}/premium/DESIGN.md`, premium.designMarkdown);
  await writeFile(`${out}/premium/design.json`, JSON.stringify(premium, null, 2));
  await writeFile(`${out}/premium/index.html`, renderSiteDocument(blueprintFromDesign(premium), source.context, premium));
}
