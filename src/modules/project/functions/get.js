/**
 * Project Get CloudFunction
 * Gets specific project details for authenticated user
 */

import { ProjectManager } from '../core/project-manager.js';

/**
 * Get project CloudFunction handler
 * @param {Object} requestContext - CloudFunction request context
 * @returns {Promise<Object>} Project get result
 */
export async function projectGet(requestContext) {
  const { env, logger, payload, auth } = requestContext;
  
  logger.log('Project get started', { 
    userId: auth.user_id,
    projectId: payload.project_id 
  });
  
  try {
    // Initialize project manager with user context
    const projects = new ProjectManager(env, auth.user_id);
    
    // Get specific project
    const result = await projects.get(payload.project_id);
    
    logger.log('Project get completed', { 
      success: result.success,
      found: !!result.project
    });
    
    return result;
    
  } catch (error) {
    logger.error('Project get failed', error);
    throw error;
  }
}

/**
 * CloudFunction configuration
 */
export const projectGetConfig = {
  auth: true,
  validation: {
    project_id: { type: 'string', required: true }
  }
};
