// CTA Jumbo Test: Ultra-Fast Above-the-Fold Conversion Element Testing
// Lightning-fast 3-5s testing for above-the-fold CTAs and conversion elements

const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const cheerio = require('cheerio');

const ctaJumboTest = {
  async run(options) {
    const startTime = Date.now();
    console.log(chalk.blue('🚀 CTA JUMBO TEST - Ultra-Fast Above-the-Fold Testing'));
    
    const { batch, pages, limit = 5 } = options;
    
    if (!batch) {
      throw new Error('--batch option is required');
    }
    
    // Load batch data
    const batchData = await this.loadBatchData(batch);
    console.log(chalk.green(`📊 Loaded batch: ${batchData.batch_id}`));
    
    // Filter to specific pages or limit for speed
    let pagesToTest = batchData.pages.slice(0, parseInt(limit));
    if (pages) {
      const requestedIds = pages.split(',').map(id => id.trim());
      pagesToTest = batchData.pages.filter(page => requestedIds.includes(page.page_id));
    }
    
    console.log(chalk.yellow(`⚡ Testing ${pagesToTest.length} pages for above-the-fold CTA optimization`));
    
    // Create test results directory
    const testDir = `.nimbus/work/${batch}/cta-jumbo-test`;
    await fs.ensureDir(testDir);
    
    const testResults = [];
    
    // Ultra-fast CTA analysis for each page
    for (let i = 0; i < pagesToTest.length; i++) {
      const page = pagesToTest[i];
      const pageStartTime = Date.now();
      
      console.log(chalk.cyan(`🎯 ${i + 1}/${pagesToTest.length}: ${page.page_id}`));
      
      try {
        // Load content map for CTA analysis
        const contentMap = await this.loadContentMap(batch, page.page_id);
        
        // Analyze above-the-fold CTAs
        const ctaAnalysis = await this.analyzeAboveFoldCTAs(contentMap, batchData.profile);
        
        // Generate CTA recommendations
        const recommendations = this.generateCTARecommendations(ctaAnalysis, page);
        
        const pageTime = Date.now() - pageStartTime;
        console.log(chalk.green(`   ✅ Analyzed in ${pageTime}ms - ${ctaAnalysis.cta_count} CTAs found`));
        
        testResults.push({
          page_id: page.page_id,
          cta_analysis: ctaAnalysis,
          recommendations: recommendations,
          test_time_ms: pageTime,
          success: true
        });
        
      } catch (error) {
        console.log(chalk.red(`   ❌ Failed: ${error.message}`));
        testResults.push({
          page_id: page.page_id,
          error: error.message,
          success: false
        });
      }
    }
    
    // Generate ultra-fast summary report
    const summaryPath = await this.generateJumboSummary(testDir, testResults, batchData);
    
    const totalTime = Date.now() - startTime;
    const avgTimePerPage = Math.round(totalTime / pagesToTest.length);
    
    console.log(chalk.green(`\n🎉 CTA JUMBO TEST COMPLETE!`));
    console.log(chalk.blue(`⚡ Total time: ${totalTime}ms (${avgTimePerPage}ms avg/page)`));
    console.log(chalk.cyan(`📊 Summary report: ${summaryPath}`));
    
    // Auto-open summary if under 5 seconds (ultra-fast goal achieved)
    if (totalTime < 5000) {
      console.log(chalk.green(`🚀 ULTRA-FAST GOAL ACHIEVED! (${totalTime}ms < 5000ms)`));
      await this.openSummary(summaryPath);
    }
    
    return {
      success: true,
      test_time_ms: totalTime,
      avg_time_per_page: avgTimePerPage,
      pages_tested: pagesToTest.length,
      successful_tests: testResults.filter(r => r.success).length,
      summary_path: summaryPath,
      ultra_fast_achieved: totalTime < 5000
    };
  },
  
  async loadBatchData(batchId) {
    const batchPath = `.nimbus/work/${batchId}/batch.json`;
    if (!(await fs.pathExists(batchPath))) {
      throw new Error(`Batch not found: ${batchPath}`);
    }
    return await fs.readJson(batchPath);
  },
  
  async loadContentMap(batchId, pageId) {
    // Try to load from existing proposals first
    const proposalPath = `.nimbus/work/${batchId}/proposals/${pageId}.json`;
    if (await fs.pathExists(proposalPath)) {
      const proposal = await fs.readJson(proposalPath);
      return proposal.request?.content_map || proposal.content_map;
    }
    
    // Fallback to scanning if no proposal exists
    throw new Error(`Content map not found for ${pageId}. Run nimbus:propose first.`);
  },
  
  async analyzeAboveFoldCTAs(contentMap, profile) {
    const analysis = {
      cta_count: 0,
      above_fold_ctas: [],
      cta_types: {},
      conversion_score: 0,
      issues: [],
      opportunities: []
    };
    
    if (!contentMap || !contentMap.blocks) {
      analysis.issues.push('No content blocks found');
      return analysis;
    }
    
    // Analyze blocks for above-the-fold CTAs (first 3-5 blocks typically above fold)
    const aboveFoldBlocks = contentMap.blocks.slice(0, 8); // Generous above-fold estimate
    
    aboveFoldBlocks.forEach((block, index) => {
      if (block.type === 'a' && block.href) {
        analysis.cta_count++;
        
        const ctaData = {
          position: index + 1,
          anchor: block.anchor || block.text,
          href: block.href,
          selector: block.selector,
          cta_type: this.classifyCTAType(block, profile),
          urgency_score: this.calculateUrgencyScore(block.anchor || block.text),
          conversion_potential: this.assessConversionPotential(block, profile)
        };
        
        analysis.above_fold_ctas.push(ctaData);
        
        // Count CTA types
        const type = ctaData.cta_type;
        analysis.cta_types[type] = (analysis.cta_types[type] || 0) + 1;
      }
    });
    
    // Calculate overall conversion score
    analysis.conversion_score = this.calculateConversionScore(analysis.above_fold_ctas);
    
    // Identify issues and opportunities
    this.identifyIssuesAndOpportunities(analysis, profile);
    
    return analysis;
  },
  
  classifyCTAType(block, profile) {
    const href = block.href?.toLowerCase() || '';
    const anchor = (block.anchor || block.text || '').toLowerCase();
    
    // Money pages (highest priority)
    if (profile.money_pages && profile.money_pages.some(page => href.includes(page.toLowerCase()))) {
      return 'money-page';
    }
    
    // Contact CTAs
    if (href.includes('tel:') || href.includes('mailto:') || 
        anchor.includes('call') || anchor.includes('phone') || anchor.includes('email')) {
      return 'contact';
    }
    
    // Quote/booking CTAs
    if (href.includes('quote') || href.includes('book') || href.includes('start') ||
        anchor.includes('quote') || anchor.includes('book') || anchor.includes('start')) {
      return 'quote';
    }
    
    // Service CTAs
    if (href.includes('service') || href.includes('repair') || 
        anchor.includes('service') || anchor.includes('repair')) {
      return 'service';
    }
    
    return 'general';
  },
  
  calculateUrgencyScore(anchor) {
    if (!anchor) return 0;
    
    const urgencyWords = [
      'now', 'today', 'urgent', 'immediate', 'fast', 'quick', 'instant',
      'limited', 'offer', 'free', 'save', 'discount', '24/7', 'emergency'
    ];
    
    const text = anchor.toLowerCase();
    let score = 0;
    
    urgencyWords.forEach(word => {
      if (text.includes(word)) score += 10;
    });
    
    // Bonus for ALL CAPS
    if (anchor === anchor.toUpperCase() && anchor.length > 3) {
      score += 15;
    }
    
    // Bonus for action words
    const actionWords = ['get', 'start', 'book', 'call', 'click', 'submit'];
    actionWords.forEach(word => {
      if (text.includes(word)) score += 5;
    });
    
    return Math.min(score, 100); // Cap at 100
  },
  
  assessConversionPotential(block, profile) {
    let potential = 50; // Base score
    
    const anchor = (block.anchor || block.text || '').toLowerCase();
    const href = block.href?.toLowerCase() || '';
    
    // High conversion indicators
    if (anchor.includes('free') || anchor.includes('guarantee')) potential += 20;
    if (anchor.includes('quote') || anchor.includes('book')) potential += 15;
    if (href.includes('tel:') || href.includes('mailto:')) potential += 25;
    
    // Money page bonus
    if (profile.money_pages && profile.money_pages.some(page => href.includes(page.toLowerCase()))) {
      potential += 30;
    }
    
    // Length penalty (too long reduces conversion)
    if (anchor.length > 40) potential -= 10;
    if (anchor.length > 60) potential -= 20;
    
    return Math.max(0, Math.min(potential, 100));
  },
  
  calculateConversionScore(ctas) {
    if (ctas.length === 0) return 0;
    
    let totalScore = 0;
    let weightedTotal = 0;
    
    ctas.forEach((cta, index) => {
      // Position weight (earlier = more important)
      const positionWeight = Math.max(1, 6 - index); // First CTA gets weight 6, second gets 5, etc.
      
      const ctaScore = (cta.urgency_score + cta.conversion_potential) / 2;
      totalScore += ctaScore * positionWeight;
      weightedTotal += positionWeight;
    });
    
    return Math.round(totalScore / weightedTotal);
  },
  
  identifyIssuesAndOpportunities(analysis, profile) {
    // Issues
    if (analysis.cta_count === 0) {
      analysis.issues.push('No CTAs found above the fold');
    } else if (analysis.cta_count === 1) {
      analysis.issues.push('Only one CTA above the fold - consider adding secondary CTA');
    }
    
    if (analysis.conversion_score < 50) {
      analysis.issues.push('Low conversion potential - CTAs need urgency/value props');
    }
    
    if (!analysis.cta_types['money-page'] && !analysis.cta_types['quote']) {
      analysis.issues.push('No money page or quote CTAs above the fold');
    }
    
    // Opportunities
    if (analysis.cta_count < 3) {
      analysis.opportunities.push('Add secondary/tertiary CTAs for different user intents');
    }
    
    if (!analysis.cta_types['contact']) {
      analysis.opportunities.push('Add phone/email CTA for immediate contact');
    }
    
    if (analysis.above_fold_ctas.some(cta => cta.urgency_score < 20)) {
      analysis.opportunities.push('Add urgency words (now, today, free, limited) to CTAs');
    }
    
    if (profile.phone && !analysis.cta_types['contact']) {
      analysis.opportunities.push(`Add phone CTA: ${profile.phone}`);
    }
  },
  
  generateCTARecommendations(analysis, page) {
    const recommendations = {
      priority: 'high',
      quick_wins: [],
      strategic_improvements: [],
      new_ctas: []
    };
    
    // Quick wins (immediate improvements)
    analysis.above_fold_ctas.forEach(cta => {
      if (cta.urgency_score < 30) {
        recommendations.quick_wins.push({
          current_cta: cta.anchor,
          suggested_improvement: this.improveCTAText(cta.anchor, cta.cta_type),
          reason: 'Add urgency and value proposition'
        });
      }
    });
    
    // Strategic improvements
    if (analysis.conversion_score < 70) {
      recommendations.strategic_improvements.push({
        type: 'cta_positioning',
        suggestion: 'Move highest-converting CTA to position 1',
        impact: 'High'
      });
    }
    
    if (analysis.cta_count < 2) {
      recommendations.strategic_improvements.push({
        type: 'cta_quantity',
        suggestion: 'Add secondary CTA with different value proposition',
        impact: 'Medium'
      });
    }
    
    // New CTA suggestions
    if (!analysis.cta_types['contact']) {
      recommendations.new_ctas.push({
        type: 'phone',
        suggested_text: 'Call Now - Free Quote in 2 Minutes',
        position: 'After primary CTA',
        conversion_type: 'immediate_contact'
      });
    }
    
    if (!analysis.cta_types['quote']) {
      recommendations.new_ctas.push({
        type: 'quote',
        suggested_text: 'Get Free Quote (2 mins)',
        position: 'Primary position',
        conversion_type: 'lead_generation'
      });
    }
    
    return recommendations;
  },
  
  improveCTAText(currentText, ctaType) {
    const improvements = {
      'money-page': [
        'Get Free Quote (2 mins)',
        'Start Repair Now - Free Collection',
        'Book Service Today - 12mo Guarantee'
      ],
      'contact': [
        'Call Now - Free Quote',
        'Speak to Expert Today',
        'Get Instant Quote - Call Now'
      ],
      'quote': [
        'Free Quote in 2 Minutes',
        'Get Quote Now - No Obligation',
        'Instant Quote - Start Today'
      ],
      'service': [
        'Book Service Now',
        'Start Repair Today',
        'Get Service Quote'
      ],
      'general': [
        'Learn More Today',
        'Get Started Now',
        'Find Out More'
      ]
    };
    
    const suggestions = improvements[ctaType] || improvements['general'];
    return suggestions[Math.floor(Math.random() * suggestions.length)];
  },
  
  async generateJumboSummary(testDir, testResults, batchData) {
    const successfulTests = testResults.filter(r => r.success);
    const totalCTAs = successfulTests.reduce((sum, test) => sum + test.cta_analysis.cta_count, 0);
    const avgConversionScore = Math.round(
      successfulTests.reduce((sum, test) => sum + test.cta_analysis.conversion_score, 0) / successfulTests.length
    );
    
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CTA Jumbo Test Results</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 1200px; margin: 0 auto; padding: 20px; background: #f8f9fa; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 12px; margin-bottom: 30px; text-align: center; }
    .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
    .stat { background: white; padding: 20px; border-radius: 8px; text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .stat-number { font-size: 2.5em; font-weight: bold; color: #667eea; margin-bottom: 5px; }
    .stat-label { color: #666; font-size: 0.9em; text-transform: uppercase; letter-spacing: 1px; }
    .results { display: grid; gap: 20px; }
    .result-card { background: white; border-radius: 12px; padding: 25px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
    .result-header { display: flex; justify-content: between; align-items: center; margin-bottom: 20px; }
    .page-title { font-size: 1.3em; font-weight: 600; color: #333; }
    .conversion-score { padding: 8px 16px; border-radius: 20px; font-weight: 600; color: white; }
    .score-high { background: #10b981; }
    .score-medium { background: #f59e0b; }
    .score-low { background: #ef4444; }
    .cta-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 15px; margin: 20px 0; }
    .cta-card { border: 1px solid #e5e7eb; border-radius: 8px; padding: 15px; background: #f9fafb; }
    .cta-text { font-weight: 600; color: #1f2937; margin-bottom: 8px; }
    .cta-meta { font-size: 0.85em; color: #6b7280; display: flex; gap: 15px; }
    .recommendations { margin-top: 20px; }
    .rec-section { margin-bottom: 15px; }
    .rec-title { font-weight: 600; color: #374151; margin-bottom: 8px; }
    .rec-item { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 10px 15px; margin-bottom: 8px; border-radius: 4px; }
    .quick-win { background: #dcfce7; border-left-color: #10b981; }
    .footer { text-align: center; padding: 30px; color: #6b7280; }
  </style>
</head>
<body>
  <div class="header">
    <h1>🚀 CTA Jumbo Test Results</h1>
    <p>Ultra-Fast Above-the-Fold Conversion Analysis</p>
  </div>

  <div class="stats">
    <div class="stat">
      <div class="stat-number">${successfulTests.length}</div>
      <div class="stat-label">Pages Tested</div>
    </div>
    <div class="stat">
      <div class="stat-number">${totalCTAs}</div>
      <div class="stat-label">CTAs Found</div>
    </div>
    <div class="stat">
      <div class="stat-number">${avgConversionScore}%</div>
      <div class="stat-label">Avg Conversion Score</div>
    </div>
    <div class="stat">
      <div class="stat-number">${Math.round(successfulTests.reduce((sum, test) => sum + test.test_time_ms, 0) / successfulTests.length)}ms</div>
      <div class="stat-label">Avg Test Time</div>
    </div>
  </div>

  <div class="results">
    ${successfulTests.map(result => {
      const scoreClass = result.cta_analysis.conversion_score >= 70 ? 'score-high' : 
                        result.cta_analysis.conversion_score >= 50 ? 'score-medium' : 'score-low';
      
      return `
        <div class="result-card">
          <div class="result-header">
            <div class="page-title">${result.page_id}</div>
            <div class="conversion-score ${scoreClass}">${result.cta_analysis.conversion_score}% Conversion Score</div>
          </div>
          
          <div class="cta-grid">
            ${result.cta_analysis.above_fold_ctas.map(cta => `
              <div class="cta-card">
                <div class="cta-text">"${cta.anchor}"</div>
                <div class="cta-meta">
                  <span>Type: ${cta.cta_type}</span>
                  <span>Urgency: ${cta.urgency_score}%</span>
                  <span>Potential: ${cta.conversion_potential}%</span>
                </div>
              </div>
            `).join('')}
          </div>

          ${result.recommendations.quick_wins.length > 0 ? `
            <div class="recommendations">
              <div class="rec-section">
                <div class="rec-title">⚡ Quick Wins</div>
                ${result.recommendations.quick_wins.map(win => `
                  <div class="rec-item quick-win">
                    <strong>Current:</strong> "${win.current_cta}"<br>
                    <strong>Suggested:</strong> "${win.suggested_improvement}"<br>
                    <em>${win.reason}</em>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}

          ${result.cta_analysis.issues.length > 0 ? `
            <div class="rec-section">
              <div class="rec-title">⚠️ Issues Found</div>
              ${result.cta_analysis.issues.map(issue => `
                <div class="rec-item">${issue}</div>
              `).join('')}
            </div>
          ` : ''}
        </div>
      `;
    }).join('')}
  </div>

  <div class="footer">
    <p>🎯 CTA Jumbo Test completed in ultra-fast mode • Generated by Nimbus AI</p>
  </div>
</body>
</html>`;
    
    const summaryPath = path.join(testDir, 'jumbo-summary.html');
    await fs.writeFile(summaryPath, html, 'utf8');
    
    return summaryPath;
  },
  
  async openSummary(summaryPath) {
    try {
      const { exec } = require('child_process');
      const absolutePath = path.resolve(summaryPath);
      exec(`start "" "${absolutePath}"`, (error) => {
        if (!error) {
          console.log(chalk.green('🌐 Opened summary in browser'));
        }
      });
    } catch (error) {
      console.log(chalk.yellow(`⚠️ Could not open browser: ${error.message}`));
    }
  }
};

module.exports = ctaJumboTest;

