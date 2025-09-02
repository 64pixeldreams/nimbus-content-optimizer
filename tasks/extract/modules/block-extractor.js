/**
 * Block Extractor Module
 * Handles extraction of content blocks from isolated DOM containers
 */

const chalk = require('chalk');
const { enhancedTextExtractor } = require('../../../lib/enhanced-text-extractor');
const { generateUniqueSelector, generateElementId } = require('../../scan/modules/utils');
const { getTagType, classifyLinkType } = require('./content-classifier');

/**
 * Extract content blocks from a DOM container using configurable rules
 * @param {Object} $ - Cheerio instance
 * @param {Object} container - DOM container to extract from
 * @param {number} startIndex - Starting index for block numbering
 * @param {string} context - Context label for logging ('above-fold' or 'rest-of-page')
 * @param {Array} extractionRules - Array of CSS selectors to extract
 * @returns {Object} Extraction result with blocks and metadata
 */
function extractBlocksFromDOM($, container, startIndex, context, extractionRules = []) {
  const blocks = [];
  const selectorMap = {};
  let index = startIndex;
  
  // Use extraction rules or fall back to default selectors
  let contentSelectors;
  if (extractionRules && extractionRules.length > 0) {
    contentSelectors = extractionRules.join(', ');
    console.log(chalk.gray(`   🎛️  Using custom extraction rules for ${context}: ${extractionRules.length} selectors`));
  } else {
    // Default behavior (current hardcoded selectors)
    contentSelectors = 'h1, h2, h3, p, li, blockquote, a, img, button, input[type="submit"], [class*="btn"], [class*="cta"]';
    console.log(chalk.gray(`   📋 Using default extraction rules for ${context}`));
  }
  
  container.find(contentSelectors).each((i, elem) => {
    const $elem = $(elem);
    const tagName = elem.tagName.toLowerCase();
    
    // V5: Enhanced text extraction (feature flag for easy disable)
    const USE_ENHANCED_EXTRACTION = true; // Easy toggle for testing
    
    let textData;
    if (USE_ENHANCED_EXTRACTION && ['h1', 'h2', 'h3', 'p', 'li', 'blockquote', 'div', 'small'].includes(tagName)) {
      textData = enhancedTextExtractor.extractText($elem, { cheerio: $ });
    } else {
      // Legacy extraction
      textData = { text: $elem.text().trim(), extraction_method: 'legacy' };
    }
    
    // Skip empty elements
    if (['h1', 'h2', 'h3', 'p', 'li', 'blockquote'].includes(tagName) && !textData.text) {
      return;
    }
    
    // V4.2: Check data-nimbus attributes for content control
    const nimbusAttr = $elem.attr('data-nimbus');
    if (nimbusAttr === 'ignore') {
      return; // Skip elements marked for ignoring
    }
    
    const selector = generateUniqueSelector($, elem, 'isolated-container');
    
    // V4.3: Generate unique ID for this element
    const elementId = generateElementId(index, tagName);
    selectorMap[elementId] = selector;
    
    if (['h1', 'h2', 'h3', 'p', 'li', 'blockquote'].includes(tagName)) {
      const blockData = {
        i: index++,
        id: elementId,
        type: tagName,
        tag_type: getTagType(elem),
        text: textData.text,
        selector: selector, // Keep for backward compatibility during transition
        nimbus_priority: nimbusAttr === 'priority' ? 'high' : nimbusAttr === 'ignore' ? 'skip' : 'normal' // V4.2: Content priority
      };
      
      // V5: Add enhanced extraction data if available
      if (textData.extraction_method !== 'legacy') {
        blockData.extraction_method = textData.extraction_method;
        blockData.inline_elements = textData.inline_elements || [];
        blockData.enhanced = true;
        
        // V5: Skip processing inline links separately if enhanced extraction captured them
        if (textData.inline_elements && textData.inline_elements.length > 0) {
          blockData.skip_inline_processing = true;
        }
      }
      
      blocks.push(blockData);
    } else if (tagName === 'a') {
      // V5: Skip if this link was already captured by enhanced extraction
      const parentBlock = blocks.find(b => 
        b.inline_elements && 
        b.inline_elements.some(el => el.text === textData.text && el.href === $elem.attr('href'))
      );
      
      if (parentBlock && parentBlock.skip_inline_processing) {
        console.log(`   ⏭️  Skipping duplicate link: ${textData.text} (captured in enhanced block)`);
        return; // Skip this link - already captured
      }
      const href = $elem.attr('href');
      const anchor = textData.text;
      if (href && anchor) {
        // V4.3: Generate unique ID for this element
        const elementId = generateElementId(index, tagName);
        selectorMap[elementId] = selector;
        
        // Classify link type for business-aware optimization
        const linkType = classifyLinkType(href, anchor);
        
        const linkBlock = {
          i: index++,
          id: elementId,
          type: 'a',
          anchor: anchor,
          href: href,
          link_type: linkType.type,
          conversion_priority: linkType.priority,
          selector: selector, // Keep for backward compatibility during transition
          nimbus_priority: nimbusAttr === 'priority' ? 'high' : nimbusAttr === 'ignore' ? 'skip' : 'normal' // V4.2: Content priority
        };
        
        blocks.push(linkBlock);
      }
    } else if (tagName === 'img') {
      const src = $elem.attr('src');
      if (src) {
        // V4.3: Generate unique ID for this element
        const elementId = generateElementId(index, tagName);
        selectorMap[elementId] = selector;
        
        const imgBlock = {
          i: index++,
          id: elementId,
          type: 'img',
          src: src,
          alt: $elem.attr('alt') || '',
          width: parseInt($elem.attr('width')) || null,
          height: parseInt($elem.attr('height')) || null,
          selector: selector, // Keep for backward compatibility during transition
          nimbus_priority: nimbusAttr === 'priority' ? 'high' : nimbusAttr === 'ignore' ? 'skip' : 'normal' // V4.2: Content priority
        };
        
        blocks.push(imgBlock);
      }
    } else if (tagName === 'button' || tagName === 'input' || $elem.attr('class')?.includes('btn') || $elem.attr('class')?.includes('cta')) {
      // Handle buttons, submit inputs, and CTA elements
      const buttonText = tagName === 'input' ? $elem.attr('value') || $elem.text().trim() : $elem.text().trim();
      const buttonType = $elem.attr('type') || 'button';
      
      if (buttonText) {
        // V4.3: Generate unique ID for this element
        const elementId = generateElementId(index, tagName);
        selectorMap[elementId] = selector;
        
        const buttonBlock = {
          i: index++,
          id: elementId,
          type: 'button',
          text: buttonText,
          button_type: buttonType,
          classes: $elem.attr('class') || '',
          selector: selector, // Keep for backward compatibility during transition
          nimbus_priority: nimbusAttr === 'priority' ? 'high' : nimbusAttr === 'ignore' ? 'skip' : 'normal' // V4.2: Content priority
        };
        
        blocks.push(buttonBlock);
      }
    }
  });
  
  return { blocks, selectorMap, nextIndex: index };
}

module.exports = {
  extractBlocksFromDOM
};
