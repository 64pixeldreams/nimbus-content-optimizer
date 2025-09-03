/**
 * Content Dimension Extractor
 * Main orchestrator for extracting structured data from content
 */

const chalk = require('chalk');

// Import dimension extraction modules
const urlExtractor = require('./dimensions/url-pattern-extractor');
const contentExtractor = require('./dimensions/content-selector-extractor');
const staticExtractor = require('./dimensions/static-value-extractor');
const metadataExtractor = require('./dimensions/metadata-extractor');

/**
 * Extract content dimensions from HTML
 * @param {string} filePath - File path for URL extraction
 * @param {Object} $ - Cheerio instance for DOM extraction
 * @param {Object} extractedContent - Already extracted content with head metadata
 * @param {Object} dimensionsConfig - Content dimensions configuration
 * @returns {Promise<Object>} Extraction results
 */
async function extractContentDimensions(filePath, $, extractedContent, dimensionsConfig) {
  console.log(chalk.blue('   🎯 Starting content dimension extraction...'));
  
  // Skip if no dimensions config
  if (!dimensionsConfig || Object.keys(dimensionsConfig).length === 0) {
    console.log(chalk.gray('   ⏭️  No content dimensions configured, skipping'));
    return {};
  }
  
  const results = {};
  let successCount = 0;
  let totalCount = 0;
  
  // Process each dimension
  for (const [dimensionName, config] of Object.entries(dimensionsConfig)) {
    // Skip empty configs
    if (!config || Object.keys(config).length === 0) {
      console.log(chalk.gray(`   ⏭️  Skipping empty dimension: ${dimensionName}`));
      continue;
    }
    
    // Skip disabled dimensions
    if (config.enabled === false) {
      console.log(chalk.gray(`   ⏭️  Skipping disabled dimension: ${dimensionName}`));
      continue;
    }
    
    console.log(chalk.cyan(`   📦 Processing dimension: ${dimensionName}`));
    totalCount++;
    
    let extractionResult;
    
    // Route to appropriate extraction method
    switch (config.extraction_method) {
      case 'url_pattern':
        extractionResult = urlExtractor.extract(filePath, config);
        break;
        
      case 'content_selector':
        extractionResult = contentExtractor.extract($, config);
        break;
        
      case 'static_value':
        extractionResult = staticExtractor.extract(config);
        break;
        
      case 'metadata':
        extractionResult = metadataExtractor.extract(extractedContent, config);
        break;
        
      default:
        console.log(chalk.red(`   ❌ Unknown extraction method: ${config.extraction_method}`));
        extractionResult = { 
          success: false, 
          error: 'UNKNOWN_METHOD', 
          value: null 
        };
    }
    
    // Store result
    results[dimensionName] = extractionResult;
    
    if (extractionResult.success) {
      successCount++;
      console.log(chalk.green(`   ✅ ${dimensionName}: "${extractionResult.value}"`));
    } else {
      console.log(chalk.red(`   ❌ ${dimensionName}: ${extractionResult.error}`));
    }
  }
  
  // Summary
  if (totalCount > 0) {
    console.log(chalk.blue(`   📊 Dimension extraction complete: ${successCount}/${totalCount} successful`));
  }
  
  return results;
}

module.exports = {
  extractContentDimensions
};
