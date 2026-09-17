import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { renderSiteDocument } from '../src/site-builder/renderer/SiteRenderer.js';
import { blueprintSchema } from '../src/site-builder/types.js';
import { context } from './fixtures/siteFixture.js';

const path = decodeURIComponent(new URL('./fixtures/phaseARenderBaseline.json', import.meta.url).pathname).replace(/^\/([A-Z]:)/i, '$1');
const data = JSON.parse(fs.readFileSync(path, 'utf8'));

for (const rec of data) {
  const html = renderSiteDocument(blueprintSchema.parse(rec.input), context);
  rec.sha256 = createHash('sha256').update(html).digest('hex');
}

fs.writeFileSync(path, JSON.stringify(data, null, 2));
console.log('Hashes updated successfully!');
