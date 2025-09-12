/**
 * Notification Model Definition
 * Represents in-app notifications for users
 */

export const NotificationModel = {
  name: 'NOTIFICATION',
  
  options: {
    timestamps: true,
    softDelete: false,
    userTracking: true,
    auth: true
  },
  
  fields: {
    notification_id: { type: 'string', primary: true },
    user_id: { type: 'string', required: true },
    project_id: { type: 'string' }, // Optional - can be global notifications
    type: { type: 'string', required: true }, // 'batch_upload_complete', 'page_processed', etc.
    title: { type: 'string', required: true },
    message: { type: 'string', required: true },
    
    // Notification-specific fields
    seen: { type: 'boolean', default: false },
    dismissed: { type: 'boolean', default: false },
    expires_at: { type: 'string' }, // ISO timestamp when notification expires
    
    // Action URL for clickable notifications
    action_url: { type: 'string' },
    
    // Flexible metadata stored as JSON
    metadata: { type: 'json', default: {} },
    
    // Priority level
    priority: { type: 'string', default: 'normal' } // 'low', 'normal', 'high', 'urgent'
  },
  
  kv: {
    namespace: 'NOTIFICATIONS',
    keyPattern: 'notification:{id}'
  },
  
  d1: {
    table: 'notifications',
    syncFields: [
      'notification_id',
      'user_id',
      'project_id',
      'type',
      'title',
      'message',
      'seen',
      'dismissed',
      'expires_at',
      'action_url',
      'priority',
      'created_at',
      'updated_at'
    ]
  }
};
