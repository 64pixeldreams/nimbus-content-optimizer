/**
 * Page Model Definition
 * Represents a web page for optimization
 */

export const PageModel = {
  name: 'PAGE',
  
  options: {
    timestamps: true,
    softDelete: true,
    userTracking: true,
    auth: true
  },
  
  fields: {
    page_id: { type: 'string', primary: true },
    project_id: { type: 'string', required: true },
    url: { type: 'string', required: true },
    title: { type: 'string' },
    status: { type: 'string', default: 'pending' },
    
    // Large content fields (KV only)
    content: { type: 'text' },
    extracted_data: { type: 'json' },
    optimized_content: { type: 'text' },
    metadata: { type: 'json' },
    
    // Processing info
    last_processed: { type: 'timestamp' },
    processing_time_ms: { type: 'number' },
    error_message: { type: 'string' }
  },
  
  kv: {
    namespace: 'PAGES',
    keyPattern: 'page:{id}'
  },
  
  d1: {
    table: 'page_meta',
    syncFields: [
      'page_id',
      'project_id',
      'user_id',
      'url',
      'title',
      'status',
      'created_at',
      'updated_at',
      'deleted_at',
      'last_processed'
    ]
  },
  
  hooks: {
    afterCreate: async (instance, data, env, logger) => {
      try {
        // Create audit log for page creation
        const { Datastore } = await import('../modules/datastore/index.js');
        const { AuditLogger } = await import('../modules/logs/core/audit-logger.js');
        
        const datastore = new Datastore(env, logger);
        const auditLogger = new AuditLogger(datastore, logger);
        
        await auditLogger.logPageActivity(
          instance.get('user_id'),
          instance.get('page_id'),
          instance.get('project_id'),
          'page_created',
          `Page created: ${instance.get('title') || instance.get('url')}`,
          {
            url: instance.get('url'),
            title: instance.get('title'),
            status: instance.get('status'),
            content_size: instance.get('content')?.length || 0,
            metadata: data?.metadata || instance.get('metadata') || {}
          }
        );
        
        logger?.log('Page queued for processing', { 
          pageId: instance.get('page_id'),
          projectId: instance.get('project_id')
        });
        
      } catch (error) {
        logger?.error('Audit logging failed in afterCreate hook', error);
        // Don't throw - audit logging shouldn't break page creation
      }
    },
    
    afterUpdate: async (instance, changes, env, logger) => {
      // Create audit log for status changes
      if (changes.status) {
        try {
          const { Datastore } = await import('../modules/datastore/index.js');
          const { AuditLogger } = await import('../modules/logs/core/audit-logger.js');
          
          const datastore = new Datastore(env, logger);
          const auditLogger = new AuditLogger(datastore, logger);
          
          await auditLogger.logPageActivity(
            instance.get('user_id'),
            instance.get('page_id'),
            instance.get('project_id'),
            `page_status_${changes.status.new}`,
            `Page status updated: ${changes.status.old} → ${changes.status.new}`,
            {
              url: instance.get('url'),
              title: instance.get('title'),
              old_status: changes.status.old,
              new_status: changes.status.new
            }
          );
        } catch (auditError) {
          logger?.warn('Failed to create page status audit log', auditError);
        }
      }
      
      if (changes.status === 'completed') {
        logger?.log('Page processing completed', { 
          pageId: instance.get('page_id'),
          status: 'completed'
        });
      }
    }
  }
};
