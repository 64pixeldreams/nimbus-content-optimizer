/**
 * Config Manager Module - Bulletproof & Light
 * Handles extraction configuration with inheritance
 */

const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');

/**
 * Get extraction config with bulletproof inheritance
 * @param {string} folderPath - Target folder path
 * @returns {Promise<Object>} Complete configuration object
 */
async function getExtractionConfig(folderPath) {
  return await resolveConfig(folderPath, new Set());
}

/**
 * Bulletproof config resolution
 * @param {string} folderPath - Target folder path
 * @param {Set} visited - Visited paths (loop prevention)
 * @returns {Promise<Object>} Resolved configuration
 */
async function resolveConfig(folderPath, visited) {
  // Prevent infinite loops
  if (visited.has(folderPath)) {
    return { selectors: {}, extraction_rules: {}, metadata_rules: {} };
  }
  visited.add(folderPath);
  
  const configPath = path.join(folderPath, 'extraction-config.json');
  
  // Read or create config
  let config = await readOrCreateConfig(configPath, folderPath);
  
  // If inherit: true, merge with parent config
  if (config.inherit === true) {
    const parentPath = path.dirname(folderPath);
    
    // Stop at filesystem root
    if (parentPath === folderPath) {
      return config;
    }
    
    console.log(chalk.cyan(`   🔗 Inheriting from: ${parentPath}`));
    const parentConfig = await resolveConfig(parentPath, visited);
    
    // Merge parent config with local config (local overrides parent)
    return {
      ...parentConfig,
      ...config,
      selectors: { ...parentConfig.selectors, ...config.selectors },
      extraction_rules: config.extraction_rules || parentConfig.extraction_rules,
      metadata_rules: config.metadata_rules || parentConfig.metadata_rules,
      content_dimensions: config.content_dimensions || parentConfig.content_dimensions
    };
  }
  
  return config;
}

/**
 * Read existing config or create new one
 * @param {string} configPath - Config file path
 * @param {string} folderPath - Folder path for smart defaults
 * @returns {Promise<Object>} Configuration object
 */
async function readOrCreateConfig(configPath, folderPath) {
  if (await fs.pathExists(configPath)) {
    try {
      const config = await fs.readJson(configPath);
      console.log(chalk.gray(`   📋 Using config: ${configPath}`));
      return config;
    } catch (error) {
      console.log(chalk.red(`   ❌ Invalid JSON: ${configPath}`));
      console.log(chalk.yellow(`   🔧 Fix syntax or delete to regenerate`));
      return { selectors: {}, extraction_rules: {} };
    }
  } else {
    return await createSmartConfig(configPath, folderPath);
  }
}

/**
 * Create config with smart inheritance defaults
 * @param {string} configPath - Config file path  
 * @param {string} folderPath - Folder path for context
 * @returns {Promise<Object>} Created configuration
 */
async function createSmartConfig(configPath, folderPath) {
  const templatePath = path.join(__dirname, '../templates/extraction-config.json');
  
  try {
    // Copy template and modify inheritance
    await fs.copy(templatePath, configPath);
    const config = await fs.readJson(configPath);
    
    // Smart inheritance: subfolder = true, root = false
    const isRoot = isRootFolder(folderPath);
    config.inherit = !isRoot;
    
    await fs.writeJson(configPath, config, { spaces: 2 });
    
    if (isRoot) {
      console.log(chalk.green(`   ✅ Root config: ${configPath} (inherit: false)`));
    } else {
      console.log(chalk.green(`   ✅ Subfolder config: ${configPath} (inherit: true)`));
    }
    
    return config;
  } catch (error) {
    console.log(chalk.red(`   ❌ Error creating config: ${error.message}`));
    return { selectors: {}, extraction_rules: {} };
  }
}

/**
 * Check if folder is root level
 * @param {string} folderPath - Folder path
 * @returns {boolean} True if root level
 */
function isRootFolder(folderPath) {
  const normalized = folderPath.replace(/\\/g, '/');
  const folderName = path.basename(normalized);
  
  // Common root folders or single-level paths
  return ['dist', 'src', 'public', 'build'].includes(folderName) || 
         !normalized.includes('/') || 
         normalized.split('/').length <= 2;
}

/**
 * Simple config validation
 * @param {Object} config - Configuration object
 * @returns {Object} Validated selectors
 */
function validateConfig(config) {
  if (!config || !config.selectors) {
    return { main: null, above_fold: null, extraction_rules: null, metadata_rules: null, content_dimensions: {} };
  }
  
  return {
    main: config.selectors.main || null,
    above_fold: config.selectors.above_fold || null,
    extraction_rules: config.extraction_rules || null,
    metadata_rules: config.metadata_rules || null,
    content_dimensions: config.content_dimensions || {}
  };
}

module.exports = {
  getExtractionConfig,
  validateConfig
};
