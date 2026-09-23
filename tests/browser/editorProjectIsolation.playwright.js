// Run with the Playwright browser_run_code tool (filename), against localhost:3000.
// Uses its own browser context; never modifies the user's projects.
async (page) => {
  const context = await page.context().browser().newContext();
  const tab = await context.newPage();
  try {
    await tab.goto('http://localhost:3000');
    await tab.evaluate(() => {
      const projects = ['Barbearia Teste', 'Salão Teste'].map((name, index) => ({
        id: `isolation-${index}`, leadId: `lead-isolation-${index}`, title: name, clientName: name,
        category: index ? 'Salão' : 'Barbearia', status: 'rascunho', generationStatus: 'editing',
        createdAt: new Date().toISOString(), siteOverrides: {},
        siteContext: {business:{name,category:index?'Salão':'Barbearia',city:'Belo Horizonte',neighborhood:''},contact:{phone:'',whatsapp:'',email:'',address:''},onlinePresence:{hasWebsite:false,websiteUrl:''},reputation:{rating:null,reviewsCount:null}},
        siteBlueprint:{version:2,templateId:'minimal-professional',seo:{title:name,description:name},brand:{primaryColor:'#153a50',accentColor:'#d8aa63',tone:'profissional'},hero:{headline:name,subtitle:name,ctaText:'',ctaType:'none'},about:{title:name,description:name},services:[],sections:{hero:true,about:true,services:false,contact:false,location:false,testimonials:false},sectionOrder:['hero','services','about','contact','location'],warnings:[],visual:{hero:'split',about:'editorial-split',services:'horizontal-cards',contact:'contact-minimal',location:'location-editorial',navigation:'inline',footer:'minimal'},presentation:{theme:'light',typography:'modern',motion:'subtle'}},
        siteMediaPlan:{version:1,items:[]},siteMediaManifest:{version:1,projectId:`isolation-${index}`,generatedAt:new Date().toISOString(),entries:[]}
      }));
      localStorage.setItem('leadsite_crm_projects_v2', JSON.stringify(projects));
    });
    await tab.goto('http://localhost:3000/editor?project=isolation-0');
    const frame = tab.frameLocator('iframe');
    await frame.getByRole('heading', {name:'Barbearia Teste',exact:true}).first().waitFor();
    await tab.getByRole('button',{name:'Mover Sobre acima',exact:true}).click();
    if (!(await tab.getByRole('button',{name:'Desfazer',exact:true}).isEnabled())) throw Error('Expected history in A');
    tab.once('dialog', dialog => dialog.accept());
    await tab.getByRole('combobox',{name:'Projeto',exact:true}).selectOption('isolation-1');
    await frame.getByRole('heading',{name:'Salão Teste',exact:true}).first().waitFor();
    if ((await frame.locator('body').innerText()).includes('Barbearia Teste')) throw Error('A content leaked into B');
    if (!(await tab.getByRole('button',{name:'Desfazer',exact:true}).isDisabled())) throw Error('A undo history leaked into B');
    await tab.getByRole('button',{name:'Salvar projeto',exact:true}).click();
    const saved = await tab.evaluate(() => JSON.parse(localStorage.getItem('leadsite_crm_projects_v2')));
    if(saved[1].siteBlueprint.hero.headline !== 'Salão Teste' || saved[1].siteMediaManifest.projectId !== 'isolation-1') throw Error('B saved foreign state');
    if(saved[0].siteBlueprint.hero.headline !== 'Barbearia Teste') throw Error('A changed');
    await tab.getByRole('combobox',{name:'Projeto',exact:true}).selectOption('isolation-0');
    await frame.getByRole('heading',{name:'Barbearia Teste',exact:true}).first().waitFor();
    if ((await frame.locator('body').innerText()).includes('Salão Teste')) throw Error('B content leaked into A');
    await tab.reload();
    await frame.getByRole('heading',{name:'Barbearia Teste',exact:true}).first().waitFor();
    return {switchBothWays:'PASS',historyIsolation:'PASS',saveIsolation:'PASS',mediaIdentity:'PASS',reload:'PASS'};
  } catch (error) {
    throw new Error(String(error) + JSON.stringify(await tab.evaluate(() => ({url:location.href,text:document.body.innerText,frame:document.querySelector("iframe")?.contentDocument?.body.innerText}))));
  } finally { await context.close(); }
}
