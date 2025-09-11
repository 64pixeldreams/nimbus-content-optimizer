/**
 * Page Model Definition
 * Represents a web page for optimization
 */

/**
 * Update project stats atomically based on page change
 */
async function updateProjectStats(projectId, change, env, logger) {
  try {
    const { DataModel } = await import('../modules/datamodel/index.js');
    const { Datastore } = await import('../modules/datastore/index.js');
    const { ProjectModel } = await import('./project.js');
    
    // Initialize datastore
    const datastore = new Datastore(env, logger);
    
    // Register models
    DataModel.registerModel(ProjectModel);
    
    // Get the project
    const project = await DataModel.get('PROJECT', datastore, projectId, logger);
    if (!project) {
      logger?.warn('Project not found for stats update', { projectId });
      return;
    }
    
    // Get current stats
    const currentStats = project.get('stats') || { total_pages: 0, processing_pages: 0, completed_pages: 0 };
    
    // Apply atomic changes
    let newStats = { ...currentStats };
    
    if (change.type === 'create') {
      newStats.total_pages += 1;
      if (change.status === 'processing') {
        newStats.processing_pages += 1;
      }
    } else if (change.type === 'update') {
      if (change.oldStatus && change.newStatus) {
        // Status changed
        if (change.oldStatus === 'processing' && change.newStatus !== 'processing') {
          newStats.processing_pages -= 1;
        }
        if (change.oldStatus !== 'processing' && change.newStatus === 'processing') {
          newStats.processing_pages += 1;
        }
        if (change.newStatus === 'completed') {
          newStats.completed_pages += 1;
        }
      }
    } else if (change.type === 'delete') {
      newStats.total_pages -= 1;
      if (change.status === 'processing') {
        newStats.processing_pages -= 1;
      }
      if (change.status === 'completed') {
        newStats.completed_pages -= 1;
      }
    }
    
    // Update last activity
    newStats.last_activity = new Date().toISOString();
    
    // Update project stats
    await project.update({ stats: newStats });
    await project.save();
    
    logger?.log('Project stats updated atomically', {
      projectId,
      change: change.type,
      oldStats: currentStats,
      newStats
    });
    
  } catch (error) {
    logger?.error('Failed to update project stats', error);
    throw error;
  }
}

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
        
        // Update project stats atomically
        await updateProjectStats(instance.get('project_id'), {
          type: 'create',
          status: instance.get('status')
        }, env, logger);
        
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
          
          // Get old and new status values - try multiple sources for old status
          const oldStatus = instance.originalData?.status || 
                           instance.data?.status || 
                           (instance.data && typeof instance.data === 'object' ? instance.data.status : null) ||
                           'pending'; // Default to pending if we can't find old status
          const newStatus = changes.status;
          
          // Use the new improved logging method
          await auditLogger.logPageActivity(
            instance.get('user_id'),
            instance.get('page_id'),
            instance.get('project_id'),
            `page_status_updated`,
            `Page status updated: ${oldStatus} → ${newStatus}`,
            {
              url: instance.get('url'),
              title: instance.get('title'),
              old_status: oldStatus,
              new_status: newStatus,
              status_change: `${oldStatus} → ${newStatus}`
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
      
      // Update project stats if status changed
      if (changes.status) {
        try {
          await updateProjectStats(instance.get('project_id'), {
            type: 'update',
            oldStatus: instance.originalData?.status,
            newStatus: changes.status
          }, env, logger);
        } catch (error) {
          logger?.warn('Failed to update project stats in afterUpdate hook', error);
        }
      }
    }
  }
};
