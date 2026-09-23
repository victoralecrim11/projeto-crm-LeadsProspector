// Controlled failures, isolated storage. Does not call Stitch or an LLM.
async (page) => {
  const results = [];
  for (const terminal of ['PAIRED', 'PARTIAL']) {
    const context = await page.context().browser().newContext();
    const tab = await context.newPage();
    let produces = 0, polls = 0;
    const requests = [];
    try {
      await tab.goto('http://localhost:3000');
      const payload = await tab.evaluate(async () => {
        const { lead, blueprint } = await import('/tests/fixtures/siteFixture.ts');
        const { normalizeLeadSource } = await import('/src/site-builder/leadSource.ts');
        const { resolveStandardDesign, buildDesignSystemContract } = await import('/src/site-builder/designPipeline.ts');
        const source = normalizeLeadSource({ ...lead, dataSource: 'manual' });
        const design = resolveStandardDesign(source, {kind:'current-business',status:'absent',auditedAt:new Date().toISOString(),method:'bounded-static-html',observations:[],structure:[],identity:[],technicalProblems:[],visualProblems:[],conversionProblems:[],contentProblems:[],accessibilityProblems:[],opportunities:[],limitations:[]});
        localStorage.setItem('leadsite_crm_leads_v2', JSON.stringify([{...lead,dataSource:'manual'}]));
        localStorage.setItem('leadsite_crm_projects_v2', '[]');
        return { blueprint, design, contract: buildDesignSystemContract(design), warnings:[], generation:{provider:'gemini',model:'controlled-test',mode:'standard-ai',fallbackUsed:false} };
      });
      await tab.route('**/api/ai/models', route => route.fulfill({json:{models:[],warnings:[]}}));
      let identity;
      await tab.route('**/api/ai/research/stitch/produce', route => {
        produces++;
        const {generationRequestId} = route.request().postDataJSON();
        identity = {generationRequestId,designProductionId:generationRequestId};
        return route.fulfill({json:{...identity,status:terminal === 'PAIRED' ? 'PENDING' : terminal,stage:'COMPLETED'}});
      });
      await tab.route('**/api/ai/research/stitch/produce/*', route => {
        polls++;
        return route.fulfill({json:{...identity,status:terminal,stage:'COMPLETED'}});
      });
      await tab.route('**/api/ai/sites/standard-ai', route => {
        requests.push(route.request().postDataJSON());
        return requests.length === 1
          ? route.fulfill({status:503,json:{code:'SITE_AI_PROVIDER_UNAVAILABLE',error:'Falha controlada do teste.'}})
          : route.fulfill({json:payload});
      });
      await tab.goto('http://localhost:3000/redesenhar');
      await tab.getByRole('button',{name:'Gerar Site com IA',exact:true}).click();
      for (let i=0;i<3;i++) await tab.getByRole('button',{name:'Continuar',exact:true}).click();
      await tab.getByRole('button',{name:'Confirmar e Gerar'}).click();
      await tab.getByRole('button',{name:'Tentar Novamente',exact:true}).waitFor();
      const afterFailure = await tab.evaluate(()=>JSON.parse(localStorage.getItem('leadsite_crm_projects_v2')||'[]').length);
      if(afterFailure !== 0) throw Error('A failed response left an incomplete project: '+afterFailure);
      await tab.getByRole('button',{name:'Tentar Novamente',exact:true}).click();
      await tab.getByRole('button',{name:'Confirmar e Gerar'}).click();
      await tab.getByRole('button',{name:'Abrir Editor Visual'}).waitFor();
      const count = await tab.evaluate(()=>JSON.parse(localStorage.getItem('leadsite_crm_projects_v2')||'[]').length);
      if(count !== 1 || produces !== 1 || requests.length !== 2) throw Error('Retry duplicated production/project');
      if(requests[0].generationRequestId !== requests[1].generationRequestId || requests[0].designProductionId !== requests[1].designProductionId) throw Error('Retry changed identity');
      const partialVisible = (await tab.getByRole('dialog').innerText()).includes('referência mobile adaptada');
      if(partialVisible !== (terminal === 'PARTIAL')) throw Error('Terminal design status was lost');
      results.push({terminal,produces,polls,requests:requests.length,projects:count,afterFailure,partialVisible});
    } finally { await context.close(); }
  }
  return {results,externalResponses:'CONTROLLED_NOT_LIVE'};
}
