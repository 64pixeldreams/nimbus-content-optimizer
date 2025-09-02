/**
 * Metadata Extractor Module
 * Handles extraction of head metadata from HTML
 */

/**
 * Extract head metadata from HTML document
 * @param {Object} $ - Cheerio instance
 * @returns {Object} Head metadata object
 */
function extractHeadMetadata($) {
  return {
    title: $('title').text().trim() || '',
    metaDescription: $('meta[name="description"]').attr('content') || '',
    canonical: $('link[rel="canonical"]').attr('href') || '',
    ogImage: $('meta[property="og:image"]').attr('content') || '',
    twitterImage: $('meta[name="twitter:image"]').attr('content') || ''
  };
}

module.exports = {
  extractHeadMetadata
};
