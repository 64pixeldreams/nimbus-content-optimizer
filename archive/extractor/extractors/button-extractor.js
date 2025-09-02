/**
 * Button Extractor
 * Extracts call-to-action buttons from containers
 */

/**
 * Extract buttons from a container
 * @param {Element} container - Container element to search within
 * @param {Object} options - Extraction options
 * @returns {Array} Array of button objects
 */
export function extractButtons(container, options = {}) {
  const { 
    maxButtons = 5,
    includeSubmit = true 
  } = options;
  
  const buttons = [];
  const seen = new Set(); // Avoid duplicates
  
  // Different button selectors to try
  const selectors = [
    'button',
    'a.btn',
    'a.button',
    '[role="button"]',
    'a[class*="cta"]',
    'a[class*="action"]',
    'a[class*="primary"]',
    'a[class*="hero-link"]',
    includeSubmit ? 'input[type="submit"]' : null
  ].filter(Boolean);
  
  selectors.forEach(selector => {
    const elements = container.querySelectorAll(selector);
    
    elements.forEach(element => {
      // Skip if already processed
      const key = element.outerHTML;
      if (seen.has(key)) return;
      seen.add(key);
      
      const buttonData = extractButtonData(element);
      if (buttonData && buttonData.text) {
        buttons.push(buttonData);
        
        // Stop if we have enough buttons
        if (buttons.length >= maxButtons) return;
      }
    });
  });
  
  // Sort by priority (primary buttons first)
  return sortButtonsByPriority(buttons).slice(0, maxButtons);
}

/**
 * Extract data from a button element
 */
function extractButtonData(element) {
  const text = element.textContent.trim();
  
  // Skip empty buttons
  if (!text) return null;
  
  // Skip navigation items that look like buttons
  if (isNavigationItem(text)) return null;
  
  return {
    text,
    type: getButtonType(element),
    href: element.href || element.getAttribute('data-href') || null,
    onclick: element.getAttribute('onclick') || null,
    classes: element.className || '',
    priority: calculateButtonPriority(element)
  };
}

/**
 * Determine button type
 */
function getButtonType(element) {
  const tag = element.tagName.toLowerCase();
  
  if (tag === 'button') return 'button';
  if (tag === 'input') return 'submit';
  if (tag === 'a') return 'link-button';
  
  return 'custom';
}

/**
 * Check if text is likely a navigation item
 */
function isNavigationItem(text) {
  const navPatterns = [
    'home', 'about', 'contact', 'blog', 'news',
    'login', 'sign in', 'menu', 'search'
  ];
  
  const lowerText = text.toLowerCase();
  return navPatterns.some(pattern => lowerText === pattern);
}

/**
 * Calculate button priority for sorting
 */
function calculateButtonPriority(element) {
  let priority = 0;
  const classes = element.className.toLowerCase();
  const text = element.textContent.toLowerCase();
  
  // Primary/CTA indicators
  if (classes.includes('primary') || classes.includes('cta')) priority += 3;
  if (classes.includes('hero')) priority += 2;
  if (classes.includes('large') || classes.includes('lg')) priority += 1;
  
  // Action words in text
  const actionWords = ['get', 'start', 'try', 'buy', 'call', 'book', 'schedule'];
  if (actionWords.some(word => text.includes(word))) priority += 2;
  
  // Size indicators
  const styles = element.style;
  if (styles.fontSize && parseInt(styles.fontSize) > 16) priority += 1;
  
  return priority;
}

/**
 * Sort buttons by priority
 */
function sortButtonsByPriority(buttons) {
  return buttons.sort((a, b) => b.priority - a.priority);
}
