/**
 * User Model Definition
 * Extends user data with DataModel features
 */

export const UserModel = {
  name: 'USER',
  
  options: {
    timestamps: true,
    softDelete: true,
    userTracking: false,  // Users don't have a user_id field
    auth: true
  },
  
  fields: {
    user_id: { type: 'string', primary: true },
    email: { type: 'string', required: true },
    name: { type: 'string', default: '' }, // Auto-generated from email if not provided
    email_verified: { type: 'boolean', default: false },
    password_hash: { type: 'string', required: true },
    
    // Profile
    profile: { type: 'json', default: {} },
    settings: { type: 'json', default: {} },
    
    // Status
    status: { type: 'string', default: 'active' },
    last_login: { type: 'timestamp' },
    
    // Billing
    stripe_customer_id: { type: 'string' },
    subscription_status: { type: 'string' },
    
    // Admin
    is_admin: { type: 'boolean', default: false }
  },
  
  kv: {
    namespace: 'USERS',
    keyPattern: 'user:{id}'
  },
  
  d1: {
    table: 'users',
    syncFields: [
      'user_id',
      'email',
      'name',
      'email_verified',
      'status',
      'last_login',
      'subscription_status',
      'is_admin',
      'created_at',
      'updated_at',
      'deleted_at'
    ]
  },
  
  hooks: {
    beforeCreate: async (instance, data, env, logger) => {
      // Auto-generate name if not provided
      if (!data.name || data.name.trim() === '') {
        const email = data.email || instance.get('email');
        const emailPart = email.split('@')[0];
        // Convert email to friendly name: "john.doe" → "John Doe"
        const friendlyName = emailPart
          .split(/[._-]/)
          .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
          .join(' ');
        
        instance.set('name', friendlyName);
        logger?.log('Auto-generated user name', { 
          email,
          generatedName: friendlyName 
        });
      }
    },
    
    afterCreate: async (instance, data, env, logger) => {
      // Create email mapping for login
      const datastore = new (await import('../modules/datastore/index.js')).Datastore(env, logger);
      const emailKey = `email:${instance.get('email').toLowerCase().trim()}`;
      await datastore.put('EMAIL', emailKey, {
        user_id: instance.get('user_id'),
        hash: instance.get('password_hash'),
        created: instance.get('created_at')
      });
      
      // Create audit log for user creation
      try {
        const { AuditLogger } = await import('../modules/logs/core/audit-logger.js');
        const auditLogger = new AuditLogger(datastore, logger);
        await auditLogger.logUserActivity(
          instance.get('user_id'),
          'user_created',
          `${instance.get('name')} created account`,
          {
            email: instance.get('email'),
            name: instance.get('name'),
            source: 'registration'
          }
        );
      } catch (auditError) {
        logger?.warn('Failed to create user audit log', auditError);
      }
      
      // Send welcome email
      logger?.log('Welcome email queued', { 
        userId: instance.get('user_id'),
        email: instance.get('email'),
        name: instance.get('name')
      });
    },
    
    beforeUpdate: async (instance, changes, env, logger) => {
      // Don't expose password hash
      if (changes.password_hash) {
        delete changes.password_hash;
      }
    },
    
    afterUpdate: async (instance, changes, env, logger) => {
      // Update email mapping if email changed
      if (changes.email) {
        const datastore = new (await import('../modules/datastore/index.js')).Datastore(env, logger);
        const oldEmailKey = `email:${instance.get('email').toLowerCase().trim()}`;
        const newEmailKey = `email:${changes.email.toLowerCase().trim()}`;
        
        // Delete old mapping
        await datastore.delete('EMAIL', oldEmailKey);
        
        // Create new mapping
        await datastore.put('EMAIL', newEmailKey, {
          user_id: instance.get('user_id'),
          created: instance.get('updated_at')
        });
      }
    }
  }
};
