import { config } from 'dotenv';
import { produceArtifact } from './producerOrchestrator.js';
import { RealStitchMcpClient } from './clients/realStitchMcpClient.js';
import { resolveDesignStrategy } from '../../server/services/research/designStrategy/designStrategyResolver.js';
import { getMockResolvedDesign } from '../../tests/fixtures/stitchProducerFixtures.js';

config();

async function runNiche(niche: string) {
  console.log(`\n======================================`);
  console.log(`Executing E2E Live for: ${niche.toUpperCase()}`);
  console.log(`======================================\n`);
  
  const resolvedDesign = getMockResolvedDesign(niche, niche);
  const strategy = resolveDesignStrategy(resolvedDesign);

  const client = new RealStitchMcpClient();
  const projectId = `live-e2e-${niche}`;
  const requestId = `req-live-${Date.now()}`;
  
  console.log(`Producing artifact for strategy ${strategy.strategyId}...`);
  const result = await produceArtifact(strategy, projectId, requestId, { client, basePath: process.cwd() });
  
  console.log(`Status: ${result.status}`);
  if (result.errorMessage) {
    console.log(`Error Message: ${result.errorMessage}`);
  }
  
  console.log(`Requested candidates: ${strategy.stitchVariantCount}`);
  console.log(`Returned candidates: ${result.candidates.length}`);
  
  if (result.writeEvidence) {
    console.log(`Artifact Written: ${result.writeEvidence.artifactPath}`);
    console.log(`Schema Version: ${result.writeEvidence.schemaVersion}`);
    console.log(`Atomic Rename Completed: ${result.writeEvidence.atomicRenameCompleted}`);
  } else {
    console.log(`WARNING: No artifact written.`);
  }
  
  return result;
}

async function runAll() {
  console.log('--- STITCH MCP LIVE E2E HOMOLOGATION ---');
  try {
    const r1 = await runNiche('barbershop');
    if (r1.status !== 'PRODUCED') {
      console.error('Barbershop failed. Halting.');
      process.exit(1);
    }
    
    const r2 = await runNiche('dentistry');
    if (r2.status !== 'PRODUCED') {
      console.error('Dentist failed. Halting.');
      process.exit(1);
    }
    
    const r3 = await runNiche('restaurant'); // Using 'restaurant' for Pizzeria
    if (r3.status !== 'PRODUCED') {
      console.error('Pizzeria failed. Halting.');
      process.exit(1);
    }
    
    console.log('\n--- LIVE HOMOLOGATION COMPLETED SUCCESSFULLY ---');
  } catch (error: any) {
    console.error('\nE2E Suite failed with error:', error.message);
    process.exit(1);
  }
}

runAll();
