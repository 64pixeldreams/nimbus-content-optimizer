const fs = require('fs');
const path = require('path');

console.log('🔍 AI OPTIMIZATION QUALITY ANALYZER\n');

// Test configuration
const TEST_PAGE = 'hublot-watch-repair';
const TEST_TONE = 'mom-n-pop';

async function analyzeAIOptimization() {
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
  console.log('\n🔍 ANALYZING OPTIMIZATION QUALITY...');
  console.log('='.repeat(60));
  
  let totalScore = 0;
  let contentPreservationScore = 0;
  let seoImprovementScore = 0;
  let toneConsistencyScore = 0;
  let technicalQualityScore = 0;
  
  let issues = [];
  let strengths = [];
  
  const analysisResults = [];
  
  optimizedBlocks.forEach((optimized, index) => {
    const original = originalBlocks.find(b => b.id === optimized.id);
    
    if (!original) {
      issues.push(`Block ${optimized.id}: No original content found for comparison`);
      return;
    }
    
    const originalText = original.text || original.anchor || '';
    const optimizedText = optimized.optimized_text || '';
    
    // 1. Content Preservation Analysis (30%)
    const lengthRatio = optimizedText.length / originalText.length;
    let contentScore = 5; // Base score
    
    if (lengthRatio < 0.5) {
      issues.push(`Block ${optimized.id}: Too much content removed (${Math.round(lengthRatio * 100)}%)`);
      contentScore -= 2;
    } else if (lengthRatio > 2) {
      issues.push(`Block ${optimized.id}: Too verbose (${Math.round(lengthRatio * 100)}% of original)`);
      contentScore -= 1;
    } else {
      contentScore += 1;
    }
    
    // Check key information retention
    const keyInfo = ['hublot', 'watch', 'repair', '0800', 'guarantee', 'uk'];
    const originalInfo = keyInfo.filter(info => originalText.toLowerCase().includes(info));
    const optimizedInfo = keyInfo.filter(info => optimizedText.toLowerCase().includes(info));
    const infoRetention = optimizedInfo.length / originalInfo.length;
    
    if (infoRetention < 0.7) {
      issues.push(`Block ${optimized.id}: Key information lost (${Math.round(infoRetention * 100)}% retained)`);
      contentScore -= 1;
    } else {
      contentScore += 1;
    }
    
    // 2. SEO Improvements Analysis (30%)
    let seoScore = 5; // Base score
    
    // Primary SEO phrase check - "hublot watch repairs"
    const primarySEOPhrase = 'hublot watch repairs';
    const hasPrimarySEO = optimizedText.toLowerCase().includes(primarySEOPhrase);
    
    if (hasPrimarySEO) {
      seoScore += 2; // Big bonus for exact phrase match
    } else {
      // Check for partial matches
      const seoWords = ['hublot', 'watch', 'repair', 'repairs'];
      const seoWordCount = seoWords.filter(word => 
        optimizedText.toLowerCase().includes(word)
      ).length;
      
      if (seoWordCount >= 3) {
        seoScore += 1; // Good if most words present
      } else if (seoWordCount >= 2) {
        seoScore += 0.5; // Partial credit
      } else {
        issues.push(`Block ${optimized.id}: Missing SEO phrase "hublot watch repairs"`);
        seoScore -= 1;
      }
    }
    
    // Local SEO check
    if (optimizedText.toLowerCase().includes('uk') || optimizedText.toLowerCase().includes('britain')) {
      seoScore += 1;
    } else {
      issues.push(`Block ${optimized.id}: Missing UK location context`);
      seoScore -= 0.5;
    }
    
    // Trust signals check
    const trustWords = ['guarantee', 'expert', 'professional', 'trusted', 'reviews'];
    const hasTrustSignals = trustWords.some(word => optimizedText.toLowerCase().includes(word));
    if (hasTrustSignals) {
      seoScore += 1;
    }
    
    // 3. Tone Consistency Analysis (20%)
    let toneScore = 5; // Base score
    
    const momPopWords = ['family', 'trust', 'care', 'expert', 'friendly', 'help', 'we', 'our', 'genuine', 'personal'];
    const toneWords = momPopWords.filter(word => optimizedText.toLowerCase().includes(word));
    
    if (toneWords.length >= 2) {
      toneScore += 2;
    } else if (toneWords.length >= 1) {
      toneScore += 1;
    } else {
      issues.push(`Block ${optimized.id}: Missing mom-n-pop tone`);
      toneScore -= 1;
    }
    
    // Emotional appeal check
    const emotionalWords = ['cherished', 'passion', 'care', 'love', 'perfect', 'beautiful'];
    const hasEmotionalAppeal = emotionalWords.some(word => optimizedText.toLowerCase().includes(word));
    if (hasEmotionalAppeal) {
      toneScore += 1;
    }
    
    // 4. Technical Quality Analysis (20%)
    let technicalScore = 5; // Base score
    
    // Grammar check (basic)
    const sentenceCount = (optimizedText.match(/[.!?]+/g) || []).length;
    const wordCount = optimizedText.split(/\s+/).length;
    const avgSentenceLength = wordCount / sentenceCount;
    
    if (avgSentenceLength > 25) {
      issues.push(`Block ${optimized.id}: Sentences too long (${Math.round(avgSentenceLength)} words avg)`);
      technicalScore -= 0.5;
    } else if (avgSentenceLength < 5) {
      issues.push(`Block ${optimized.id}: Sentences too short (${Math.round(avgSentenceLength)} words avg)`);
      technicalScore -= 0.5;
    } else {
      technicalScore += 0.5;
    }
    
    // Call-to-action clarity
    const ctaWords = ['click', 'call', 'contact', 'start', 'get', 'try'];
    const hasCTA = ctaWords.some(word => optimizedText.toLowerCase().includes(word));
    if (hasCTA) {
      technicalScore += 0.5;
    }
    
    // Calculate block score
    const blockScore = (contentScore * 0.3) + (seoScore * 0.3) + (toneScore * 0.2) + (technicalScore * 0.2);
    
    contentPreservationScore += contentScore;
    seoImprovementScore += seoScore;
    toneConsistencyScore += toneScore;
    technicalQualityScore += technicalScore;
    totalScore += blockScore;
    
    analysisResults.push({
      id: optimized.id,
      original_text: originalText.substring(0, 100) + '...',
      optimized_text: optimizedText.substring(0, 100) + '...',
      length_ratio: lengthRatio,
      content_score: contentScore,
      seo_score: seoScore,
      tone_score: toneScore,
      technical_score: technicalScore,
      block_score: blockScore,
      issues: []
    });
  });
  
  // Calculate average scores
  const avgContentScore = contentPreservationScore / optimizedBlocks.length;
  const avgSeoScore = seoImprovementScore / optimizedBlocks.length;
  const avgToneScore = toneConsistencyScore / optimizedBlocks.length;
  const avgTechnicalScore = technicalQualityScore / optimizedBlocks.length;
  const overallScore = totalScore / optimizedBlocks.length;
  
  // Generate strengths
  if (avgContentScore > 7) strengths.push('Excellent content preservation');
  if (avgSeoScore > 7) strengths.push('Strong SEO optimization');
  if (avgToneScore > 7) strengths.push('Perfect mom-n-pop tone implementation');
  if (avgTechnicalScore > 7) strengths.push('High technical quality');
  
  // Generate recommendations
  const recommendations = [];
  if (issues.filter(i => i.includes('verbose')).length > 0) {
    recommendations.push('Consider shortening verbose blocks');
  }
  if (issues.filter(i => i.includes('UK location')).length > 0) {
    recommendations.push('Add more UK location mentions');
  }
  if (issues.filter(i => i.includes('tone')).length > 0) {
    recommendations.push('Enhance mom-n-pop tone consistency');
  }
  
  // Display results
  console.log('\n📊 AI OPTIMIZATION QUALITY REPORT');
  console.log('='.repeat(50));
  console.log(`\nOVERALL SCORE: ${overallScore.toFixed(1)}/10`);
  
  console.log('\n📈 SCORE BREAKDOWN:');
  console.log(`- Content Preservation: ${avgContentScore.toFixed(1)}/10`);
  console.log(`- SEO Improvements: ${avgSeoScore.toFixed(1)}/10`);
  console.log(`- Tone Consistency: ${avgToneScore.toFixed(1)}/10`);
  console.log(`- Technical Quality: ${avgTechnicalScore.toFixed(1)}/10`);
  
  if (strengths.length > 0) {
    console.log('\n✅ STRENGTHS:');
    strengths.forEach(strength => console.log(`- ${strength}`));
  }
  
  if (issues.length > 0) {
    console.log('\n❌ ISSUES FOUND:');
    issues.slice(0, 10).forEach(issue => console.log(`- ${issue}`));
    if (issues.length > 10) {
      console.log(`- ... and ${issues.length - 10} more issues`);
    }
  }
  
  if (recommendations.length > 0) {
    console.log('\n📝 RECOMMENDATIONS:');
    recommendations.forEach(rec => console.log(`- ${rec}`));
  }
  
  // Quality assessment
  let qualityLevel = '';
  if (overallScore >= 8.0) qualityLevel = 'EXCELLENT';
  else if (overallScore >= 7.0) qualityLevel = 'GOOD';
  else if (overallScore >= 6.0) qualityLevel = 'ACCEPTABLE';
  else qualityLevel = 'NEEDS IMPROVEMENT';
  
  console.log(`\n🎯 QUALITY ASSESSMENT: ${qualityLevel}`);
  
  // Save detailed results
  const detailedResults = {
    timestamp: new Date().toISOString(),
    test_page: TEST_PAGE,
    test_tone: TEST_TONE,
    overall_score: overallScore,
    quality_level: qualityLevel,
    score_breakdown: {
      content_preservation: avgContentScore,
      seo_improvements: avgSeoScore,
      tone_consistency: avgToneScore,
      technical_quality: avgTechnicalScore
    },
    strengths: strengths,
    issues: issues,
    recommendations: recommendations,
    block_analysis: analysisResults,
    summary: {
      total_blocks_analyzed: optimizedBlocks.length,
      blocks_with_issues: issues.length,
      average_block_score: overallScore
    }
  };
  
  fs.writeFileSync(
    path.join(__dirname, '.nimbus', 'ai-quality-analysis.json'),
    JSON.stringify(detailedResults, null, 2)
  );
  
  console.log('\n💾 Detailed results saved to .nimbus/ai-quality-analysis.json');
  console.log('\n✅ AI QUALITY ANALYSIS COMPLETE');
  
  return detailedResults;
}

// Run the analysis
analyzeAIOptimization().catch(console.error);
