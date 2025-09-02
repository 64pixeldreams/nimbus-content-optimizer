/**
 * Container Finder Utility
 * Finds hero/jumbotron containers in the DOM
 */

/**
 * Find the hero container starting from an element
 * @param {Element} startElement - Starting element (usually H1)
 * @param {Object} options - Search options
 * @returns {Element|null} The hero container or null
 */
export function findHeroContainer(startElement, options = {}) {
  const { maxDepth = 5 } = options;
  
  let current = startElement.parentElement;
  let depth = 0;
  
  while (current && depth < maxDepth) {
    if (isLikelyHeroContainer(current)) {
      return current;
    }
    
    // Also check if this container has enough hero-like content
    if (hasHeroContent(current)) {
      return current;
    }
    
    current = current.parentElement;
    depth++;
  }
  
  // If no hero container found, return the immediate parent
  return startElement.parentElement;
}

/**
 * Check if element is likely a hero container based on class/id names
 */
function isLikelyHeroContainer(element) {
  if (!element) return false;
  
  // Common hero container patterns
  const patterns = [
    'hero', 'jumbotron', 'banner', 'header-content',
    'page-header', 'intro', 'landing', 'above-fold',
    'masthead', 'showcase', 'feature', 'splash'
  ];
  
  const elementIdentifiers = [
    element.className || '',
    element.id || '',
    element.getAttribute('data-section') || '',
    element.getAttribute('role') || ''
  ].join(' ').toLowerCase();
  
  return patterns.some(pattern => elementIdentifiers.includes(pattern));
}

/**
 * Check if container has typical hero content structure
 */
function hasHeroContent(element) {
  if (!element) return false;
  
  const hasHeading = element.querySelector('h1, h2');
  const hasButtons = element.querySelector('button, a.btn, a.button, [role="button"]');
  const hasContent = element.querySelector('p, div.content, div.description');
  const hasImage = element.querySelector('img:not([src*="icon"]):not([src*="logo"])');
  
  // Score based on elements present
  let score = 0;
  if (hasHeading) score += 2;  // Headings are most important
  if (hasButtons) score += 1;
  if (hasContent) score += 1;
  if (hasImage) score += 0.5;
  
  return score >= 3;  // Need at least heading + one other element
}

/**
 * Get container info for debugging
 */
export function getContainerInfo(element) {
  if (!element) return null;
  
  return {
    tag: element.tagName.toLowerCase(),
    id: element.id || null,
    classes: element.className || null,
    dataAttributes: Array.from(element.attributes)
      .filter(attr => attr.name.startsWith('data-'))
      .reduce((acc, attr) => {
        acc[attr.name] = attr.value;
        return acc;
      }, {})
  };
}

