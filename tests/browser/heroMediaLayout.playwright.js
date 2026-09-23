// Real renderer/CSS geometry at three viewports; fixture image, no remote provider.
async (page) => {
  const context = await page.context().browser().newContext();
  const tab = await context.newPage();
  try {
    await tab.goto('http://localhost:3000');
    const html = await tab.evaluate(async () => {
      const {renderSiteDocument} = await import('/src/site-builder/renderer/SiteRenderer.tsx');
      const {blueprint, context} = await import('/tests/fixtures/siteFixture.ts');
      const manifest = {version:1,projectId:'hero-geometry',generatedAt:new Date().toISOString(),entries:[{
        id:'hero-media',requestId:'geometry',section:'hero',sourceType:'licensed',provider:'pexels',providerAssetId:'fixture',
        retrievedAt:new Date().toISOString(),contentHash:'e'.repeat(64),assetId:'fixture',assetPath:'fixture.png',mimeType:'image/png',width:1,height:1,byteLength:68,
        alt:'Ilustração de teste',decorative:false,realBusinessMedia:false,licensed:true,aiGenerated:false,reviewStatus:'selected'
      }]};
      return renderSiteDocument({...blueprint,visual:{...blueprint.visual,hero:'full-bleed'}},context,undefined,manifest,{fixture:'/tests/fixtures/media-test.png'});
    });
    await tab.setContent(html);
    const results=[];
    for(const width of [390,768,1440]) {
      await tab.setViewportSize({width,height:900});
      const measurement=await tab.evaluate(()=>{
        const hero=document.querySelector('.hero-full-bleed');
        const media=hero.querySelector('.hero-bg-media');
        const h=hero.getBoundingClientRect(),m=media.getBoundingClientRect();
        return {position:getComputedStyle(media).position,backgroundZ:getComputedStyle(media).zIndex,headingZ:getComputedStyle(hero.querySelector('h1')).zIndex,
          covered:Math.abs(h.width-m.width)<1 && Math.abs(h.height-m.height)<1 && Math.abs(h.x-m.x)<1 && Math.abs(h.y-m.y)<1,
          overflow:document.documentElement.scrollWidth>innerWidth};
      });
      if(measurement.position!=='absolute'||!measurement.covered||measurement.overflow||Number(measurement.headingZ)<=Number(measurement.backgroundZ)) throw Error(JSON.stringify({width,...measurement}));
      results.push({width,...measurement});
    }
    return results;
  } finally {await context.close();}
}
