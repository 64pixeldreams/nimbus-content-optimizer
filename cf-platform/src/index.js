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
        auth: false,
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
    // Set up request context for logging
    LOGS.setRequest({
      requestId: crypto.randomUUID(),
      method: request.method,
      url: request.url,
      headers: Object.fromEntries(request.headers.entries())
    });

    try {
      return await router.handle(request, env, ctx);
    } catch (err) {
      LOGS.error('Unhandled error', err);
      return new Response(JSON.stringify({ 
        error: 'Internal server error',
        requestId: LOGS.getRequestId()
      }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
};
