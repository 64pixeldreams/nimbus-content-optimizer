/**
 * Content Selector Extractor
 * Extracts data from HTML elements using CSS selectors
 */

const chalk = require('chalk');
const { getRawTextFromContainer } = require('./text-extractor');

const ERROR_CODES = {
  NO_DATA_FOUND: 'No data extracted from source',
  SELECTOR_NOT_FOUND: 'CSS selector found no elements',
  MISSING_CONFIG: 'Required config fields missing'
};

/**
 * Process extracted value with consistent formatting
 * @param {string} rawValue - Raw extracted value
 * @returns {Object} Processed result
 */
function processExtractedValue(rawValue) {
  if (!rawValue || rawValue.trim() === '') {
    return { success: false, error: ERROR_CODES.NO_DATA_FOUND, value: null };
  }
  
  return { 
    success: true, 
    value: rawValue.trim().toLowerCase(),
    error: null 
  };
}

/**
 * Extract data from HTML elements using CSS selector
 * @param {Object} $ - Cheerio instance
 * @param {Object} config - Extraction configuration
 * @returns {Object} Extraction result
 */
function extract($, config) {
  console.log(chalk.gray(`     🎯 Content selector extraction: ${config.source}`));
  
  // Validate config
  if (!config.source) {
    console.log(chalk.red(`     ❌ Missing source selector`));
    return { success: false, error: ERROR_CODES.MISSING_CONFIG, value: null };
  }
  
  try {
    // Use dedicated text extractor to get raw text from container
    const rawValue = getRawTextFromContainer($, config.source, {
      extractAll: false,        // Extract from first matching element only
      preserveSpacing: false    // Normalize whitespace
    });
    
    if (!rawValue) {
      console.log(chalk.red(`     ❌ No text extracted from selector: ${config.source}`));
      return { success: false, error: ERROR_CODES.SELECTOR_NOT_FOUND, value: null };
    }
    
    console.log(chalk.green(`     ✅ Extracted: "${rawValue}"`));
    
    // Process and return
    return processExtractedValue(rawValue);
    
  } catch (error) {
    console.log(chalk.red(`     ❌ Selector error: ${error.message}`));
    return { success: false, error: ERROR_CODES.SELECTOR_NOT_FOUND, value: null };
  }
}

module.exports = {
  extract,
  ERROR_CODES
};
