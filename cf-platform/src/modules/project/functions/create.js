/**
 * Project Create CloudFunction
 * Creates a new project for authenticated user
 */

import { ProjectManager } from '../core/project-manager.js';

/**
 * Create project CloudFunction handler
 * @param {Object} requestContext - CloudFunction request context
 * @returns {Promise<Object>} Project creation result
 */
export async function projectCreate(requestContext) {
  const { env, logger, payload, auth } = requestContext;
  
  logger.log('Project creation started', { 
    userId: auth.user_id,
    projectName: payload.name 
  });
  
  try {
    // Initialize project manager with user context
    const projects = new ProjectManager(env, auth.user_id);
    
    // Create project using existing manager
    const result = await projects.create(payload);
    
    logger.log('Project creation completed', { 
      success: result.success,
      projectId: result.project?.project_id 
    });
    
    return result;
    
  } catch (error) {
    logger.error('Project creation failed', error);
    throw error;
  }
}

/**
 * CloudFunction configuration
 */
export const projectCreateConfig = {
  auth: true,
  validation: {
    name: { type: 'string', required: true },
    domain: { type: 'string', required: true, validation: 'domain' },
    description: { type: 'string' },
    logo: { type: 'string', validation: 'url' },
    config: { type: 'json', validation: 'object' }
  }
};
