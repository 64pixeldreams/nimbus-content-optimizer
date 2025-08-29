// Step 5: Approval workflow for proposed changes
// Implemented according to specs/step-5-approval.md

const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const inquirer = require('inquirer');

const approveTask = {
  async run(options) {
    console.log(chalk.blue('🔍 Starting Nimbus approval workflow...'));
    
    const { batch, pages, mode = 'interactive', confidence } = options;
    
    // Validate required options
    if (!batch) {
      throw new Error('--batch option is required');
    }
    
    // Load batch and proposals
    const batchData = await this.loadBatchData(batch);
    console.log(chalk.green(`📊 Loaded batch: ${batchData.batch_id} (${batchData.pages.length} pages)`));
    
    // Filter to specific pages if requested
    let pagesToReview = batchData.pages;
    if (pages) {
      const requestedIds = pages.split(',').map(id => id.trim());
      pagesToReview = batchData.pages.filter(page => requestedIds.includes(page.page_id));
      
      if (pagesToReview.length === 0) {
        throw new Error(`No matching pages found for: ${pages}`);
      }
    }
    
    // Ensure approvals directory exists
    const approvalsDir = `.nimbus/work/${batch}/approvals`;
    await fs.ensureDir(approvalsDir);
    
    // Process approvals based on mode
    const approvalResults = [];
    const confidenceThreshold = confidence ? parseFloat(confidence) : null;
    
    console.log(chalk.blue(`\n🔍 REVIEWING PAGES (${pagesToReview.length}) - Mode: ${mode}`));
    if (confidenceThreshold) {
      console.log(chalk.gray(`Confidence threshold: ${Math.round(confidenceThreshold * 100)}%`));
    }
    
    for (let i = 0; i < pagesToReview.length; i++) {
      const page = pagesToReview[i];
      const { page_id, directive } = page;
      
      console.log(chalk.yellow(`\n⏳ ${i + 1}/${pagesToReview.length}: ${page_id} [${directive.type}/${directive.tone}]`));
      
      try {
        // Load proposal for this page
        const proposal = await this.loadProposal(batch, page_id);
        
        // Process approval based on mode
        let approvalRecord;
        if (mode === 'auto') {
          approvalRecord = await this.autoApprove(page, proposal, confidenceThreshold);
        } else if (mode === 'reject') {
          approvalRecord = await this.rejectAll(page, proposal);
        } else {
          approvalRecord = await this.interactiveApprove(page, proposal);
        }
        
        // Save approval record
        await this.saveApprovalRecord(approvalsDir, approvalRecord);
        
        const { approved, rejected, approval_rate } = approvalRecord.summary;
        console.log(chalk.green(`   ✅ ${approved}/${approved + rejected} changes approved (${Math.round(approval_rate * 100)}%)`));
        
        approvalResults.push(approvalRecord);
        
      } catch (error) {
        console.log(chalk.red(`   ❌ Failed: ${error.message}`));
        
        approvalResults.push({
          page_id,
          error: error.message,
          summary: { approved: 0, rejected: 0, approval_rate: 0 }
        });
      }
    }
    
    // Generate summary and update batch
    const summary = this.generateApprovalSummary(approvalResults, mode, confidenceThreshold);
    await this.updateBatchWithApprovals(batch, summary);
    
    this.displayApprovalSummary(summary);
    
    console.log(chalk.green(`🎉 Approval workflow complete! Ready for Step 6 (apply changes)`));
    
    return {
      success: true,
      batch_id: batch,
      pages_reviewed: approvalResults.filter(r => !r.error).length,
      mode,
      approval_summary: summary
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
  
  async interactiveApprove(page, proposal) {
    const { page_id, content_map, directive } = page;
    const { response } = proposal;
    const confidence = Math.round((response.confidence || 0) * 100);
    
    // Display page summary
    console.log(chalk.blue(`\n🔍 APPROVAL REVIEW: ${page_id} [${directive.type}/${directive.tone}]`));
    console.log(chalk.gray(`Route: ${content_map.route}`));
    console.log(chalk.gray(`Confidence: ${confidence}% | Changes: ${this.countChanges(response)}`));
    
    // Show change summary
    this.displayChangeSummary(response);
    
    // Get user decision
    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: 'What would you like to do?',
        choices: [
          { name: '✅ Approve all changes', value: 'approve_all' },
          { name: '❌ Reject all changes', value: 'reject_all' },
          { name: '🔍 Selective approval (choose individual changes)', value: 'selective' },
          { name: '👀 Preview in browser', value: 'preview' },
          { name: '⏭️  Skip this page', value: 'skip' }
        ]
      }
    ]);
    
    if (action === 'preview') {
      await this.openPreview(page_id, proposal.batch_id || 'current');
      // Recursively ask again after preview
      return await this.interactiveApprove(page, proposal);
    }
    
    if (action === 'skip') {
      throw new Error('Page skipped by user');
    }
    
    if (action === 'approve_all') {
      return this.createApprovalRecord(page, proposal, 'approve_all');
    }
    
    if (action === 'reject_all') {
      return this.createApprovalRecord(page, proposal, 'reject_all');
    }
    
    if (action === 'selective') {
      return await this.selectiveApprove(page, proposal);
    }
    
    throw new Error('Invalid action selected');
  },
  
  async selectiveApprove(page, proposal) {
    const { response } = proposal;
    const decisions = {};
    
    console.log(chalk.blue('\n🔍 SELECTIVE APPROVAL - Choose individual changes:'));
    
    // Head changes
    if (response.head && Object.keys(response.head).length > 0) {
      console.log(chalk.yellow('\n📝 HEAD CHANGES:'));
      decisions.head = {};
      
      if (response.head.title) {
        const { approve } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'approve',
            message: `Title: "${response.head.title.substring(0, 60)}..." - Approve?`,
            default: true
          }
        ]);
        decisions.head.title = { approved: approve, confidence: 0.9, reason: 'manual' };
      }
      
      if (response.head.metaDescription) {
        const { approve } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'approve',
            message: `Meta: "${response.head.metaDescription.substring(0, 60)}..." - Approve?`,
            default: true
          }
        ]);
        decisions.head.metaDescription = { approved: approve, confidence: 0.85, reason: 'manual' };
      }
    }
    
    // Content blocks
    if (response.blocks && response.blocks.length > 0) {
      console.log(chalk.yellow('\n✏️ CONTENT CHANGES:'));
      decisions.blocks = [];
      
      for (let i = 0; i < Math.min(response.blocks.length, 5); i++) {
        const block = response.blocks[i];
        const { approve } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'approve',
            message: `[${block.selector}]: "${block.new_text.substring(0, 50)}..." - Approve?`,
            default: true
          }
        ]);
        decisions.blocks.push({ index: i, approved: approve, confidence: 0.8, reason: 'manual' });
      }
      
      // Auto-approve remaining blocks if many
      if (response.blocks.length > 5) {
        for (let i = 5; i < response.blocks.length; i++) {
          decisions.blocks.push({ index: i, approved: true, confidence: 0.8, reason: 'auto' });
        }
        console.log(chalk.gray(`   Auto-approved ${response.blocks.length - 5} additional content changes`));
      }
    }
    
    // Links
    if (response.links && response.links.length > 0) {
      console.log(chalk.yellow('\n🔗 LINK CHANGES:'));
      decisions.links = [];
      
      for (let i = 0; i < response.links.length; i++) {
        const link = response.links[i];
        const { approve } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'approve',
            message: `Link: "${link.new_anchor}" - Approve?`,
            default: true
          }
        ]);
        decisions.links.push({ index: i, approved: approve, confidence: 0.75, reason: 'manual' });
      }
    }
    
    // Alt texts
    if (response.alts && response.alts.length > 0) {
      console.log(chalk.yellow('\n🖼️ IMAGE ALT TEXT CHANGES:'));
      decisions.alts = [];
      
      for (let i = 0; i < response.alts.length; i++) {
        const alt = response.alts[i];
        const { approve } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'approve',
            message: `Alt: "${alt.new_alt.substring(0, 50)}..." - Approve?`,
            default: true
          }
        ]);
        decisions.alts.push({ index: i, approved: approve, confidence: 0.95, reason: 'manual' });
      }
    }
    
    // Schema
    if (response.schema) {
      console.log(chalk.yellow('\n📋 SCHEMA MARKUP:'));
      const { approve } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'approve',
          message: 'Add structured data schema - Approve?',
          default: true
        }
      ]);
      decisions.schema = { approved: approve, confidence: 0.85, reason: 'manual' };
    }
    
    return this.createApprovalRecord(page, proposal, 'selective', decisions);
  },
  
  async autoApprove(page, proposal, confidenceThreshold = 0.8) {
    console.log(chalk.gray(`   🤖 Auto-approving changes above ${Math.round(confidenceThreshold * 100)}% confidence`));
    
    const decisions = {};
    const { response } = proposal;
    
    // Auto-approve based on confidence
    if (response.head) {
      decisions.head = {};
      Object.keys(response.head).forEach(key => {
        const confidence = 0.85; // Mock confidence for head changes
        decisions.head[key] = {
          approved: confidence >= confidenceThreshold,
          confidence,
          reason: confidence >= confidenceThreshold ? 'auto_approved' : 'auto_rejected'
        };
      });
    }
    
    if (response.blocks) {
      decisions.blocks = response.blocks.map((block, i) => {
        const confidence = 0.8 + Math.random() * 0.15; // Mock confidence
        return {
          index: i,
          approved: confidence >= confidenceThreshold,
          confidence,
          reason: confidence >= confidenceThreshold ? 'auto_approved' : 'auto_rejected'
        };
      });
    }
    
    if (response.links) {
      decisions.links = response.links.map((link, i) => {
        const confidence = 0.75 + Math.random() * 0.2; // Mock confidence
        return {
          index: i,
          approved: confidence >= confidenceThreshold,
          confidence,
          reason: confidence >= confidenceThreshold ? 'auto_approved' : 'auto_rejected'
        };
      });
    }
    
    if (response.alts) {
      decisions.alts = response.alts.map((alt, i) => {
        const confidence = 0.9 + Math.random() * 0.1; // Mock confidence
        return {
          index: i,
          approved: confidence >= confidenceThreshold,
          confidence,
          reason: confidence >= confidenceThreshold ? 'auto_approved' : 'auto_rejected'
        };
      });
    }
    
    if (response.schema) {
      const confidence = 0.85;
      decisions.schema = {
        approved: confidence >= confidenceThreshold,
        confidence,
        reason: confidence >= confidenceThreshold ? 'auto_approved' : 'auto_rejected'
      };
    }
    
    return this.createApprovalRecord(page, proposal, 'auto', decisions, confidenceThreshold);
  },
  
  async rejectAll(page, proposal) {
    console.log(chalk.gray('   ❌ Rejecting all changes'));
    return this.createApprovalRecord(page, proposal, 'reject_all');
  },
  
  createApprovalRecord(page, proposal, approvalMode, decisions = null, confidenceThreshold = null) {
    const { page_id } = page;
    const { response } = proposal;
    
    let finalDecisions = decisions;
    
    // Generate decisions based on approval mode if not provided
    if (!decisions) {
      finalDecisions = {};
      
      if (response.head) {
        finalDecisions.head = {};
        Object.keys(response.head).forEach(key => {
          finalDecisions.head[key] = {
            approved: approvalMode === 'approve_all',
            confidence: 0.85,
            reason: approvalMode
          };
        });
      }
      
      if (response.blocks) {
        finalDecisions.blocks = response.blocks.map((block, i) => ({
          index: i,
          approved: approvalMode === 'approve_all',
          confidence: 0.8,
          reason: approvalMode
        }));
      }
      
      if (response.links) {
        finalDecisions.links = response.links.map((link, i) => ({
          index: i,
          approved: approvalMode === 'approve_all',
          confidence: 0.75,
          reason: approvalMode
        }));
      }
      
      if (response.alts) {
        finalDecisions.alts = response.alts.map((alt, i) => ({
          index: i,
          approved: approvalMode === 'approve_all',
          confidence: 0.95,
          reason: approvalMode
        }));
      }
      
      if (response.schema) {
        finalDecisions.schema = {
          approved: approvalMode === 'approve_all',
          confidence: 0.85,
          reason: approvalMode
        };
      }
    }
    
    // Calculate summary
    const summary = this.calculateApprovalSummary(finalDecisions);
    
    return {
      page_id,
      batch_id: proposal.batch_id || 'unknown',
      approved_at: new Date().toISOString(),
      approval_mode: approvalMode,
      confidence_threshold: confidenceThreshold,
      decisions: finalDecisions,
      summary,
      notes: []
    };
  },
  
  calculateApprovalSummary(decisions) {
    let totalChanges = 0;
    let approved = 0;
    
    // Count head changes
    if (decisions.head) {
      Object.values(decisions.head).forEach(decision => {
        totalChanges++;
        if (decision.approved) approved++;
      });
    }
    
    // Count block changes
    if (decisions.blocks) {
      decisions.blocks.forEach(decision => {
        totalChanges++;
        if (decision.approved) approved++;
      });
    }
    
    // Count link changes
    if (decisions.links) {
      decisions.links.forEach(decision => {
        totalChanges++;
        if (decision.approved) approved++;
      });
    }
    
    // Count alt changes
    if (decisions.alts) {
      decisions.alts.forEach(decision => {
        totalChanges++;
        if (decision.approved) approved++;
      });
    }
    
    // Count schema
    if (decisions.schema) {
      totalChanges++;
      if (decisions.schema.approved) approved++;
    }
    
    const rejected = totalChanges - approved;
    const approval_rate = totalChanges > 0 ? approved / totalChanges : 0;
    
    return {
      total_changes: totalChanges,
      approved,
      rejected,
      approval_rate
    };
  },
  
  displayChangeSummary(response) {
    if (response.head && Object.keys(response.head).length > 0) {
      console.log(chalk.yellow('\n📝 HEAD CHANGES:'));
      if (response.head.title) {
        console.log(`   Title: "${response.head.title.substring(0, 60)}..."`);
      }
      if (response.head.metaDescription) {
        console.log(`   Meta: "${response.head.metaDescription.substring(0, 60)}..."`);
      }
    }
    
    if (response.blocks && response.blocks.length > 0) {
      console.log(chalk.yellow(`\n✏️ CONTENT CHANGES (${response.blocks.length}):`));
      response.blocks.slice(0, 3).forEach(block => {
        console.log(`   [${block.selector}]: "${block.new_text.substring(0, 50)}..."`);
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
    
    if (response.alts && response.alts.length > 0) {
      console.log(chalk.yellow(`\n🖼️ IMAGE CHANGES (${response.alts.length}):`));
      response.alts.forEach(alt => {
        console.log(`   Alt: "${alt.new_alt.substring(0, 50)}..."`);
      });
    }
    
    if (response.schema) {
      console.log(chalk.yellow('\n📋 SCHEMA ADDED: LocalBusiness, BreadcrumbList'));
    }
  },
  
  async saveApprovalRecord(approvalsDir, approvalRecord) {
    const approvalPath = path.join(approvalsDir, `${approvalRecord.page_id}.json`);
    await fs.writeJson(approvalPath, approvalRecord, { spaces: 2 });
  },
  
  generateApprovalSummary(approvalResults, mode, confidenceThreshold) {
    const validResults = approvalResults.filter(r => !r.error);
    
    const totalPages = validResults.length;
    const totalChanges = validResults.reduce((sum, r) => sum + r.summary.total_changes, 0);
    const changesApproved = validResults.reduce((sum, r) => sum + r.summary.approved, 0);
    const changesRejected = validResults.reduce((sum, r) => sum + r.summary.rejected, 0);
    
    const pagesApproved = validResults.filter(r => r.summary.approval_rate === 1).length;
    const pagesRejected = validResults.filter(r => r.summary.approval_rate === 0).length;
    const pagesPartial = validResults.filter(r => r.summary.approval_rate > 0 && r.summary.approval_rate < 1).length;
    
    const overallApprovalRate = totalChanges > 0 ? changesApproved / totalChanges : 0;
    
    return {
      total_pages: totalPages,
      pages_reviewed: totalPages,
      pages_approved: pagesApproved,
      pages_rejected: pagesRejected,
      pages_partial: pagesPartial,
      total_changes: totalChanges,
      changes_approved: changesApproved,
      changes_rejected: changesRejected,
      approval_rate: overallApprovalRate,
      confidence_threshold: confidenceThreshold,
      approval_mode: mode
    };
  },
  
  async updateBatchWithApprovals(batchId, summary) {
    const batchPath = `.nimbus/work/${batchId}/batch.json`;
    const batch = await fs.readJson(batchPath);
    
    batch.status = 'approvals_complete';
    batch.approval_summary = summary;
    batch.ready_for_apply = summary.changes_approved > 0;
    batch.updated = new Date().toISOString();
    
    await fs.writeJson(batchPath, batch, { spaces: 2 });
  },
  
  displayApprovalSummary(summary) {
    console.log(chalk.blue('\n📊 APPROVAL SUMMARY:'));
    console.log(`- Total changes: ${chalk.yellow(summary.total_changes)}`);
    console.log(`- Approved: ${chalk.green(summary.changes_approved)} (${Math.round(summary.approval_rate * 100)}%)`);
    console.log(`- Rejected: ${chalk.red(summary.changes_rejected)} (${Math.round((1 - summary.approval_rate) * 100)}%)`);
    console.log(`- Pages ready for apply: ${chalk.yellow(summary.pages_approved + summary.pages_partial)}/${summary.total_pages}`);
    
    if (summary.confidence_threshold) {
      console.log(`- Confidence threshold: ${Math.round(summary.confidence_threshold * 100)}%`);
    }
  },
  
  async openPreview(pageId, batchId) {
    const previewPath = `.nimbus/work/${batchId}/previews/${pageId}.html`;
    if (await fs.pathExists(previewPath)) {
      try {
        const open = await import('open');
        await open.default(path.resolve(previewPath));
        console.log(chalk.green(`🌐 Opened preview in browser`));
      } catch (error) {
        console.log(chalk.yellow(`⚠️  Could not open browser. Preview available at: ${previewPath}`));
      }
    } else {
      console.log(chalk.yellow(`⚠️  Preview not found. Run nimbus:preview first.`));
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
  }
};

module.exports = approveTask;