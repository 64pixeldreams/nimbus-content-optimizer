/**
 * Project Manager
 * Core business logic for project operations
 */

import { DataModel } from '../../datamodel/index.js';
import { ProjectModel } from '../../../models/project.js';
import { LOGS } from '../../logs/index.js';

export class ProjectManager {
  constructor(env, userId = null) {
    this.env = env;
    this.userId = userId;
    this.logger = LOGS.init('PROJECT');
    
    // Register model
    DataModel.registerModel(ProjectModel);
  }
  
  /**
   * Create a new project
   */
  async create(data) {
    const timer = this.logger.timer('create');
    
    try {
      // Create project - DataModel handles validation and ID generation
      const project = await DataModel.create('PROJECT', {
        ...data,
        user_id: this.userId
      }, this.env, this.userId);
      
      timer.end({ projectId: project.get('project_id') });
      return {
        success: true,
        project: project.toJSON()
      };
      
    } catch (error) {
      this.logger.error('Failed to create project', error);
      timer.end({ error: true });
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Get project by ID
   */
  async get(projectId) {
    const timer = this.logger.timer('get');
    
    try {
      const project = await DataModel.get('PROJECT', projectId, this.env, this.userId);
      
      if (!project) {
        timer.end({ found: false });
        return {
          success: false,
          error: 'Project not found'
        };
      }
      
      timer.end({ found: true });
      return {
        success: true,
        project: project.toJSON()
      };
      
    } catch (error) {
      this.logger.error('Failed to get project', error);
      timer.end({ error: true });
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Update project
   */
  async update(projectId, updates) {
    const timer = this.logger.timer('update');
    
    try {
      // Load project
      const project = await DataModel.get('PROJECT', projectId, this.env, this.userId);
      
      if (!project) {
        timer.end({ found: false });
        return {
          success: false,
          error: 'Project not found'
        };
      }
      
      // Apply updates
      for (const [key, value] of Object.entries(updates)) {
        if (key !== 'project_id' && key !== 'user_id') { // Protect immutable fields
          project.set(key, value);
        }
      }
      
      // Save
      await project.save();
      
      timer.end({ updated: true });
      return {
        success: true,
        project: project.toJSON()
      };
      
    } catch (error) {
      this.logger.error('Failed to update project', error);
      timer.end({ error: true });
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Delete project (soft delete)
   */
  async delete(projectId) {
    const timer = this.logger.timer('delete');
    
    try {
      // Load project
      const project = await DataModel.get('PROJECT', projectId, this.env, this.userId);
      
      if (!project) {
        timer.end({ found: false });
        return {
          success: false,
          error: 'Project not found'
        };
      }
      
      // Soft delete
      await project.delete();
      
      timer.end({ deleted: true });
      return {
        success: true,
        message: 'Project deleted successfully'
      };
      
    } catch (error) {
      this.logger.error('Failed to delete project', error);
      timer.end({ error: true });
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * List projects for user
   */
  async list(options = {}) {
    const timer = this.logger.timer('list');
    
    try {
      const query = DataModel.query('PROJECT', this.env)
        .where('user_id', '=', this.userId)
        .orderBy('created_at', 'DESC');
      
      // Apply filters
      if (options.status) {
        query.where('status', '=', options.status);
      }
      
      if (options.domain) {
        query.where('domain', '=', options.domain);
      }
      
      // Include full data if requested
      if (options.includeData) {
        query.withData();
      }
      
      // Execute
      const result = await query.execute();
      
      timer.end({ count: result.items.length });
      return {
        success: true,
        projects: result.items,
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          hasNext: result.hasNext,
          hasPrev: result.hasPrev
        }
      };
      
    } catch (error) {
      this.logger.error('Failed to list projects', error);
      timer.end({ error: true });
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Update project configuration
   */
  async updateConfig(projectId, config) {
    const timer = this.logger.timer('updateConfig');
    
    try {
      const project = await DataModel.get('PROJECT', projectId, this.env, this.userId);
      
      if (!project) {
        timer.end({ found: false });
        return {
          success: false,
          error: 'Project not found'
        };
      }
      
      // Merge config
      const currentConfig = project.get('config') || {};
      project.set('config', { ...currentConfig, ...config });
      
      await project.save();
      
      timer.end({ updated: true });
      return {
        success: true,
        project: project.toJSON()
      };
      
    } catch (error) {
      this.logger.error('Failed to update config', error);
      timer.end({ error: true });
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Update extraction rules
   */
  async updateExtractionRules(projectId, rules) {
    const timer = this.logger.timer('updateExtractionRules');
    
    try {
      const project = await DataModel.get('PROJECT', projectId, this.env, this.userId);
      
      if (!project) {
        timer.end({ found: false });
        return {
          success: false,
          error: 'Project not found'
        };
      }
      
      project.set('extraction_rules', rules);
      await project.save();
      
      timer.end({ updated: true });
      return {
        success: true,
        project: project.toJSON()
      };
      
    } catch (error) {
      this.logger.error('Failed to update extraction rules', error);
      timer.end({ error: true });
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Check if user owns project
   */
  async checkOwnership(projectId) {
    const timer = this.logger.timer('checkOwnership');
    
    try {
      const project = await DataModel.get('PROJECT', projectId, this.env, this.userId);
      const isOwner = project && project.get('user_id') === this.userId;
      
      timer.end({ isOwner });
      return isOwner;
      
    } catch (error) {
      this.logger.error('Failed to check ownership', error);
      timer.end({ error: true });
      return false;
    }
  }
}
