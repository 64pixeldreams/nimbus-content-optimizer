# 🚦 Router Architecture Specification

## 🎯 **Purpose**
Dead simple routing with auth middleware - index.js stays tiny, routes are self-contained.

## 🏗️ **Architecture Overview**

```
/cloudflare-worker/
├── index.js              # < 50 lines - Just routing
├── router.js             # Route matcher utility
├── /routes/
│   ├── /auth/
│   │   ├── login.js      # POST /auth/login
│   │   ├── signup.js     # POST /auth/signup
│   │   ├── logout.js     # POST /auth/logout
│   │   └── me.js         # GET /auth/me
│   ├── /api-keys/
│   │   ├── create.js     # POST /api-keys
│   │   ├── list.js       # GET /api-keys
│   │   ├── revoke.js     # DELETE /api-keys/:id
│   │   └── get.js        # GET /api-keys/:id
│   ├── /pages/
│   │   ├── store.js      # POST /pages
│   │   ├── get.js        # GET /pages/:id
│   │   ├── list.js       # GET /pages
│   │   └── process.js    # POST /pages/:id/process
│   ├── /projects/
│   │   ├── create.js     # POST /projects
│   │   ├── get.js        # GET /projects/:id
│   │   ├── update.js     # PATCH /projects/:id
│   │   └── delete.js     # DELETE /projects/:id
│   └── /users/
│       ├── profile.js    # GET/PATCH /users/profile
│       ├── password.js   # POST /users/password
│       └── delete.js     # DELETE /users/account
```

## 📄 **index.js - The Minimal Entry Point**

```javascript
// index.js - ONLY routing, no business logic
import { Router } from './router.js';
import { withAuth } from './auth/middleware.js';

// Import route handlers
import { login } from './routes/auth/login.js';
import { signup } from './routes/auth/signup.js';
import { createApiKey } from './routes/api-keys/create.js';
import { storePages } from './routes/pages/store.js';

const router = new Router();

// Public routes
router.post('/auth/login', login);
router.post('/auth/signup', signup);

// Protected routes (automatic auth)
router.post('/api-keys', withAuth, createApiKey);
router.post('/pages', withAuth, storePages);
router.get('/pages/:id', withAuth, getPage);

// Export for Cloudflare Worker
export default {
  async fetch(request, env, ctx) {
    return router.handle(request, env, ctx);
  }
};
```

## 🛣️ **Router Utility**

```javascript
// router.js - Simple and powerful
export class Router {
  constructor() {
    this.routes = [];
  }

  // Register routes
  get(path, ...handlers) {
    this.routes.push({ method: 'GET', path, handlers });
  }

  post(path, ...handlers) {
    this.routes.push({ method: 'POST', path, handlers });
  }

  // Match and handle
  async handle(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    
    for (const route of this.routes) {
      if (route.method !== request.method) continue;
      
      const params = this.matchPath(route.path, path);
      if (params) {
        request.params = params;
        // Pass env and ctx through the handler chain
        return this.runHandlers(route.handlers, request, env, ctx);
      }
    }
    
    return new Response('Not Found', { status: 404 });
  }
  
  // Run handlers in sequence, passing env and ctx
  async runHandlers(handlers, request, env, ctx) {
    let result;
    for (let i = 0; i < handlers.length; i++) {
      const handler = handlers[i];
      
      // Last handler is the route function
      if (i === handlers.length - 1) {
        result = await handler(request, env, ctx);
      } else {
        // Middleware - pass next function
        const next = async (req, env, ctx, ...args) => {
          // Pass any additional args (like auth) to next handler
          const nextHandler = handlers[handlers.length - 1];
          return nextHandler(req, env, ctx, ...args);
        };
        result = await handler(request, env, ctx, next);
      }
      
      if (result) return result;
    }
  }
}
```

## 📝 **Route Handler Pattern**

### **Example: Create API Key**
```javascript
// /routes/api-keys/create.js
import { Datastore } from '../../modules/datastore';
import { APIKEY } from '../../modules/api-key';
import { response } from '../../utils/response.js';

export async function createApiKey(request, env, ctx, auth) {
  // Parse request
  const { name } = await request.json();
  
  // Validate
  if (!name) {
    return response.error('Name required', 400);
  }
  
  // Access KV bindings directly from env
  // env.NIMBUS_CACHE, env.NIMBUS_PAGES, etc. are available
  
  // Initialize datastore with env for KV access
  const DATASTORE = new Datastore(env);
  const db = DATASTORE.auth(auth.user_id);
  
  // Or use KV directly if needed
  const cached = await env.NIMBUS_CACHE.get(cacheKey);
  
  // Business logic
  const apiKey = await apiKeyService.create({
    userId: auth.user_id,
    name
  });
  
  // Return response
  return response.json({
    key: apiKey.key,
    key_id: apiKey.id,
    created: apiKey.created
  });
}
```

### **Example: Store Pages**
```javascript
// /routes/pages/store.js
import { Datastore } from '../../modules/datastore';
import { response } from '../../utils/response.js';
import { generatePageId } from '../../utils/ids.js';

export async function storePages(request, env, ctx, auth) {
  const { project_id, pages } = await request.json();
  
  // Initialize datastore with env to access KV bindings
  const DATASTORE = new Datastore(env);
  const db = DATASTORE.auth(auth.user_id);
  
  // Validate project ownership
  const project = await db.get('PROJECT', project_id);
  if (!project) {
    return response.error('Project not found', 404);
  }
  
  // Store pages using KV through env
  const stored = [];
  for (const page of pages) {
    const pageId = generatePageId(project_id, page.url);
    await db.put('PAGE', pageId, {
      ...page,
      project_id,
      uploaded: new Date().toISOString()
    });
    stored.push(pageId);
  }
  
  // Use ctx for waitUntil if needed
  if (pages.length > 10) {
    ctx.waitUntil(logBatchUpload(env, project_id, stored.length));
  }
  
  return response.json({ 
    stored: stored.length,
    page_ids: stored 
  });
}
```

## 🔐 **Auth Middleware Pattern**

```javascript
// auth/middleware.js
import { AUTH } from '../modules/auth';

export async function withAuth(request, env, ctx, next) {
  // Try to authenticate
  const auth = await AUTH.validate(request, env);
  
  if (!auth) {
    return new Response('Unauthorized', { 
      status: 401,
      headers: { 'WWW-Authenticate': 'Bearer' }
    });
  }
  
  // Pass auth context to route handler
  return next(request, env, ctx, auth);
}
```

## 🎯 **Route Organization Rules**

### **1. One File = One Endpoint**
```
/routes/api-keys/create.js   → POST /api-keys
/routes/api-keys/list.js     → GET /api-keys
/routes/api-keys/revoke.js   → DELETE /api-keys/:id
```

### **2. Folder = Resource**
```
/auth/      → Authentication endpoints
/api-keys/  → API key management
/pages/     → Page storage/processing
/projects/  → Project management
```

### **3. Consistent Naming**
- `create.js` → POST to create
- `get.js` → GET single item
- `list.js` → GET collection
- `update.js` → PATCH/PUT to update
- `delete.js` → DELETE to remove

## 📊 **Benefits**

1. **Dead Simple Navigation**
   - See URL → Find file instantly
   - `/api-keys/create` → `routes/api-keys/create.js`

2. **Tiny index.js**
   - Just route registration
   - No business logic
   - Easy to see all endpoints

3. **Self-Contained Routes**
   - Each file has one job
   - Easy to test in isolation
   - Clear dependencies

4. **Automatic Auth**
   - Add `withAuth` to protect route
   - Auth context passed automatically
   - No auth code in route handlers

## ✅ **Route Handler Checklist**

Each route file should:
- [ ] Export single function
- [ ] Use modules (DATASTORE, AUTH, etc)
- [ ] Return proper responses
- [ ] Handle errors gracefully
- [ ] Be under 100 lines
- [ ] Have clear parameter validation

This architecture makes your API incredibly easy to understand and maintain!
