/**
 * Heading Extractor
 * Extracts headings (H1, H2, H3, etc) from containers
 */

/**
 * Extract headings of a specific level
 * @param {Element} container - Container element to search within
 * @param {string} level - Heading level (h1, h2, h3, etc)
 * @param {Object} options - Extraction options
 * @returns {Array} Array of heading texts
 */
export function extractHeadings(container, level = 'h2', options = {}) {
  const {
    maxHeadings = 5,
    minLength = 3,
    includeSubtext = false
  } = options;
  
  const headings = [];
  const elements = container.querySelectorAll(level);
  
  elements.forEach(element => {
    // Skip hidden headings
    if (!isVisible(element)) return;
    
    const headingData = extractHeadingData(element, includeSubtext);
    
    if (headingData.text.length >= minLength) {
      headings.push(headingData.text);
    }
    
    // Stop if we have enough
    if (headings.length >= maxHeadings) return;
  });
  
  return headings;
}

/**
 * Extract all headings with hierarchy
 * @param {Element} container - Container element to search within
 * @param {Object} options - Extraction options
 * @returns {Object} Object with h1, h2, h3 arrays
 */
export function extractAllHeadings(container, options = {}) {
  return {
    h1: extractHeadings(container, 'h1', options),
    h2: extractHeadings(container, 'h2', options),
    h3: extractHeadings(container, 'h3', options)
  };
}

/**
 * Extract data from a heading element
 */
function extractHeadingData(element, includeSubtext = false) {
  let text = element.textContent.trim();
  
  // If not including subtext, try to get just the main text
  if (!includeSubtext) {
    // Clone and remove child elements like spans, small, etc
    const clone = element.cloneNode(true);
    const removeElements = clone.querySelectorAll('small, span.subtext, span.subtitle');
    removeElements.forEach(el => el.remove());
    text = clone.textContent.trim();
  }
  
  return {
    text,
    level: element.tagName.toLowerCase(),
    classes: element.className || '',
    id: element.id || null
  };
}

/**
 * Check if element is visible
 */
function isVisible(element) {
  // Check hidden attribute
  if (element.hidden) return false;
  
  // Check inline styles
  const style = element.style;
  if (style && (style.display === 'none' || style.visibility === 'hidden')) {
    return false;
  }
  
  // Check for common hiding classes
  const hidingClasses = ['hidden', 'hide', 'd-none', 'invisible'];
  const classes = element.className.toLowerCase();
  if (hidingClasses.some(cls => classes.includes(cls))) {
    return false;
  }
  
  return true;
}

/**
 * Find the primary heading in a container
 * Useful for finding the main H1 or H2
 */
export function findPrimaryHeading(container, options = {}) {
  const { preferredLevel = 'h1' } = options;
  
  // Try preferred level first
  const preferred = container.querySelector(preferredLevel);
  if (preferred && isVisible(preferred)) {
    return extractHeadingData(preferred).text;
  }
  
  // Fall back to other levels
  const levels = ['h1', 'h2', 'h3'].filter(l => l !== preferredLevel);
  
  for (const level of levels) {
    const heading = container.querySelector(level);
    if (heading && isVisible(heading)) {
      return extractHeadingData(heading).text;
    }
  }
  
  return null;
}
