import test from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'fs';
import * as path from 'path';

test('POST-E.3.4 Evidence Lock', async (t) => {
  await t.test('PreviewCanvas implements stable iframe lifecycle and atomic updates', () => {
    // using process.cwd() assuming it runs from project root
    const filePath = path.join(process.cwd(), 'src/components/editor/PreviewCanvas.tsx');
    const content = fs.readFileSync(filePath, 'utf-8');

    // stable iframe
    assert.ok(content.includes('doc.documentElement.hasAttribute("data-editor-initialized")'));
    assert.ok(content.includes('doc.documentElement.setAttribute("data-editor-initialized", "true")'));

    // atomic content update
    assert.ok(content.includes('doc.documentElement.replaceChild(doc.adoptNode(newDoc.head), doc.head)'));
    
    // no src navigation on selection
    assert.ok(!content.includes('iframe.src = blobUrl'));

    // scroll behavior
    assert.ok(content.includes('win.scrollTo(0, scrollY)'));
  });

  await t.test('MediaPanel ethical note layout prevents wrap issues', () => {
    const filePath = path.join(process.cwd(), 'src/site-builder/components/MediaPanel.tsx');
    const content = fs.readFileSync(filePath, 'utf-8');

    // MediaPanel ethical label does not character-wrap
    assert.ok(content.includes('shrink-0'));
    assert.ok(content.includes('Nota ética:'));
    assert.ok(content.includes('min-w-0 break-words leading-relaxed'));
  });
});
