/**
 * 🎯 Simple Page Type Detection
 * One function, accepts URL, returns page type and priority
 */

// Page type to priority mapping
const PAGE_TYPE_PRIORITY = {
  // HIGH PRIORITY - Landing pages (conversion focused)
  'home': 'high',
  'local_landing': 'high', 
  'brand_landing': 'high',
  'service_landing': 'high',
  'product_landing': 'high',
  
  // MEDIUM PRIORITY - Lead generation
  'contact': 'medium',
  'pricing': 'medium',
  
  // LOW PRIORITY - Information/Legal
  'about': 'low',
  'faq': 'low', 
  'legal': 'low',
  'blog': 'low',
  'index': 'low',
  
  // NORMAL PRIORITY - Default
  'page': 'normal'
};

/**
 * Detects page type from URL - simple and fast
 * @param {string} url - Page URL 
 * @returns {Object} { type: string, priority: string }
 */
function detectPageType(url) {
  if (!url) return { type: 'page', priority: 'normal' };
  
  const cleanUrl = url.toLowerCase().trim();
  let pageType = 'page';
  
  // HOME
  if (cleanUrl === '/' || cleanUrl === '/index.html' || cleanUrl === '/home') {
    pageType = 'home';
  }
  // LOCATION PATTERNS
  else if (cleanUrl.includes('/locations/') || cleanUrl.includes('/stores/') || 
           cleanUrl.includes('/branches/') || cleanUrl.includes('/local/') ||
           cleanUrl.includes('/areas/') || cleanUrl.includes('/near-me')) {
    pageType = 'local_landing';
  }
  // BRAND PATTERNS  
  else if (cleanUrl.includes('/brand/') || cleanUrl.includes('/brands/')) {
    pageType = 'brand_landing';
  }
  // SERVICE PATTERNS
  else if (cleanUrl.includes('/services/') || cleanUrl.includes('-repair') || 
           cleanUrl.includes('-service') || cleanUrl.includes('/repair/')) {
    pageType = 'service_landing';
  }
  // PRODUCT PATTERNS
  else if (cleanUrl.includes('/products/') || cleanUrl.includes('/shop/') || 
           cleanUrl.includes('/store/')) {
    pageType = 'product_landing';
  }
  // CONTENT PATTERNS
  else if (cleanUrl.includes('/contact')) {
    pageType = 'contact';
  }
  else if (cleanUrl.includes('/about')) {
    pageType = 'about';
  }
  else if (cleanUrl.includes('/pricing') || cleanUrl.includes('/cost')) {
    pageType = 'pricing';
  }
  else if (cleanUrl.includes('/faq') || cleanUrl.includes('/help')) {
    pageType = 'faq';
  }
  else if (cleanUrl.includes('/terms') || cleanUrl.includes('/privacy') || cleanUrl.includes('/legal')) {
    pageType = 'legal';
  }
  else if (cleanUrl.includes('/blog/')) {
    pageType = 'blog';
  }
  // INDEX PATTERNS
  else if (cleanUrl === '/blog' || cleanUrl === '/news' || cleanUrl === '/help') {
    pageType = 'index';
  }
  
  return { 
    type: pageType, 
    priority: PAGE_TYPE_PRIORITY[pageType] || 'normal' 
  };
}

/**
 * Check if page type should show above-fold hero cards
 * @param {string} pageType 
 * @returns {boolean}
 */
function isLandingPage(pageType) {
  const landingTypes = ['home', 'local_landing', 'brand_landing', 'service_landing', 'product_landing'];
  return landingTypes.includes(pageType);
}

export { detectPageType, isLandingPage };
