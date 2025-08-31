// Progressive 3-Tier Optimization System
// Extends existing infrastructure with intelligent caching

const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const crypto = require('crypto');

// Import existing tasks to reuse their logic
const proposeV2Task = require('./propose-v2');
const previewTask = require('./preview');

// Import unified template engine
const templateEngine = require('../lib/template-engine');

// Use dynamic import for fetch (same pattern as existing tasks)
let fetch;
(async () => {
  const { default: nodeFetch } = await import('node-fetch');
  fetch = nodeFetch;
})();

const progressiveOptimizer = {
  
  // Tier 1: Meta-Only Optimization (1-2s)
  async runMetaOnly(options) {
    console.log(chalk.blue('⚡ TIER 1: Meta-Only Optimization (Ultra-Fast)'));
    
    const startTime = Date.now();
    const results = await this.executeOptimization(options, 1, 'meta_only');
    const totalTime = Date.now() - startTime;
    
    console.log(chalk.green(`✅ Tier 1 complete: ${totalTime}ms`));
    return results;
  },
  
  // Tier 2: Above-Fold Optimization (3-5s)
  async runAboveFold(options) {
    console.log(chalk.blue('🎯 TIER 2: Above-Fold Optimization (Fast)'));
    
    const startTime = Date.now();
    const results = await this.executeOptimization(options, 2, 'above_fold');
    const totalTime = Date.now() - startTime;
    
    console.log(chalk.green(`✅ Tier 2 complete: ${totalTime}ms`));
    return results;
  },
  
  // Tier 3: Full Page Optimization (15-30s) - Uses unified template system
  async runFullPage(options) {
    console.log(chalk.blue('🏆 TIER 3: Full Page Optimization (Complete)'));
    
    const startTime = Date.now();
    
    // Run full optimization using our unified system
    const results = await this.executeOptimization(options, 3, 'full_page');
    
    const totalTime = Date.now() - startTime;
    console.log(chalk.green(`✅ Tier 3 complete: ${totalTime}ms`));
    
    return results;
  },
  
  // Core optimization execution with progressive caching
  async executeOptimization(options, tierLevel, optimizationType) {
    const { batch, pages, workerUrl, tone } = options;
    
    if (!batch) {
      throw new Error('--batch option is required');
    }
    
    // Load batch data (reuse existing logic)
    const workBatch = await this.loadWorkBatch(batch);
    console.log(chalk.green(`📊 Loaded batch: ${workBatch.batch_id} (${workBatch.pages.length} pages)`));
    
    // Filter pages (reuse existing logic)
    let pagesToProcess = workBatch.pages;
    if (pages) {
      const requestedIds = pages.split(',').map(id => id.trim());
      pagesToProcess = workBatch.pages.filter(page => requestedIds.includes(page.page_id));
    }
    
    const finalWorkerUrl = workerUrl || 'https://nimbus-content-optimizer.martin-598.workers.dev';
    const results = [];
    
    console.log(chalk.blue(`\n📄 TIER ${tierLevel} PROCESSING (${pagesToProcess.length}):`));
    
    for (let i = 0; i < pagesToProcess.length; i++) {
      const page = pagesToProcess[i];
      const pageStartTime = Date.now();
      
      // V5: Determine tones to test for this page
      let tonesToTest = [page.directive.tone]; // Default: use original tone
      
      if (tone === 'roll-tone') {
        // Roll-tone: Use different tone per page
        const tonePresets = ['local-expert', 'premium-new', 'startup-new', 'helpful-calm', 'classic-retail', 'mom-n-pop', 'clinical', 'govtech'];
        tonesToTest = [tonePresets[i % tonePresets.length]];
        console.log(chalk.cyan(`   🎭 Roll-tone mode: ${tonesToTest[0]} (page ${i + 1})`));
      } else if (tone === 'all-tone') {
        // All-tone: Test same page with all tones
        tonesToTest = ['local-expert', 'premium-new', 'startup-new', 'helpful-calm', 'classic-retail', 'mom-n-pop', 'clinical', 'govtech'];
        console.log(chalk.cyan(`   🎭 All-tone mode: Testing ${tonesToTest.length} tones for ${page.page_id}`));
      } else if (tone) {
        // Single tone override
        tonesToTest = [tone];
      }
      
      console.log(chalk.cyan(`🎯 ${i + 1}/${pagesToProcess.length}: ${page.page_id} [${tonesToTest.length} tone${tonesToTest.length > 1 ? 's' : ''}]`));
      
      // Process each tone for this page
      for (let toneIndex = 0; toneIndex < tonesToTest.length; toneIndex++) {
        const currentTone = tonesToTest[toneIndex];
        const directive = { ...page.directive, tone: currentTone };
        const pageId = tonesToTest.length > 1 ? `${page.page_id}-${currentTone}` : page.page_id;
        
        console.log(chalk.yellow(`   🎭 Tone ${toneIndex + 1}/${tonesToTest.length}: ${currentTone}`));
        
        try {
          // Check for cached results from previous tiers
          const cachedResults = await this.checkProgressiveCache(batch, pageId, tierLevel);
        
        let result;
        if (cachedResults.useCache) {
          console.log(chalk.gray(`   ✅ Using cached results from Tier ${cachedResults.fromTier}`));
          result = cachedResults.data;
          // Normalize cached results structure for consistent access
          if (result.result) {
            // Extract nested result data
            const nestedResult = result.result.result || result.result;
            result.head = nestedResult.head;
            result.confidence = nestedResult.confidence;
            result.blocks = nestedResult.blocks || [];
            result.ctas = nestedResult.ctas || nestedResult.links || [];
          }
        } else {
          // Execute optimization with tier-specific directive
          const tierDirective = this.createTierDirective(directive, optimizationType, tierLevel);
          result = await this.requestOptimization(finalWorkerUrl, workBatch.profile, tierDirective, page.content_map, tierLevel);
          
          // Cache the result for future tier usage
          await this.cacheProgressiveResult(batch, pageId, tierLevel, result);
        }
        
        const toneTime = Date.now() - pageStartTime;
        const confidence = result.result?.confidence || result.confidence || 0;
        console.log(chalk.green(`      ✅ ${currentTone} optimized in ${toneTime}ms - ${Math.round(confidence * 100)}% confidence`));
        
        results.push({
          page_id: pageId,
          directive: directive,
          result: result,
          content_map: page.content_map, // Add content map for image extraction
          tier_level: tierLevel,
          optimization_type: optimizationType,
          cached: cachedResults.useCache,
          execution_time_ms: toneTime,
          confidence: confidence,
          changes: this.countChanges(result)
        });
        
        } catch (error) {
          console.log(chalk.red(`      ❌ ${currentTone} failed: ${error.message}`));
          results.push({
            page_id: pageId,
            error: error.message,
            tier_level: tierLevel,
            execution_time_ms: Date.now() - pageStartTime
          });
        }
      }
    }
    
    // Generate tier-specific preview AND individual page files
    const previewPath = await this.generateTierPreview(batch, results, workBatch.profile, tierLevel, optimizationType);
    
    // Generate individual page files using EJS templates
    await this.generateIndividualPagePreviewsEJS(batch, results, workBatch.profile, tierLevel, optimizationType);
    
    console.log(chalk.green(`📊 Tier ${tierLevel} preview: ${previewPath}`));
    
    // Auto-open preview
    await this.openPreview(previewPath);
    
    return {
      success: true,
      tier_level: tierLevel,
      optimization_type: optimizationType,
      results: results,
      preview_path: previewPath
    };
  },
  
  // Create tier-specific directive for AI optimization
  createTierDirective(baseDirective, optimizationType, tierLevel) {
    const tierDirectives = {
      meta_only: {
        ...baseDirective,
        optimization_focus: 'meta_tags_only',
        priority: 'search_visibility',
        blocks_to_process: 0, // No content blocks, just meta
        instructions: `Focus ONLY on meta title and description optimization. Apply ${baseDirective.tone} tone strongly. Optimize for SERP click-through rates.`
      },
      above_fold: {
        ...baseDirective,
        optimization_focus: 'hero_section_conversion', 
        priority: 'above_fold_engagement',
        blocks_to_process: 8, // First 8 blocks (above-fold)
        instructions: `Optimize meta tags AND hero section (H1, H2, primary CTAs) for conversion. Apply ${baseDirective.tone} tone personality strongly.`
      }
    };
    
    return tierDirectives[optimizationType] || baseDirective;
  },
  
  // Progressive cache checking
  async checkProgressiveCache(batchId, pageId, requestedTier) {
    const cacheDir = `.nimbus/work/${batchId}/cache`;
    
    // Check for cached results from previous tiers
    for (let tier = requestedTier; tier >= 1; tier--) {
      const cachePath = path.join(cacheDir, `${pageId}-tier-${tier}.json`);
      
      if (await fs.pathExists(cachePath)) {
        const cachedData = await fs.readJson(cachePath);
        
        // Check if cache is still valid (within 1 hour)
        const cacheAge = Date.now() - new Date(cachedData.created_at).getTime();
        if (cacheAge < 3600000) { // 1 hour
          return {
            useCache: true,
            fromTier: tier,
            data: cachedData.result
          };
        }
      }
    }
    
    return { useCache: false };
  },
  
  // Cache progressive results
  async cacheProgressiveResult(batchId, pageId, tierLevel, result) {
    const cacheDir = `.nimbus/work/${batchId}/cache`;
    await fs.ensureDir(cacheDir);
    
    const cacheData = {
      page_id: pageId,
      tier_level: tierLevel,
      created_at: new Date().toISOString(),
      result: result
    };
    
    const cachePath = path.join(cacheDir, `${pageId}-tier-${tierLevel}.json`);
    await fs.writeJson(cachePath, cacheData);
  },
  
  // Request optimization from AI worker (reuse existing pattern)
  async requestOptimization(workerUrl, profile, directive, contentMap, tierLevel) {
    if (!fetch) {
      const { default: nodeFetch } = await import('node-fetch');
      fetch = nodeFetch;
    }
    
    const requestBody = {
      prompt_type: tierLevel === 1 ? 'head' : 'multi', // Tier 1: head only, Tier 2+: multi-prompt
      model: 'gpt-4-turbo-preview',
      profile: profile,
      directive: directive,
      content_map: contentMap,
      tier_level: tierLevel, // Add tier info for AI context
      cache_bust: Date.now(),
      no_cache: true
    };
    
    const response = await fetch(workerUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`AI Worker failed: ${response.status} - ${errorText}`);
    }
    
    const result = await response.json();
    
    // Log debug information from worker
    if (result.debug_logs && result.debug_logs.length > 0) {
      console.log(chalk.gray('\n📋 Worker Debug Logs:'));
      result.debug_logs.forEach(log => console.log(chalk.gray(`   ${log}`)));
    }
    
    if (result.error) {
      throw new Error(`AI Worker error: ${result.error}`);
    }
    
    return result;
  },
  
  // Generate tier-specific preview (reuse existing preview system)
  async generateTierPreview(batchId, results, profile, tierLevel, optimizationType) {
    const previewDir = `.nimbus/work/${batchId}/tier-${tierLevel}-preview`;
    await fs.ensureDir(previewDir);
    
    // Transform results to match existing preview format
    const transformedResults = results.map(result => ({
      page_id: result.page_id,
      preview_path: `${result.page_id}.html`,
      changes: result.changes || this.countChanges(result.result),
      confidence: result.confidence || 0, // Use the confidence we already calculated
      tier_level: tierLevel,
      cached: result.cached || false
    }));
    
    // Use existing preview generation logic with tier-specific title
    const tierNames = { 1: 'Meta-Only', 2: 'Above-Fold', 3: 'Full Page' };
    const customBatchData = {
      batch_id: `${batchId}-tier-${tierLevel}`,
      profile: profile,
      proposal_summary: {
        total_changes: transformedResults.reduce((sum, r) => sum + r.changes, 0),
        average_confidence: transformedResults.reduce((sum, r) => sum + r.confidence, 0) / transformedResults.length
      },
      tier_level: tierLevel,
      tier_name: tierNames[tierLevel]
    };
    
    // Generate summary using EJS template system
    const summaryPath = await this.generateUnifiedSummary(previewDir, results, profile, tierLevel, optimizationType);
    return summaryPath;
  },
  
  // Generate tier summary (extends existing preview system)
  async generateTierSummary(previewDir, results, batchData) {
    const { batch_id, profile, tier_level, tier_name } = batchData;
    const successfulResults = results.filter(r => !r.error);
    
    // Use existing Google-style preview HTML with tier-specific modifications
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tier ${tier_level} Results: ${tier_name}</title>
  
  <!-- Bootstrap 5 CSS -->
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
  
  <style>
    body { font-family: arial, sans-serif; }
    .header { padding: 20px 0; border-bottom: 1px solid #ddd; margin-bottom: 30px; }
    .tier-badge { 
      display: inline-block; 
      padding: 8px 16px; 
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
      color: white; 
      border-radius: 20px; 
      font-weight: 600;
      margin-bottom: 10px;
    }
    .stats { display: flex; gap: 30px; margin: 20px 0; }
    .stat { text-align: center; }
    .stat-number { font-size: 1.8em; font-weight: bold; color: #1a73e8; }
    .stat-label { color: #70757a; font-size: 14px; }
    
    /* Reuse existing Google-style preview CSS */
    .search-results { margin: 20px 0; }
    .search-result { margin-bottom: 30px; padding: 0; border: none; background: none; }
    .result-title { 
      font-size: 20px; 
      color: #1a0dab; 
      text-decoration: none; 
      line-height: 1.3;
      display: block;
      margin-bottom: 3px;
      cursor: pointer;
    }
    .result-title:hover { text-decoration: underline; }
    .result-url { 
      font-size: 14px; 
      color: #006621; 
      margin-bottom: 3px;
      line-height: 1.3;
    }
    .result-description { 
      font-size: 14px; 
      color: #4d5156; 
      line-height: 1.58;
      margin: 0;
    }
    .result-meta {
      font-size: 12px;
      color: #70757a;
      margin-top: 5px;
      display: flex;
      gap: 15px;
    }
    .cached { color: #34a853; font-weight: 500; }
    .fresh { color: #ea4335; font-weight: 500; }
  </style>
</head>
<body>
  <div class="header">
    <div class="tier-badge">TIER ${tier_level}: ${tier_name}</div>
    <h1>🎯 ${profile.name} - ${tier_name} Optimization</h1>
    <div class="stats">
      <div class="stat">
        <div class="stat-number">${successfulResults.length}</div>
        <div class="stat-label">Pages Optimized</div>
      </div>
      <div class="stat">
        <div class="stat-number">${Math.round((batchData.proposal_summary?.average_confidence || 0) * 100)}%</div>
        <div class="stat-label">Avg Confidence</div>
      </div>
      <div class="stat">
        <div class="stat-number">${batchData.proposal_summary?.total_changes || 0}</div>
        <div class="stat-label">Total Changes</div>
      </div>
    </div>
  </div>

  <div class="search-results">
    ${successfulResults.map(result => `
      <div class="search-result">
        <div style="display: flex; gap: 15px; align-items: flex-start;">
          <div class="result-content" style="flex: 1; min-width: 0;">
            <div class="result-site" style="display: flex; align-items: center; margin-bottom: 2px;">
              <img src="https://www.repairsbypost.com/favicon.ico" 
                   style="width: 16px; height: 16px; margin-right: 8px; vertical-align: middle;"
                   onerror="this.src='data:image/svg+xml,<svg xmlns=&quot;http://www.w3.org/2000/svg&quot; viewBox=&quot;0 0 16 16&quot;><circle cx=&quot;8&quot; cy=&quot;8&quot; r=&quot;6&quot; fill=&quot;%231a73e8&quot;/></svg>'">
              <span style="font-size: 14px; color: #202124; font-weight: 400;">${profile.name}</span>
            </div>
            <div class="result-url">
              https://www.${profile.domain} › ${result.page_id.replace(/-/g, ' › ')}
            </div>
            <a href="${result.page_id}.html" class="result-title">
              ${this.extractOptimizedTitle(result, tier_level)}
            </a>
            <p class="result-description">
              ${this.extractOptimizedDescription(result, tier_level)}
            </p>
            <div class="result-meta">
              <span class="${result.cached ? 'cached' : 'fresh'}">${result.cached ? 'Cached' : 'Fresh'} Results</span>
              <span>${Math.round((result.confidence || 0) * 100)}% confidence</span>
              <span>${result.changes || 0} changes</span>
              <span>${result.directive?.tone || 'default'} tone</span>
              <span>Tier ${tier_level}</span>
            </div>
          </div>
          <div class="result-image" style="flex-shrink: 0;">
            <img src="${this.getResultImage(result, profile)}" 
                 alt="${result.page_id} preview" 
                 style="width: 80px; height: 80px; object-fit: cover; border-radius: 8px; border: 1px solid #dadce0;"
                 onerror="this.style.display='none'">
          </div>
          </div>
        </div>
      </div>
    `).join('')}
  </div>

  <footer style="text-align: center; padding: 40px 20px; color: #70757a; border-top: 1px solid #ddd; margin-top: 40px;">
    <p>🎯 Tier ${tier_level}: ${tier_name} Optimization • Progressive 3-Tier System • Generated by Nimbus AI</p>
  </footer>
</body>
</html>`;
    
    const summaryPath = path.join(previewDir, 'index.html');
    await fs.writeFile(summaryPath, html, 'utf8');
    
    return summaryPath;
  },
  
  // Generate unified summary using EJS template engine
  async generateUnifiedSummary(previewDir, results, profile, tierLevel, optimizationType) {
    const tierNames = { 1: 'Meta-Only', 2: 'Above-Fold', 3: 'Full Page' };
    const optimizationName = tierNames[tierLevel] || optimizationType;
    
    console.log(chalk.gray(`   🎨 Generating EJS template with ${results.length} results`));
    
    // Format data for EJS template
    const templateData = templateEngine.formatSearchResultsData(results, profile, optimizationName, tierLevel);
    
    console.log(chalk.gray(`   📊 Template data: ${templateData.pages_count} pages, ${templateData.avg_confidence}% confidence`));
    console.log(chalk.gray(`   🖼️ First result image: ${templateData.results[0]?.result_image || 'MISSING'}`));
    
    // Render using EJS template
    const html = await templateEngine.renderSearchResults(templateData);
    
    // Write to file
    const summaryPath = path.join(previewDir, 'index.html');
    await fs.writeFile(summaryPath, html, 'utf8');
    
    console.log(chalk.gray(`   ✅ EJS template rendered successfully`));
    
    return summaryPath;
  },
  
  // Generate individual page files using EJS templates
  async generateIndividualPagePreviewsEJS(batchId, results, profile, tierLevel, optimizationType) {
    const previewDir = `.nimbus/work/${batchId}/tier-${tierLevel}-preview`;
    const tierNames = { 1: 'Meta-Only', 2: 'Above-Fold', 3: 'Full Page' };
    
    for (const result of results.filter(r => r.success !== false)) {
      // Load original content for comparison from the current batch content map
      const originalHead = result.content_map?.head || {};
      
      // If no head data in content map, try to load from original proposal
      if (!originalHead.title && !originalHead.metaDescription) {
        const originalProposal = await this.loadOriginalProposal(batchId, result.page_id.replace(/-local-expert|-premium-new|-startup-new|-helpful-calm|-classic-retail|-mom-n-pop|-clinical|-govtech/, ''));
        const proposalHead = originalProposal?.request?.content_map?.head || {};
        Object.assign(originalHead, proposalHead);
      }
      
      // Debug: Check original head data
      console.log(chalk.gray(`   📋 Original title: "${originalHead.title || 'MISSING'}"`));
      console.log(chalk.gray(`   📋 Original desc: "${originalHead.metaDescription || 'MISSING'}"`));
      
      // Format data for EJS template
      const templateData = templateEngine.formatIndividualPreviewData(
        result, 
        { head: originalHead, blocks: result.content_map?.blocks || [] }, 
        profile, 
        tierNames[tierLevel] || optimizationType, 
        tierLevel
      );
      
      // Render using EJS template
      const html = await templateEngine.renderIndividualPreview(templateData);
      
      // Write individual page file
      const pagePreviewPath = path.join(previewDir, `${result.page_id}.html`);
      await fs.writeFile(pagePreviewPath, html, 'utf8');
    }
  },
  
  // Generate individual page files with before/after comparison (OLD - keep for reference)
  async generateIndividualPagePreviews(batchId, results, profile, tierLevel) {
    const previewDir = `.nimbus/work/${batchId}/tier-${tierLevel}-preview`;
    const tierNames = { 1: 'Meta-Only', 2: 'Above-Fold', 3: 'Full Page' };
    
    for (const result of results.filter(r => r.success !== false)) {
      // Load original content for comparison
      const originalProposal = await this.loadOriginalProposal(batchId, result.page_id);
      const originalHead = originalProposal?.request?.content_map?.head || {};
      
      const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${result.page_id} - ${tierNames[tierLevel]} Results</title>
  <style>
    body { font-family: arial, sans-serif; max-width: 1200px; margin: 0 auto; padding: 20px; background: #fff; }
    .header { padding: 20px 0; border-bottom: 1px solid #ddd; margin-bottom: 30px; }
    .tier-badge { 
      display: inline-block; 
      padding: 8px 16px; 
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
      color: white; 
      border-radius: 20px; 
      font-weight: 600;
      margin-bottom: 10px;
    }
    
    /* Google SERP Preview Styles */
    .serp-preview { 
      border: 1px solid #dadce0; 
      border-radius: 8px; 
      padding: 20px; 
      margin: 20px 0;
      background: #fff;
    }
    .serp-title { font-size: 20px; color: #1a0dab; margin-bottom: 5px; line-height: 1.3; }
    .serp-url { font-size: 14px; color: #006621; margin-bottom: 3px; }
    .serp-description { font-size: 14px; color: #4d5156; line-height: 1.58; margin: 0; }
    .serp-meta { font-size: 12px; color: #70757a; margin-top: 10px; }
    
    /* Before/After Comparison */
    .comparison { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin: 30px 0; }
    .comparison-section { }
    .section-title { 
      font-size: 1.2em; 
      font-weight: 600; 
      margin-bottom: 15px; 
      padding: 10px 0; 
      border-bottom: 2px solid #e1e5e9;
    }
    .before .section-title { color: #ea4335; }
    .after .section-title { color: #34a853; }
    
    .meta-item { margin-bottom: 20px; }
    .meta-label { 
      font-size: 12px; 
      color: #70757a; 
      text-transform: uppercase; 
      font-weight: 500;
      margin-bottom: 5px;
    }
    .meta-content { 
      font-size: 14px; 
      color: #202124; 
      line-height: 1.4;
      padding: 10px;
      background: #f8f9fa;
      border-radius: 4px;
      border-left: 4px solid #e8eaed;
    }
    .before .meta-content { border-left-color: #fbbc04; background: #fef7e0; }
    .after .meta-content { border-left-color: #34a853; background: #e6f4ea; }
    
    .char-count {
      font-size: 11px;
      color: #70757a;
      margin-top: 5px;
    }
    .char-good { color: #34a853; }
    .char-warn { color: #fbbc04; }
    .char-over { color: #ea4335; }
    
    .back-link { 
      display: inline-block; 
      margin-top: 30px; 
      padding: 10px 20px; 
      background: #1a73e8; 
      color: white; 
      text-decoration: none; 
      border-radius: 4px;
    }
    .back-link:hover { background: #1557b0; }
  </style>
</head>
<body>
  <div class="header">
    <div class="tier-badge">TIER ${tierLevel}: ${tierNames[tierLevel]}</div>
    <h1>📄 ${result.page_id.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</h1>
    <p><strong>Business:</strong> ${profile.name} • <strong>Tone:</strong> ${result.directive?.tone || 'default'} • <strong>Confidence:</strong> ${Math.round((result.confidence || 0) * 100)}%</p>
  </div>

  <!-- SERP Preview of Optimized Result -->
  <div class="serp-preview">
    <h2>🔍 How this appears in Google Search Results</h2>
    <div style="display: flex; align-items: center; margin-bottom: 2px;">
      <img src="https://www.repairsbypost.com/favicon.ico" 
           style="width: 16px; height: 16px; margin-right: 8px; vertical-align: middle;"
           onerror="this.src='data:image/svg+xml,<svg xmlns=&quot;http://www.w3.org/2000/svg&quot; viewBox=&quot;0 0 16 16&quot;><circle cx=&quot;8&quot; cy=&quot;8&quot; r=&quot;6&quot; fill=&quot;%231a73e8&quot;/></svg>'">
      <span style="font-size: 14px; color: #202124; font-weight: 400;">${profile.name}</span>
    </div>
    <div class="serp-url">https://www.${profile.domain} › ${result.page_id.replace(/-/g, ' › ')}</div>
    <div class="serp-title">${this.extractOptimizedTitle(result, tierLevel)}</div>
    <div class="serp-description">${this.extractOptimizedDescription(result, tierLevel)}</div>
    <div class="serp-meta">
      ${result.cached ? 'Cached' : 'Fresh'} • ${Math.round((result.confidence || 0) * 100)}% confidence • ${result.changes || 0} changes
    </div>
  </div>

  <!-- Before/After Meta Comparison -->
  <div class="comparison">
    <div class="comparison-section before">
      <div class="section-title">❌ Before (Original)</div>
      
      <div class="meta-item">
        <div class="meta-label">Page Title</div>
        <div class="meta-content">
          ${originalHead.title || 'No title found'}
          <div class="char-count ${this.getCharClass(originalHead.title?.length || 0, 60)}">${originalHead.title?.length || 0}/60 characters</div>
        </div>
      </div>
      
      <div class="meta-item">
        <div class="meta-label">Meta Description</div>
        <div class="meta-content">
          ${originalHead.metaDescription || 'No meta description found'}
          <div class="char-count ${this.getCharClass(originalHead.metaDescription?.length || 0, 160)}">${originalHead.metaDescription?.length || 0}/160 characters</div>
        </div>
      </div>
    </div>

    <div class="comparison-section after">
      <div class="section-title">✅ After (AI Optimized)</div>
      
      <div class="meta-item">
        <div class="meta-label">Page Title</div>
        <div class="meta-content">
          ${this.extractOptimizedTitle(result, tierLevel)}
          <div class="char-count ${this.getCharClass(this.extractOptimizedTitle(result, tierLevel).length, 60)}">${this.extractOptimizedTitle(result, tierLevel).length}/60 characters</div>
        </div>
      </div>
      
      <div class="meta-item">
        <div class="meta-label">Meta Description</div>
        <div class="meta-content">
          ${this.extractOptimizedDescription(result, tierLevel)}
          <div class="char-count ${this.getCharClass(this.extractOptimizedDescription(result, tierLevel).length, 160)}">${this.extractOptimizedDescription(result, tierLevel).length}/160 characters</div>
        </div>
      </div>
    </div>
  </div>

  <a href="index.html" class="back-link">← Back to ${tierNames[tierLevel]} Results</a>

  <footer style="text-align: center; padding: 40px 20px; color: #70757a; border-top: 1px solid #ddd; margin-top: 40px;">
    <p>🎯 ${tierNames[tierLevel]} Optimization • Individual Page View • Generated by Nimbus AI</p>
  </footer>
</body>
</html>`;
      
      const pagePreviewPath = path.join(previewDir, `${result.page_id}.html`);
      await fs.writeFile(pagePreviewPath, html, 'utf8');
    }
  },
  
  // Helper method to load original proposal for comparison
  async loadOriginalProposal(batchId, pageId) {
    try {
      const proposalPath = `.nimbus/work/${batchId}/proposals/${pageId}.json`;
      if (await fs.pathExists(proposalPath)) {
        return await fs.readJson(proposalPath);
      }
    } catch (error) {
      console.log(chalk.yellow(`⚠️ Could not load original proposal for ${pageId}`));
    }
    return null;
  },
  
  // Helper method for character count classes
  getCharClass(length, target) {
    if (length > target) return 'char-over';
    if (length < target * 0.8) return 'char-warn';
    return 'char-good';
  },
  
  // Get result image (reuse existing pattern from preview.js)
  getResultImage(result, profile) {
    // Extract brand name for branded placeholder
    const brandMatch = result.page_id.match(/(.+)-watch-repair/);
    const brand = brandMatch ? brandMatch[1] : null;
    
    // Brand-specific placeholder images
    const brandImages = {
      'hublot': 'https://via.placeholder.com/80x80/000000/FFFFFF?text=H',
      'hamilton': 'https://via.placeholder.com/80x80/2C5F2D/FFFFFF?text=HAM',
      'gucci': 'https://via.placeholder.com/80x80/8B0000/FFFFFF?text=G',
      'rolex': 'https://via.placeholder.com/80x80/006400/FFFFFF?text=R',
      'omega': 'https://via.placeholder.com/80x80/000080/FFFFFF?text=Ω',
      'fossil': 'https://via.placeholder.com/80x80/8B4513/FFFFFF?text=F',
      'festina': 'https://via.placeholder.com/80x80/FF6B35/FFFFFF?text=F'
    };
    
    // For local pages, use location placeholder
    if (result.page_id.includes('watch-repairs-')) {
      const location = result.page_id.replace('watch-repairs-', '').replace(/-/g, ' ');
      const firstLetter = location.charAt(0).toUpperCase();
      return `https://via.placeholder.com/80x80/1a73e8/FFFFFF?text=${firstLetter}`;
    }
    
    // Return brand image or default fallback
    return brandImages[brand] || 'https://via.placeholder.com/80x80/70757a/FFFFFF?text=?';
  },
  
  // Helper methods (reuse existing patterns)
  async loadWorkBatch(batchId) {
    const batchPath = `.nimbus/work/${batchId}/batch.json`;
    if (!(await fs.pathExists(batchPath))) {
      throw new Error(`Batch not found: ${batchPath}`);
    }
    return await fs.readJson(batchPath);
  },
  
  countChanges(result) {
    let count = 0;
    const actualResult = result.result || result;
    if (actualResult?.head) count += Object.keys(actualResult.head).length;
    if (actualResult?.blocks) count += actualResult.blocks.length;
    if (actualResult?.links || actualResult?.ctas) count += (actualResult.links || actualResult.ctas || []).length;
    if (actualResult?.alts) count += actualResult.alts.length;
    if (actualResult?.schema) count += 1;
    return count;
  },
  
  extractOptimizedTitle(result, tierLevel) {
    // Handle both cached and fresh result structures
    let title = null;
    
    // For cached results from our progressive system
    if (result.result?.result?.head?.title) {
      title = result.result.result.head.title;
    }
    // For fresh AI worker results  
    else if (result.result?.head?.title) {
      title = result.result.head.title;
    }
    // For normalized results
    else if (result.head?.title) {
      title = result.head.title;
    }
    
    if (title) {
      return title;
    }
    
    // Fallback - this should rarely be used now
    return result.page_id.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) + ` - Tier ${tierLevel} Optimized`;
  },
  
  extractOptimizedDescription(result, tierLevel) {
    // Handle both cached and fresh result structures
    let description = null;
    
    // For cached results from our progressive system
    if (result.result?.result?.head?.metaDescription) {
      description = result.result.result.head.metaDescription;
    }
    // For fresh AI worker results
    else if (result.result?.head?.metaDescription) {
      description = result.result.head.metaDescription;
    }
    // For normalized results
    else if (result.head?.metaDescription) {
      description = result.head.metaDescription;
    }
    
    if (description) {
      return description;
    }
    
    // Fallback description
    const tierNames = { 1: 'Meta-Only', 2: 'Above-Fold', 3: 'Full Page' };
    return `${tierNames[tierLevel]} optimization completed with ${result.changes || 0} improvements and ${Math.round((result.confidence || 0) * 100)}% confidence.`;
  },
  
  async openPreview(previewPath) {
    try {
      const { exec } = require('child_process');
      const absolutePath = path.resolve(previewPath);
      exec(`start "" "${absolutePath}"`, (error) => {
        if (!error) {
          console.log(chalk.green('🌐 Opened preview in browser'));
        }
      });
    } catch (error) {
      console.log(chalk.yellow(`⚠️ Could not open browser: ${error.message}`));
    }
  }
};

module.exports = progressiveOptimizer;
