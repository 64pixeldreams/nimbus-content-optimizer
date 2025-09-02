/**
 * Content Finder Module
 * Handles detection of main content areas in HTML
 */

const chalk = require('chalk');

/**
 * Find main content container using heuristics
 * @param {Object} $ - Cheerio instance
 * @param {string} customSelector - Custom main selector if provided
 * @returns {string} CSS selector for main content
 */
function findMainContent($, customSelector) {
  if (customSelector) {
    return customSelector;
  }
  
  // Priority order for finding main content
  const selectors = [
    'main',
    '[role="main"]',
    'article',
    '#content',
    '.content'
  ];
  
  for (const selector of selectors) {
    if ($(selector).length > 0) {
      return selector;
    }
  }
  
  // Heuristic fallback: find container with highest text density
  let bestSelector = 'body';
  let maxTextLength = 0;
  
  $('body > *').each((i, elem) => {
    const $elem = $(elem);
    const tagName = elem.tagName.toLowerCase();
    
    // Skip navigation, header, footer, aside
    if (['header', 'nav', 'footer', 'aside', 'script', 'style', 'link'].includes(tagName)) {
      return;
    }
    
    const textLength = $elem.text().trim().length;
    if (textLength > maxTextLength) {
      maxTextLength = textLength;
      bestSelector = generateSelector($, elem);
    }
  });
  
  return bestSelector;
}

/**
 * Generate basic selector for element
 * @param {Object} $ - Cheerio instance
 * @param {Object} elem - DOM element
 * @returns {string} CSS selector
 */
function generateSelector($, elem) {
  const $elem = $(elem);
  const tagName = elem.tagName.toLowerCase();
  const id = $elem.attr('id');
  const className = $elem.attr('class');
  
  if (id) {
    return `#${id}`;
  } else if (className) {
    return `${tagName}.${className.split(' ')[0]}`;
  } else {
    return tagName;
  }
}

module.exports = {
  findMainContent
};
