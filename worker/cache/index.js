// KV Cache Management System
// Centralized cache operations for optimization results

import { generateCacheKey } from './generate-key.js';
import { getCachedResult } from './get-cache.js';
import { setCachedResult } from './set-cache.js';

// Export all cache functions
export {
  generateCacheKey,
  getCachedResult,
  setCachedResult
};

// Export default object for convenience
export default {
  generateCacheKey,
  getCachedResult,
  setCachedResult
};
