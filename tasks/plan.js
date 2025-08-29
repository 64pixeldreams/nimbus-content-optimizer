// Step 2: Profile and directive merging task
// Implemented according to specs/step-2-profile-directive.md

const fs = require('fs-extra');
const path = require('path');
const yaml = require('yaml');
const chalk = require('chalk');

const planTask = {
  async run(options) {
    console.log(chalk.blue('📋 Starting Nimbus planning and configuration merge...'));
    
    const { batch, pages, 'dry-run': dryRun } = options;
    
    // Validate required options
    if (!batch) {
      throw new Error('--batch option is required');
    }
    
    // Load profile configuration
    const profile = await this.loadProfile();
    console.log(chalk.green(`📊 Loaded profile: ${profile.name} (${profile.domain})`));
    
    // Load directive configuration
    const directives = await this.loadDirectives();
    console.log(chalk.green(`📝 Loaded directive configuration with ${Object.keys(directives.families).length} page families`));
    
    // Load content maps from previous scan
    const contentMaps = await this.loadContentMaps(pages);
    console.log(chalk.green(`📄 Loaded ${contentMaps.length} content maps`));
    
    // Process each page: match directives and merge configurations
    const processedPages = [];
    for (const contentMap of contentMaps) {
      const directive = this.matchDirective(contentMap.route, directives);
      const processedPage = {
        page_id: this.generatePageId(contentMap.path),
        content_map: contentMap,
        directive: directive,
        status: 'ready'
      };
      processedPages.push(processedPage);
    }
    
    // Create work batch
    const workBatch = {
      batch_id: batch,
      created: new Date().toISOString(),
      profile: profile,
      pages: processedPages,
      summary: this.generateSummary(processedPages)
    };
    
    // Generate planning report
    this.generatePlanningReport(workBatch);
    
    if (!dryRun) {
      // Ensure work directory exists
      await fs.ensureDir(`.nimbus/work/${batch}`);
      
      // Save work batch
      await fs.writeJson(`.nimbus/work/${batch}/batch.json`, workBatch, { spaces: 2 });
      console.log(chalk.green(`💾 Work batch saved: .nimbus/work/${batch}/batch.json`));
    } else {
      console.log(chalk.yellow('🔍 Dry run mode - no files were created'));
    }
    
    console.log(chalk.green(`🎉 Planning complete! Ready for Step 3 (AI proposals)`));
    
    return {
      success: true,
      batch_id: batch,
      pages_planned: processedPages.length,
      dry_run: dryRun
    };
  },
  
  async loadProfile() {
    const profilePath = 'profile.yaml';
    if (!(await fs.pathExists(profilePath))) {
      throw new Error(`Profile configuration not found: ${profilePath}`);
    }
    
    const profileContent = await fs.readFile(profilePath, 'utf8');
    const profile = yaml.parse(profileContent);
    
    // Validate required profile fields
    const requiredFields = ['name', 'domain', 'services', 'goal'];
    for (const field of requiredFields) {
      if (!profile[field]) {
        throw new Error(`Profile missing required field: ${field}`);
      }
    }
    
    return profile;
  },
  
  async loadDirectives() {
    const directivePath = '_directive.yaml';
    if (!(await fs.pathExists(directivePath))) {
      throw new Error(`Directive configuration not found: ${directivePath}`);
    }
    
    const directiveContent = await fs.readFile(directivePath, 'utf8');
    const directives = yaml.parse(directiveContent);
    
    // Validate directive structure
    if (!directives.default) {
      throw new Error('Directive configuration missing default rules');
    }
    if (!directives.families) {
      throw new Error('Directive configuration missing families section');
    }
    
    return directives;
  },
  
  async loadContentMaps(specificPages = null) {
    const mapsDir = '.nimbus/maps';
    if (!(await fs.pathExists(mapsDir))) {
      throw new Error('No content maps found. Run nimbus:scan:map first.');
    }
    
    // Load index to get available pages
    const indexPath = path.join(mapsDir, 'index.json');
    if (!(await fs.pathExists(indexPath))) {
      throw new Error('Content maps index not found. Run nimbus:scan:map first.');
    }
    
    const index = await fs.readJson(indexPath);
    let pagesToLoad = index.pages;
    
    // Filter to specific pages if requested
    if (specificPages) {
      const requestedIds = specificPages.split(',').map(id => id.trim());
      pagesToLoad = index.pages.filter(page => requestedIds.includes(page.id));
      
      if (pagesToLoad.length === 0) {
        throw new Error(`No matching pages found for: ${specificPages}`);
      }
    }
    
    // Load content maps
    const contentMaps = [];
    for (const page of pagesToLoad) {
      const mapPath = path.join(mapsDir, `${page.id}.json`);
      if (await fs.pathExists(mapPath)) {
        const contentMap = await fs.readJson(mapPath);
        contentMaps.push(contentMap);
      } else {
        console.warn(chalk.yellow(`⚠️  Content map not found: ${mapPath}`));
      }
    }
    
    return contentMaps;
  },
  
  matchDirective(route, directives) {
    // Start with default directive
    let matchedDirective = { ...directives.default };
    
    // Try to match against family patterns
    for (const [familyName, familyConfig] of Object.entries(directives.families)) {
      if (this.matchesPattern(route, familyConfig.pattern)) {
        // Merge family-specific config over defaults
        matchedDirective = {
          ...matchedDirective,
          ...familyConfig
        };
        
        // Remove the pattern field from final directive
        delete matchedDirective.pattern;
        
        console.log(chalk.blue(`📍 ${route} → ${familyName} family`));
        break;
      }
    }
    
    return matchedDirective;
  },
  
  matchesPattern(route, pattern) {
    // Convert route to comparable format
    const normalizedRoute = route.replace(/^\//, ''); // Remove leading slash
    
    if (pattern === 'index') {
      return normalizedRoute === '' || normalizedRoute === 'index';
    }
    
    if (pattern.endsWith('/*')) {
      const prefix = pattern.slice(0, -2); // Remove /*
      return normalizedRoute.startsWith(prefix);
    }
    
    return normalizedRoute === pattern;
  },
  
  generateSummary(pages) {
    const summary = {
      total_pages: pages.length,
      by_type: {},
      by_tone: {},
      schema_types: {}
    };
    
    for (const page of pages) {
      const { type, tone, schema_types } = page.directive;
      
      // Count by type
      summary.by_type[type] = (summary.by_type[type] || 0) + 1;
      
      // Count by tone
      summary.by_tone[tone] = (summary.by_tone[tone] || 0) + 1;
      
      // Count schema types
      if (schema_types) {
        for (const schemaType of schema_types) {
          summary.schema_types[schemaType] = (summary.schema_types[schemaType] || 0) + 1;
        }
      }
    }
    
    return summary;
  },
  
  generatePlanningReport(workBatch) {
    const { batch_id, profile, pages, summary } = workBatch;
    
    console.log(chalk.blue('\n📋 NIMBUS PLANNING REPORT'));
    console.log(chalk.blue('═'.repeat(50)));
    console.log(`Batch: ${chalk.yellow(batch_id)}`);
    console.log(`Profile: ${chalk.green(profile.name)} (${profile.domain})`);
    console.log(`Goal: ${chalk.cyan(profile.goal)}`);
    
    console.log(chalk.blue(`\n📄 PAGES TO PROCESS (${pages.length}):`));
    for (const page of pages) {
      const { page_id, content_map, directive } = page;
      const typeColor = this.getTypeColor(directive.type);
      const toneColor = this.getToneColor(directive.tone);
      
      console.log(`${chalk.green('✅')} ${chalk.white(page_id)} [${typeColor(directive.type)}/${toneColor(directive.tone)}] → ${directive.schema_types.join(' + ')}`);
      console.log(`   Route: ${chalk.gray(content_map.route)}`);
      console.log(`   CTA Priority: ${directive.cta_priority} | Trust Signals: ${directive.trust_signals.join(', ')}`);
    }
    
    console.log(chalk.blue('\n📊 SUMMARY:'));
    for (const [type, count] of Object.entries(summary.by_type)) {
      console.log(`- ${this.getTypeColor(type)(type)} pages: ${count}`);
    }
    console.log(`- Tone distribution: ${Object.entries(summary.by_tone).map(([tone, count]) => `${tone}(${count})`).join(', ')}`);
    console.log(`- Schema types: ${Object.entries(summary.schema_types).map(([type, count]) => `${type}(${count})`).join(', ')}`);
    
    console.log(chalk.blue('\n🎯 OPTIMIZATION GOALS:'));
    console.log(`- Primary: ${chalk.cyan(profile.goal)}`);
    if (profile.money_pages) {
      console.log(`- Money pages: ${profile.money_pages.join(', ')}`);
    }
    if (profile.review_count && profile.guarantee) {
      console.log(`- Trust signals: ${profile.review_count} reviews, ${profile.guarantee}`);
    }
    
    console.log(''); // Empty line for spacing
  },
  
  getTypeColor(type) {
    const colors = {
      'local': chalk.green,
      'brand': chalk.blue,
      'landing': chalk.magenta,
      'service': chalk.cyan,
      'info': chalk.gray
    };
    return colors[type] || chalk.white;
  },
  
  getToneColor(tone) {
    const colors = {
      'professional': chalk.blue,
      'friendly': chalk.green,
      'urgent': chalk.red,
      'helpful': chalk.yellow
    };
    return colors[tone] || chalk.white;
  },
  
  generatePageId(filePath) {
    // Convert file path to page ID
    const basename = path.basename(filePath, '.html');
    return basename === 'index' ? 'home' : basename;
  }
};

module.exports = planTask;