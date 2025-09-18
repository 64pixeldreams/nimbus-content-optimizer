/**
 * Cloudflare Worker entry point
 * Simple routing with auth middleware
 */

import { Router } from './router.js';
import { withAuth } from './modules/auth/middleware/with-auth.js';
import { LOGS } from './modules/logs/index.js';
import { CloudFunction } from './modules/cloudfunction/index.js';
import { DataModel } from './modules/datamodel/index.js';
import { Datastore } from './modules/datastore/index.js';
import { UserModel } from './models/user.js';
import { ProjectModel } from './models/project.js';
import { PageModel } from './models/page.js';
import { LogModel } from './models/log.js';
import { NotificationModel } from './models/notification.js';
import { WebhookConfigModel } from './models/webhook-config.js';

// Auth routes
import { login } from './routes/auth/login.js';
import { signup } from './routes/auth/signup.js';
import { logout } from './routes/auth/logout.js';
import { me } from './routes/auth/me.js';

// API key routes
import { create as createApiKey } from './routes/api-keys/create.js';
import { list as listApiKeys } from './routes/api-keys/list.js';
import { get as getApiKey } from './routes/api-keys/get.js';
import { revoke as revokeApiKey } from './routes/api-keys/revoke.js';

// User routes
import { profile } from './routes/users/profile.js';
import { password } from './routes/users/password.js';
import { deleteAccount } from './routes/users/delete.js';

// Create router
const router = new Router();

// Initialize CloudFunction
let cloudFunction = null;

// Register all models
DataModel.registerModel(UserModel);
DataModel.registerModel(ProjectModel);
DataModel.registerModel(PageModel);
DataModel.registerModel(LogModel);
DataModel.registerModel(NotificationModel);
DataModel.registerModel(WebhookConfigModel);

// Health check
router.get('/health', (request, env) => {
  return new Response(JSON.stringify({ 
    status: 'healthy',
    environment: env.ENVIRONMENT,
    timestamp: new Date().toISOString()
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
});

// Debug endpoint
router.get('/debug/logs', (request, env) => {
  return new Response(JSON.stringify({ 
    logs: LOGS.getRecent(50),
    requestId: LOGS.getRequestId(),
    level: LOGS.getLevel()
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
});

// CloudFunction endpoint
router.post('/api/function', async (request, env) => {
  try {
    // Initialize CloudFunction if not already done
    if (!cloudFunction) {
      cloudFunction = new CloudFunction(env);
      
      // Register system initialization function
      // 🔧 AUTO-SCHEMA SYSTEM: Creates D1 tables from model definitions
      // Call this after adding new models or changing schemas:
      // POST /api/function { "action": "system.initialize", "data": {} }
      cloudFunction.define('system.initialize', async (requestContext) => {
        const { env, logger } = requestContext;
        const datastore = new Datastore(env, logger);
        
        logger.log('Database initialization started');
        const result = await DataModel.initialize(datastore, logger);
        logger.log('Database initialization completed');
        
        return result;
      }, {
        auth: false, // Can be secured later if needed
        validation: {}
      });
      
      // Register test log creation function
      cloudFunction.define('test.log.create', async (requestContext) => {
        const { env, logger, payload, auth } = requestContext;
        
        try {
          // Use LogManager to create the log
          const { LogManager } = await import('./modules/logs/core/log-manager.js');
          const logManager = new LogManager(env, auth.user_id);
          
          const result = await logManager.create(payload);
          
          logger.log('Test log created', { 
            success: result.success,
            logId: payload.log_id || 'unknown'
          });
          
          return result;
          
        } catch (error) {
          logger.error('Test log creation failed', error);
          return {
            success: false,
            error: error.message
          };
        }
      }, {
        auth: true,
        validation: {
          user_id: { type: 'string', required: true },
          entity_type: { type: 'string', required: true },
          entity_id: { type: 'string', required: true },
          action: { type: 'string', required: true },
          message: { type: 'string', required: true },
          level: { type: 'string', default: 'info' },
          entity_ids: { type: 'json', default: [] },
          details: { type: 'json', default: {} }
        }
      });
      
      // Register user signup function for debugging
      cloudFunction.define('user.signup', async (requestContext) => {
        const { env, logger, payload } = requestContext;
        
        logger.log('User signup started', payload);
        
        // Import signup logic
        const { createUser } = await import('./modules/user/core/create.js');
        const { createSession } = await import('./modules/auth/utils/sessions.js');
        const { validatePasswordStrength } = await import('./modules/auth/utils/passwords.js');
        const { Messenger } = await import('./modules/messaging/index.js');
        
        const { email, password, name } = payload;
        
        // Validate input
        if (!email || !password) {
          throw new Error('Email and password required');
        }
        
        // Validate password strength
        const passwordValidation = validatePasswordStrength(password);
        if (!passwordValidation.valid) {
          throw new Error(`Password requirements not met: ${passwordValidation.errors.join(', ')}`);
        }
        
        logger.log('Creating user via DataModel');
        
        // Create user using DataModel
        const messenger = new Messenger(env, logger);
        const result = await createUser(
          email, 
          password, 
          { name: name || email.split('@')[0] }, 
          env, 
          messenger, 
          logger
        );
        
        if (!result.success) {
          throw new Error(`User creation failed: ${result.error}`);
        }
        
        logger.log('User created successfully', { userId: result.user.user_id });
        
        return {
          success: true,
          user: {
            user_id: result.user.user_id,
            email: result.user.email,
            created_at: result.user.created_at
          }
        };
      }, {
        auth: false,
        validation: {
          email: { type: 'string', required: true },
          password: { type: 'string', required: true },
          name: { type: 'string' }
        }
      });
      
      // Register user creation test function
      cloudFunction.define('user.create', async (requestContext) => {
        const { env, logger, payload } = requestContext;
        
        logger.log('Testing user creation via CloudFunction', payload);
        
        try {
          const { createUser } = await import('./modules/user/core/create.js');
          const { Messenger } = await import('./modules/messaging/index.js');
          
          const messenger = new Messenger(env, logger);
          const result = await createUser(
            payload.email,
            payload.password,
            { name: payload.name || 'Test User' },
            env,
            messenger,
            logger
          );
          
          logger.log('User creation result', result);
          return result;
          
        } catch (error) {
          logger.error('User creation failed in CloudFunction', error);
          throw error;
        }
      }, {
        auth: false,
        validation: {
          email: { type: 'string', required: true },
          password: { type: 'string', required: true },
          name: { type: 'string' }
        }
      });
      
      // Register DataProxy demonstration function
      cloudFunction.define('demo.dataproxy', async (requestContext) => {
        const { env, logger } = requestContext;
        
        try {
          const { DataModel } = await import('./modules/datamodel/index.js');
          const { Datastore } = await import('./modules/datastore/index.js');
          
          const datastore = new Datastore(env, logger);
          
          logger.log('Querying users with DataProxy');
          
          // Query users - returns DataProxy objects with D1 metadata only
          const users = await DataModel.query('USER', datastore, logger)
            .limit(2)
            .list();
          
          if (users.data.length === 0) {
            return { message: 'No users found', users: [] };
          }
          
          const firstUser = users.data[0];
          
          // Demonstrate D1 metadata access
          const d1Data = {
            user_id: firstUser.user_id,
            email: firstUser.email,
            status: firstUser.status,
            created_at: firstUser.created_at,
            isFullyLoaded: firstUser.isFullyLoaded()
          };
          
          logger.log('Accessing D1 metadata', d1Data);
          
          // Demonstrate fetchData() for full KV data
          await firstUser.fetchData();
          
          const kvData = {
            user_id: firstUser.user_id,
            email: firstUser.email,
            profile: firstUser.profile,
            settings: firstUser.settings,
            isFullyLoaded: firstUser.isFullyLoaded()
          };
          
          logger.log('After fetchData() - full KV data available', kvData);
          
          return {
            message: 'DataProxy demonstration complete',
            totalUsers: users.pagination.total,
            d1MetadataOnly: d1Data,
            afterFetchData: kvData,
            demonstration: {
              step1: 'Query returned DataProxy objects with D1 metadata',
              step2: 'Called fetchData() to load full KV data',
              step3: 'Now has access to profile, settings, etc.'
            }
          };
          
        } catch (error) {
          logger.error('DataProxy demo failed', error);
          throw error;
        }
      }, {
        auth: false,
        validation: {}
      });
      
      // Register auth.login function
      cloudFunction.define('auth.login', async (requestContext) => {
        const { env, logger, payload } = requestContext;
        
        try {
          const { email, password } = payload;
          logger.log('Auth login started', { email });
          
          // Import login logic
          const { getPasswordHash, verifyPassword } = await import('./modules/auth/utils/passwords.js');
          const { createSession } = await import('./modules/auth/utils/sessions.js');
          
          // Get password hash
          const passwordData = await getPasswordHash(env, email.toLowerCase(), logger);
          if (!passwordData) {
            throw new Error('Invalid credentials');
          }
          
          // Verify password
          const isValid = await verifyPassword(password, passwordData.hash);
          if (!isValid) {
            throw new Error('Invalid credentials');
          }
          
          // Create session
          const session = await createSession(env, passwordData.user_id, email, null, logger);
          
          logger.log('Auth login successful', { userId: passwordData.user_id });
          
          return {
            success: true,
            userId: passwordData.user_id,
            session_token: session.token,
            expires: session.expires,
            user: {
              user_id: passwordData.user_id,
              email: email,
              name: email.split('@')[0]
            }
          };
          
        } catch (error) {
          logger.error('Auth login failed', error);
          return { 
            success: false, 
            error: error.message
          };
        }
      }, {
        auth: false,
        validation: {
          email: { type: 'string', required: true },
          password: { type: 'string', required: true }
        }
      });
      
      // Register login debug function
      cloudFunction.define('debug.login', async (requestContext) => {
        const { env, logger, payload } = requestContext;
        
        try {
          const { email, password } = payload;
          logger.log('Debug login started', { email });
          
          // Step 1: Check EMAIL mapping exists
          const { Datastore } = await import('./modules/datastore/index.js');
          const datastore = new Datastore(env, logger);
          
          const emailKey = `email:${email.toLowerCase()}`;
          const passwordData = await datastore.get('EMAIL', emailKey);
          
          logger.log('EMAIL mapping lookup', { 
            emailKey, 
            found: !!passwordData,
            data: passwordData ? { user_id: passwordData.user_id, hasHash: !!passwordData.hash } : null
          });
          
          if (!passwordData) {
            return { success: false, error: 'User not found', step: 'email_lookup' };
          }
          
          // Step 2: Verify password
          const { verifyPassword } = await import('./modules/auth/utils/passwords.js');
          const isValid = await verifyPassword(password, passwordData.hash);
          
          logger.log('Password verification', { isValid });
          
          if (!isValid) {
            return { success: false, error: 'Invalid password', step: 'password_verify' };
          }
          
          // Step 3: Test session creation
          const { createSession } = await import('./modules/auth/utils/sessions.js');
          const session = await createSession(env, passwordData.user_id, email, {
            headers: new Map([['CF-Connecting-IP', '127.0.0.1'], ['User-Agent', 'Debug']])
          }, logger);
          
          logger.log('Session creation', { 
            token: session.token.substring(0, 10) + '...', 
            expires: session.expires 
          });
          
          return {
            success: true,
            user_id: passwordData.user_id,
            email: email,
            session_token: session.token,
            expires: session.expires,
            steps_completed: ['email_lookup', 'password_verify', 'session_create']
          };
          
        } catch (error) {
          logger.error('Debug login failed', error);
          return { 
            success: false, 
            error: error.message,
            stack: error.stack 
          };
        }
      }, {
        auth: false,
        validation: {
          email: { type: 'string', required: true },
          password: { type: 'string', required: true }
        }
      });
      
      // Register project CloudFunctions
      const { projectCreate, projectCreateConfig, projectList, projectListConfig, projectGet, projectGetConfig, projectUpdate, projectUpdateConfig, recomputeStats, recomputeStatsConfig } = await import('./modules/project/functions/index.js');
      
      cloudFunction.define('project.create', projectCreate, projectCreateConfig);
      cloudFunction.define('project.list', projectList, projectListConfig);
      cloudFunction.define('project.get', projectGet, projectGetConfig);
      cloudFunction.define('project.update', projectUpdate, projectUpdateConfig);
      cloudFunction.define('project.stats.recompute', recomputeStats, recomputeStatsConfig);
      
      // Register pages CloudFunctions
      const { pageCreate, pageCreateConfig, pageList, pageListConfig, pageGet, pageGetConfig, pageUpdate, pageUpdateConfig, pageLogs, pageLogsConfig, upsert, upsertConfig } = await import('./modules/pages/functions/index.js');
      
      cloudFunction.define('page.create', pageCreate, pageCreateConfig);
      cloudFunction.define('page.list', pageList, pageListConfig);
      cloudFunction.define('page.get', pageGet, pageGetConfig);
      cloudFunction.define('page.update', pageUpdate, pageUpdateConfig);
      cloudFunction.define('page.upsert', upsert, upsertConfig);
      cloudFunction.define('page.logs', pageLogs, pageLogsConfig);
      
      // Register notification CloudFunctions
      const { notificationCreate, notificationCreateConfig, notificationList, notificationListConfig, notificationMarkSeen, notificationMarkSeenConfig } = await import('./modules/notifications/functions/index.js');
      
      cloudFunction.define('notification.create', notificationCreate, notificationCreateConfig);
      cloudFunction.define('notification.list', notificationList, notificationListConfig);
      cloudFunction.define('notification.mark_seen', notificationMarkSeen, notificationMarkSeenConfig);
      
      // Register messaging functions
      const { sendTestEmail, sendTestEmailConfig } = await import('./modules/messaging/functions/index.js');
      cloudFunction.define('email.test', sendTestEmail, sendTestEmailConfig);
      
      // Register analytics functions
      const { getMetrics, getMetricsConfig, getSummary, getSummaryConfig, querySql, querySqlConfig, testWrite, testWriteConfig, testQuery, testQueryConfig } = await import('./modules/analytics/functions/index.js');
      cloudFunction.define('analytics.metrics', getMetrics, getMetricsConfig);
      cloudFunction.define('analytics.summary', getSummary, getSummaryConfig);
      cloudFunction.define('analytics.sql', querySql, querySqlConfig);
      cloudFunction.define('analytics.write.test', testWrite, testWriteConfig);
      cloudFunction.define('analytics.test.query', testQuery, testQueryConfig);
      
      // Register webhook functions
      const { testWebhook, testWebhookConfig, webhookConfigCreate, webhookConfigCreateConfig } = await import('./modules/webhooks/functions/index.js');
      cloudFunction.define('webhook.test', testWebhook, testWebhookConfig);
      cloudFunction.define('webhook.config.create', webhookConfigCreate, webhookConfigCreateConfig);
      
      // Register session debug function
      cloudFunction.define('debug.session', async (requestContext) => {
        const { env, logger } = requestContext;
        
        try {
          logger.log('Session debug started');
          
          // Test session creation
          const { createSession } = await import('./modules/auth/utils/sessions.js');
          const mockRequest = {
            headers: new Map([
              ['CF-Connecting-IP', '127.0.0.1'],
              ['User-Agent', 'Debug Test']
            ])
          };
          
          const session = await createSession(env, 'user:test123', 'test@example.com', mockRequest, logger);
          
          logger.log('Session created', { 
            token: session.token.substring(0, 10) + '...',
            expires: session.expires 
          });
          
          // Test session retrieval
          const { Datastore } = await import('./modules/datastore/index.js');
          const datastore = new Datastore(env, logger);
          const storedSession = await datastore.get('SESSION', session.token);
          
          logger.log('Session retrieval', { 
            found: !!storedSession,
            data: storedSession ? { user_id: storedSession.user_id, email: storedSession.email } : null
          });
          
          return {
            sessionCreated: true,
            sessionToken: session.token.substring(0, 10) + '...',
            sessionStored: !!storedSession,
            kvNamespace: 'NIMBUS_SESSIONS'
          };
          
        } catch (error) {
          logger.error('Session debug failed', error);
          throw error;
        }
      }, {
        auth: false,
        validation: {}
      });
      
      // Register test function
      cloudFunction.define('hello.world', async (requestContext) => {
        const { logger } = requestContext;
        logger.log('Hello world function called');
        
        return {
          message: 'Hello World',
          timestamp: new Date().toISOString(),
          user: requestContext.auth?.user_id || 'anonymous'
        };
      }, {
        auth: true,
        validation: {}
      });
      
      // Register Analytics Engine test function
      cloudFunction.define('analytics.test', async (requestContext) => {
        const { env, logger, payload, auth } = requestContext;
        
        try {
          logger.log('Analytics Engine test started');
          
          // Test write
          const writeResult = env.NIMBUS_ANALYTICS.writeDataPoint({
            blobs: ['test_event', payload.project_id || 'test_project', auth.user_id, 'created'],
            doubles: [1, Date.now(), 1000],
            indexes: [`test_${Date.now()}`]
          });
          
          logger.log('Analytics Engine write completed', { writeResult });
          
          // Test if binding exists
          const bindingExists = !!env.NIMBUS_ANALYTICS;
          const hasWriteMethod = typeof env.NIMBUS_ANALYTICS?.writeDataPoint === 'function';
          const hasSqlMethod = typeof env.NIMBUS_ANALYTICS?.sql === 'function';
          
          return {
            success: true,
            binding_exists: bindingExists,
            has_write_method: hasWriteMethod,
            has_sql_method: hasSqlMethod,
            write_result: writeResult,
            timestamp: new Date().toISOString()
          };
          
        } catch (error) {
          logger.error('Analytics Engine test failed', error);
          return {
            success: false,
            error: error.message,
            binding_exists: !!env.NIMBUS_ANALYTICS
          };
        }
      }, {
        auth: true,
        validation: {}
      });
    }

    // Parse request body
    const body = await request.json();
    const { action, payload } = body;

    if (!action) {
      return new Response(JSON.stringify({
        success: false,
        error: { code: 'MISSING_ACTION', message: 'Action is required' }
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Execute function
    return await cloudFunction.execute(action, payload || {}, request);

  } catch (error) {
    LOGS.error('CloudFunction endpoint error', error);
    return new Response(JSON.stringify({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Internal server error' }
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});

// Public auth routes
router.post('/auth/login', login);
router.post('/auth/signup', signup);

// Protected auth routes
router.post('/auth/logout', withAuth, logout);
router.get('/auth/me', withAuth, me);

// Protected API key routes
router.post('/api-keys', withAuth, createApiKey);
router.get('/api-keys', withAuth, listApiKeys);
router.get('/api-keys/:id', withAuth, getApiKey);
router.delete('/api-keys/:id', withAuth, revokeApiKey);

// Protected user routes
router.get('/users/profile', withAuth, profile);
router.patch('/users/profile', withAuth, profile);
router.post('/users/password', withAuth, password);
router.delete('/users/account', withAuth, deleteAccount);

// Export for Cloudflare Worker
export default {
  async fetch(request, env, ctx) {
    // Handle CORS preflight requests
    if (request.method === 'OPTIONS') {
      const origin = request.headers.get('Origin') || 'http://localhost:3000';
      return new Response(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': origin,
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, Cookie, X-Request-ID, X-Session-Token',
          'Access-Control-Allow-Credentials': 'true',
          'Access-Control-Max-Age': '86400'
        }
      });
    }

    // Set up request context for logging
    LOGS.setRequest({
      requestId: crypto.randomUUID(),
      method: request.method,
      url: request.url,
      headers: Object.fromEntries(request.headers.entries())
    });

    try {
      const response = await router.handle(request, env, ctx);
      
      // Add CORS headers to all responses
      const origin = request.headers.get('Origin') || 'http://localhost:3000';
      const corsHeaders = {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, Cookie, X-Request-ID, X-Session-Token',
        'Access-Control-Allow-Credentials': 'true'
      };
      
      // Clone response and add CORS headers
      const newResponse = new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: {
          ...Object.fromEntries(response.headers.entries()),
          ...corsHeaders
        }
      });
      
      return newResponse;
      
    } catch (err) {
      LOGS.error('Unhandled error', err);
      return new Response(JSON.stringify({ 
        error: 'Internal server error',
        requestId: LOGS.getRequestId()
      }), { 
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': request.headers.get('Origin') || 'http://localhost:3000',
          'Access-Control-Allow-Credentials': 'true'
        }
      });
    }
  }
};
