const fs = require('fs');
const path = require('path');

console.log('🤖 TASK 2.1: Testing AI Response Quality\n');

// Test configuration
const TEST_TONE = 'mom-n-pop';

async function testAIOptimization() {
  console.log('📄 Loading extracted content blocks...');
  
  // Load the existing working batch data
  const batchPath = path.join(__dirname, '.nimbus', 'work', 'brand-demo', 'batch.json');
  
  if (!fs.existsSync(batchPath)) {
    console.log('❌ Batch data not found. Run nimbus:scan first.');
    return;
  }
  
  const batchData = JSON.parse(fs.readFileSync(batchPath, 'utf8'));
  const hublotPage = batchData.pages.find(p => p.page_id === 'hublot-watch-repair');
  
  if (!hublotPage) {
    console.log('❌ Hublot page not found in batch data.');
    return;
  }
  
  const blocks = hublotPage.content_map.blocks;
  
  console.log(`✅ Loaded ${blocks.length} content blocks from extraction`);
  
  // Select a subset of blocks for testing (to avoid token limits)
  const testBlocks = blocks.slice(0, 10); // Test first 10 blocks
  
  console.log(`🔍 Testing with ${testBlocks.length} blocks:`);
  testBlocks.forEach((block, i) => {
    const text = block.text || block.anchor || block.original_text || 'No text';
    console.log(`  ${i + 1}. ${block.id} (${block.type}): ${text.substring(0, 60)}...`);
  });
  
  console.log('\n🤖 Sending to AI worker...');
  
  const workerUrl = 'https://nimbus-content-optimizer.martin-598.workers.dev';
  
  const payload = {
    prompt_type: 'multi',
    model: 'gpt-4o',
    profile: {
      business_name: "Repairs by Post",
      industry: "watch repair",
      target_audience: "luxury watch owners",
      geographic_focus: "UK"
    },
    directive: {
      tone: TEST_TONE,
      optimization_goals: ["seo", "conversion", "readability"]
    },
    content_map: hublotPage.content_map,
    tier_level: 3,
    cache_bust: Date.now(),
    no_cache: true
  };
  
  try {
    console.log('📤 Sending request to AI worker...');
    
    const response = await fetch(workerUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      console.log(`❌ HTTP error: ${response.status} ${response.statusText}`);
      return;
    }
    
    const result = await response.json();
    
    console.log('✅ AI response received');
    
    // Debug: Show the full response
    console.log('\n🔍 FULL AI RESPONSE:');
    console.log('='.repeat(60));
    console.log(JSON.stringify(result, null, 2));
    
    // Analyze the response
    console.log('\n📊 AI RESPONSE ANALYSIS:');
    console.log('='.repeat(60));
    
    // Check if we have any successful optimizations
    const successfulPrompts = result.v2_metadata?.successful_prompts || 0;
    const totalPrompts = result.v2_metadata?.prompt_count || 0;
    
    if (successfulPrompts === 0) {
      console.log('❌ AI optimization failed:');
      console.log(`Error: ${result.error}`);
      if (result.raw_response) {
        console.log(`Raw response: ${result.raw_response.substring(0, 200)}...`);
      }
      return;
    }
    
    console.log(`✅ AI optimization partially successful: ${successfulPrompts}/${totalPrompts} prompts succeeded`);
    
    // Check what optimizations we got
    console.log('\n📦 OPTIMIZATION RESULTS:');
    console.log('='.repeat(40));
    
    if (result.head && Object.keys(result.head).length > 0) {
      console.log('✅ Head optimizations received');
    }
    
    if (result.blocks && result.blocks.length > 0) {
      console.log(`✅ Content blocks optimized: ${result.blocks.length} blocks`);
    } else {
      console.log('⚠️ No content blocks optimized (this is the issue we need to fix)');
    }
    
    if (result.links && result.links.length > 0) {
      console.log(`✅ Links optimized: ${result.links.length} links`);
    }
    
    if (result.alts && result.alts.length > 0) {
      console.log(`✅ Alt text optimized: ${result.alts.length} images`);
    }
    
    if (result.schema && Object.keys(result.schema).length > 0) {
      console.log('✅ Schema markup generated');
    }
    
    // Display alt text optimizations
    if (result.alts && result.alts.length > 0) {
      console.log('\n📝 ALT TEXT OPTIMIZATIONS:');
      console.log('='.repeat(60));
      
      result.alts.slice(0, 3).forEach((alt, index) => {
        console.log(`\n--- IMAGE ${index + 1} ---`);
        console.log(`Selector: ${alt.selector}`);
        console.log(`Current: ${alt.current_alt}`);
        console.log(`Optimized: ${alt.new_alt}`);
        console.log(`Reasoning: ${alt.optimization_reasoning}`);
      });
    }
    
    // Display schema optimizations
    if (result.schema && result.schema['@graph']) {
      console.log('\n📝 SCHEMA OPTIMIZATIONS:');
      console.log('='.repeat(60));
      
      result.schema['@graph'].forEach((item, index) => {
        console.log(`\n--- SCHEMA ${index + 1} ---`);
        console.log(`Type: ${item['@type']}`);
        if (item.name) console.log(`Name: ${item.name}`);
        if (item.description) console.log(`Description: ${item.description.substring(0, 100)}...`);
      });
    }
    
    // Check for improvements
    console.log('\n🔍 QUALITY CHECKS:');
    console.log('='.repeat(40));
    
    let totalScore = 0;
    let issues = [];
    
    // Score alt text optimizations
    if (result.alts && result.alts.length > 0) {
      let altScore = 0;
      result.alts.forEach((alt, index) => {
        let blockScore = 5; // Base score
        
        // Check if alt text is improved
        if (alt.new_alt.length > alt.current_alt.length) {
          blockScore += 2;
        }
        
        // Check for location context
        if (alt.new_alt.toLowerCase().includes('uk') || alt.new_alt.toLowerCase().includes('britain')) {
          blockScore += 1;
        }
        
        // Check for brand context
        if (alt.new_alt.toLowerCase().includes('hublot')) {
          blockScore += 1;
        }
        
        altScore += blockScore;
      });
      
      const avgAltScore = altScore / result.alts.length;
      console.log(`Alt text optimization: ${avgAltScore.toFixed(1)}/10`);
      totalScore += avgAltScore;
    }
    
    // Score schema optimizations
    if (result.schema && result.schema['@graph']) {
      let schemaScore = 0;
      result.schema['@graph'].forEach((item, index) => {
        let blockScore = 5; // Base score
        
        // Check for comprehensive schema
        if (item['@type'] === 'LocalBusiness') {
          if (item.hasOfferCatalog) blockScore += 2;
          if (item.aggregateRating) blockScore += 1;
          if (item.address) blockScore += 1;
        }
        
        if (item['@type'] === 'FAQPage') {
          if (item.mainEntity && item.mainEntity.length > 0) blockScore += 2;
        }
        
        schemaScore += blockScore;
      });
      
      const avgSchemaScore = schemaScore / result.schema['@graph'].length;
      console.log(`Schema optimization: ${avgSchemaScore.toFixed(1)}/10`);
      totalScore += avgSchemaScore;
    }
    
    // Note the content block issue
    if (!result.blocks || result.blocks.length === 0) {
      issues.push('Content blocks not optimized - AI worker has an issue with block processing');
    }
    
    const averageScore = totalScore / 2; // Average of alt text and schema scores
    
    console.log(`\n📈 OVERALL SCORE: ${averageScore.toFixed(1)}/10`);
    
    if (issues.length > 0) {
      console.log('\n❌ ISSUES FOUND:');
      issues.forEach(issue => console.log(`  - ${issue}`));
    } else {
      console.log('\n✅ No major issues found');
    }
    
    // Save results for next phase
    const aiResults = {
      timestamp: new Date().toISOString(),
      test_tone: TEST_TONE,
      blocks_sent: testBlocks.length,
      blocks_received: result.blocks?.length || 0,
      score: averageScore,
      issues: issues,
      original_blocks: testBlocks,
      optimized_blocks: result.blocks || [],
      ai_response: result
    };
    
    fs.writeFileSync(
      path.join(__dirname, '.nimbus', 'ai-optimization-results.json'),
      JSON.stringify(aiResults, null, 2)
    );
    
    console.log('\n💾 Results saved to .nimbus/ai-optimization-results.json');
    console.log('\n✅ TASK 2.1 COMPLETE - Ready for Task 2.2');
    
    return aiResults;
    
  } catch (error) {
    console.log('❌ AI request failed:', error.message);
    return null;
  }
}

// Run the test
testAIOptimization().catch(console.error);
