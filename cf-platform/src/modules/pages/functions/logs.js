/**
 * Page Logs CloudFunction
 * Retrieves audit logs for pages, projects, or users
 */

/**
 * Get logs CloudFunction handler
 * @param {Object} requestContext - CloudFunction request context
 * @returns {Promise<Object>} Logs retrieval result
 */
export async function pageLogs(requestContext) {
  const { env, logger, payload, auth } = requestContext;
  
  logger.log('Logs retrieval started', { 
    userId: auth.user_id,
    queryType: payload.type,
    entityId: payload.entity_id
  });
  
  try {
    // Initialize datastore
    const { Datastore } = await import('../../datastore/index.js');
    const datastore = new Datastore(env, logger);
    datastore.setAuthContext(auth.user_id);
    
    const { type, entity_id, limit = 50, offset = 0 } = payload;
    
    // Build query based on type
    let logs = [];
    
    if (type === 'user') {
      // Get all logs for user
      logs = await datastore.list('LOG', `user:${auth.user_id}`, { limit, offset });
      
    } else if (type === 'project' && entity_id) {
      // Get all logs for project
      logs = await datastore.list('LOG', `project:${entity_id}`, { limit, offset });
      
    } else if (type === 'page' && entity_id) {
      // Get all logs for specific page
      logs = await datastore.list('LOG', `page:${entity_id}`, { limit, offset });
      
    } else {
      return {
        success: false,
        error: 'Invalid query type. Use: user, project, or page with entity_id'
      };
    }
    
    // Format logs for display
    const formattedLogs = logs.map(log => ({
      log_id: log.log_id,
      message: log.entries?.[0]?.message || 'No message',
      action: log.entries?.[0]?.data?.action || 'unknown',
      entity_type: type,
      entity_id: entity_id || auth.user_id,
      timestamp: log.timestamp || log.created_at,
      details: log.entries?.[0]?.data || {}
    }));
    
    logger.log('Logs retrieval completed', { 
      count: formattedLogs.length,
      type,
      entityId: entity_id
    });
    
    return {
      success: true,
      logs: formattedLogs,
      count: formattedLogs.length,
      type,
      entity_id: entity_id || auth.user_id,
      offset,
      limit
    };
    
  } catch (error) {
    logger.error('Logs retrieval failed', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * CloudFunction configuration
 */
export const pageLogsConfig = {
  auth: true,
  validation: {
    type: { type: 'string', required: true, validation: ['user', 'project', 'page'] },
    entity_id: { type: 'string' }, // Required for project/page, optional for user
    limit: { type: 'number', default: 50 },
    offset: { type: 'number', default: 0 }
  }
};
