import { StitchToolClient } from '@google/stitch-sdk';
import { config } from 'dotenv';

config();

async function run() {
  console.log('--- STITCH MCP LIVE SMOKE TEST ---');
  const client = new StitchToolClient();

  try {
    console.log('Connecting...');
    await client.connect();
    console.log('Connected.');
    
    console.log('Listing tools...');
    const result = await client.listTools();
    const toolNames = result.tools.map(t => t.name);
    console.log('Tools discovered:', toolNames.join(', '));

    if (!toolNames.includes('create_project') || !toolNames.includes('generate_screen_from_text')) {
      console.log('Required tools (create_project, generate_screen_from_text) not found.');
      process.exit(1);
    }
    
    console.log('\nExecuting smoke test: step 1 - create_project');
    const projectResult = await client.callTool<any>('create_project', {
      title: 'Smoke Test Project'
    });
    
    const projectId = projectResult.name?.replace('projects/', '') || projectResult.projectId;
    if (!projectId) {
      console.log('Failed to get projectId from create_project response:', JSON.stringify(projectResult, null, 2));
      process.exit(1);
    }
    console.log('Created project:', projectId);

    console.log('\nExecuting smoke test: step 2 - generate_screen_from_text');
    const smokeArgs = {
      niche: 'barbershop',
      sitePurpose: 'Attract new customers for a modern barbershop',
      visualMood: 'modern, editorial, bold',
      compositionDirection: 'hero centered, services grid',
      typographyDirection: 'sans-serif, bold headlines',
      imageryDirection: 'high-contrast, barbershop tools, haircuts',
    };
    
    // The prompt is typically a string description. We will map our domain fields into a prompt string.
    const promptString = `Design a website for a ${smokeArgs.niche}. 
    Purpose: ${smokeArgs.sitePurpose}. 
    Mood: ${smokeArgs.visualMood}. 
    Composition: ${smokeArgs.compositionDirection}. 
    Typography: ${smokeArgs.typographyDirection}. 
    Imagery: ${smokeArgs.imageryDirection}.`;
    
    console.log('Prompt (PII sanitized):', promptString);
    
    const startTime = Date.now();
    const callResult = await client.callTool<any>('generate_screen_from_text', {
      projectId: projectId,
      prompt: promptString
    });
    const duration = Date.now() - startTime;
    
    console.log(`\nResult received in ${duration}ms:`);
    // Output just metadata and keys to avoid flooding the log
    console.log('Output Keys:', Object.keys(callResult));
    const screenId = callResult.name?.replace('projects/'+projectId+'/screens/', '') || callResult.screenId || callResult.id;
    console.log('Screen ID:', screenId);
    console.log('Status:', callResult.status);
    
    if (toolNames.includes('generate_variants') && screenId) {
        console.log('\nExecuting smoke test: step 3 - generate_variants');
        const variantStartTime = Date.now();
        const variantResult = await client.callTool<any>('generate_variants', {
          projectId: projectId,
          selectedScreenIds: [screenId],
          prompt: promptString,
          variantOptions: {
            variantCount: 3,
            creativeRange: 'EXPLORE'
          }
        });
        const variantDuration = Date.now() - variantStartTime;
        console.log(`\nVariants Result received in ${variantDuration}ms:`);
        console.log('Variants Output Keys:', Object.keys(variantResult));
        console.log('Variants count:', variantResult.variants?.length);
        
        // Let's log some structure of the variants to check diversity
        if (variantResult.variants && variantResult.variants.length > 0) {
            variantResult.variants.forEach((v: any, index: number) => {
               console.log(`\n--- Variant ${index + 1} ---`);
               console.log(`ID: ${v.name || v.id}`);
               console.log(`Layout Patterns: ${JSON.stringify(v.layoutPatterns || [])}`);
               if (v.content?.hero) {
                   console.log(`Hero structure: ${JSON.stringify(v.content.hero)}`);
               }
               if (v.content?.composition) {
                   console.log(`Section order: ${JSON.stringify(v.content.composition)}`);
               }
            });
        }
    }
    
    console.log('\nSMOKE TEST PASS');
    
  } catch (error: any) {
    console.error('Smoke test failed:', error.message);
    if (error.cause) console.error('Cause:', error.cause);
    if (error.response) console.error('Response Data:', error.response.data);
    process.exit(1);
  } finally {
    await client.close();
  }
}

run();
