/**
 * Page Audit Utilities
 * Simple, clean audit logging for MVP
 */

/**
 * Create audit log entry for page events with user/project names
 * @param {Object} context - { env, logger, user_id, project_id, page_id }
 * @param {string} action - Action type (page_created, status_changed, etc.)
 * @param {Object} details - Event details
 */
export async function createPageAudit(context, action, details) {
  const { env, logger, user_id, project_id, page_id } = context;
  
  try {
    // Import dependencies
    const { SavedLogger } = await import('../../logs/core/saved-logger.js');
    const { Datastore } = await import('../../datastore/index.js');
    const { DataModel } = await import('../../datamodel/index.js');
    
    // Create datastore
    const datastore = new Datastore(env, logger);
    
    // Get user name and project name from D1 (since they use DataModel)
    let userName = 'Unknown User';
    let projectName = 'Unknown Project';
    
    try {
      // Get user name from D1 (now includes name field)
      const userQuery = DataModel.query('USER', datastore, logger);
      userQuery.where('user_id', user_id);
      const users = await userQuery.execute();
      if (users.length > 0) {
        userName = users[0].name || users[0].email?.split('@')[0] || users[0].email || 'Unknown User';
      }
      
      // Get project name from D1
      if (project_id) {
        const projectQuery = DataModel.query('PROJECT', datastore, logger);
        projectQuery.where('project_id', project_id);
        const projects = await projectQuery.execute();
        if (projects.length > 0) {
          projectName = projects[0].name || 'Unknown Project';
        }
      }
    } catch (queryError) {
      logger?.warn('Could not fetch user/project names for audit log', queryError);
    }
    
    // Create audit logger
    const audit = new SavedLogger(
      datastore,
      { user_id, project_id },
      page_id
    );
    
    // Create rich audit message with names
    const auditMessages = {
      'page_created': `${userName} uploaded page: ${details.title || details.url} (${projectName})`,
      'status_changed': `${userName} changed page status: ${details.old_status} → ${details.new_status} (${details.title})`,
      'processing_started': `AI processing started: ${details.title} by ${userName} (${details.processing_time_ms || 0}ms)`,
      'processing_completed': `AI processing completed: ${details.title} by ${userName} (${details.processing_time_ms || 0}ms)`,
      'optimization_applied': `${userName} optimized page: ${details.changes_count} changes (${details.title})`,
      'page_published': `${userName} published page: ${details.title} (${projectName})`
    };
    
    const message = auditMessages[action] || `${userName}: Page ${action} - ${details.title || details.url}`;
    
    // Log with rich message and structured data
    audit.log(message, {
      action,
      page_id,
      project_id,
      user_id,
      user_name: userName,
      project_name: projectName,
      processing_time_ms: details.processing_time_ms || 0,
      ...details,
      timestamp: new Date().toISOString()
    });
    
    // Persist to audit trail
    await audit.persist();
    
    logger?.log('Audit log created', { action, page_id, message });
    
  } catch (error) {
    logger?.error('Failed to create audit log', error);
    // Don't throw - audit logging shouldn't break main functionality
  }
}

/**
 * Quick audit helpers for common page events
 */
export const PageAudit = {
  /**
   * Log page creation/upload
   */
  async created(context, pageData) {
    await createPageAudit(context, 'page_created', {
      url: pageData.url,
      title: pageData.title,
      status: pageData.status,
      content_size: pageData.content?.length || 0,
      extraction_source: pageData.metadata?.source || 'unknown'
    });
  },
  
  /**
   * Log status change
   */
  async statusChanged(context, pageData, oldStatus, newStatus) {
    await createPageAudit(context, 'status_changed', {
      url: pageData.url,
      title: pageData.title,
      old_status: oldStatus,
      new_status: newStatus
    });
  },
  
  /**
   * Log processing events with timing
   */
  async processingStarted(context, pageData, options = {}) {
    await createPageAudit(context, 'processing_started', {
      url: pageData.url,
      title: pageData.title,
      model: options.ai_model || 'gpt-4',
      estimated_time_ms: options.estimated_time_ms || 0,
      processing_start_time: new Date().toISOString()
    });
  },
  
  async processingCompleted(context, pageData, results) {
    await createPageAudit(context, 'processing_completed', {
      url: pageData.url,
      title: pageData.title,
      processing_time_ms: results.processing_time_ms || results.duration || 0,
      changes_count: results.changes_count || 0,
      success: results.success || true,
      model_used: results.model_used || 'gpt-4',
      tokens_consumed: results.tokens_consumed || 0,
      processing_end_time: new Date().toISOString()
    });
  },
  
  /**
   * Log AI optimization events (for when AI runs tasks)
   */
  async aiOptimizationStarted(context, pageData, options = {}) {
    await createPageAudit(context, 'ai_optimization_started', {
      url: pageData.url,
      title: pageData.title,
      ai_model: options.ai_model || 'gpt-4',
      prompt_type: options.prompt_type || 'content_optimization',
      estimated_time_ms: options.estimated_time_ms || 3000,
      optimization_start_time: new Date().toISOString()
    });
  },
  
  async aiOptimizationCompleted(context, pageData, results) {
    await createPageAudit(context, 'ai_optimization_completed', {
      url: pageData.url,
      title: pageData.title,
      processing_time_ms: results.processing_time_ms || 0,
      ai_model: results.ai_model || 'gpt-4',
      tokens_consumed: results.tokens_consumed || 0,
      changes_made: results.changes_made || 0,
      optimization_score: results.optimization_score || 0,
      success: results.success || true,
      optimization_end_time: new Date().toISOString()
    });
  }
};
