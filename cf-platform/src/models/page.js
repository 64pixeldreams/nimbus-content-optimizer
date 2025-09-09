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
      // Queue for processing
      logger?.log('Page queued for processing', { 
        pageId: instance.get('page_id'),
        projectId: instance.get('project_id')
      });
    },
    
    afterUpdate: async (instance, changes, env, logger) => {
      if (changes.status === 'completed') {
        // Send webhook notification
        logger?.log('Page processing completed', { 
          pageId: instance.get('page_id'),
          status: 'completed'
        });
      }
    }
  }
};
