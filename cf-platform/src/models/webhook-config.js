/**
 * WebhookConfig Model Definition
 * Stores webhook configurations for users/projects
 */

export const WebhookConfigModel = {
  name: 'WEBHOOK_CONFIG',
  
  options: {
    timestamps: true,
    softDelete: false,
    userTracking: true,
    auth: true
  },
  
  fields: {
    webhook_id: { type: 'string', primary: true },
    user_id: { type: 'string', required: true },
    project_id: { type: 'string' }, // Optional - can be global webhooks
    
    // Webhook configuration
    name: { type: 'string', required: true }, // User-friendly name
    target_url: { type: 'string', required: true },
    secret: { type: 'string' }, // For HMAC signatures
    
    // Event filtering
    event_types: { type: 'json', default: [] }, // ['page.completed', 'project.created']
    
    // Status and reliability
    status: { type: 'string', default: 'active' }, // 'active', 'disabled', 'failed'
    failure_count: { type: 'number', default: 0 },
    last_success_at: { type: 'string' }, // ISO timestamp
    last_failure_at: { type: 'string' }, // ISO timestamp
    last_error: { type: 'string' }, // Last error message
    
    // Configuration options
    timeout_ms: { type: 'number', default: 10000 }, // 10 seconds
    max_retries: { type: 'number', default: 3 },
    
    // Flexible metadata
    metadata: { type: 'json', default: {} }
  },
  
  kv: {
    namespace: 'WEBHOOK_CONFIGS',
    keyPattern: 'webhook:{id}'
  },
  
  d1: {
    table: 'webhook_configs',
    syncFields: [
      'webhook_id',
      'user_id', 
      'project_id',
      'name',
      'target_url',
      'secret',
      'status',
      'failure_count',
      'last_success_at',
      'last_failure_at',
      'last_error',
      'timeout_ms',
      'max_retries',
      'created_at',
      'updated_at'
    ]
  },
  
  hooks: {
    beforeCreate: async function(data, context) {
      // Generate webhook ID if not provided
      if (!data.webhook_id) {
        data.webhook_id = `wh_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      }
      
      // Validate URL
      try {
        new URL(data.target_url);
      } catch (error) {
        throw new Error('Invalid target_url: must be a valid URL');
      }
      
      return data;
    },
    
    beforeUpdate: async function(data, context) {
      // Validate URL if being updated
      if (data.target_url) {
        try {
          new URL(data.target_url);
        } catch (error) {
          throw new Error('Invalid target_url: must be a valid URL');
        }
      }
      
      return data;
    }
  }
};
