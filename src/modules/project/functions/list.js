/**
 * Project List CloudFunction
 * Lists all projects for authenticated user
 */

import { ProjectManager } from '../core/project-manager.js';

/**
 * List projects CloudFunction handler
 * @param {Object} requestContext - CloudFunction request context
 * @returns {Promise<Object>} Project list result
 */
export async function projectList(requestContext) {
  const { env, logger, payload, auth } = requestContext;
  
  logger.log('Project list started', { 
    userId: auth.user_id,
    filters: payload 
  });
  
  try {
    // Initialize project manager with user context
    const projects = new ProjectManager(env, auth.user_id);
    
    // List projects with optional filters
    const result = await projects.list(payload);
    
    logger.log('Project list completed', { 
      success: result.success,
      count: result.projects?.length || 0
    });
    
    return result;
    
  } catch (error) {
    logger.error('Project list failed', error);
    throw error;
  }
}

/**
 * CloudFunction configuration
 */
export const projectListConfig = {
  auth: true,
  validation: {
    status: { type: 'string', validation: ['active', 'paused', 'archived'] },
    domain: { type: 'string' },
    includeData: { type: 'boolean' }
  }
};
