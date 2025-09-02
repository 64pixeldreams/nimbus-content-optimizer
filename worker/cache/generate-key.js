// Cache Key Generator
// Creates unique cache keys for optimization requests

/**
 * Generate cache key from request data
 * @param {Object} requestData - Full request payload
 * @returns {string} Unique cache key
 */
export async function generateCacheKey(requestData) {
  const keyString = JSON.stringify(requestData);
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(keyString));
  const hashArray = Array.from(new Uint8Array(hash));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return `ai-result-${hashHex}`;
}

export default { generateCacheKey };
