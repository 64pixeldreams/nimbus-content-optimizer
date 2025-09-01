const fs = require('fs');
const path = require('path');

console.log('🤖 AI-POWERED QUALITY ANALYZER\n');

// Test configuration
const TEST_PAGE = 'hublot-watch-repair';
const TEST_TONE = 'mom-n-pop';
const WORKER_URL = 'https://nimbus-content-optimizer.martin-598.workers.dev';

// Quality thresholds
const THRESHOLDS = {
  content_preservation: 7.0,
  seo_improvement: 7.0,
  tone_consistency: 7.0,
  overall_quality: 7.0
};

async function analyzeBlockWithAI(originalText, optimizedText, blockId) {
  // Create a simple analysis prompt that works with the content optimization worker
  const analysisPrompt = `ANALYZE THIS OPTIMIZATION:

ORIGINAL: "${originalText}"
OPTIMIZED: "${optimizedText}"

Rate this optimization (1-10) and provide feedback in JSON format:

{
  "content_preservation_score": 8,
  "seo_improvement_score": 7, 
  "tone_consistency_score": 9,
  "overall_quality_score": 8,
  "issues": ["Missing UK location context"],
  "recommendations": ["Add 'UK' to make it more local"],
  "ai_comment": "Good mom-n-pop tone but needs local SEO"
}

Focus on:
- Content preservation (keeps key info?)
- SEO improvement (includes "hublot watch repairs"?)
- Tone consistency (mom-n-pop style?)
- Overall quality (better written?)`;

  try {
    const response = await fetch(WORKER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt_type: 'content',
        model: 'gpt-4o',
        profile: {
          tone: 'mom-n-pop',
          business_type: 'watch_repair',
          location: 'UK'
        },
        directive: {
          tone: 'mom-n-pop',
          focus: 'quality_analysis'
        },
        content_map: {
          route: `analysis-${blockId}`,
          blocks: [{
            id: blockId,
            text: analysisPrompt,
            optimized_text: "Please analyze the above optimization quality."
          }]
        },
        cache_bust: Date.now(),
        no_cache: true
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    
    if (result.error) {
      throw new Error(result.error);
    }

    // Parse AI response
    let aiAnalysis;
    try {
      aiAnalysis = JSON.parse(result.result);
    } catch (parseError) {
      console.log(`⚠️  Block ${blockId}: Failed to parse AI response, using fallback`);
      aiAnalysis = {
        content_preservation_score: 5,
        seo_improvement_score: 5,
        tone_consistency_score: 5,
        overall_quality_score: 5,
        issues: ["AI response parsing failed"],
        recommendations: ["Check AI response format"],
        ai_comment: "Analysis failed - using fallback scores"
      };
    }

    // Add pass/fail status based on thresholds
    aiAnalysis.pass = aiAnalysis.overall_quality_score >= THRESHOLDS.overall_quality;
    aiAnalysis.block_id = blockId;

    return aiAnalysis;

  } catch (error) {
    console.log(`❌ Block ${blockId}: AI analysis failed - ${error.message}`);
    return {
      content_preservation_score: 5,
      seo_improvement_score: 5,
      tone_consistency_score: 5,
      overall_quality_score: 5,
      issues: [`AI analysis failed: ${error.message}`],
      recommendations: ["Retry AI analysis"],
      ai_comment: "Analysis failed due to technical error",
      pass: false,
      block_id: blockId
    };
  }
}

async function analyzeAIOptimizationWithAI() {
  console.log('📄 Loading existing AI optimization results...');
  
  // Load the cached AI results
  const cachePath = path.join(__dirname, '.nimbus', 'work', 'brand-demo', 'cache', `${TEST_PAGE}-tier-3.json`);
  
  if (!fs.existsSync(cachePath)) {
    console.log('❌ Cached results not found. Run optimization first.');
    return;
  }
  
  const aiResults = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
  const optimizedBlocks = aiResults.result.blocks;
  
  console.log(`✅ Loaded ${optimizedBlocks.length} optimized blocks`);
  
  // Load original content for comparison
  const batchPath = path.join(__dirname, '.nimbus', 'work', 'brand-demo', 'batch.json');
  const batchData = JSON.parse(fs.readFileSync(batchPath, 'utf8'));
  const hublotPage = batchData.pages.find(p => p.page_id === TEST_PAGE);
  const originalBlocks = hublotPage.content_map.blocks;
  
  console.log(`✅ Loaded ${originalBlocks.length} original blocks for comparison`);
  
  // Analyze each optimized block with AI
  console.log('\n🤖 ANALYZING OPTIMIZATION QUALITY WITH AI...');
  console.log('='.repeat(60));
  
  let totalPassed = 0;
  let totalFailed = 0;
  let averageScores = {
    content_preservation: 0,
    seo_improvement: 0,
    tone_consistency: 0,
    overall_quality: 0
  };
  
  const allIssues = [];
  const allRecommendations = [];
  
  // Process blocks in batches to avoid overwhelming the AI
  const BATCH_SIZE = 5;
  const updatedBlocks = [];
  
  for (let i = 0; i < optimizedBlocks.length; i += BATCH_SIZE) {
    const batch = optimizedBlocks.slice(i, i + BATCH_SIZE);
    console.log(`\n📊 Analyzing blocks ${i + 1}-${Math.min(i + BATCH_SIZE, optimizedBlocks.length)}...`);
    
    const batchPromises = batch.map(async (optimized) => {
      const original = originalBlocks.find(b => b.id === optimized.id);
      
      if (!original) {
        console.log(`⚠️  Block ${optimized.id}: No original content found`);
        return {
          ...optimized,
          ai_analysis: {
            content_preservation_score: 5,
            seo_improvement_score: 5,
            tone_consistency_score: 5,
            overall_quality_score: 5,
            issues: ["No original content found for comparison"],
            recommendations: ["Check content mapping"],
            ai_comment: "Cannot analyze without original content",
            pass: false,
            block_id: optimized.id
          }
        };
      }
      
      const originalText = original.text || original.anchor || '';
      const optimizedText = optimized.optimized_text || '';
      
      // Skip very short blocks
      if (originalText.length < 10 || optimizedText.length < 10) {
        console.log(`⏭️  Block ${optimized.id}: Skipping short block`);
        return {
          ...optimized,
          ai_analysis: {
            content_preservation_score: 5,
            seo_improvement_score: 5,
            tone_consistency_score: 5,
            overall_quality_score: 5,
            issues: ["Block too short for meaningful analysis"],
            recommendations: ["Consider combining with other content"],
            ai_comment: "Short block - minimal analysis possible",
            pass: false,
            block_id: optimized.id
          }
        };
      }
      
      const aiAnalysis = await analyzeBlockWithAI(originalText, optimizedText, optimized.id);
      
      // Update counters
      if (aiAnalysis.pass) {
        totalPassed++;
      } else {
        totalFailed++;
      }
      
      // Collect issues and recommendations
      allIssues.push(...aiAnalysis.issues);
      allRecommendations.push(...aiAnalysis.recommendations);
      
      // Add to averages
      averageScores.content_preservation += aiAnalysis.content_preservation_score;
      averageScores.seo_improvement += aiAnalysis.seo_improvement_score;
      averageScores.tone_consistency += aiAnalysis.tone_consistency_score;
      averageScores.overall_quality += aiAnalysis.overall_quality_score;
      
      return {
        ...optimized,
        ai_analysis: aiAnalysis
      };
    });
    
    const batchResults = await Promise.all(batchPromises);
    updatedBlocks.push(...batchResults);
    
    // Small delay between batches
    if (i + BATCH_SIZE < optimizedBlocks.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  // Calculate final averages
  const totalBlocks = updatedBlocks.length;
  averageScores.content_preservation /= totalBlocks;
  averageScores.seo_improvement /= totalBlocks;
  averageScores.tone_consistency /= totalBlocks;
  averageScores.overall_quality /= totalBlocks;
  
  // Display results
  console.log('\n📊 AI-POWERED QUALITY ANALYSIS REPORT');
  console.log('='.repeat(50));
  console.log(`\nOVERALL RESULTS:`);
  console.log(`- Total Blocks Analyzed: ${totalBlocks}`);
  console.log(`- Passed (≥${THRESHOLDS.overall_quality}/10): ${totalPassed} (${((totalPassed/totalBlocks)*100).toFixed(1)}%)`);
  console.log(`- Failed (<${THRESHOLDS.overall_quality}/10): ${totalFailed} (${((totalFailed/totalBlocks)*100).toFixed(1)}%)`);
  
  console.log('\n📈 AVERAGE SCORES:');
  console.log(`- Content Preservation: ${averageScores.content_preservation.toFixed(1)}/10`);
  console.log(`- SEO Improvements: ${averageScores.seo_improvement.toFixed(1)}/10`);
  console.log(`- Tone Consistency: ${averageScores.tone_consistency.toFixed(1)}/10`);
  console.log(`- Overall Quality: ${averageScores.overall_quality.toFixed(1)}/10`);
  
  // Most common issues
  const issueCounts = {};
  allIssues.forEach(issue => {
    issueCounts[issue] = (issueCounts[issue] || 0) + 1;
  });
  
  const topIssues = Object.entries(issueCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5);
  
  if (topIssues.length > 0) {
    console.log('\n❌ TOP ISSUES:');
    topIssues.forEach(([issue, count]) => {
      console.log(`- ${issue}: ${count} blocks`);
    });
  }
  
  // Most common recommendations
  const recCounts = {};
  allRecommendations.forEach(rec => {
    recCounts[rec] = (recCounts[rec] || 0) + 1;
  });
  
  const topRecommendations = Object.entries(recCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5);
  
  if (topRecommendations.length > 0) {
    console.log('\n📝 TOP RECOMMENDATIONS:');
    topRecommendations.forEach(([rec, count]) => {
      console.log(`- ${rec}: ${count} blocks`);
    });
  }
  
  // Quality assessment
  let qualityLevel = '';
  if (averageScores.overall_quality >= 8.0) qualityLevel = 'EXCELLENT';
  else if (averageScores.overall_quality >= 7.0) qualityLevel = 'GOOD';
  else if (averageScores.overall_quality >= 6.0) qualityLevel = 'ACCEPTABLE';
  else qualityLevel = 'NEEDS IMPROVEMENT';
  
  console.log(`\n🎯 QUALITY ASSESSMENT: ${qualityLevel}`);
  
  // Save updated results with AI analysis
  const updatedResults = {
    ...aiResults,
    result: {
      ...aiResults.result,
      blocks: updatedBlocks
    },
    ai_analysis_summary: {
      timestamp: new Date().toISOString(),
      test_page: TEST_PAGE,
      test_tone: TEST_TONE,
      total_blocks: totalBlocks,
      passed_blocks: totalPassed,
      failed_blocks: totalFailed,
      pass_rate: ((totalPassed/totalBlocks)*100).toFixed(1) + '%',
      average_scores: averageScores,
      quality_level: qualityLevel,
      top_issues: topIssues,
      top_recommendations: topRecommendations
    }
  };
  
  fs.writeFileSync(
    path.join(__dirname, '.nimbus', 'work', 'brand-demo', 'cache', `${TEST_PAGE}-tier-3-with-ai-analysis.json`),
    JSON.stringify(updatedResults, null, 2)
  );
  
  console.log('\n💾 Updated results with AI analysis saved to cache');
  console.log('\n✅ AI-POWERED QUALITY ANALYSIS COMPLETE');
  
  return updatedResults;
}

// Run the analysis
analyzeAIOptimizationWithAI().catch(console.error);
