/**
 * Above-the-Fold Content Extractor
 * Main entry point for extracting hero/jumbotron content from HTML
 */

import { findHeroContainer } from './utils/container-finder.js';
import { extractButtons } from './extractors/button-extractor.js';
import { extractContent } from './extractors/content-extractor.js';
import { extractImages } from './extractors/image-extractor.js';
import { extractHeadings } from './extractors/heading-extractor.js';
import { validateExtraction } from './utils/validator.js';

/**
 * Extract above-the-fold content from HTML
 * @param {string} html - HTML string to parse
 * @param {Object} options - Extraction options
 * @returns {Object} Extracted content with validation score
 */
export function extractAboveFoldContent(html, options = {}) {
  const {
    maxDepth = 5,
    minContentLength = 20,
    includeLinks = true,
    debug = false
  } = options;

  try {
    // Parse HTML - in browser use DOMParser, in Node use a parser like jsdom
    const doc = typeof DOMParser !== 'undefined' 
      ? new DOMParser().parseFromString(html, 'text/html')
      : parseHTML(html); // You'll need to implement parseHTML for Node.js

    // Find the main H1
    const h1Element = findMainH1(doc);
    if (!h1Element) {
      return {
        success: false,
        error: 'No H1 element found',
        extracted: null
      };
    }

    // Find the hero container
    const container = findHeroContainer(h1Element, { maxDepth });
    if (debug) {
      console.log('Found container:', container?.className || container?.tagName);
    }

    // Extract all elements
    const extracted = {
      h1: h1Element.textContent.trim(),
      h2: extractHeadings(container || h1Element.parentElement, 'h2'),
      h3: extractHeadings(container || h1Element.parentElement, 'h3'),
      buttons: extractButtons(container || h1Element.parentElement),
      content: extractContent(container || h1Element.parentElement, { minLength: minContentLength }),
      images: extractImages(container || h1Element.parentElement),
      links: includeLinks ? extractLinks(container || h1Element.parentElement) : [],
      container: {
        tag: container?.tagName.toLowerCase(),
        classes: container?.className,
        id: container?.id
      }
    };

    // Validate the extraction
    const validation = validateExtraction(extracted);

    return {
      success: true,
      extracted,
      validation,
      isValid: validation.isValid
    };

  } catch (error) {
    return {
      success: false,
      error: error.message,
      extracted: null
    };
  }
}

/**
 * Find the main H1 element (first visible one)
 */
function findMainH1(doc) {
  const h1s = doc.querySelectorAll('h1');
  
  for (const h1 of h1s) {
    // Skip hidden elements
    if (isElementVisible(h1)) {
      return h1;
    }
  }
  
  return null;
}

/**
 * Check if element is visible
 */
function isElementVisible(element) {
  if (!element) return false;
  
  // Check for hidden attribute
  if (element.hidden) return false;
  
  // Check for display none
  const style = element.style;
  if (style && (style.display === 'none' || style.visibility === 'hidden')) {
    return false;
  }
  
  // Check computed styles if available
  if (typeof window !== 'undefined' && window.getComputedStyle) {
    const computed = window.getComputedStyle(element);
    if (computed.display === 'none' || computed.visibility === 'hidden') {
      return false;
    }
  }
  
  return true;
}

/**
 * Extract links (non-button links)
 */
function extractLinks(container) {
  const links = [];
  const linkElements = container.querySelectorAll('a');
  
  linkElements.forEach(link => {
    // Skip if it's a button
    if (link.classList.toString().match(/btn|button/i) || link.role === 'button') {
      return;
    }
    
    const text = link.textContent.trim();
    if (text) {
      links.push({
        text,
        href: link.href || '#',
        classes: link.className
      });
    }
  });
  
  return links;
}

/**
 * Parse HTML for Node.js environment
 * You'll need to implement this based on your parser choice (jsdom, cheerio, etc.)
 */
function parseHTML(html) {
  // Placeholder - implement based on your Node.js HTML parser
  throw new Error('parseHTML not implemented - use jsdom or cheerio');
}

export default extractAboveFoldContent;

