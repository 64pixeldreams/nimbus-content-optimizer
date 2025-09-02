/**
 * Content Classifier Module
 * Handles semantic classification of content elements
 */

/**
 * Get semantic tag type for AI optimization
 * @param {Object} element - DOM element
 * @param {boolean} isMetaTitle - Whether this is a meta title
 * @param {boolean} isMetaDescription - Whether this is a meta description
 * @returns {string} Semantic tag type
 */
function getTagType(element, isMetaTitle = false, isMetaDescription = false) {
  if (isMetaTitle) return 'META_TITLE';
  if (isMetaDescription) return 'META_DESC';
  
  const tagName = element.tagName.toLowerCase();
  
  if (tagName === 'h1') return 'H1';
  if (tagName === 'h2') return 'H2';
  if (tagName === 'h3') return 'H3';
  if (tagName === 'button' || (element.attribs && element.attribs.class && element.attribs.class.includes('btn'))) return 'BTN';
  if (tagName === 'a') return 'LINK';
  
  return 'CONTENT';  // For p, div, span, etc.
}

/**
 * Classify link type for business optimization
 * @param {string} href - Link URL
 * @param {string} anchor - Link text
 * @returns {Object} Link classification
 */
function classifyLinkType(href, anchor) {
  // Default money pages - will be overridden by profile config
  const defaultMoneyPages = [
    '/start-repair.html',
    '/contact.html',
    '/how-it-works.html',
    '/quote',
    '/checkout',
    '/shop',
    '/buy'
  ];
  
  const defaultCtaPatterns = [
    'tel:',
    'mailto:',
    '/quote',
    '/contact',
    '/start-'
  ];
  
  // Check for money pages (exact match)
  if (defaultMoneyPages.some(page => href === page || href.includes(page))) {
    return {
      type: 'cta-money',
      priority: 'high'
    };
  }
  
  // Check for CTA patterns
  if (defaultCtaPatterns.some(pattern => href.startsWith(pattern))) {
    return {
      type: 'cta-contact',
      priority: 'high'
    };
  }
  
  // Check anchor text for CTA keywords
  const ctaKeywords = ['quote', 'contact', 'buy', 'order', 'submit', 'start', 'get started', 'book', 'call'];
  const anchorLower = anchor.toLowerCase();
  if (ctaKeywords.some(keyword => anchorLower.includes(keyword))) {
    return {
      type: 'cta-intent',
      priority: 'medium'
    };
  }
  
  return {
    type: 'link-regular',
    priority: 'low'
  };
}

module.exports = {
  getTagType,
  classifyLinkType
};
