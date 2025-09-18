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
    
    // Page classification
    page_type: { type: 'string', default: 'page' },
    
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
      'page_type',
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
          instance.get('user_id') || 'system',
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

        // Track analytics event - NEW CLEAN STRUCTURE
        try {
          if (env.ANALYTICS_DATA?.writeDataPoint) {
            // Extract clean project ID (remove 'project:' prefix if present)
            const rawProjectId = instance.get('project_id');
            const cleanProjectId = rawProjectId?.startsWith('project:') 
              ? rawProjectId.substring(8) 
              : rawProjectId;

            env.ANALYTICS_DATA.writeDataPoint({
              blobs: [
                'page',                         // blob1: entity type
                'uploaded',                     // blob2: action
                cleanProjectId,                 // blob3: clean project_id  
                instance.get('status')          // blob4: status
              ],
              doubles: [
                1,                              // count (always 1 per event)
                JSON.stringify(data).length    // size in bytes
              ],
              indexes: [instance.get('page_id')]
            });
            
            logger?.log('📊 Analytics event written: page.uploaded', {
              pageId: instance.get('page_id'),
              status: instance.get('status'),
              projectId: cleanProjectId,
              action: 'uploaded'
            });
          } else {
            logger?.warn('Analytics Engine binding not available');
          }
        } catch (error) {
          logger?.error('❌ Analytics tracking failed', error);
        }
        
        // Atomic stats: increment via D1 JSON ops, then mirror to KV
        try {
          const { ProjectStats } = await import('../modules/stats/project-stats.js');
          const stats = new ProjectStats(env, logger);
          await stats.applyCreate(instance.get('project_id'), instance.get('status'));
        } catch (statsErr) {
          logger?.warn('ProjectStats applyCreate failed', { error: statsErr.message });
        }
        
      } catch (error) {
        logger?.error('Audit logging failed in afterCreate hook', error);
        // Don't throw - audit logging shouldn't break page creation
      }
    },
    
    afterUpdate: async (instance, changes, env, logger, context) => {
      // Always log page updates
      try {
        const { Datastore } = await import('../modules/datastore/index.js');
        const { AuditLogger } = await import('../modules/logs/core/audit-logger.js');
        
        const datastore = new Datastore(env, logger);
        const auditLogger = new AuditLogger(datastore, logger);
        
        // Get the authenticated user ID from context or instance
        const userId = context?.user_id || 
                      instance.get('user_id') || 
                      instance.get('created_by') ||
                      'system';
        
        logger?.log('🔧 PAGE HOOK: afterUpdate triggered', {
          pageId: instance.get('page_id'),
          changes: Object.keys(changes),
          userId: userId
        });
        
        // Log general page update
        await auditLogger.logPageActivity(
          userId,
          instance.get('page_id'),
          instance.get('project_id'),
          'page_updated',
          'Page updated',
          {
            url: instance.get('url'),
            title: instance.get('title'),
            changed_fields: Object.keys(changes),
            field_count: Object.keys(changes).length
          }
        );
        
        // Additional status-specific logging if status changed
        if (changes.status) {
          const oldStatus = instance.originalData?.status || 'pending';
          const newStatus = changes.status;
          
          // Only log status change if it actually changed
          if (oldStatus !== newStatus) {
            await auditLogger.logPageActivity(
              userId,
              instance.get('page_id'),
              instance.get('project_id'),
              'page_status_updated',
              `Status changed from ${oldStatus} to ${newStatus}`,
              {
                url: instance.get('url'),
                title: instance.get('title'),
                old_status: oldStatus,
                new_status: newStatus,
                status_change: `${oldStatus} → ${newStatus}`
              }
            );
          }
        }
        
        logger?.log('🔧 PAGE HOOK: Update audit logs created successfully');
        
      } catch (auditError) {
        logger?.error('🔧 PAGE HOOK: Failed to create page update audit log', auditError);
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
          const { ProjectStats } = await import('../modules/stats/project-stats.js');
          const stats = new ProjectStats(env, logger);
          await stats.applyStatusChange(instance.get('project_id'), instance.originalData?.status, changes.status);
        } catch (statsErr) {
          logger?.warn('ProjectStats applyStatusChange failed', { error: statsErr.message });
        }
        
        // Track analytics event for page updates - NEW CLEAN STRUCTURE
        try {
          if (env.ANALYTICS_DATA?.writeDataPoint) {
            // Extract clean project ID (remove 'project:' prefix if present)
            const rawProjectId = instance.get('project_id');
            const cleanProjectId = rawProjectId?.startsWith('project:') 
              ? rawProjectId.substring(8) 
              : rawProjectId;

            // Determine action based on status change
            const statusChanged = changes.status !== undefined;
            const currentStatus = instance.get('status');
            
            // Use specific action based on what happened
            let action = 'updated';
            if (statusChanged && currentStatus === 'completed') {
              action = 'completed';
            } else if (statusChanged && currentStatus === 'failed') {
              action = 'failed';
            }

            env.ANALYTICS_DATA.writeDataPoint({
              blobs: [
                'page',                         // blob1: entity type
                action,                         // blob2: action (updated/completed/failed)
                cleanProjectId,                 // blob3: clean project_id
                currentStatus                   // blob4: current status
              ],
              doubles: [
                1,                              // count (always 1 per event)
                Object.keys(changes).length    // number of fields changed
              ],
              indexes: [instance.get('page_id')]
            });
            
            logger?.log(`📊 Analytics event written: page.${action}`, {
              pageId: instance.get('page_id'),
              status: currentStatus,
              projectId: cleanProjectId,
              action: action,
              changedFields: Object.keys(changes)
            });
          } else {
            logger?.warn('Analytics Engine binding not available in afterUpdate');
          }
        } catch (error) {
          logger?.error('❌ Analytics tracking failed in afterUpdate', error);
        }
      }
    }
  }
};
