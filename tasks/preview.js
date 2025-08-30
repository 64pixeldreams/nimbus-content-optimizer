// Step 4: Preview system for proposed changes
// Implemented according to specs/step-4-preview.md

const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const cheerio = require('cheerio');

const previewTask = {
  async run(options) {
    console.log(chalk.blue('🔍 Starting Nimbus change preview generation...'));
    
    const { batch, pages, format = 'html', open: openInBrowser } = options;
    
    // Validate required options
    if (!batch) {
      throw new Error('--batch option is required');
    }
    
    // Load batch and proposals
    const batchData = await this.loadBatchData(batch);
    console.log(chalk.green(`📊 Loaded batch: ${batchData.batch_id} (${batchData.pages.length} pages)`));
    
    // Filter to specific pages if requested
    let pagesToPreview = batchData.pages;
    if (pages) {
      const requestedIds = pages.split(',').map(id => id.trim());
      pagesToPreview = batchData.pages.filter(page => requestedIds.includes(page.page_id));
      
      if (pagesToPreview.length === 0) {
        throw new Error(`No matching pages found for: ${pages}`);
      }
    }
    
    // Ensure preview directory exists
    const previewDir = `.nimbus/work/${batch}/previews`;
    await fs.ensureDir(previewDir);
    
    // V4.5: Discover all proposal files (including tone variations)
    const proposalsDir = `.nimbus/work/${batch}/proposals`;
    const proposalFiles = await fs.readdir(proposalsDir);
    const proposalIds = proposalFiles
      .filter(f => f.endsWith('.json'))
      .map(f => f.replace('.json', ''));
    
    // Generate previews for each proposal file
    const previewResults = [];
    
    console.log(chalk.blue(`\n🔍 GENERATING PREVIEWS (${proposalIds.length}):`));
    
    for (let i = 0; i < proposalIds.length; i++) {
      const page_id = proposalIds[i];
      
      // Get directive info from original page or proposal
      const originalPage = pagesToPreview.find(p => p.page_id === page_id || page_id.startsWith(p.page_id));
      const directive = originalPage?.directive || { type: 'unknown', tone: 'unknown' };
      
      console.log(chalk.yellow(`⏳ ${i + 1}/${proposalIds.length}: ${page_id} [${directive.type}/${directive.tone}]`));
      
      try {
        // Load proposal for this page
        const proposal = await this.loadProposal(batch, page_id);
        
        // Generate preview based on format
        let previewPath;
        if (format === 'html') {
          // Create page object for compatibility
          const pageObj = { page_id, directive, content_map: proposal.request.content_map };
          previewPath = await this.generateHtmlPreview(previewDir, pageObj, proposal);
        } else if (format === 'console') {
          const pageObj = { page_id, directive, content_map: proposal.request.content_map };
          this.displayConsolePreview(pageObj, proposal);
          continue; // Skip file creation for console format
        } else {
          throw new Error(`Unsupported format: ${format}`);
        }
        
        const changeCount = this.countChanges(proposal.response);
        console.log(chalk.green(`   ✅ Generated preview: ${path.basename(previewPath)} (${changeCount} changes)`));
        
        previewResults.push({
          page_id,
          preview_path: previewPath,
          changes: changeCount,
          confidence: proposal.response.confidence || 0
        });
        
      } catch (error) {
        console.log(chalk.red(`   ❌ Failed: ${error.message}`));
        
        previewResults.push({
          page_id,
          error: error.message,
          changes: 0,
          confidence: 0
        });
      }
    }
    
    // Generate batch summary if HTML format
    if (format === 'html') {
      const summaryPath = await this.generateBatchSummary(previewDir, batchData, previewResults);
      console.log(chalk.green(`📋 Generated batch summary: ${path.basename(summaryPath)}`));
      
      // Show clickable URLs
      const absoluteSummaryPath = path.resolve(summaryPath);
      console.log(chalk.blue('\n🌐 PREVIEW URLS (click to open):'));
      console.log(chalk.cyan(`📊 Batch Summary: file:///${absoluteSummaryPath.replace(/\\/g, '/')}`));
      
      previewResults.filter(r => !r.error).forEach(result => {
        const absolutePreviewPath = path.resolve(result.preview_path);
        console.log(chalk.cyan(`📄 ${result.page_id}: file:///${absolutePreviewPath.replace(/\\/g, '/')}`));
      });
      
      // Open in browser if requested
      if (openInBrowser) {
        await this.openInBrowser(summaryPath);
      }
    }
    
    console.log(chalk.green(`🎉 Preview generation complete!`));
    
    return {
      success: true,
      batch_id: batch,
      previews_generated: previewResults.filter(r => !r.error).length,
      format,
      preview_directory: previewDir
    };
  },
  
  async loadBatchData(batchId) {
    const batchPath = `.nimbus/work/${batchId}/batch.json`;
    if (!(await fs.pathExists(batchPath))) {
      throw new Error(`Batch not found: ${batchPath}. Run nimbus:plan first.`);
    }
    
    return await fs.readJson(batchPath);
  },
  
  async loadProposal(batchId, pageId) {
    const proposalPath = `.nimbus/work/${batchId}/proposals/${pageId}.json`;
    if (!(await fs.pathExists(proposalPath))) {
      throw new Error(`Proposal not found: ${proposalPath}. Run nimbus:propose first.`);
    }
    
    return await fs.readJson(proposalPath);
  },
  
  async generateHtmlPreview(previewDir, page, proposal) {
    const { page_id, content_map, directive } = page;
    const { response } = proposal;
    const confidence = Math.round((response.confidence || 0) * 100);
    
    // Simple HTML preview for now
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nimbus Preview: ${page_id}</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 1200px; margin: 0 auto; padding: 20px; background: #f5f6fa; }
    .header { background: white; padding: 30px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .section { background: white; margin: 20px 0; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .diff { display: flex; gap: 20px; margin: 15px 0; }
    .before, .after { flex: 1; padding: 15px; border-radius: 6px; }
    .before { background: #fff5f5; border-left: 4px solid #dc3545; }
    .after { background: #f0fff4; border-left: 4px solid #28a745; }
    .confidence { display: inline-block; padding: 6px 12px; border-radius: 20px; font-size: 0.85em; font-weight: 600; }
    .high { background: #28a745; color: white; }
    .medium { background: #ffc107; color: black; }
    .low { background: #dc3545; color: white; }
    code { background: #f1f3f4; padding: 2px 6px; border-radius: 3px; font-family: monospace; }
    pre { background: #f8f9fa; padding: 15px; border-radius: 6px; overflow-x: auto; }
  </style>
</head>
<body>
  <div class="header">
    <h1>🔍 Nimbus Preview: ${page_id}</h1>
    <p><strong>Route:</strong> <code>${content_map.route}</code></p>
    <p><strong>Type:</strong> ${directive.type} | <strong>Tone:</strong> ${directive.tone}</p>
    <p><strong>Confidence:</strong> <span class="confidence ${confidence >= 80 ? 'high' : confidence >= 60 ? 'medium' : 'low'}">${confidence}%</span></p>
  </div>
  
  ${this.generateHeadSection(content_map.head, response.head)}
  ${this.generateContentSection(response.blocks, content_map)}
  ${this.generateLinksSection(response.links, content_map)}
  ${this.generateImagesSection(response.alts)}
  ${this.generateSchemaSection(response.schema)}
  ${this.generateNotesSection(response.notes)}
  
  <div class="section">
    <p><a href="index.html">← Back to Batch Summary</a></p>
  </div>
</body>
</html>`;
    
    const previewPath = path.join(previewDir, `${page_id}.html`);
    await fs.writeFile(previewPath, html, 'utf8');
    
    return previewPath;
  },
  
  generateHeadSection(original, proposed) {
    if (!proposed || Object.keys(proposed).length === 0) return '';
    
    let content = '<div class="section"><h2>📝 Head Metadata Changes</h2>';
    
    if (proposed.title && proposed.title !== original.title) {
      content += `
        <h3>Page Title</h3>
        <div class="diff">
          <div class="before"><strong>Before:</strong><br>${this.escapeHtml(original.title || '(empty)')}</div>
          <div class="after"><strong>After:</strong><br>${this.escapeHtml(proposed.title)}</div>
        </div>`;
    }
    
    if (proposed.metaDescription && proposed.metaDescription !== original.metaDescription) {
      content += `
        <h3>Meta Description</h3>
        <div class="diff">
          <div class="before"><strong>Before:</strong><br>${this.escapeHtml(original.metaDescription || '(empty)')}</div>
          <div class="after"><strong>After:</strong><br>${this.escapeHtml(proposed.metaDescription)}</div>
        </div>`;
    }
    
    content += '</div>';
    return content;
  },
  
  generateContentSection(blocks, contentMap) {
    if (!blocks || blocks.length === 0) return '';
    
    let content = `<div class="section"><h2>✏️ Content Changes (${blocks.length})</h2>`;
    
    // Track occurrences of each selector type for proper matching
    const selectorCounts = {};
    
    blocks.forEach((block, i) => {
      // Track which occurrence of this selector type we're on
      const selectorType = block.selector;
      selectorCounts[selectorType] = (selectorCounts[selectorType] || 0) + 1;
      const occurrence = selectorCounts[selectorType];
      
      // Extract original text using the selector and occurrence number
      const originalText = this.extractOriginalTextByOccurrence(selectorType, occurrence, contentMap) || '(not found in original)';
      
      content += `
        <h3>Change ${i + 1}</h3>
        <p><strong>Selector:</strong> <code>${this.escapeHtml(block.selector)}</code></p>
        <div class="diff">
          <div class="before"><strong>Before:</strong><br>${this.escapeHtml(originalText)}</div>
          <div class="after"><strong>After:</strong><br>${this.escapeHtml(block.new_text)}</div>
        </div>`;
    });
    
    content += '</div>';
    return content;
  },
  
  generateLinksSection(links, contentMap) {
    if (!links || links.length === 0) return '';
    
    let content = `<div class="section"><h2>🔗 Link Changes (${links.length})</h2>`;
    
    links.forEach((link, i) => {
      // Extract original link text using the selector from the content map
      const originalLinkText = this.extractOriginalLinkText(link.selector, contentMap) || '(not found in original)';
      
      content += `
        <h3>Link ${i + 1}</h3>
        <p><strong>Selector:</strong> <code>${this.escapeHtml(link.selector)}</code></p>
        <div class="diff">
          <div class="before"><strong>Before:</strong><br>Text: ${this.escapeHtml(originalLinkText)}<br>URL: ${this.escapeHtml(link.new_href || 'unchanged')}</div>
          <div class="after"><strong>After:</strong><br>Text: ${this.escapeHtml(link.new_anchor)}<br>URL: ${this.escapeHtml(link.new_href || 'unchanged')}</div>
        </div>`;
    });
    
    content += '</div>';
    return content;
  },
  
  generateImagesSection(alts) {
    if (!alts || alts.length === 0) return '';
    
    let content = `<div class="section"><h2>🖼️ Image Alt Text Changes (${alts.length})</h2>`;
    
    alts.forEach((alt, i) => {
      content += `
        <h3>Image ${i + 1}</h3>
        <p><strong>Selector:</strong> <code>${this.escapeHtml(alt.selector)}</code></p>
        <div class="diff">
          <div class="before"><strong>Before:</strong><br><em>(empty or poor alt text)</em></div>
          <div class="after"><strong>After:</strong><br>${this.escapeHtml(alt.new_alt)}</div>
        </div>`;
    });
    
    content += '</div>';
    return content;
  },
  
  generateSchemaSection(schema) {
    if (!schema) return '';
    
    return `
      <div class="section">
        <h2>📋 Schema.org Markup</h2>
        <p>Adding structured data to improve search engine understanding:</p>
        <details>
          <summary>View Schema JSON</summary>
          <pre><code>${this.escapeHtml(JSON.stringify(schema, null, 2))}</code></pre>
        </details>
      </div>`;
  },
  
  generateNotesSection(notes) {
    if (!notes || notes.length === 0) return '';
    
    const notesHtml = notes.map(note => `<li>${this.escapeHtml(note)}</li>`).join('');
    
    return `
      <div class="section">
        <h2>🤖 AI Optimization Notes</h2>
        <ul>${notesHtml}</ul>
      </div>`;
  },
  
  displayConsolePreview(page, proposal) {
    const { page_id, directive, content_map } = page;
    const { response } = proposal;
    const confidence = Math.round((response.confidence || 0) * 100);
    
    console.log(chalk.blue(`\n🔍 PREVIEW: ${page_id} [${directive.type}/${directive.tone}]`));
    console.log(chalk.gray(`Route: ${content_map.route} | Confidence: ${confidence}%`));
    
    if (response.head && Object.keys(response.head).length > 0) {
      console.log(chalk.yellow('\n📝 HEAD CHANGES:'));
      if (response.head.title) {
        console.log(`   Title: "${response.head.title}"`);
      }
      if (response.head.metaDescription) {
        console.log(`   Meta: "${response.head.metaDescription.substring(0, 80)}..."`);
      }
    }
    
    if (response.blocks && response.blocks.length > 0) {
      console.log(chalk.yellow(`\n✏️ CONTENT CHANGES (${response.blocks.length}):`));
      response.blocks.slice(0, 3).forEach(block => {
        console.log(`   [${block.selector}]: "${block.new_text.substring(0, 60)}..."`);
      });
      if (response.blocks.length > 3) {
        console.log(chalk.gray(`   ... and ${response.blocks.length - 3} more`));
      }
    }
    
    if (response.links && response.links.length > 0) {
      console.log(chalk.yellow(`\n🔗 LINK CHANGES (${response.links.length}):`));
      response.links.forEach(link => {
        console.log(`   "${link.new_anchor}"`);
      });
    }
    
    if (response.notes && response.notes.length > 0) {
      console.log(chalk.yellow('\n🤖 AI NOTES:'));
      response.notes.slice(0, 3).forEach(note => {
        console.log(`   - ${note}`);
      });
    }
  },
  
  countChanges(proposal) {
    let count = 0;
    if (proposal.head) count += Object.keys(proposal.head).length;
    if (proposal.blocks) count += proposal.blocks.length;
    if (proposal.links) count += proposal.links.length;
    if (proposal.alts) count += proposal.alts.length;
    if (proposal.schema) count += 1;
    return count;
  },
  
  escapeHtml(text) {
    if (typeof text !== 'string') return text;
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  },

  // Helper method to extract original text by occurrence (1st h2, 2nd h2, etc)
  extractOriginalTextByOccurrence(selectorType, occurrence, contentMap) {
    if (!contentMap || !contentMap.blocks) return null;
    
    // Find all blocks of this type
    const matchingBlocks = contentMap.blocks.filter(block => {
      // Handle simple type selectors (h1, h2, h3, p)
      if (selectorType === 'h1' && block.type === 'h1') return true;
      if (selectorType === 'h2' && block.type === 'h2') return true;
      if (selectorType === 'h3' && block.type === 'h3') return true;
      if (selectorType === 'p' && block.type === 'p') return true;
      
      return false;
    });
    
    // Return the nth occurrence (1-based)
    const targetBlock = matchingBlocks[occurrence - 1];
    return targetBlock ? targetBlock.text : null;
  },

  // Helper method to extract original text from HTML using selector (legacy)
  extractOriginalText(selector, contentMap) {
    if (!contentMap || !contentMap.blocks) return null;
    
    // Find the block that matches this selector
    const matchingBlock = contentMap.blocks.find(block => {
      // First try exact selector match
      if (block.selector === selector) return true;
      
      // Handle simple type selectors (h1, h2, h3, p)
      if (selector === 'h1' && block.type === 'h1') return true;
      if (selector === 'h2' && block.type === 'h2') return true;
      if (selector === 'h3' && block.type === 'h3') return true;
      if (selector === 'p' && block.type === 'p') return true;
      
      return false;
    });
    
    return matchingBlock ? matchingBlock.text : null;
  },

  // Helper method to extract original link text from content map
  extractOriginalLinkText(selector, contentMap) {
    if (!contentMap || !contentMap.blocks) return null;
    
    // Find the link block that matches this selector
    const matchingBlock = contentMap.blocks.find(block => {
      return block.type === 'a' && block.selector === selector;
    });
    
    return matchingBlock ? matchingBlock.anchor : null;
  },

  // V4.5: Get header image for Google-style preview from actual page content
  getHeaderImage(result, profile, contentMap) {
    // First try to get image from content map
    if (contentMap && contentMap.blocks) {
      // Look for the first image in the content
      const imageBlock = contentMap.blocks.find(block => block.type === 'img' && block.src);
      if (imageBlock) {
        return imageBlock.src;
      }
    }
    
    // Fallback to profile default image
    if (profile.default_share_image) {
      return profile.default_share_image;
    }
    
    // Extract brand name for branded placeholder as last resort
    const brandMatch = result.page_id.match(/(.+)-watch-repair/);
    const brand = brandMatch ? brandMatch[1] : null;
    
    // Brand-specific placeholder images as final fallback
    const brandImages = {
      'hublot': 'https://via.placeholder.com/80x80/000000/FFFFFF?text=H',
      'hamilton': 'https://via.placeholder.com/80x80/2C5F2D/FFFFFF?text=HAM',
      'gucci': 'https://via.placeholder.com/80x80/8B0000/FFFFFF?text=G',
      'rolex': 'https://via.placeholder.com/80x80/006400/FFFFFF?text=R',
      'omega': 'https://via.placeholder.com/80x80/000080/FFFFFF?text=Ω',
      'fossil': 'https://via.placeholder.com/80x80/8B4513/FFFFFF?text=F'
    };
    
    // For local pages, use location placeholder
    if (result.page_id.includes('watch-repairs-')) {
      const location = result.page_id.replace('watch-repairs-', '').replace(/-/g, ' ');
      const firstLetter = location.charAt(0).toUpperCase();
      return `https://via.placeholder.com/80x80/1a73e8/FFFFFF?text=${firstLetter}`;
    }
    
    // Return brand image or final fallback
    return brandImages[brand] || 'https://via.placeholder.com/80x80/70757a/FFFFFF?text=?';
  },
  
  async generateBatchSummary(previewDir, batchData, previewResults) {
    const { batch_id, profile, proposal_summary } = batchData;
    const successfulPreviews = previewResults.filter(r => !r.error);
    
    // Load proposals to get head metadata for Google-style display
    const googleStyleResults = await Promise.all(successfulPreviews.map(async (result) => {
      try {
        const proposalPath = path.join(path.dirname(previewDir), 'proposals', `${result.page_id}.json`);
        const proposalData = JSON.parse(await fs.readFile(proposalPath, 'utf8'));
        const head = proposalData.response?.result?.head || proposalData.response?.head || {};
        const contentMap = proposalData.request?.content_map;
        
        // Get type and tone from batch data or proposal
        const pageData = batchData.pages?.find(p => p.page_id === result.page_id || result.page_id.startsWith(p.page_id));
        const toneFromProposal = proposalData.tone_tested || proposalData.request?.directive?.tone;
        
        return {
          ...result,
          title: head.title || 'No title generated',
          description: head.metaDescription || 'No description generated',
          type: pageData?.directive?.type || 'unknown',
          tone: toneFromProposal || pageData?.directive?.tone || 'unknown',
          contentMap: contentMap
        };
      } catch (error) {
        return {
          ...result,
          title: 'Error loading title',
          description: 'Error loading description',
          type: 'error',
          tone: 'error'
        };
      }
    }));
    
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nimbus Batch Preview: ${batch_id}</title>
  <style>
    body { font-family: arial, sans-serif; max-width: 1000px; margin: 0 auto; padding: 20px; background: #fff; }
    .header { padding: 20px 0; border-bottom: 1px solid #ddd; margin-bottom: 30px; }
    .stats { display: flex; gap: 30px; margin: 20px 0; }
    .stat { text-align: center; }
    .stat-number { font-size: 1.8em; font-weight: bold; color: #1a73e8; }
    .stat-label { color: #70757a; font-size: 14px; }
    
    /* Google Search Results Style */
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
    .confidence-high { color: #137333; font-weight: 500; }
    .confidence-medium { color: #ea8600; font-weight: 500; }
    .confidence-low { color: #d93025; font-weight: 500; }
    
    /* Character limit indicators */
    .char-count { font-size: 11px; color: #70757a; margin-left: 5px; }
    .char-over { color: #d93025; font-weight: bold; }
    .char-good { color: #137333; }
  </style>
</head>
<body>
  <div class="header">
    <h1>🎯 Nimbus Batch Results: ${batch_id}</h1>
    <div class="stats">
      <div class="stat">
        <div class="stat-number">${successfulPreviews.length}</div>
        <div class="stat-label">Pages Optimized</div>
      </div>
      <div class="stat">
        <div class="stat-number">${proposal_summary?.total_changes || 0}</div>
        <div class="stat-label">Total Changes</div>
      </div>
      <div class="stat">
        <div class="stat-number">${Math.round((proposal_summary?.average_confidence || 0) * 100)}%</div>
        <div class="stat-label">Avg Confidence</div>
      </div>
    </div>
    <p style="color: #70757a;"><strong>Business:</strong> ${profile.name} • <strong>Goal:</strong> ${profile.goal}</p>
  </div>

  <div class="search-results">
    ${googleStyleResults.map(result => {
      const titleLength = result.title.length;
      const descLength = result.description.length;
      const titleTruncated = titleLength > 60 ? result.title.substring(0, 57) + '...' : result.title;
      const descTruncated = descLength > 160 ? result.description.substring(0, 157) + '...' : result.description;
      const confidenceClass = result.confidence >= 0.9 ? 'confidence-high' : result.confidence >= 0.8 ? 'confidence-medium' : 'confidence-low';
      
      return `
        <div class="search-result">
          <div style="display: flex; gap: 15px; align-items: flex-start;">
            <div class="result-content" style="flex: 1; min-width: 0;">
              <a href="${result.page_id}.html" class="result-title">
                ${this.escapeHtml(titleTruncated)}
                <span class="char-count ${titleLength > 60 ? 'char-over' : 'char-good'}">${titleLength}/60</span>
              </a>
              <div class="result-url">
                ${profile.domain}${result.route || '/' + result.page_id}
              </div>
              <p class="result-description">
                ${this.escapeHtml(descTruncated)}
                <span class="char-count ${descLength > 160 ? 'char-over' : 'char-good'}">${descLength}/160</span>
              </p>
              <div class="result-meta">
                <span class="${confidenceClass}">${Math.round(result.confidence * 100)}% confidence</span>
                <span>${result.changes} changes</span>
                <span>${result.type}/${result.tone}</span>
              </div>
            </div>
            <div class="result-image" style="flex-shrink: 0;">
              <img src="${this.getHeaderImage(result, profile, result.contentMap)}" 
                   alt="${result.page_id} header" 
                   style="width: 80px; height: 80px; object-fit: cover; border-radius: 8px; border: 1px solid #dadce0;"
                   onerror="this.style.display='none'">
            </div>
          </div>
        </div>
      `;
    }).join('')}
  </div>

  <footer style="text-align: center; padding: 40px 20px; color: #70757a; border-top: 1px solid #ddd; margin-top: 40px;">
    <p>Generated by Nimbus AI Content Optimizer • Click titles to view detailed changes</p>
  </footer>
</body>
</html>`;
    
    const summaryPath = path.join(previewDir, 'index.html');
    await fs.writeFile(summaryPath, html, 'utf8');
    
    return summaryPath;
  },
  
  async openInBrowser(filePath) {
    try {
      const open = await import('open');
      await open.default(filePath);
      console.log(chalk.green(`🌐 Opened preview in browser`));
    } catch (error) {
      console.log(chalk.yellow(`⚠️  Could not open browser: ${error.message}`));
      console.log(chalk.gray(`   You can manually open: ${filePath}`));
    }
  }
};

module.exports = previewTask;