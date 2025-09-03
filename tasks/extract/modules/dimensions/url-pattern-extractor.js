/**
 * URL Pattern Extractor
 * Extracts data from URLs using regex patterns
 */

const chalk = require('chalk');

const ERROR_CODES = {
  NO_DATA_FOUND: 'No data extracted from source',
  INVALID_PATTERN: 'Regex pattern failed to match',
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
 * Extract data from URL using regex pattern
 * @param {string} filePath - File path or URL
 * @param {Object} config - Extraction configuration
 * @returns {Object} Extraction result
 */
function extract(filePath, config) {
  console.log(chalk.gray(`     🔗 URL pattern extraction: ${config.pattern}`));
  
  // Validate config
  if (!config.pattern || !config.extract) {
    console.log(chalk.red(`     ❌ Missing pattern or extract config`));
    return { success: false, error: ERROR_CODES.MISSING_CONFIG, value: null };
  }
  
  try {
    // Extract using regex
    const match = filePath.match(new RegExp(config.pattern));
    if (!match || !config.extract.startsWith('$')) {
      console.log(chalk.red(`     ❌ Pattern did not match: ${config.pattern}`));
      return { success: false, error: ERROR_CODES.INVALID_PATTERN, value: null };
    }
    
    const groupIndex = parseInt(config.extract.substring(1)); // $1 -> 1
    const rawValue = match[groupIndex];
    
    console.log(chalk.green(`     ✅ Extracted: "${rawValue}"`));
    
    // Process and return
    return processExtractedValue(rawValue);
    
  } catch (error) {
    console.log(chalk.red(`     ❌ Regex error: ${error.message}`));
    return { success: false, error: ERROR_CODES.INVALID_PATTERN, value: null };
  }
}

module.exports = {
  extract,
  ERROR_CODES
};
