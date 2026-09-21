import { resolveRuntimeResponsiveDesign } from '../server/services/research/siteGenerationResponsiveResolver.js';
import { ArtifactMcpProvider } from '../server/services/research/stitch/providers/artifactMcpProvider.js';
import { getMockResolvedDesign, barbershopVariants, dentistVariants } from './fixtures/stitchProducerFixtures.js';
import { writeArtifact } from '../tools/stitch-producer/artifactWriter.js';
import { mapStitchRawToArtifact } from '../tools/stitch-producer/producerMapper.js';
import { resolveDesignStrategy } from '../server/services/research/designStrategy/designStrategyResolver.js';
import fs from 'node:fs/promises';
import path from 'node:path';

async function run() {
  const TEST_BASE = path.join(process.cwd(), '.stitch-test-smoke');
  await fs.rm(TEST_BASE, { recursive: true, force: true });
  
  const mockDesign = getMockResolvedDesign('barbershop');
  const strategy = resolveDesignStrategy(mockDesign);
  
  // 1. Create Mobile Anchor
  const mobileRaw = { status: 'ok' as const, variants: barbershopVariants };
  const mobileArtifact = mapStitchRawToArtifact(mobileRaw, strategy, 'proj-barber', 'req-mob');
  await writeArtifact(mobileArtifact!, TEST_BASE);
  
  // 2. Create Desktop Companion (using dentistVariants just to simulate different structural patterns for desktop)
  const desktopRaw = { status: 'ok' as const, variants: [dentistVariants[0]] };
  const desktopArtifact = mapStitchRawToArtifact(desktopRaw, strategy, 'proj-barber', 'req-desk');
  await writeArtifact(desktopArtifact!, TEST_BASE);

  // 3. Inject references into mockDesign
  mockDesign.stitch = {
    viewportAnchors: {
      mobile: { projectId: 'proj-barber', requestId: 'req-mob', strategyId: strategy.strategyId, artifactPath: '', source: 'stitch' },
      desktop: { projectId: 'proj-barber', requestId: 'req-desk', strategyId: strategy.strategyId, artifactPath: '', source: 'stitch' }
    },
    alternatives: ['opt1', 'opt2'],
    selected: 'req-mob',
    review: 'ok',
    projectUrl: 'https://stitch.withgoogle.com/test'
  };

  // 4. Resolve
  const provider = new ArtifactMcpProvider(TEST_BASE);
  const result = await resolveRuntimeResponsiveDesign(mockDesign, mockDesign.stitch!.viewportAnchors!, provider);
  
  console.log('Mobile Candidate count:', mobileArtifact!.candidates.length);
  console.log('Mobile Winner:', result.resolution.effectiveCandidate?.candidateId);
  console.log('Desktop Companion:', result.resolution.status === 'PAIRED' && 'desktopCompanion' in result.resolution ? (result.resolution as any).desktopCompanion?.candidateId : 'None (Incoherent)');
  console.log('strategyId:', strategy.strategyId);
  console.log('responsivePairId:', 'mock-pair-123'); // From fixture
  console.log('requestIds:', 'req-mob', '/', 'req-desk');
  console.log('deviceTypes:', 'mobile', '/', 'desktop');
  console.log('ArtifactReferences (Mobile):', mockDesign.stitch?.viewportAnchors?.mobile);
  console.log('ArtifactReferences (Desktop):', mockDesign.stitch?.viewportAnchors?.desktop);
  console.log('Coherence result:', result.resolution.status, result.resolution.incoherenceReason ? `(${result.resolution.incoherenceReason})` : '');
  
  await fs.rm(TEST_BASE, { recursive: true, force: true });
}

run().catch(console.error);
