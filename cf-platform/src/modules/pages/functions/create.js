/**
 * Page Create CloudFunction
 * Creates a new page from extracted content data
 */

import { PageManager } from '../core/page-manager.js';

/**
 * Create page CloudFunction handler
 * @param {Object} requestContext - CloudFunction request context
 * @returns {Promise<Object>} Page creation result
 */
export async function pageCreate(requestContext) {
  const { env, logger, payload, auth } = requestContext;
  
  logger.log('Page creation started', { 
    userId: auth.user_id,
    projectId: payload.project_id,
    url: payload.url
  });
  
  try {
    // Initialize page manager with user context
    const pages = new PageManager(env, auth.user_id);
    
    // Create page using manager
    const result = await pages.create(payload);
    
    logger.log('Page creation completed', { 
      success: result.success,
      pageId: result.page?.page_id 
    });
    
    return result;
    
  } catch (error) {
    logger.error('Page creation failed', error);
    throw error;
  }
}

/**
 * CloudFunction configuration
 */
export const pageCreateConfig = {
  auth: true,
  validation: {
    project_id: { type: 'string', required: true },
    url: { type: 'string', required: true },
    title: { type: 'string' },
    content: { type: 'text' },
    extracted_data: { type: 'json' },
    metadata: { type: 'json' }
  }
};
