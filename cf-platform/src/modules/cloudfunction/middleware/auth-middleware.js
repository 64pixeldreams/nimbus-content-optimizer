/**
 * Authentication Middleware
 * Handles authentication for CloudFunction requests
 */

import { AUTH } from '../../auth/core/singleton.js';
import { LOGS } from '../../logs/index.js';

export class AuthMiddleware {
  constructor(env) {
    this.env = env;
  }

  /**
   * Process authentication for a request
   * @param {Request} request - Original request
   * @param {Object} metadata - Function metadata
   * @returns {Promise<Object|null>} Auth context or null
   */
  async process(request, metadata) {
    const logger = LOGS.init('cloudfunction.auth');
    
    // Skip auth if not required
    if (!metadata.auth) {
      return null;
    }

    try {
      // Initialize AUTH if not already done
      if (!AUTH.instance) {
        AUTH.init(this.env, logger);
      }

      // Try API key first
      const apiAuth = await AUTH.validateApiKey(request, logger);
      if (apiAuth) {
        logger.log('Authenticated via API key', { userId: apiAuth.user_id });
        return {
          type: 'api',
          ...apiAuth
        };
      }

      // Try session
      const sessionAuth = await AUTH.validateSession(request, logger);
      if (sessionAuth) {
        logger.log('Authenticated via session', { userId: sessionAuth.user_id });
        return {
          type: 'session',
          ...sessionAuth
        };
      }

      // No valid auth found
      logger.warn('Authentication failed - no valid auth found');
      return null;

    } catch (error) {
      logger.error('Auth middleware error', error);
      return null;
    }
  }
}
