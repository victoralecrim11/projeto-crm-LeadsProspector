import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { GenerationResultStep } from '../../src/site-builder/components/wizard/GenerationResultStep';
import { GenerationFallbackNotice } from '../../src/site-builder/components/GenerationFallbackNotice';
import type { GenerationMetadata } from '../../src/site-builder/types';

test('completed fallback is presented as basic draft rather than successful AI generation', () => {
 const props = {phase:'completed' as const,onOpenEditor(){},onRetry(){},onReviewConfig(){}};
 const html = renderToStaticMarkup(React.createElement(GenerationResultStep,{...props,fallbackUsed:true}));
 assert.match(html,/Rascunho salvo sem IA/);
 assert.doesNotMatch(html,/Site criado para revisão/);
 assert.match(html,/Abrir Editor Visual/);
 const success=renderToStaticMarkup(React.createElement(GenerationResultStep,props));
 assert.match(success,/Site criado para revisão/);
});

test('persisted fallback warning survives reopening and is absent for successful AI',()=>{
 const generation=JSON.parse(JSON.stringify({fallbackUsed:true,mode:'standard-fallback'})) as GenerationMetadata;
 assert.match(renderToStaticMarkup(React.createElement(GenerationFallbackNotice,{generation})),/versão básica de contingência/);
 assert.equal(renderToStaticMarkup(React.createElement(GenerationFallbackNotice,{generation:{...generation,fallbackUsed:false}})),'');
 assert.equal(renderToStaticMarkup(React.createElement(GenerationFallbackNotice,{})),'');
});
