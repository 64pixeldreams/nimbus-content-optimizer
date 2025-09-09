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
        // Create audit log entry using new audit system
        const { PageAudit } = await import('../modules/pages/utils/audit.js');
        
        const context = {
          env,
          logger,
          user_id: instance.get('user_id'),
          project_id: instance.get('project_id'),
          page_id: instance.get('page_id')
        };
        
        const pageData = {
          url: instance.get('url'),
          title: instance.get('title'),
          status: instance.get('status'),
          content: data?.content || instance.get('content') || '',
          metadata: data?.metadata || instance.get('metadata') || {}
        };
        
        await PageAudit.created(context, pageData);
        
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
        const { SavedLogger } = await import('../modules/logs/core/saved-logger.js');
        const { Datastore } = await import('../modules/datastore/index.js');
        
        const datastore = new Datastore(env, logger);
        const audit = new SavedLogger(
          datastore,
          { user_id: instance.get('user_id'), project_id: instance.get('project_id') },
          instance.get('page_id')
        );
        
        audit.log('Page status updated', {
          page_id: instance.get('page_id'),
          project_id: instance.get('project_id'),
          old_status: changes.status.old,
          new_status: changes.status.new,
          action: `page_status_${changes.status.new}`,
          url: instance.get('url'),
          title: instance.get('title')
        });
        
        await audit.persist();
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
