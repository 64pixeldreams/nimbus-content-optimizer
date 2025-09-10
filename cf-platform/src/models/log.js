/**
 * Log Model Definition
 * Represents audit logs and activity trails
 */

export const LogModel = {
  name: 'LOG',
  
  options: {
    timestamps: true,
    softDelete: false, // Logs are never deleted
    userTracking: true,
    auth: true
  },
  
  fields: {
    log_id: { type: 'string', primary: true },
    user_id: { type: 'string', required: true },
    entity_type: { type: 'string', required: true }, // 'user', 'project', 'page'
    entity_id: { type: 'string' }, // ID of the main entity being logged
    action: { type: 'string', required: true }, // 'page_created', 'user_login', etc.
    message: { type: 'string', required: true },
    level: { type: 'string', default: 'info' }, // 'info', 'warn', 'error'
    
    // Flexible indexing - all IDs this log relates to
    entity_ids: { type: 'json', default: [] }, // Array of all related entity IDs
    
    // Details stored as JSON
    details: { type: 'json', default: {} },
    
    // Performance data
    duration_ms: { type: 'number' },
    request_id: { type: 'string' }
  },
  
  kv: {
    namespace: 'LOGS',
    keyPattern: 'log:{id}'
  },
  
  d1: {
    table: 'audit_logs',
    syncFields: [
      'log_id',
      'user_id',
      'entity_type',
      'entity_id',
      'action',
      'message',
      'level',
      'entity_ids',
      'created_at',
      'updated_at'
    ]
  }
};
