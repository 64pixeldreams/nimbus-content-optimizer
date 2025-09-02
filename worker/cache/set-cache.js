// Cache Storage Module
// Handles storing optimization results in KV

const CACHE_TTL = 86400 * 7; // 7 days

/**
 * Store result in KV cache
 * @param {string} cacheKey - Cache key to store under
 * @param {Object} result - Result to cache
 * @param {Object} env - Cloudflare environment with KV binding
 */
export async function setCachedResult(cacheKey, result, env) {
  if (!env.NIMBUS_CACHE) {
    return;
  }
  
  try {
    const cacheData = {
      ...result,
      cached_at: new Date().toISOString()
    };
    
    await env.NIMBUS_CACHE.put(cacheKey, JSON.stringify(cacheData), { 
      expirationTtl: CACHE_TTL 
    });
  } catch (error) {
    // Fail silently - caching is not critical
  }
}

export default { setCachedResult };
