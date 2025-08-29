// Step 3: AI proposal generation task
// Implemented according to specs/step-3-ai-proposals.md

const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');

// Use dynamic import for fetch since we're in CommonJS
let fetch;
(async () => {
  const { default: nodeFetch } = await import('node-fetch');
  fetch = nodeFetch;
})();

const proposeTask = {
  async run(options) {
    console.log(chalk.blue('🤖 Starting Nimbus AI proposal generation...'));
    
    const { batch, pages, workerUrl, dryRun } = options;
    

    // Validate required options
    if (!batch) {
      throw new Error('--batch option is required');
    }
    
    // Load work batch
    const workBatch = await this.loadWorkBatch(batch);
    console.log(chalk.green(`📊 Loaded batch: ${workBatch.batch_id} (${workBatch.pages.length} pages)`));
    
    // Filter to specific pages if requested
    let pagesToProcess = workBatch.pages;
    if (pages) {
      const requestedIds = pages.split(',').map(id => id.trim());
      pagesToProcess = workBatch.pages.filter(page => requestedIds.includes(page.page_id));
      
      if (pagesToProcess.length === 0) {
        throw new Error(`No matching pages found for: ${pages}`);
      }
    }
    
    // Set up worker URL
    const finalWorkerUrl = workerUrl || this.getDefaultWorkerUrl();
    console.log(chalk.blue(`🔗 Using worker: ${finalWorkerUrl}`));
    
    // Process each page
    const results = [];
    const startTime = Date.now();
    
    console.log(chalk.blue(`\n📄 PROCESSING PAGES (${pagesToProcess.length}):`));
    
    for (let i = 0; i < pagesToProcess.length; i++) {
      const page = pagesToProcess[i];
      const { page_id, content_map, directive } = page;
      
      console.log(chalk.yellow(`⏳ ${i + 1}/${pagesToProcess.length}: ${page_id} [${directive.type}/${directive.tone}]`));
      
      try {
        let proposal;
        
        if (dryRun) {
          // Generate mock proposal for dry run
          proposal = this.generateMockProposal(workBatch.profile, directive, content_map);
          console.log(chalk.gray(`   🔍 Dry run - mock proposal generated`));
        } else {
          // Send actual request to worker or use mock if worker not available
          if (finalWorkerUrl === 'MOCK') {
            proposal = this.generateMockProposal(workBatch.profile, directive, content_map);
            console.log(chalk.gray(`   🔄 Using mock mode (no worker URL provided)`));
          } else {
            proposal = await this.requestProposal(finalWorkerUrl, workBatch.profile, directive, content_map);
          }
        }
        
        const changeCount = this.countChanges(proposal);
        console.log(chalk.green(`   ✅ ${changeCount} changes (confidence: ${(proposal.confidence || 0).toFixed(2)})`));
        
        // Save proposal
        if (!dryRun) {
          await this.saveProposal(batch, page_id, {
            profile: workBatch.profile,
            directive,
            content_map
          }, proposal);
        }
        
        results.push({
          page_id,
          status: 'completed',
          changes: changeCount,
          confidence: proposal.confidence || 0,
          processing_time_ms: Date.now() - startTime
        });
        
      } catch (error) {
        console.log(chalk.red(`   ❌ Failed: ${error.message}`));
        
        results.push({
          page_id,
          status: 'failed',
          error: error.message,
          changes: 0,
          confidence: 0
        });
      }
    }
    
    const totalTime = Date.now() - startTime;
    
    // Generate summary
    const summary = this.generateSummary(results, totalTime);
    this.displaySummary(summary);
    
    if (!dryRun) {
      // Update batch with proposal summary
      await this.updateBatchSummary(batch, summary);
      console.log(chalk.green(`💾 Updated batch summary`));
    }
    
    console.log(chalk.green(`🎉 AI proposals complete! Ready for Step 4 (preview)`));
    
    return {
      success: true,
      batch_id: batch,
      processed: results.length,
      completed: results.filter(r => r.status === 'completed').length,
      failed: results.filter(r => r.status === 'failed').length,
      dry_run: dryRun
    };
  },
  
  async loadWorkBatch(batchId) {
    const batchPath = `.nimbus/work/${batchId}/batch.json`;
    if (!(await fs.pathExists(batchPath))) {
      throw new Error(`Work batch not found: ${batchPath}. Run nimbus:plan first.`);
    }
    
    return await fs.readJson(batchPath);
  },
  
  getDefaultWorkerUrl() {
    // Production Cloudflare Worker with OpenAI GPT-4 integration
    return 'https://nimbus-content-optimizer.martin-598.workers.dev';
  },
  
  async requestProposal(workerUrl, profile, directive, contentMap) {
    // Ensure fetch is available
    if (!fetch) {
      const { default: nodeFetch } = await import('node-fetch');
      fetch = nodeFetch;
    }
    
    const requestBody = {
      profile,
      directive,
      content_map: contentMap
    };
    
    const response = await fetch(workerUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
      timeout: 30000 // 30 second timeout
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Worker request failed: ${response.status} ${errorText}`);
    }
    
    const proposal = await response.json();
    
    // Validate proposal structure
    if (!proposal || typeof proposal !== 'object') {
      throw new Error('Invalid proposal response from worker');
    }
    
    return proposal;
  },
  
  generateMockProposal(profile, directive, contentMap) {
    // Generate a simple mock proposal for dry run mode
    const { route, head, blocks } = contentMap;
    const { type, tone } = directive;
    
    const location = this.extractLocation(route);
    
    return {
      head: {
        title: type === 'local' && location ? 
          `Professional Watch Repairs in ${location} | Free Collection & ${profile.guarantee}` :
          head.title,
        metaDescription: `Expert watch repair service${location ? ` in ${location}` : ''}. ${profile.guarantee}, ${profile.review_count} reviews.`
      },
      blocks: blocks.slice(0, 3).map((block, i) => ({
        selector: block.selector,
        new_text: `Optimized ${block.type} content for ${type}/${tone} tone`
      })),
      links: blocks.filter(b => b.type === 'a' && b.href?.includes('start-repair')).slice(0, 1).map(block => ({
        selector: block.selector,
        new_anchor: 'GET FREE QUOTE (2 MINS)',
        new_href: block.href
      })),
      alts: blocks.filter(b => b.type === 'img' && (!b.alt || b.alt.length < 10)).slice(0, 2).map(block => ({
        selector: block.selector,
        new_alt: `Professional watch repair service${location ? ` in ${location}` : ''}`
      })),
      schema: {
        '@context': 'https://schema.org',
        '@type': 'LocalBusiness',
        'name': location ? `${profile.name} - ${location}` : profile.name
      },
      confidence: 0.75 + Math.random() * 0.2,
      notes: [
        `Optimized for ${type} page type with ${tone} tone`,
        location ? `Added location-specific content for ${location}` : 'Enhanced general content',
        'Improved meta description and title tags',
        'Added schema markup for better SEO'
      ]
    };
  },
  
  extractLocation(route) {
    const match = route.match(/\/branches\/watch-repairs-(.+)/);
    if (match) {
      return match[1].replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
    return null;
  },
  
  countChanges(proposal) {
    let count = 0;
    
    if (proposal.head) {
      count += Object.keys(proposal.head).length;
    }
    
    if (proposal.blocks) {
      count += proposal.blocks.length;
    }
    
    if (proposal.links) {
      count += proposal.links.length;
    }
    
    if (proposal.alts) {
      count += proposal.alts.length;
    }
    
    if (proposal.schema) {
      count += 1; // Count schema as one change
    }
    
    return count;
  },
  
  async saveProposal(batchId, pageId, request, response) {
    const proposalDir = `.nimbus/work/${batchId}/proposals`;
    await fs.ensureDir(proposalDir);
    
    const proposal = {
      page_id: pageId,
      created: new Date().toISOString(),
      status: 'completed',
      request,
      response,
      processing_time_ms: Date.now() - Date.now() // This would be calculated properly
    };
    
    const proposalPath = path.join(proposalDir, `${pageId}.json`);
    await fs.writeJson(proposalPath, proposal, { spaces: 2 });
  },
  
  generateSummary(results, totalTime) {
    const completed = results.filter(r => r.status === 'completed');
    const failed = results.filter(r => r.status === 'failed');
    
    const totalChanges = completed.reduce((sum, r) => sum + r.changes, 0);
    const avgConfidence = completed.length > 0 ? 
      completed.reduce((sum, r) => sum + r.confidence, 0) / completed.length : 0;
    
    return {
      total_pages: results.length,
      completed: completed.length,
      failed: failed.length,
      total_changes: totalChanges,
      average_confidence: avgConfidence,
      processing_time_ms: totalTime,
      processing_time_s: (totalTime / 1000).toFixed(1)
    };
  },
  
  displaySummary(summary) {
    console.log(chalk.blue('\n📊 PROPOSAL SUMMARY:'));
    console.log(`- Total changes proposed: ${chalk.yellow(summary.total_changes)}`);
    console.log(`- Average confidence: ${chalk.yellow((summary.average_confidence).toFixed(2))}`);
    console.log(`- Processing time: ${chalk.yellow(summary.processing_time_s)}s`);
    console.log(`- Success rate: ${chalk.green(summary.completed)}/${summary.total_pages} pages`);
    
    if (summary.failed > 0) {
      console.log(chalk.red(`- Failed: ${summary.failed} pages`));
    }
  },
  
  async updateBatchSummary(batchId, summary) {
    const batchPath = `.nimbus/work/${batchId}/batch.json`;
    const batch = await fs.readJson(batchPath);
    
    batch.status = summary.failed === 0 ? 'proposals_complete' : 'proposals_partial';
    batch.proposal_summary = summary;
    batch.updated = new Date().toISOString();
    
    await fs.writeJson(batchPath, batch, { spaces: 2 });
  }
};

module.exports = proposeTask;