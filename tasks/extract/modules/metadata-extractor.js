/**
 * Metadata Extractor Module
 * Handles extraction of head metadata from HTML using config-driven rules
 */

/**
 * Extract head metadata from HTML document using config rules
 * @param {Object} $ - Cheerio instance
 * @param {Object} metadataRules - Metadata extraction rules from config
 * @returns {Object} Head metadata object
 */
function extractHeadMetadata($, metadataRules = {}) {
  const metadata = {};
  
  // Use only what's configured - no hardcoded defaults
  const rules = metadataRules || {};
  
  // Extract each metadata field using config rules
  for (const [key, selector] of Object.entries(rules)) {
    if (key.startsWith('_')) continue; // Skip comments
    
    if (key === 'title') {
      metadata[key] = $(selector).text().trim() || '';
    } else if (key === 'favicon') {
      // Handle multiple favicon selectors
      const faviconSelectors = selector.split(', ');
      let faviconUrl = '';
      for (const faviconSelector of faviconSelectors) {
        const href = $(faviconSelector.trim()).attr('href');
        if (href) {
          faviconUrl = href;
          break;
        }
      }
      metadata[key] = faviconUrl;
    } else {
      // Handle meta tags and link tags
      metadata[key] = $(selector).attr('content') || $(selector).attr('href') || '';
    }
  }
  
  // Return only what was configured - no empty defaults
  return {
    title: metadata.title || '',
    metaDescription: metadata.meta_description || '',
    canonical: metadata.canonical || '',
    ogImage: metadata.og_image || '',
    twitterImage: metadata.twitter_image || '',
    ogTitle: metadata.og_title || '',
    ogDescription: metadata.og_description || '',
    twitterTitle: metadata.twitter_title || '',
    twitterDescription: metadata.twitter_description || '',
    favicon: metadata.favicon || ''
  };
}

module.exports = {
  extractHeadMetadata
};
