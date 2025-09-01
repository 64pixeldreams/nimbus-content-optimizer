const fs = require('fs');
const path = require('path');

console.log('🤖 SIMPLE AI-POWERED QUALITY ANALYZER\n');

// Test configuration
const TEST_PAGE = 'hublot-watch-repair';
const TEST_TONE = 'mom-n-pop';

// Quality thresholds
const THRESHOLDS = {
  content_preservation: 7.0,
  seo_improvement: 7.0,
  tone_consistency: 7.0,
  overall_quality: 7.0
};

function analyzeBlockLocally(originalText, optimizedText, blockId) {
  // Simple but intelligent local analysis
  let contentScore = 5; // Base score
  let seoScore = 5;
  let toneScore = 5;
  let technicalScore = 5;
  
  const issues = [];
  const recommendations = [];
  
  // 1. Content Preservation Analysis
  const lengthRatio = optimizedText.length / originalText.length;
  
  if (lengthRatio < 0.5) {
    issues.push('Too much content removed');
    contentScore -= 2;
  } else if (lengthRatio > 3) {
    issues.push('Too verbose');
    contentScore -= 1;
  } else if (lengthRatio >= 1.5 && lengthRatio <= 2.5) {
    contentScore += 1; // Good expansion
  }
  
  // Check key information retention
  const keyInfo = ['hublot', 'watch', 'repair', '0800', 'guarantee', 'uk'];
  const originalInfo = keyInfo.filter(info => originalText.toLowerCase().includes(info));
  const optimizedInfo = keyInfo.filter(info => optimizedText.toLowerCase().includes(info));
  
  if (originalInfo.length > 0) {
    const infoRetention = optimizedInfo.length / originalInfo.length;
    if (infoRetention < 0.7) {
      issues.push('Key information lost');
      contentScore -= 1;
    } else if (infoRetention >= 0.9) {
      contentScore += 1;
    }
  }
  
  // 2. SEO Improvements Analysis
  // Check for exact phrase "hublot watch repairs"
  if (optimizedText.toLowerCase().includes('hublot watch repairs')) {
    seoScore += 2; // Big bonus for exact phrase
  } else {
    // Check for partial matches
    const seoWords = ['hublot', 'watch', 'repair', 'repairs'];
    const seoWordCount = seoWords.filter(word => 
      optimizedText.toLowerCase().includes(word)
    ).length;
    
    if (seoWordCount >= 3) {
      seoScore += 1;
    } else if (seoWordCount >= 2) {
      seoScore += 0.5;
    } else {
      issues.push('Missing SEO phrase "hublot watch repairs"');
      seoScore -= 1;
    }
  }
  
  // Local SEO check
  if (optimizedText.toLowerCase().includes('uk') || optimizedText.toLowerCase().includes('britain')) {
    seoScore += 1;
  } else {
    issues.push('Missing UK location context');
    seoScore -= 0.5;
  }
  
  // Trust signals check
  const trustWords = ['guarantee', 'expert', 'professional', 'trusted', 'reviews', 'specialist'];
  const hasTrustSignals = trustWords.some(word => optimizedText.toLowerCase().includes(word));
  if (hasTrustSignals) {
    seoScore += 1;
  }
  
  // 3. Tone Consistency Analysis
  const momPopWords = ['family', 'trust', 'care', 'expert', 'friendly', 'help', 'we', 'our', 'genuine', 'personal', 'love', 'cherished'];
  const toneWords = momPopWords.filter(word => optimizedText.toLowerCase().includes(word));
  
  if (toneWords.length >= 3) {
    toneScore += 2;
  } else if (toneWords.length >= 2) {
    toneScore += 1;
  } else if (toneWords.length >= 1) {
    toneScore += 0.5;
  } else {
    issues.push('Missing mom-n-pop tone');
    toneScore -= 1;
  }
  
  // Emotional appeal check
  const emotionalWords = ['cherished', 'passion', 'care', 'love', 'perfect', 'beautiful', 'genuine'];
  const hasEmotionalAppeal = emotionalWords.some(word => optimizedText.toLowerCase().includes(word));
  if (hasEmotionalAppeal) {
    toneScore += 1;
  }
  
  // 4. Technical Quality Analysis
  // Grammar and readability check
  const sentenceCount = (optimizedText.match(/[.!?]+/g) || []).length;
  const wordCount = optimizedText.split(/\s+/).length;
  
  if (sentenceCount > 0) {
    const avgSentenceLength = wordCount / sentenceCount;
    
    if (avgSentenceLength > 25) {
      issues.push('Sentences too long');
      technicalScore -= 0.5;
    } else if (avgSentenceLength < 5) {
      issues.push('Sentences too short');
      technicalScore -= 0.5;
    } else {
      technicalScore += 0.5;
    }
  }
  
  // Call-to-action clarity
  const ctaWords = ['click', 'call', 'contact', 'start', 'get', 'try', 'visit'];
  const hasCTA = ctaWords.some(word => optimizedText.toLowerCase().includes(word));
  if (hasCTA) {
    technicalScore += 0.5;
  }
  
  // Professional language check
  const professionalWords = ['expert', 'professional', 'specialist', 'guarantee', 'service'];
  const hasProfessionalLanguage = professionalWords.some(word => optimizedText.toLowerCase().includes(word));
  if (hasProfessionalLanguage) {
    technicalScore += 0.5;
  }
  
  // Calculate overall score
  const overallScore = (contentScore * 0.3) + (seoScore * 0.3) + (toneScore * 0.2) + (technicalScore * 0.2);
  
  // Generate AI-like comment
  let aiComment = '';
  if (overallScore >= 8) {
    aiComment = 'Excellent optimization with strong SEO and tone consistency';
  } else if (overallScore >= 7) {
    aiComment = 'Good optimization with room for minor improvements';
  } else if (overallScore >= 6) {
    aiComment = 'Acceptable optimization but needs enhancement';
  } else {
    aiComment = 'Needs significant improvement in multiple areas';
  }
  
  // Generate recommendations
  if (issues.includes('Missing UK location context')) {
    recommendations.push('Add UK location mentions for local SEO');
  }
  if (issues.includes('Missing mom-n-pop tone')) {
    recommendations.push('Include more family/trust language');
  }
  if (issues.includes('Missing SEO phrase "hublot watch repairs"')) {
    recommendations.push('Include the exact phrase "hublot watch repairs"');
  }
  if (issues.includes('Too verbose')) {
    recommendations.push('Consider shortening the content');
  }
  if (issues.includes('Key information lost')) {
    recommendations.push('Preserve more key information from original');
  }
  
  return {
    content_preservation_score: Math.round(contentScore * 10) / 10,
    seo_improvement_score: Math.round(seoScore * 10) / 10,
    tone_consistency_score: Math.round(toneScore * 10) / 10,
    overall_quality_score: Math.round(overallScore * 10) / 10,
    issues: issues,
    recommendations: recommendations,
    ai_comment: aiComment,
    pass: overallScore >= THRESHOLDS.overall_quality,
    block_id: blockId
  };
}

async function analyzeAIOptimizationLocally() {
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
  
  // Analyze each optimized block
  console.log('\n🤖 ANALYZING OPTIMIZATION QUALITY LOCALLY...');
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
  const updatedBlocks = [];
  
  optimizedBlocks.forEach((optimized, index) => {
    const original = originalBlocks.find(b => b.id === optimized.id);
    
    if (!original) {
      console.log(`⚠️  Block ${optimized.id}: No original content found`);
      const fallbackAnalysis = {
        content_preservation_score: 5,
        seo_improvement_score: 5,
        tone_consistency_score: 5,
        overall_quality_score: 5,
        issues: ['No original content found for comparison'],
        recommendations: ['Check content mapping'],
        ai_comment: 'Cannot analyze without original content',
        pass: false,
        block_id: optimized.id
      };
      
      updatedBlocks.push({
        ...optimized,
        ai_analysis: fallbackAnalysis
      });
      return;
    }
    
    const originalText = original.text || original.anchor || '';
    const optimizedText = optimized.optimized_text || '';
    
    // Skip very short blocks
    if (originalText.length < 10 || optimizedText.length < 10) {
      console.log(`⏭️  Block ${optimized.id}: Skipping short block`);
      const shortBlockAnalysis = {
        content_preservation_score: 5,
        seo_improvement_score: 5,
        tone_consistency_score: 5,
        overall_quality_score: 5,
        issues: ['Block too short for meaningful analysis'],
        recommendations: ['Consider combining with other content'],
        ai_comment: 'Short block - minimal analysis possible',
        pass: false,
        block_id: optimized.id
      };
      
      updatedBlocks.push({
        ...optimized,
        ai_analysis: shortBlockAnalysis
      });
      return;
    }
    
    const aiAnalysis = analyzeBlockLocally(originalText, optimizedText, optimized.id);
    
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
    
    updatedBlocks.push({
      ...optimized,
      ai_analysis: aiAnalysis
    });
    
    // Show progress for first few blocks
    if (index < 5) {
      console.log(`📊 Block ${optimized.id}: ${aiAnalysis.overall_quality_score}/10 ${aiAnalysis.pass ? '✅ PASS' : '❌ FAIL'} - ${aiAnalysis.ai_comment}`);
    }
  });
  
  // Calculate final averages
  const totalBlocks = updatedBlocks.length;
  averageScores.content_preservation /= totalBlocks;
  averageScores.seo_improvement /= totalBlocks;
  averageScores.tone_consistency /= totalBlocks;
  averageScores.overall_quality /= totalBlocks;
  
  // Display results
  console.log('\n📊 LOCAL AI QUALITY ANALYSIS REPORT');
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
    path.join(__dirname, '.nimbus', 'work', 'brand-demo', 'cache', `${TEST_PAGE}-tier-3-with-local-analysis.json`),
    JSON.stringify(updatedResults, null, 2)
  );
  
  console.log('\n💾 Updated results with local AI analysis saved to cache');
  console.log('\n✅ LOCAL AI QUALITY ANALYSIS COMPLETE');
  
  return updatedResults;
}

// Run the analysis
analyzeAIOptimizationLocally().catch(console.error);
