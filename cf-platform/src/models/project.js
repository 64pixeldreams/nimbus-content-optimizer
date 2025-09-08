/**
 * Project Model Definition
 * Represents a website project
 */

export const ProjectModel = {
  name: 'PROJECT',
  
  options: {
    timestamps: true,
    softDelete: true,
    userTracking: true,
    auth: true
  },
  
  fields: {
    project_id: { type: 'string', primary: true },
    name: { type: 'string', required: true },
    description: { type: 'string', default: '' },
    domain: { type: 'string', required: true, validation: 'domain' },
    logo: { type: 'string', default: '', validation: 'url' },
    status: { type: 'string', default: 'active', validation: ['active', 'paused', 'archived'] },
    
    // Configuration
    config: { type: 'json', validation: 'object' },
    extraction_rules: { type: 'json', validation: 'object' },
    optimization_settings: { type: 'json', validation: 'object' },
    
    // Settings
    settings: { type: 'json', default: {}, validation: 'object' }
  },
  
  kv: {
    namespace: 'PROJECTS',
    keyPattern: 'project:{id}'
  },
  
  d1: {
    table: 'project_meta',
    syncFields: [
      'project_id',
      'user_id',
      'name',
      'domain',
      'status',
      'created_at',
      'updated_at',
      'deleted_at'
    ]
  },
  
  hooks: {
    afterCreate: async (instance, data, env, logger) => {
      // Initialize project structure
      logger?.log('Project created', { 
        projectId: instance.get('project_id'),
        name: instance.get('name') 
      });
    },
    
    beforeDelete: async (instance, data, env, logger) => {
      // Could check if project has pages via stats or D1 query
      logger?.log('Project marked for deletion', { 
        projectId: instance.get('project_id') 
      });
    }
  }
};
