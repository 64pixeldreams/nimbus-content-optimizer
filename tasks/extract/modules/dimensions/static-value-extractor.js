/**
 * Static Value Extractor
 * Returns fixed values from configuration
 */

const chalk = require('chalk');

const ERROR_CODES = {
  NO_DATA_FOUND: 'No data extracted from source',
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
 * Extract static value from configuration
 * @param {Object} config - Extraction configuration
 * @returns {Object} Extraction result
 */
function extract(config) {
  console.log(chalk.gray(`     📌 Static value extraction: ${config.value}`));
  
  // Validate config
  if (!config.value) {
    console.log(chalk.red(`     ❌ Missing static value`));
    return { success: false, error: ERROR_CODES.MISSING_CONFIG, value: null };
  }
  
  console.log(chalk.green(`     ✅ Static value: "${config.value}"`));
  
  // Process and return
  return processExtractedValue(config.value);
}

module.exports = {
  extract,
  ERROR_CODES
};
