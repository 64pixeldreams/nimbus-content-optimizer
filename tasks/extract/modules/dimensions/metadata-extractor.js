/**
 * Metadata Extractor
 * Extracts data from already-extracted metadata using simple lookup
 */

const chalk = require('chalk');

const ERROR_CODES = {
  NO_DATA_FOUND: 'No data extracted from source',
  INVALID_SOURCE: 'Invalid metadata source variable',
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
 * Extract data from already-extracted metadata
 * @param {Object} extractedContent - Already extracted content with head metadata
 * @param {Object} config - Extraction configuration
 * @returns {Object} Extraction result
 */
function extract(extractedContent, config) {
  console.log(chalk.gray(`     🏷️  Metadata lookup: ${config.source}`));
  
  // Validate config
  if (!config.source) {
    console.log(chalk.red(`     ❌ Missing metadata source`));
    return { success: false, error: ERROR_CODES.MISSING_CONFIG, value: null };
  }
  
  // Map source variables to extracted data
  const sourceMap = {
    '{meta-title}': extractedContent.head?.title,
    '{meta-description}': extractedContent.head?.metaDescription,
    '{og-title}': extractedContent.head?.ogTitle,
    '{og-description}': extractedContent.head?.ogDescription,
    '{twitter-title}': extractedContent.head?.twitterTitle,
    '{twitter-description}': extractedContent.head?.twitterDescription,
    '{canonical-url}': extractedContent.head?.canonical,
    '{absoluteurl}': extractedContent.path
  };
  
  // Look up the value
  const rawValue = sourceMap[config.source];
  
  if (rawValue === undefined) {
    console.log(chalk.red(`     ❌ Invalid metadata source: ${config.source}`));
    console.log(chalk.gray(`     💡 Available sources: ${Object.keys(sourceMap).join(', ')}`));
    return { success: false, error: ERROR_CODES.INVALID_SOURCE, value: null };
  }
  
  if (!rawValue) {
    console.log(chalk.red(`     ❌ No data found for: ${config.source}`));
    return { success: false, error: ERROR_CODES.NO_DATA_FOUND, value: null };
  }
  
  console.log(chalk.green(`     ✅ Found: "${rawValue}"`));
  
  // Process and return
  return processExtractedValue(rawValue);
}

module.exports = {
  extract,
  ERROR_CODES
};
