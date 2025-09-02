/**
 * Content Extraction System - Main Entry Point
 * Handles extraction of content from HTML files
 */

const fs = require('fs-extra');
const cheerio = require('cheerio');
const chalk = require('chalk');

// Import extraction modules
const { extractHeadMetadata } = require('./modules/metadata-extractor');
const { findMainContent } = require('./modules/content-finder');
const { extractIsolatedContent } = require('./modules/dom-isolator');
const { extractBlocksFromDOM } = require('./modules/block-extractor');

/**
 * Extract content from a single HTML file
 * @param {string} filePath - Path to HTML file
 * @param {Object} options - Extraction options
 * @returns {Promise<Object>} Extracted content data
 */
async function extractContent(filePath, options = {}) {
  const {
    customMainSelector,
    contentClass,
    aboveFoldClass,
    extractionRules
  } = options;
  
  // Load HTML file
  const htmlContent = await fs.readFile(filePath, 'utf8');
  const $ = cheerio.load(htmlContent);
  
  // Extract head metadata
  const head = extractHeadMetadata($);
  
  // Find main content container
  const mainSelector = findMainContent($, customMainSelector);
  const mainElement = $(mainSelector);
  
  if (mainElement.length === 0) {
    throw new Error(`No main content found with selector: ${mainSelector}`);
  }
  
  // Extract content blocks using isolated DOM approach
  const extractionResult = extractContentBlocksIsolated(
    $, 
    mainElement, 
    mainSelector,
    contentClass,
    aboveFoldClass,
    extractionRules
  );
  
  return {
    engine: 'html',
    main_selector: mainSelector,
    head: head,
    blocks: extractionResult.blocks,                    // All blocks (backward compat)
    above_fold_blocks: extractionResult.above_fold,     // Blocks in above-fold area
    rest_of_page_blocks: extractionResult.rest_of_page, // Blocks outside above-fold
    selector_map: extractionResult.selectorMap,          // ID-to-selector mapping
    extraction_config: {                                 // Document what selectors were used
      content_class: contentClass || null,
      above_fold_class: aboveFoldClass || null
    }
  };
}

/**
 * Extract content blocks using isolated DOM approach
 * @param {Object} $ - Cheerio instance
 * @param {Object} mainElement - Main content element
 * @param {string} mainSelector - Main selector
 * @param {string} contentClass - Content class
 * @param {string} aboveFoldClass - Above-fold class
 * @returns {Object} Extraction results
 */
function extractContentBlocksIsolated($, mainElement, mainSelector, contentClass, aboveFoldClass, extractionRules) {
  // Extract isolated content first
  const isolatedContent = extractIsolatedContent($, mainElement, contentClass, aboveFoldClass);
  
  let allBlocks = [];
  let above_fold = [];
  let rest_of_page = [];
  let selectorMap = {};
  let index = 0;
  
  // Get extraction rules for each context
  const aboveFoldRules = extractionRules?.above_fold || [];
  const restOfPageRules = extractionRules?.rest_of_page || [];
  
  // Extract above-fold blocks from isolated DOM
  if (isolatedContent.aboveFold && isolatedContent.aboveFold.length > 0) {
    console.log(chalk.gray(`   🎯 Extracting blocks from isolated above-fold content`));
    const aboveFoldResult = extractBlocksFromDOM($, isolatedContent.aboveFold, index, 'above-fold', aboveFoldRules);
    above_fold = aboveFoldResult.blocks;
    Object.assign(selectorMap, aboveFoldResult.selectorMap);
    index = aboveFoldResult.nextIndex;
  }
  
  // Extract rest-of-page blocks from cleaned DOM
  if (isolatedContent.restOfPage && isolatedContent.restOfPage.length > 0) {
    console.log(chalk.gray(`   📄 Extracting blocks from rest-of-page content`));
    const restOfPageResult = extractBlocksFromDOM($, isolatedContent.restOfPage, index, 'rest-of-page', restOfPageRules);
    rest_of_page = restOfPageResult.blocks;
    Object.assign(selectorMap, restOfPageResult.selectorMap);
  }
  
  // Combine all blocks for backward compatibility
  allBlocks = [...above_fold, ...rest_of_page];
  
  // Log extraction summary
  if (aboveFoldClass) {
    console.log(chalk.gray(`   📊 Extraction summary: ${above_fold.length} above-fold blocks, ${rest_of_page.length} rest-of-page blocks`));
  }
  
  return { blocks: allBlocks, above_fold, rest_of_page, selectorMap };
}

module.exports = {
  extractContent
};
