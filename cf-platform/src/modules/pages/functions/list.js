/**
 * Page List CloudFunction
 * Lists pages with filtering and pagination
 */

import { PageManager } from '../core/page-manager.js';

/**
 * List pages CloudFunction handler
 * @param {Object} requestContext - CloudFunction request context
 * @returns {Promise<Object>} Page listing result
 */
export async function pageList(requestContext) {
  const { env, logger, payload, auth } = requestContext;
  
  logger.log('Page listing started', { 
    userId: auth.user_id,
    projectId: payload.project_id
  });
  
  try {
    // Initialize page manager with user context
    const pages = new PageManager(env, auth.user_id);
    
    // List pages using manager
    const result = await pages.list(payload);
    
    logger.log('Page listing completed', { 
      success: result.success,
      count: result.pages?.length || 0
    });
    
    return result;
    
  } catch (error) {
    logger.error('Page listing failed', error);
    throw error;
  }
}

/**
 * CloudFunction configuration
 */
export const pageListConfig = {
  auth: true,
  validation: {
    project_id: { type: 'string' },
    status: { type: 'string' },
    limit: { type: 'number' },
    offset: { type: 'number' }
  }
};