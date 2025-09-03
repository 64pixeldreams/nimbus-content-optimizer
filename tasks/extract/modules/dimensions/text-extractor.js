/**
 * Text Extractor Utility
 * Extracts raw text from HTML containers using various methods
 */

const chalk = require('chalk');

/**
 * Extract raw text from inside a container element
 * @param {Object} $ - Cheerio instance
 * @param {string} selector - CSS selector for the container
 * @param {Object} options - Extraction options
 * @returns {string|null} Extracted raw text or null if not found
 */
function getRawTextFromContainer($, selector, options = {}) {
  const {
    extractAll = false,        // Extract from all matching elements or just first
    separator = ' ',           // Separator when combining multiple elements
    preserveSpacing = false    // Preserve original spacing or normalize
  } = options;

  console.log(chalk.gray(`       🔍 Extracting text from: ${selector}`));

  try {
    const elements = $(selector);
    
    if (elements.length === 0) {
      console.log(chalk.red(`       ❌ No elements found for selector: ${selector}`));
      return null;
    }

    let rawText;

    if (extractAll && elements.length > 1) {
      // Extract text from ALL matching elements
      console.log(chalk.gray(`       📦 Found ${elements.length} elements, extracting from all`));
      
      const textArray = [];
      elements.each((index, element) => {
        const elementText = $(element).text();
        if (elementText && elementText.trim()) {
          textArray.push(elementText.trim());
        }
      });
      
      rawText = textArray.join(separator);
    } else {
      // Extract text from FIRST matching element only
      console.log(chalk.gray(`       📦 Found ${elements.length} elements, using first`));
      rawText = elements.first().text();
    }

    if (!rawText || rawText.trim() === '') {
      console.log(chalk.red(`       ❌ No text content found in elements`));
      return null;
    }

    // Process spacing
    if (!preserveSpacing) {
      // Normalize whitespace (collapse multiple spaces, remove newlines)
      rawText = rawText.replace(/\s+/g, ' ').trim();
    }

    console.log(chalk.green(`       ✅ Extracted raw text: "${rawText}"`));
    return rawText;

  } catch (error) {
    console.log(chalk.red(`       ❌ Text extraction error: ${error.message}`));
    return null;
  }
}

/**
 * Extract text with automatic fallback selectors
 * @param {Object} $ - Cheerio instance
 * @param {string|Array} selectors - Primary selector or array of fallback selectors
 * @param {Object} options - Extraction options
 * @returns {string|null} Extracted text or null if all selectors fail
 */
function getRawTextWithFallback($, selectors, options = {}) {
  const selectorArray = Array.isArray(selectors) ? selectors : [selectors];
  
  console.log(chalk.gray(`       🔄 Trying ${selectorArray.length} selector(s) with fallback`));
  
  for (let i = 0; i < selectorArray.length; i++) {
    const selector = selectorArray[i];
    const text = getRawTextFromContainer($, selector, options);
    
    if (text) {
      console.log(chalk.green(`       ✅ Success with selector ${i + 1}/${selectorArray.length}: ${selector}`));
      return text;
    }
    
    console.log(chalk.yellow(`       ⏭️  Selector ${i + 1}/${selectorArray.length} failed, trying next...`));
  }
  
  console.log(chalk.red(`       ❌ All ${selectorArray.length} selectors failed`));
  return null;
}

/**
 * Extract text from specific HTML attributes
 * @param {Object} $ - Cheerio instance
 * @param {string} selector - CSS selector
 * @param {string} attribute - HTML attribute name (e.g., 'content', 'value', 'alt')
 * @returns {string|null} Extracted attribute value or null
 */
function getRawTextFromAttribute($, selector, attribute) {
  console.log(chalk.gray(`       🏷️  Extracting attribute '${attribute}' from: ${selector}`));
  
  try {
    const element = $(selector).first();
    
    if (element.length === 0) {
      console.log(chalk.red(`       ❌ No elements found for selector: ${selector}`));
      return null;
    }
    
    const attributeValue = element.attr(attribute);
    
    if (!attributeValue || attributeValue.trim() === '') {
      console.log(chalk.red(`       ❌ No '${attribute}' attribute found or empty`));
      return null;
    }
    
    const rawText = attributeValue.trim();
    console.log(chalk.green(`       ✅ Extracted attribute text: "${rawText}"`));
    return rawText;
    
  } catch (error) {
    console.log(chalk.red(`       ❌ Attribute extraction error: ${error.message}`));
    return null;
  }
}

module.exports = {
  getRawTextFromContainer,
  getRawTextWithFallback,
  getRawTextFromAttribute
};
