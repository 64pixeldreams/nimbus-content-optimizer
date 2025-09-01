const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

// Test configuration
const TEST_PAGE = 'hublot-watch-repair';
const TEST_TONE = 'mom-n-pop';

async function testContentExtraction() {
  console.log('🔍 TESTING CONTENT EXTRACTION...');
  
  const htmlPath = path.join(__dirname, '..', 'dist', 'brands', `${TEST_PAGE}.html`);
  const html = fs.readFileSync(htmlPath, 'utf8');
  const $ = cheerio.load(html);
  
  const extractedBlocks = [];
  
  // Extract H1, H2, H3, P tags with inline handling
  $('main h1, main h2, main h3, main p').each((index, element) => {
    const $el = $(element);
    const tagName = element.tagName.toLowerCase();
    
    // Get clean text while preserving inline structure
    let cleanText = '';
    $el.contents().each((i, node) => {
      if (node.type === 'text') {
        cleanText += node.data;
      } else if (node.type === 'tag') {
        const $node = $(node);
        if (node.tagName === 'a') {
          cleanText += `[LINK:${$node.text()}]`;
        } else if (['b', 'strong', 'em', 'i'].includes(node.tagName)) {
          cleanText += `*${$node.text()}*`;
        } else {
          cleanText += $node.text();
        }
      }
    });
    
    if (cleanText.trim().length > 10) {
      extractedBlocks.push({
        id: `${tagName}-${index + 1}`,
        type: tagName,
        original_text: cleanText.trim(),
        selector: $el.attr('class') || tagName,
        length: cleanText.trim().length
      });
    }
  });
  
  console.log(`✅ Extracted ${extractedBlocks.length} content blocks:`);
  extractedBlocks.forEach(block => {
    console.log(`  ${block.id}: ${block.original_text.substring(0, 80)}...`);
  });
  
  return extractedBlocks;
}

async function testAIOptimization(blocks) {
  console.log('\n🤖 TESTING AI OPTIMIZATION...');
  
  const workerUrl = 'https://nimbus-ai-worker.marti.workers.dev/optimize';
  
  const payload = {
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
    content_map: {
      blocks: blocks
    },
    model: 'gpt-4o'
  };
  
  try {
    const response = await fetch(workerUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    const result = await response.json();
    
    if (!result.success) {
      console.log('❌ AI optimization failed:', result.error);
      return null;
    }
    
    console.log('✅ AI optimization completed');
    return result;
    
  } catch (error) {
    console.log('❌ AI request failed:', error.message);
    return null;
  }
}

async function auditOptimizationResults(originalBlocks, aiResult) {
  console.log('\n🔍 AUDITING OPTIMIZATION RESULTS...');
  
  if (!aiResult || !aiResult.result || !aiResult.result.blocks) {
    console.log('❌ No AI results to audit');
    return;
  }
  
  const optimizedBlocks = aiResult.result.blocks;
  
  // Create audit prompt
  const auditPrompt = {
    role: "system",
    content: `You are a content optimization expert. Audit the following optimization results and provide:
1. Overall score (1-10)
2. List of specific issues found
3. Assessment of tone change
4. SEO improvements analysis
5. Content quality assessment
6. Recommendations for improvement

Be specific and critical.`
  };
  
  const auditContent = {
    role: "user", 
    content: `ORIGINAL CONTENT:
${originalBlocks.map(b => `${b.id} (${b.type}): ${b.original_text}`).join('\n\n')}

OPTIMIZED CONTENT:
${optimizedBlocks.map(b => `${b.id}: ${b.optimized_text}`).join('\n\n')}

TARGET TONE: ${TEST_TONE}

Please audit these results.`
  };
  
  // For now, let's do a manual audit
  console.log('\n📊 MANUAL AUDIT RESULTS:');
  
  let totalScore = 0;
  let issues = [];
  
  // Check each block
  optimizedBlocks.forEach((optimized, index) => {
    const original = originalBlocks.find(b => b.id === optimized.id) || originalBlocks[index];
    
    if (!original) {
      issues.push(`Block ${optimized.id}: No original content found`);
      return;
    }
    
    console.log(`\n--- BLOCK ${optimized.id} ---`);
    console.log(`ORIGINAL: ${original.original_text.substring(0, 100)}...`);
    console.log(`OPTIMIZED: ${optimized.optimized_text.substring(0, 100)}...`);
    
    // Check for improvements
    let blockScore = 5; // Base score
    
    // Length check
    if (optimized.optimized_text.length < original.original_text.length * 0.5) {
      issues.push(`${optimized.id}: Too much content removed`);
      blockScore -= 2;
    }
    
    // Tone check
    if (TEST_TONE === 'mom-n-pop') {
      const momPopWords = ['family', 'trust', 'care', 'expert', 'friendly', 'help'];
      const hasMomPopTone = momPopWords.some(word => 
        optimized.optimized_text.toLowerCase().includes(word)
      );
      if (!hasMomPopTone) {
        issues.push(`${optimized.id}: Doesn't match mom-n-pop tone`);
        blockScore -= 1;
      } else {
        blockScore += 1;
      }
    }
    
    // SEO check
    const hasKeywords = optimized.optimized_text.toLowerCase().includes('hublot') || 
                       optimized.optimized_text.toLowerCase().includes('watch');
    if (!hasKeywords) {
      issues.push(`${optimized.id}: Missing brand keywords`);
      blockScore -= 1;
    } else {
      blockScore += 1;
    }
    
    totalScore += blockScore;
    console.log(`BLOCK SCORE: ${blockScore}/10`);
  });
  
  const averageScore = totalScore / optimizedBlocks.length;
  
  console.log(`\n📈 OVERALL SCORE: ${averageScore.toFixed(1)}/10`);
  
  if (issues.length > 0) {
    console.log('\n❌ ISSUES FOUND:');
    issues.forEach(issue => console.log(`  - ${issue}`));
  } else {
    console.log('\n✅ No major issues found');
  }
  
  return {
    score: averageScore,
    issues: issues,
    blocks_processed: optimizedBlocks.length
  };
}

async function runFullTest() {
  console.log('🧪 STARTING COMPREHENSIVE AI OPTIMIZATION TEST\n');
  
  // Step 1: Test content extraction
  const blocks = await testContentExtraction();
  
  if (blocks.length === 0) {
    console.log('❌ No content blocks extracted - stopping test');
    return;
  }
  
  // Step 2: Test AI optimization
  const aiResult = await testAIOptimization(blocks);
  
  if (!aiResult) {
    console.log('❌ AI optimization failed - stopping test');
    return;
  }
  
  // Step 3: Audit results
  const audit = await auditOptimizationResults(blocks, aiResult);
  
  console.log('\n🎯 TEST COMPLETE');
  console.log(`Final Score: ${audit.score}/10`);
  console.log(`Issues Found: ${audit.issues.length}`);
  
  // Save results for analysis
  const testResults = {
    timestamp: new Date().toISOString(),
    test_page: TEST_PAGE,
    test_tone: TEST_TONE,
    blocks_extracted: blocks.length,
    blocks_optimized: audit.blocks_processed,
    score: audit.score,
    issues: audit.issues,
    original_blocks: blocks,
    ai_result: aiResult
  };
  
  fs.writeFileSync(
    path.join(__dirname, '.nimbus', 'test-results.json'),
    JSON.stringify(testResults, null, 2)
  );
  
  console.log('\n💾 Test results saved to .nimbus/test-results.json');
}

// Run the test
runFullTest().catch(console.error);
