// URL Discovery System for Strategic Deep Linking
// Scans project folders and builds available URL pools for AI linking

const fs = require('fs-extra');
const path = require('path');
const glob = require('glob');
const yaml = require('yaml');
const chalk = require('chalk');

const urlDiscoveryTask = {
  async run(options = {}) {
    console.log(chalk.blue('🔍 Discovering available URLs for strategic linking...'));
    
    // Load link configuration
    const linkConfig = await this.loadLinkConfig();
    console.log(chalk.green(`📋 Loaded link strategy configuration`));
    
    // Discover URLs from configured folders
    const availableUrls = await this.discoverUrlPools(linkConfig);
    
    // Analyze and categorize URLs
    const urlAnalysis = this.analyzeUrlPools(availableUrls);
    
    // Save discovered URLs for AI prompt usage
    await this.saveUrlDiscovery(availableUrls, urlAnalysis, linkConfig);
    
    // Display summary
    this.displayUrlSummary(urlAnalysis);
    
    console.log(chalk.green(`🎉 URL discovery complete! Ready for strategic deep linking.`));
    
    return {
      success: true,
      available_urls: availableUrls,
      analysis: urlAnalysis
    };
  },
  
  async loadLinkConfig() {
    const configPath = '_link-config.yaml';
    if (!(await fs.pathExists(configPath))) {
      throw new Error(`Link configuration not found: ${configPath}`);
    }
    
    const configContent = await fs.readFile(configPath, 'utf8');
    return yaml.parse(configContent);
  },
  
  async discoverUrlPools(linkConfig) {
    const pools = {
      money_pages: linkConfig.money_pages || [],
      service_pages: [],
      brand_pages: [],
      local_pages: [],
      help_pages: []
    };
    
    // Scan high-value folders (brands, services)
    if (linkConfig.link_pools.high_value_folders) {
      for (const folder of linkConfig.link_pools.high_value_folders) {
        const urls = await this.scanFolderForUrls(folder);
        if (folder.includes('brand')) {
          pools.brand_pages.push(...urls);
        } else if (folder.includes('service')) {
          pools.service_pages.push(...urls);
        }
      }
    }
    
    // Scan local folders (branches, locations)
    if (linkConfig.link_pools.local_folders) {
      for (const folder of linkConfig.link_pools.local_folders) {
        const urls = await this.scanFolderForUrls(folder);
        pools.local_pages.push(...urls);
      }
    }
    
    // Scan help folders (information, FAQ)
    if (linkConfig.link_pools.help_folders) {
      for (const folder of linkConfig.link_pools.help_folders) {
        const urls = await this.scanFolderForUrls(folder);
        pools.help_pages.push(...urls);
      }
    }
    
    return pools;
  },
  
  async scanFolderForUrls(folderPattern) {
    if (!folderPattern) return [];
    
    try {
      // Handle relative paths from gulp directory
      const searchPattern = folderPattern.startsWith('dist/') ? 
        '../' + folderPattern + '**/*.html' : 
        folderPattern + '**/*.html';
        
      const htmlFiles = glob.sync(searchPattern);
      
      return htmlFiles.map(filePath => {
        // Convert file path to URL route
        const normalizedPath = filePath.replace(/\\/g, '/');
        const distIndex = normalizedPath.lastIndexOf('/dist/');
        const afterDist = distIndex >= 0 ? normalizedPath.substring(distIndex + 6) : normalizedPath;
        const route = '/' + afterDist.replace(/\.html$/, '');
        
        return {
          file_path: filePath,
          route: route,
          title: this.extractTitleFromFile(filePath),
          category: this.categorizeUrl(route)
        };
      });
    } catch (error) {
      console.warn(chalk.yellow(`⚠️  Could not scan folder: ${folderPattern}`));
      return [];
    }
  },
  
  extractTitleFromFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const titleMatch = content.match(/<title[^>]*>([^<]+)<\/title>/i);
      return titleMatch ? titleMatch[1].trim() : path.basename(filePath, '.html');
    } catch (error) {
      return path.basename(filePath, '.html');
    }
  },
  
  categorizeUrl(route) {
    if (route.includes('/brand/')) return 'brand';
    if (route.includes('/service') || route.includes('/watch-repair')) return 'service';
    if (route.includes('/branch') || route.includes('/local')) return 'local';
    if (route.includes('/information') || route.includes('/faq')) return 'help';
    if (route.includes('/start-repair') || route.includes('/contact')) return 'money';
    return 'other';
  },
  
  analyzeUrlPools(availableUrls) {
    const analysis = {
      total_urls: 0,
      by_category: {},
      authority_potential: {},
      linking_opportunities: {}
    };
    
    // Count URLs by category
    Object.entries(availableUrls).forEach(([category, urls]) => {
      analysis.by_category[category] = urls.length;
      analysis.total_urls += urls.length;
    });
    
    // Calculate authority potential (local pages can boost brand pages)
    const localCount = analysis.by_category.local_pages || 0;
    const brandCount = analysis.by_category.brand_pages || 0;
    const serviceCount = analysis.by_category.service_pages || 0;
    
    analysis.authority_potential = {
      local_to_brand_boost: localCount * 2, // Each local can link to 2 brands
      local_to_service_boost: localCount * 1, // Each local can link to 1 service
      total_internal_links: localCount * 3 // Each local creates 3 internal links
    };
    
    analysis.linking_opportunities = {
      brand_pages_can_receive: brandCount * 20, // Each brand can receive many links
      service_pages_can_receive: serviceCount * 10,
      link_juice_multiplier: Math.round(localCount / brandCount) // How many locals per brand
    };
    
    return analysis;
  },
  
  async saveUrlDiscovery(availableUrls, analysis, config) {
    const discoveryData = {
      discovered_at: new Date().toISOString(),
      config: config,
      available_urls: availableUrls,
      analysis: analysis
    };
    
    await fs.ensureDir('.nimbus');
    await fs.writeJson('.nimbus/url-discovery.json', discoveryData, { spaces: 2 });
  },
  
  displayUrlSummary(analysis) {
    console.log(chalk.blue('\n📊 URL DISCOVERY SUMMARY:'));
    console.log(`- Total URLs discovered: ${chalk.yellow(analysis.total_urls)}`);
    
    Object.entries(analysis.by_category).forEach(([category, count]) => {
      if (count > 0) {
        console.log(`- ${category.replace('_', ' ')}: ${chalk.green(count)} pages`);
      }
    });
    
    console.log(chalk.blue('\n🎯 AUTHORITY POTENTIAL:'));
    console.log(`- Local→Brand authority boost: ${chalk.yellow(analysis.authority_potential.local_to_brand_boost)} potential links`);
    console.log(`- Local→Service boost: ${chalk.yellow(analysis.authority_potential.local_to_service_boost)} potential links`);
    console.log(`- Total internal links possible: ${chalk.yellow(analysis.authority_potential.total_internal_links)}`);
    
    console.log(chalk.blue('\n🔗 LINKING OPPORTUNITIES:'));
    console.log(`- Link juice multiplier: ${chalk.yellow(analysis.linking_opportunities.link_juice_multiplier)}x (locals per brand)`);
    console.log(`- Brand authority potential: ${chalk.yellow(analysis.linking_opportunities.brand_pages_can_receive)} incoming links`);
  }
};

module.exports = urlDiscoveryTask;
