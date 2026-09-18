import { resolveSiteGenerationDesign } from './server/services/research/siteGenerationDesignResolver.js';
import { stitchDesignProductionService } from './server/services/research/stitchProductionService.js';
import { classifyOsmBusiness } from './src/domain/businessTaxonomy.js';

const run = async () => {
  console.log("=== HAIR SALON LIVE TRACE ===");
  const hairSalon = classifyOsmBusiness({ shop: 'hairdresser' });
  const hsLead = {
    leadId: 'lead-hair-123',
    source: 'manual',
    state: 'pending',
    niche: hairSalon.canonicalNiche,
    context: {
      business: { name: 'Studio Bella', category: hairSalon.categoryLabel, city: 'SP' },
      contact: { phone: '', email: '', socialLinks: [] },
      onlinePresence: { hasWebsite: false, websiteUrl: '' },
      reputation: { rating: 5, reviewsCount: 1 }
    }
  } as any;
  const hsCurrent = { kind: 'current-business', status: 'absent', auditedAt: new Date().toISOString(), method: 'bounded-static-html', observations: [], structure: [], identity: [], technicalProblems: [], visualProblems: [], conversionProblems: [], contentProblems: [], accessibilityProblems: [], opportunities: [], limitations: [] } as any;
  
  const hsDes = await resolveSiteGenerationDesign(hsLead, hsCurrent, undefined, undefined, false);
  console.log('canonicalNiche:', hairSalon.canonicalNiche);
  console.log('strategyId:', hsDes.strategy.strategyId);
  console.log('visualMood:', hsDes.strategy.visualMood);
  console.log('imageryDirection:', hsDes.strategy.imageryDirection);
  
  try {
    const hsProdObj = await stitchDesignProductionService.getOrCreateProduction('req-hair-1', hsDes.artifactIdentity.projectId, hsLead);
    const hsProdId = hsProdObj.generationRequestId;
    console.log('designProductionId:', hsProdId);
    
    // Polling for completion
    let hsProd = stitchDesignProductionService.getProduction(hsProdId);
    while (hsProd && hsProd.status !== 'PAIRED' && hsProd.status !== 'PARTIAL' && hsProd.status !== 'FAILED') {
      await new Promise(r => setTimeout(r, 2000));
      hsProd = stitchDesignProductionService.getProduction(hsProdId);
    }
    
    console.log('stitchProjectId:', hsProd?.mobileReference?.projectId || hsProd?.desktopReference?.projectId);
    console.log('mobileRequestId:', hsProd?.mobileReference?.requestId);
    console.log('desktopRequestId:', hsProd?.desktopReference?.requestId);
    console.log('mobileCandidateId:', 'N/A');
    console.log('desktopCandidateId:', 'N/A');
    console.log('pairStatus:', hsProd?.status);
  } catch (e) {
    console.error('Hair Salon error:', e);
  }

  console.log("\n=== BARBERSHOP LIVE TRACE ===");
  const barbershop = classifyOsmBusiness({ shop: 'hairdresser', hairdresser: 'barber' });
  const bbLead = {
    leadId: 'lead-barber-456',
    source: 'manual',
    state: 'pending',
    niche: barbershop.canonicalNiche,
    context: {
      business: { name: 'Barba Forte', category: barbershop.categoryLabel, city: 'SP' },
      contact: { phone: '', email: '', socialLinks: [] },
      onlinePresence: { hasWebsite: false, websiteUrl: '' },
      reputation: { rating: 5, reviewsCount: 1 }
    }
  } as any;
  
  const bbDes = await resolveSiteGenerationDesign(bbLead, hsCurrent, undefined, undefined, false);
  console.log('canonicalNiche:', barbershop.canonicalNiche);
  console.log('strategyId:', bbDes.strategy.strategyId);
  console.log('visualMood:', bbDes.strategy.visualMood);
  console.log('imageryDirection:', bbDes.strategy.imageryDirection);
  
  try {
    const bbProdObj = await stitchDesignProductionService.getOrCreateProduction('req-barber-1', bbDes.artifactIdentity.projectId, bbLead);
    const bbProdId = bbProdObj.generationRequestId;
    console.log('designProductionId:', bbProdId);
    
    let bbProd = stitchDesignProductionService.getProduction(bbProdId);
    while (bbProd && bbProd.status !== 'PAIRED' && bbProd.status !== 'PARTIAL' && bbProd.status !== 'FAILED') {
      await new Promise(r => setTimeout(r, 2000));
      bbProd = stitchDesignProductionService.getProduction(bbProdId);
    }
    
    console.log('stitchProjectId:', bbProd?.mobileReference?.projectId || bbProd?.desktopReference?.projectId);
    console.log('mobileRequestId:', bbProd?.mobileReference?.requestId);
    console.log('desktopRequestId:', bbProd?.desktopReference?.requestId);
    console.log('pairStatus:', bbProd?.status);
  } catch (e) {
    console.error('Barbershop error:', e);
  }
};

run().catch(console.error);
