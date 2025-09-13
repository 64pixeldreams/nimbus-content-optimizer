/**
 * WebhookQueue Model
 * Stores failed webhooks for retry processing
 */

export const WebhookQueueModel = {
  name: 'WEBHOOK_QUEUE',
  options: {
    primaryKey: 'queue_id',
    timestamps: true,
    userTracking: true,
    auth: true
  },
  fields: {
    queue_id: {
      type: 'string',
      primary: true,
      required: true
    },
    webhook_id: {
      type: 'string',
      required: true
    },
    event_type: {
      type: 'string',
      required: true
    },
    target_url: {
      type: 'string',
      required: true
    },
    payload: {
      type: 'object',
      required: true
    },
    headers: {
      type: 'object',
      required: false
    },
    retry_count: {
      type: 'number',
      required: true,
      default: 0
    },
    max_retries: {
      type: 'number',
      required: true,
      default: 3
    },
    next_retry_at: {
      type: 'string',
      required: true
    },
    status: {
      type: 'string',
      required: true,
      default: 'pending',
      enum: ['pending', 'processing', 'completed', 'failed', 'cancelled']
    },
    last_error: {
      type: 'string',
      required: false
    },
    user_id: {
      type: 'string',
      required: false
    },
    entity_id: {
      type: 'string',
      required: false
    },
    entity_type: {
      type: 'string',
      required: false
    }
  },
  kv: {
    namespace: 'WEBHOOK_QUEUE',
    keyPattern: 'queue:{id}'
  },
  d1: {
    table: 'webhook_queue',
    syncFields: [
      'queue_id',
      'webhook_id',
      'event_type',
      'target_url',
      'retry_count',
      'max_retries',
      'next_retry_at',
      'status',
      'last_error',
      'user_id',
      'entity_id',
      'entity_type',
      'created_at',
      'updated_at'
    ]
  },
  hooks: {
    beforeCreate: async function(data, context) {
      // Generate queue ID if not provided
      if (!data.queue_id) {
        data.queue_id = `wq_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      }
      
      // Set next retry time (exponential backoff)
      const delayMinutes = Math.pow(2, data.retry_count || 0); // 1, 2, 4, 8 minutes
      data.next_retry_at = new Date(Date.now() + delayMinutes * 60 * 1000).toISOString();
      
      return data;
    },
    
    beforeUpdate: async function(data, context) {
      // Update retry time on retry increment
      if (data.retry_count && data.retry_count > 0) {
        const delayMinutes = Math.pow(2, data.retry_count);
        data.next_retry_at = new Date(Date.now() + delayMinutes * 60 * 1000).toISOString();
      }
      
      return data;
    }
  }
};
