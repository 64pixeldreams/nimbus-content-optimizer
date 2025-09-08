# 🔧 CloudFunction Module Specification

## 🎯 **Purpose**

Create a unified API interface that abstracts away HTTP endpoints and provides a simple function-based API for both frontend and backend integration. This module acts as a central dispatcher that handles authentication, logging, and function execution.

## 🏗️ **Architecture Overview**

### **Core Concept**
Instead of multiple REST endpoints, provide a single `POST /api/function` endpoint that dispatches to registered functions based on action names.

### **Frontend Usage**
```javascript
// Simple function calls
const result = await CloudFunction.run('project.create', { name: 'My Site', domain: 'example.com' });
const projects = await CloudFunction.run('project.list', { status: 'active' });
const page = await CloudFunction.run('page.upload', { projectId: 'proj_123', content: {...} });
```

### **Backend Registration**
```javascript
// Register functions with automatic auth and logging
CloudFunction.define('project.create', async (request, auth, env, logger) => {
  const { name, domain } = request.payload;
  const project = await ProjectManager.create(env, auth.user_id, { name, domain });
  return { success: true, project };
});
```

## 📁 **Module Structure**

```
cloudfunction/
├── index.js                    # Main exports
├── core/
│   ├── cloudfunction.js        # Core CloudFunction class
│   └── function-registry.js    # Function registration and lookup
├── middleware/
│   ├── auth-middleware.js      # Authentication wrapper
│   └── validation-middleware.js # Request validation
├── utils/
│   ├── request-parser.js       # Parse and validate requests
│   ├── response-builder.js     # Build consistent responses
│   └── error-handler.js        # Centralized error handling
└── README.md
```

## 🔧 **Core Components**

### **1. CloudFunction Class**
- **Function Registration**: `define(action, handler)`
- **Function Execution**: `run(action, payload, options)`
- **Middleware Management**: Auth, validation, logging
- **Error Handling**: Centralized error responses

### **2. Function Registry**
- **Storage**: Map of action names to handlers
- **Validation**: Ensure functions are properly registered
- **Metadata**: Store function info (auth required, validation rules)

### **3. Request/Response Flow**
```
1. POST /api/function { action: "project.create", payload: {...} }
2. Parse and validate request
3. Check authentication (API key or session)
4. Look up function handler
5. Execute with auth context and logging
6. Return consistent response format
```

## 🛠️ **API Specification**

### **Request Format**
```javascript
POST /api/function
{
  "action": "project.create",           // Function to execute
  "payload": {                         // Data to pass to function
    "name": "My Website",
    "domain": "example.com"
  },
  "options": {                         // Optional execution options
    "timeout": 30000,
    "retries": 3
  }
}
```

### **Response Format**
```javascript
{
  "success": true,                     // Execution status
  "data": { ... },                     // Function return value
  "logs": [...],                       // Execution logs
  "requestId": "req_123",              // Request tracking
  "duration": 150,                     // Execution time (ms)
  "function": "project.create"         // Executed function
}
```

### **Error Response**
```javascript
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid project name",
    "details": { field: "name", reason: "required" }
  },
  "logs": [...],
  "requestId": "req_123"
}
```

## 🔐 **Authentication Integration**

### **Automatic Auth Handling**
- **API Key**: Extract from `Authorization: Bearer` header
- **Session**: Extract from cookies
- **Context**: Pass `auth` object to all functions
- **User ID**: Available as `auth.user_id`
- **Permissions**: Available as `auth.permissions`

### **Auth Context Object**
```javascript
{
  user_id: "user_123",
  email: "user@example.com",
  type: "api" | "session",
  permissions: ["read", "write"],
  rate_limit: { requests: 1000, window: 3600 },
  session_id: "sess_123" // Only for session auth
}
```

## 📊 **Logging Integration**

### **Automatic Logging**
- **Function Entry**: Log function name and payload
- **Auth Status**: Log authentication method and user
- **Execution Time**: Track function duration
- **Errors**: Log errors with stack traces
- **Performance**: Track memory usage and timing

### **Log Context**
```javascript
{
  requestId: "req_123",
  function: "project.create",
  userId: "user_123",
  authType: "api",
  duration: 150,
  success: true
}
```

## 🎯 **Function Definition Interface**

### **Handler Signature**
```javascript
async function handler(request, auth, env, logger) {
  // request.payload - Data sent from frontend
  // auth - Authentication context
  // env - Cloudflare environment (KV, D1, etc.)
  // logger - Scoped logger instance
  
  // Your function logic here
  return { success: true, data: result };
}
```

### **Built-in Middleware**
- **Authentication**: Automatic auth check
- **Validation**: Payload validation based on function rules
- **Logging**: Automatic request/response logging
- **Error Handling**: Catch and format errors
- **Rate Limiting**: Per-user rate limiting
- **Timeout**: Function execution timeout

## 🔄 **Integration with Existing Framework**

### **Datastore Integration**
```javascript
// Functions automatically get authenticated datastore
const datastore = new Datastore(env, logger).auth(auth.user_id);
```

### **Module Integration**
```javascript
// Easy access to all modules
const projects = new ProjectManager(env, auth.user_id);
const pages = new PageManager(env, auth.user_id);
const messenger = new Messenger(env);
```

### **LOGS Integration**
```javascript
// Scoped logging for each function
const logger = LOGS.init(`cloudfunction.${action}`);
```

## 📋 **Function Registry**

### **Core Functions**
- `project.create` - Create new project
- `project.list` - List user's projects
- `project.get` - Get project details
- `project.update` - Update project
- `project.delete` - Delete project
- `page.upload` - Upload page content
- `page.list` - List project pages
- `page.get` - Get page details
- `page.update` - Update page
- `page.delete` - Delete page
- `batch.create` - Create processing batch
- `batch.status` - Get batch status
- `user.profile` - Get user profile
- `user.update` - Update user profile

### **System Functions**
- `system.health` - Health check
- `system.logs` - Get recent logs
- `system.stats` - System statistics

## 🚀 **Usage Examples**

### **Frontend (Gulp)**
```javascript
// In gulp task
const result = await CloudFunction.run('project.create', {
  name: 'My Website',
  domain: 'example.com',
  config: { tone: 'professional' }
});

if (result.success) {
  console.log('Project created:', result.data.project_id);
}
```

### **Frontend (Dashboard)**
```javascript
// In React/Vue component
const projects = await CloudFunction.run('project.list');
const pages = await CloudFunction.run('page.list', { projectId: 'proj_123' });
```

### **Backend Registration**
```javascript
// In CF Worker
CloudFunction.define('project.create', async (request, auth, env, logger) => {
  const { name, domain, config } = request.payload;
  
  const projects = new ProjectManager(env, auth.user_id);
  const result = await projects.create({ name, domain, config });
  
  logger.log('Project created', { projectId: result.project.project_id });
  return result;
});
```

## 🔧 **Configuration**

### **Function Options**
```javascript
CloudFunction.define('project.create', handler, {
  auth: true,                    // Require authentication
  validation: {                  // Payload validation rules
    name: { type: 'string', required: true },
    domain: { type: 'string', required: true, validation: 'domain' }
  },
  timeout: 30000,               // Function timeout (ms)
  rateLimit: { requests: 10, window: 60000 }, // Per-user rate limit
  logLevel: 'info'              // Logging level
});
```

## 🎯 **Benefits**

### **For Frontend**
- **Simple API**: One function call instead of HTTP requests
- **Consistent**: Same pattern for all operations
- **Type Safe**: Can generate TypeScript definitions
- **Error Handling**: Consistent error responses

### **For Backend**
- **Centralized Auth**: Handle auth once for all functions
- **Consistent Logging**: Automatic request/response logging
- **Easy Testing**: Mock individual functions
- **Scalable**: Easy to add new functions

### **For Development**
- **Self-Documenting**: Function registry shows available actions
- **Easy Debugging**: Centralized logging and error handling
- **Version Control**: Function versioning and rollback
- **Monitoring**: Built-in performance and error tracking

## 🔄 **Migration Strategy**

### **Phase 1: Core Module**
- Build CloudFunction core class
- Implement function registry
- Add auth middleware
- Create basic error handling

### **Phase 2: Function Registration**
- Register existing project functions
- Add validation middleware
- Implement logging integration
- Create response builder

### **Phase 3: Frontend Integration**
- Build frontend CloudFunction client
- Update gulp tasks to use CloudFunction
- Create dashboard integration
- Add TypeScript definitions

### **Phase 4: Advanced Features**
- Add rate limiting
- Implement function versioning
- Add performance monitoring
- Create function documentation generator

## 📊 **Success Metrics**

- **Reduced Complexity**: 50% fewer API endpoints
- **Faster Development**: New functions in minutes, not hours
- **Better Debugging**: Centralized logging and error handling
- **Improved UX**: Consistent API responses
- **Easier Testing**: Mock individual functions instead of HTTP calls

This module will be the foundation for all API interactions, making the platform much easier to use and maintain.
