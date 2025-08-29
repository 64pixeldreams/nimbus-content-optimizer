// Step 4: Preview system for proposed changes
// Implemented according to specs/step-4-preview.md

const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');

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
    
    // Generate previews for each page
    const previewResults = [];
    
    console.log(chalk.blue(`\n🔍 GENERATING PREVIEWS (${pagesToPreview.length}):`));
    
    for (let i = 0; i < pagesToPreview.length; i++) {
      const page = pagesToPreview[i];
      const { page_id, directive } = page;
      
      console.log(chalk.yellow(`⏳ ${i + 1}/${pagesToPreview.length}: ${page_id} [${directive.type}/${directive.tone}]`));
      
      try {
        // Load proposal for this page
        const proposal = await this.loadProposal(batch, page_id);
        
        // Generate preview based on format
        let previewPath;
        if (format === 'html') {
          previewPath = await this.generateHtmlPreview(previewDir, page, proposal);
        } else if (format === 'console') {
          this.displayConsolePreview(page, proposal);
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
  ${this.generateContentSection(response.blocks)}
  ${this.generateLinksSection(response.links)}
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
  
  generateContentSection(blocks) {
    if (!blocks || blocks.length === 0) return '';
    
    let content = `<div class="section"><h2>✏️ Content Changes (${blocks.length})</h2>`;
    
    blocks.forEach((block, i) => {
      content += `
        <h3>Change ${i + 1}</h3>
        <p><strong>Selector:</strong> <code>${this.escapeHtml(block.selector)}</code></p>
        <div class="diff">
          <div class="before"><strong>Before:</strong><br><em>Original content from page</em></div>
          <div class="after"><strong>After:</strong><br>${this.escapeHtml(block.new_text)}</div>
        </div>`;
    });
    
    content += '</div>';
    return content;
  },
  
  generateLinksSection(links) {
    if (!links || links.length === 0) return '';
    
    let content = `<div class="section"><h2>🔗 Link Changes (${links.length})</h2>`;
    
    links.forEach((link, i) => {
      content += `
        <h3>Link ${i + 1}</h3>
        <p><strong>Selector:</strong> <code>${this.escapeHtml(link.selector)}</code></p>
        <div class="diff">
          <div class="before"><strong>Before:</strong><br>Text: <em>Original link text</em><br>URL: ${this.escapeHtml(link.new_href || 'unchanged')}</div>
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
  
  async generateBatchSummary(previewDir, batchData, previewResults) {
    const { batch_id, profile, proposal_summary } = batchData;
    const successfulPreviews = previewResults.filter(r => !r.error);
    
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nimbus Batch Preview: ${batch_id}</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 1200px; margin: 0 auto; padding: 20px; background: #f5f6fa; }
    .header { background: white; padding: 30px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .stats { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 20px; }
    .stat { text-align: center; }
    .stat-number { font-size: 2em; font-weight: bold; color: #007bff; }
    .stat-label { color: #666; margin-top: 5px; }
    .page-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin: 20px 0; }
    .page-card { border: 1px solid #ddd; border-radius: 8px; padding: 20px; background: white; }
    .page-card h3 { margin: 0 0 10px 0; color: #333; }
    .page-card p { margin: 5px 0; color: #666; }
    .page-card a { color: #007bff; text-decoration: none; font-weight: bold; }
    .page-card a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <div class="header">
    <h1>🎯 Batch Preview: ${batch_id}</h1>
    <div class="stats">
      <div class="stat">
        <div class="stat-number">${successfulPreviews.length}</div>
        <div class="stat-label">Pages</div>
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
    <p><strong>Business:</strong> ${profile.name} (${profile.domain})</p>
    <p><strong>Goal:</strong> ${profile.goal}</p>
  </div>

  <h2>📄 Page Previews</h2>
  <div class="page-grid">
    ${successfulPreviews.map(result => `
      <div class="page-card">
        <h3>${result.page_id}</h3>
        <p>${result.changes} changes • ${Math.round(result.confidence * 100)}% confidence</p>
        <a href="${result.page_id}.html">View Preview →</a>
      </div>
    `).join('')}
  </div>

  <footer style="text-align: center; padding: 40px 20px; color: #666; border-top: 1px solid #ddd; margin-top: 40px;">
    <p>Generated by Nimbus AI Content Optimizer</p>
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