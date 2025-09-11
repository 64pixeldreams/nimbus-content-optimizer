import { ProjectManager } from '../core/project-manager.js';

export const projectUpdate = async (requestContext) => {
  const { env, logger, payload, auth } = requestContext;
  
  try {
    const { project_id, ...updateData } = payload;
    
    if (!project_id) {
      return { success: false, error: 'project_id is required' };
    }
    
    // Initialize project manager with user context
    const projects = new ProjectManager(env, auth.user_id);
    
    // Update project using manager
    const result = await projects.update(project_id, updateData);
    
    logger.log('Project updated successfully', { project_id, updateData });
    
    return result;
    
  } catch (error) {
    logger.error('Project update failed', error);
    return { success: false, error: error.message };
  }
};

export const projectUpdateConfig = {
  auth: true,
  validation: {
    project_id: { type: 'string', required: true }
  }
};
