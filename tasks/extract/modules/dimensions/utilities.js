/**
 * Content Dimensions Utilities
 * Clean, safe dimension property fetcher with error handling
 */

/**
 * Create dimension property fetcher with clean dot notation access
 * @param {Object} dimensions - The dimensions object from contentMap
 * @returns {Object} - Property fetcher with brand(), location(), service(), etc.
 */
function fetchProperty(dimensions) {
  const safeFetch = (key) => {
    try {
      if (!dimensions || !dimensions[key]) return '';
      if (!dimensions[key].success || !dimensions[key].value) return '';
      return dimensions[key].value;
    } catch (error) {
      return '';
    }
  };

  return {
    brand: () => safeFetch('brand'),
    location: () => safeFetch('location'),
    service: () => safeFetch('service'),
    product: () => safeFetch('product'),
    faqTitle: () => safeFetch('faq_title')
  };
}

module.exports = { fetchProperty };
