// Cache Retrieval Module
// Handles getting cached optimization results

/**
 * Get cached result from KV storage
 * @param {string} cacheKey - Cache key to lookup
 * @param {Object} env - Cloudflare environment with KV binding
 * @returns {Object|null} Cached result or null if not found
 */
export async function getCachedResult(cacheKey, env) {
  if (!env.NIMBUS_CACHE) {
    return null;
  }
  
  try {
    const cached = await env.NIMBUS_CACHE.get(cacheKey);
    return cached ? JSON.parse(cached) : null;
  } catch (error) {
    return null;
  }
}

export default { getCachedResult };
