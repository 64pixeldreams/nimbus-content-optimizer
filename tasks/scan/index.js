/**
 * V2 Scan System - Main Entry Point
 * Modular content scanning and mapping system
 */

const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');

// Import modules
const { discoverFiles } = require('./modules/file-discovery');
const { extractContent } = require('../extract');
const { generateMapFileName, generatePageId, generateRoute } = require('./modules/utils');
const { getExtractionConfig, validateConfig } = require('./modules/config-manager');

const scanTask = {
  /**
   * Main scan operation
   * @param {Object} options - Scan options
   * @returns {Promise<Object>} Scan results
   */
  async run(options) {
    console.log(chalk.blue('🔍 Starting content scanning and mapping...'));
    
    const { 
      folder, 
      limit = 10, 
      batch = 'new', 
      main: customMainSelector,
      contentClass,      // Optional: selector for main content area (e.g., "main", ".content")
      aboveFoldClass     // Optional: selector for above-fold/hero area (e.g., ".hero", ".container")
    } = options;
    
    // Validate required options
    if (!folder) {
      throw new Error('--folder option is required');
    }
    
    // Ensure .nimbus directories exist
    await fs.ensureDir('.nimbus/maps');
    await fs.ensureDir('.nimbus/work');
    
    // Get extraction config for this folder
    const folderConfig = await getExtractionConfig(folder);
    const config = validateConfig(folderConfig);
    
    // Override with command line options if provided
    const finalConfig = {
      customMainSelector: customMainSelector || config.main,
      contentClass: contentClass || config.main,
      aboveFoldClass: aboveFoldClass || config.above_fold,
      extractionRules: config.extraction_rules || null,
      metadataRules: config.metadata_rules || null,
      contentDimensionsRules: config.content_dimensions || {}
    };
    
    if (config.main || config.above_fold) {
      console.log(chalk.cyan(`   ⚙️  Using config selectors - main: "${finalConfig.contentClass || 'auto'}", above-fold: "${finalConfig.aboveFoldClass || 'none'}"`));
    }
    
    // Discover HTML files
    const htmlFiles = await discoverFiles(folder, parseInt(limit));
    console.log(chalk.green(`📁 Found ${htmlFiles.length} HTML files to scan`));
    
    const contentMaps = [];
    
    // Process each HTML file
    for (let i = 0; i < htmlFiles.length; i++) {
      const filePath = htmlFiles[i];
      console.log(chalk.blue(`📄 Processing ${i + 1}/${htmlFiles.length}: ${path.basename(filePath)}`));
      
      try {
        // Extract content using the extract system with config
        const extractedContent = await extractContent(filePath, {
          customMainSelector: finalConfig.customMainSelector,
          contentClass: finalConfig.contentClass,
          aboveFoldClass: finalConfig.aboveFoldClass,
          extractionRules: finalConfig.extractionRules,
          metadataRules: finalConfig.metadataRules,
          contentDimensionsRules: finalConfig.contentDimensionsRules
        });
        
        // Build complete content map
        const contentMap = {
          path: filePath,
          route: generateRoute(filePath),
          ...extractedContent
        };
        
        contentMaps.push(contentMap);
        
        // Save individual content map
        const mapFileName = generateMapFileName(filePath);
        await fs.writeJson(`.nimbus/maps/${mapFileName}`, contentMap, { spaces: 2 });
        
        console.log(chalk.green(`✅ Generated content map: ${mapFileName}`));
      } catch (error) {
        console.error(chalk.red(`❌ Error processing ${filePath}:`), error.message);
      }
    }
    
    // Create index file
    const indexData = {
      batch_id: batch,
      created: new Date().toISOString(),
      total_pages: contentMaps.length,
      pages: contentMaps.map(map => ({
        id: generatePageId(map.path),
        path: map.path,
        route: map.route,
        title: map.head.title
      }))
    };
    
    await fs.writeJson('.nimbus/maps/index.json', indexData, { spaces: 2 });
    
    console.log(chalk.green(`🎉 Content scanning complete! Generated ${contentMaps.length} content maps`));
    
    return {
      success: true,
      maps_generated: contentMaps.length,
      batch_id: batch
    };
  }
};

module.exports = scanTask;
