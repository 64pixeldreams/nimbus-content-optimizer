/**
 * DOM Isolator Module
 * Handles isolation of content containers for clean extraction
 */

const chalk = require('chalk');

/**
 * Extract and isolate content containers
 * @param {Object} $ - Cheerio instance
 * @param {Object} mainElement - Main content element
 * @param {string} contentClass - Content container selector
 * @param {string} aboveFoldClass - Above-fold container selector
 * @returns {Object} Isolated content containers
 */
function extractIsolatedContent($, mainElement, contentClass, aboveFoldClass) {
  // 1. Apply content class filter if provided (removes header/footer)
  let contentContainer = mainElement;
  if (contentClass) {
    const contentEl = mainElement.find(contentClass).first();
    if (contentEl.length > 0) {
      contentContainer = contentEl;
      console.log(chalk.gray(`   📦 Using content container: ${contentClass}`));
    } else {
      console.log(chalk.yellow(`   ⚠️  Content class '${contentClass}' not found, using full main element`));
    }
  }
  
  let aboveFoldContent = null;
  let restOfPageContent = null;
  
  // 2. If above-fold selector provided, extract and isolate it
  if (aboveFoldClass) {
    // Find first above-fold container
    aboveFoldContent = contentContainer.find(aboveFoldClass).first();
    
    if (aboveFoldContent.length > 0) {
      console.log(chalk.gray(`   🎯 Found above-fold container: ${aboveFoldClass} (using FIRST occurrence)`));
      
      // Clone content container for "rest of page"
      restOfPageContent = contentContainer.clone();
      
      // Remove above-fold from the cloned content (clean removal)
      restOfPageContent.find(aboveFoldClass).first().remove();
      
      console.log(chalk.gray(`   ✂️  Removed above-fold content from rest-of-page`));
    } else {
      console.log(chalk.yellow(`   ⚠️  Above-fold class '${aboveFoldClass}' not found`));
      // If no above-fold found, everything goes to rest-of-page
      restOfPageContent = contentContainer;
    }
  } else {
    // No above-fold specified, everything goes to rest-of-page
    restOfPageContent = contentContainer;
  }
  
  return {
    aboveFold: aboveFoldContent,
    restOfPage: restOfPageContent
  };
}

module.exports = {
  extractIsolatedContent
};
