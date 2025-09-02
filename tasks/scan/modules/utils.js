/**
 * Utility Functions for V2 Scan System
 * All generator and helper functions
 */

const path = require('path');

/**
 * Convert file path to URL route
 * @param {string} filePath - File path to convert
 * @returns {string} URL route
 */
function generateRoute(filePath) {
  // Convert file path to route
  // ../dist/local/watch-repairs-abbots-langley.html -> /branches/watch-repairs-abbots-langley
  const normalizedPath = filePath.replace(/\\/g, '/');
  
  // Find the dist part in the path
  const distIndex = normalizedPath.indexOf('/dist/');
  if (distIndex === -1) {
    // Fallback: use basename
    const basename = path.basename(filePath, '.html');
    return basename === 'index' ? '/' : `/${basename}`;
  }
  
  // Extract path after dist/
  const afterDist = normalizedPath.substring(distIndex + 6); // +6 for '/dist/'
  const routePath = afterDist.replace(/\.html$/, '');
  
  if (routePath === 'index' || routePath === '') {
    return '/';
  } else if (routePath.startsWith('local/')) {
    return `/branches/${routePath.replace('local/', '')}`;
  } else if (routePath.startsWith('brands/')) {
    return `/brands/${routePath.replace('brands/', '')}`;
  } else {
    return `/${routePath}`;
  }
}

/**
 * Generate page ID from file path
 * @param {string} filePath - File path
 * @returns {string} Page ID
 */
function generatePageId(filePath) {
  // Convert file path to page ID
  // dist/local/watch-repairs-abbots-langley.html -> watch-repairs-abbots-langley
  const basename = path.basename(filePath, '.html');
  return basename === 'index' ? 'home' : basename;
}

/**
 * Generate unique element ID
 * @param {number} index - Element index
 * @param {string} type - Element type
 * @returns {string} Element ID
 */
function generateElementId(index, type) {
  // Use simple incremental ID for easy reference
  return (index + 1).toString();
}

/**
 * Generate content map filename
 * @param {string} filePath - Source file path
 * @returns {string} JSON filename
 */
function generateMapFileName(filePath) {
  const pageId = generatePageId(filePath);
  return `${pageId}.json`;
}

/**
 * Generate unique CSS selector for element
 * @param {Object} $ - Cheerio instance
 * @param {Object} elem - DOM element
 * @param {string} mainSelector - Main container selector
 * @returns {string} CSS selector
 */
function generateUniqueSelector($, elem, mainSelector) {
  const $elem = $(elem);
  const tagName = elem.tagName.toLowerCase();
  
  // Get classes
  const className = $elem.attr('class');
  let selector = mainSelector + ' ' + tagName;
  
  if (className) {
    const firstClass = className.split(' ')[0];
    selector += '.' + firstClass;
    
    // Check if this selector is unique
    if ($(selector).length === 1) {
      return selector;
    }
  }
  
  // Use nth-of-type for repeated elements
  const siblings = $elem.siblings(tagName).addBack();
  const index = siblings.index($elem) + 1;
  
  if (className) {
    return `${mainSelector} ${tagName}.${className.split(' ')[0]}:nth-of-type(${index})`;
  } else {
    return `${mainSelector} ${tagName}:nth-of-type(${index})`;
  }
}

module.exports = {
  generateRoute,
  generatePageId,
  generateElementId,
  generateMapFileName,
  generateUniqueSelector
};
