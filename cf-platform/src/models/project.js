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
    logo: { type: 'string', default: '', validation: 'url-optional' },
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
      console.log('🔧 PROJECT HOOK: afterCreate called!', {
        projectId: instance.get('project_id'),
        name: instance.get('name'),
        userId: instance.get('user_id')
      });
      
      // Also log to the logger so it appears in the response
      logger?.log('🔧 PROJECT HOOK: afterCreate called!', {
        projectId: instance.get('project_id'),
        name: instance.get('name'),
        userId: instance.get('user_id')
      });
      
      // Initialize project structure
      logger?.log('Project created', { 
        projectId: instance.get('project_id'),
        name: instance.get('name') 
      });

      // Create audit log for project creation
      try {
        console.log('🔧 PROJECT HOOK: Creating audit log...');
        const { Datastore } = await import('../modules/datastore/index.js');
        const { AuditLogger } = await import('../modules/logs/core/audit-logger.js');
        const datastore = new Datastore(env, logger);
        const auditLogger = new AuditLogger(datastore, logger);
        
        console.log('🔧 PROJECT HOOK: Calling logProjectActivity...');
        const result = await auditLogger.logProjectActivity(
          instance.get('user_id'),
          instance.get('project_id'),
          'project_created',
          `${instance.get('name')} project created`,
          {
            name: instance.get('name'),
            domain: instance.get('domain'),
            status: instance.get('status')
          }
        );
        console.log('🔧 PROJECT HOOK: Audit log result:', result);
      } catch (auditError) {
        console.log('🔧 PROJECT HOOK: Audit log error:', auditError);
        logger?.warn('Failed to create project audit log', auditError);
      }
    },
    
    beforeDelete: async (instance, data, env, logger) => {
      // Could check if project has pages via stats or D1 query
      logger?.log('Project marked for deletion', { 
        projectId: instance.get('project_id') 
      });

      // Create audit log for project deletion
      try {
        const { Datastore } = await import('../modules/datastore/index.js');
        const { AuditLogger } = await import('../modules/logs/core/audit-logger.js');
        const datastore = new Datastore(env, logger);
        const auditLogger = new AuditLogger(datastore, logger);
        await auditLogger.logProjectActivity(
          instance.get('user_id'),
          instance.get('project_id'),
          'project_deleted',
          `${instance.get('name')} project deleted`,
          {
            name: instance.get('name'),
            domain: instance.get('domain')
          }
        );
      } catch (auditError) {
        logger?.warn('Failed to create project deletion audit log', auditError);
      }
    }
  }
};
