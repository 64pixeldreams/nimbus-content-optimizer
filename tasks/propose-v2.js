// V2 Multi-Prompt Proposal Task
// Uses the multi-prompt worker for comprehensive optimization

const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');

// Use dynamic import for fetch
let fetch;
(async () => {
  const { default: nodeFetch } = await import('node-fetch');
  fetch = nodeFetch;
})();

const proposeV2Task = {
  async run(options) {
    const modeText = options.headOnly ? 'Head-Only AI optimization' : 'V2 Multi-Prompt AI generation';
    console.log(chalk.blue(`🤖 Starting Nimbus ${modeText}...`));
    
    const { batch, pages, workerUrl, dryRun, tone, headOnly } = options;
    
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
    
    // Use V2 multi-prompt worker
    const finalWorkerUrl = workerUrl || 'https://nimbus-content-optimizer.martin-598.workers.dev';
    console.log(chalk.blue(`🔗 Using V2 multi-prompt worker: ${finalWorkerUrl}`));
    
    // Process each page with V2 multi-prompt
    const results = [];
    const startTime = Date.now();
    
    console.log(chalk.blue(`\n📄 V2 MULTI-PROMPT PROCESSING (${pagesToProcess.length}):`));
    
    for (let i = 0; i < pagesToProcess.length; i++) {
      const page = pagesToProcess[i];
      const { page_id, content_map } = page;
      
      // V4.5: Apply tone override if specified
      let directive = { ...page.directive };
      if (tone) {
        directive.tone = tone;
        console.log(chalk.cyan(`   🎭 Tone override: ${tone}`));
      }
      
      const displayMode = headOnly ? 'HEAD-ONLY' : directive.type;
      console.log(chalk.yellow(`⏳ ${i + 1}/${pagesToProcess.length}: ${page_id} [${displayMode}/${directive.tone}]`));
      
      try {
        let proposal;
        
        if (dryRun) {
          proposal = this.generateMockV2Proposal(workBatch.profile, directive, content_map);
          console.log(chalk.gray(`   🔍 Dry run - V2 mock proposal generated`));
        } else {
          // Send V2 multi-prompt request (or head-only)
          proposal = await this.requestV2Proposal(finalWorkerUrl, workBatch.profile, directive, content_map, headOnly);
        }
        
        const changeCount = this.countChanges(proposal);
        console.log(chalk.green(`   ✅ ${changeCount} changes (confidence: ${(proposal.confidence || 0).toFixed(2)})`));
        
        // Show V2 metadata if available
        if (proposal.v2_metadata) {
          const meta = proposal.v2_metadata;
          console.log(chalk.gray(`   🔧 V2: ${meta.successful_prompts}/5 prompts, ${(meta.total_processing_time / 1000).toFixed(1)}s, ${meta.total_tokens} tokens`));
        }
        
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
          v2_metadata: proposal.v2_metadata
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
    
    // Generate V2 summary
    const summary = this.generateV2Summary(results, totalTime);
    this.displayV2Summary(summary);
    
    if (!dryRun) {
      await this.updateBatchSummary(batch, summary);
      console.log(chalk.green(`💾 Updated batch summary with V2 metadata`));
    }
    
    console.log(chalk.green(`🎉 V2 Multi-prompt proposals complete! Ready for preview`));
    
    return {
      success: true,
      batch_id: batch,
      processed: results.length,
      summary,
      dry_run: dryRun
    };
  },
  
  async requestV2Proposal(workerUrl, profile, directive, contentMap, headOnly = false) {
    if (!fetch) {
      const { default: nodeFetch } = await import('node-fetch');
      fetch = nodeFetch;
    }
    
    const requestBody = {
      prompt_type: headOnly ? 'head' : 'multi', // V4.5: Head-only mode for rapid testing
      model: 'gpt-4-turbo-preview',
      profile,
      directive,
      content_map: contentMap,
      cache_bust: Date.now(), // V4.5: Force cache miss for fresh content
      no_cache: true // V4.5: Always get fresh results for testing
    };
    
    const response = await fetch(workerUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
      timeout: 60000 // 60 second timeout for multi-prompt
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`V2 Worker request failed: ${response.status} ${errorText}`);
    }
    
    const proposal = await response.json();
    
    if (!proposal || typeof proposal !== 'object') {
      throw new Error('Invalid V2 proposal response from worker');
    }
    
    return proposal;
  },
  
  // Use existing methods from propose.js
  async loadWorkBatch(batchId) {
    const batchPath = `.nimbus/work/${batchId}/batch.json`;
    if (!(await fs.pathExists(batchPath))) {
      throw new Error(`Work batch not found: ${batchPath}. Run nimbus:plan first.`);
    }
    return await fs.readJson(batchPath);
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
  
  async saveProposal(batchId, pageId, request, response) {
    const proposalDir = `.nimbus/work/${batchId}/proposals`;
    await fs.ensureDir(proposalDir);
    
    const proposal = {
      page_id: pageId,
      created: new Date().toISOString(),
      status: 'completed',
      version: 'v2-multi-prompt',
      request,
      response,
      processing_time_ms: response.v2_metadata?.total_processing_time || 0
    };
    
    const proposalPath = path.join(proposalDir, `${pageId}.json`);
    await fs.writeJson(proposalPath, proposal, { spaces: 2 });
  },
  
  generateV2Summary(results, totalTime) {
    const completed = results.filter(r => r.status === 'completed');
    const failed = results.filter(r => r.status === 'failed');
    
    const totalChanges = completed.reduce((sum, r) => sum + r.changes, 0);
    const avgConfidence = completed.length > 0 ? 
      completed.reduce((sum, r) => sum + r.confidence, 0) / completed.length : 0;
    
    return {
      version: 'v2-multi-prompt',
      total_pages: results.length,
      completed: completed.length,
      failed: failed.length,
      total_changes: totalChanges,
      average_confidence: avgConfidence,
      processing_time_ms: totalTime,
      processing_time_s: (totalTime / 1000).toFixed(1)
    };
  },
  
  displayV2Summary(summary) {
    console.log(chalk.blue('\n📊 V2 MULTI-PROMPT SUMMARY:'));
    console.log(`- Version: ${chalk.yellow(summary.version)}`);
    console.log(`- Total changes proposed: ${chalk.yellow(summary.total_changes)}`);
    console.log(`- Average confidence: ${chalk.yellow((summary.average_confidence).toFixed(2))}`);
    console.log(`- Processing time: ${chalk.yellow(summary.processing_time_s)}s`);
    console.log(`- Success rate: ${chalk.green(summary.completed)}/${summary.total_pages} pages`);
  },
  
  async updateBatchSummary(batchId, summary) {
    const batchPath = `.nimbus/work/${batchId}/batch.json`;
    const batch = await fs.readJson(batchPath);
    
    batch.status = 'v2_proposals_complete';
    batch.proposal_summary = summary;
    batch.updated = new Date().toISOString();
    
    await fs.writeJson(batchPath, batch, { spaces: 2 });
  },
  
  generateMockV2Proposal(profile, directive, contentMap) {
    return {
      head: { title: "Mock V2 title", metaDescription: "Mock V2 description" },
      blocks: [{ selector: "h1", new_text: "Mock V2 content" }],
      links: [{ selector: "a", new_anchor: "Mock V2 link", new_href: "/mock" }],
      alts: [{ selector: "img", new_alt: "Mock V2 alt" }],
      schema: { "@context": "https://schema.org", "@type": "LocalBusiness" },
      confidence: 0.95,
      notes: ["Mock V2 proposal for dry run"],
      v2_metadata: { execution_type: 'mock', prompt_count: 5 }
    };
  }
};

module.exports = proposeV2Task;
