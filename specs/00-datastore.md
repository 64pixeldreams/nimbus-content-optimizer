# 📊 Datastore Specification

## 🎯 **Purpose**

Provide a unified interface for data storage in Cloudflare Workers with swappable adapters for KV and D1, enabling consistent data operations regardless of underlying storage mechanism.

## 🏗️ **Architecture**

```
datastore/
├── index.js                 # Main datastore interface
└── adapters/
    ├── kv.js               # KV storage adapter
    └── d1.js               # D1 database adapter
```

## 📐 **Design Principles**

1. **Unified Interface** - Same methods work across all adapters
2. **Adapter Pattern** - Swap storage backends without changing application code
3. **Class-Based Keys** - Consistent namespacing: `CLASS_ID`
4. **Simple API** - Minimal methods that cover 90% of use cases
5. **Auth by Default** - Set auth context once, enforced on all operations
6. **Minimize Lookups** - Embed related data to reduce KV operations
7. **Denormalize for Reads** - Optimize for common access patterns

## 🔌 **Cloudflare Bindings Configuration**

In Cloudflare Workers, both KV namespaces and D1 databases are accessed through **bindings** that are passed via the `env` parameter, not traditional environment variables.

### **wrangler.toml Configuration**

```toml
# KV Namespace bindings
[[kv_namespaces]]
binding = "NIMBUS_CACHE"
id = "fc3d8474323a4256a3b65a36d4e6f6c6"

[[kv_namespaces]]
binding = "NIMBUS_PAGES"
id = "your-pages-namespace-id"

[[kv_namespaces]]
binding = "NIMBUS_PROJECTS"
id = "your-projects-namespace-id"

[[kv_namespaces]]
binding = "NIMBUS_USERS"
id = "your-users-namespace-id"

[[kv_namespaces]]
binding = "NIMBUS_KEYS"
id = "your-keys-namespace-id"

[[kv_namespaces]]
binding = "NIMBUS_SESSIONS"
id = "your-sessions-namespace-id"

[[kv_namespaces]]
binding = "NIMBUS_EMAILS"
id = "your-emails-namespace-id"

[[kv_namespaces]]
binding = "NIMBUS_LISTS"
id = "your-lists-namespace-id"

# D1 Database binding
[[d1_databases]]
binding = "NIMBUS_DB"
database_name = "nimbus-production"
database_id = "your-d1-database-id"
```

### **Worker Handler Pattern**

```javascript
export default {
  async fetch(request, env, ctx) {
    // Initialize datastore ONCE with env bindings
    const DATASTORE = new Datastore(env);
    
    // All KV/D1 access goes through datastore
    const authStore = DATASTORE.auth(userId);
    const project = await authStore.get('project', projectId);
    
    // NEVER access env.NIMBUS_CACHE directly in route handlers!
    // Always use DATASTORE methods
  }
};
```

### **Important Notes**
- **Bindings are NOT environment variables** - they're special objects passed via `env`
- Each KV namespace needs its own binding and ID
- D1 databases require both a database name and ID
- Bindings are configured per environment (production, staging, etc.)

## 🔧 **Core Interface**

### **Authentication**

```javascript
// Set auth context for all operations
auth(userId)                      // Returns new datastore instance with auth context
```

### **Basic Operations**

```javascript
// All adapters implement these methods:

// Single object operations
get(class, id)                    // Retrieve object (checks auth)
put(class, id, data)              // Store object (adds auth)
delete(class, id)                 // Delete object (checks auth)
exists(class, id)                 // Check existence (checks auth)

// List operations
queryListByPointer(listName, pointer)              // Get list items
queryListAddItem(listName, pointer, itemId)        // Add to list
queryListRemoveItem(listName, pointer, itemId)     // Remove from list
queryListClear(listName, pointer)                  // Clear entire list

// Convenience method for getting entire lists
getList(class, pointer)                            // Get array (e.g., projects:{user_id})
```

### **Composite Key Pattern**

For keys that require multiple IDs (e.g., `page:{project_id}:{page_id}`), concatenate them:

```javascript
// Composite key example
const pageId = `${projectId}:${pageId}`;
await db.put('PAGE', pageId, pageData);

// Or use a helper function
function compositeKey(...parts) {
  return parts.join(':');
}

await db.put('PAGE', compositeKey(projectId, pageId), pageData);
```

## 📦 **KV Adapter Implementation**

### **Internal KV Access Pattern**
```javascript
class KVAdapter {
  constructor(env) {
    // Store env to access ALL KV bindings
    this.env = env;
    this.authContext = null;
  }
  
  async get(class, id) {
    // Route to correct KV namespace based on class
    const kv = this.getNamespace(class);
    const key = this.makeKey(class, id);
    const data = await kv.get(key, 'json');
    
    // Check auth
    if (data && data._auth && !data._auth.includes(this.authContext)) {
      return null; // No access
    }
    
    return data;
  }
  
  async put(class, id, data) {
    const kv = this.getNamespace(class);
    const key = this.makeKey(class, id);
    
    // Add auth context
    const dataWithAuth = { ...data, _auth: [this.authContext] };
    await kv.put(key, JSON.stringify(dataWithAuth));
  }
  
  getNamespace(class) {
    // Map class to KV namespace binding from env
    const mapping = {
      'USER': this.env.NIMBUS_USERS,
      'PROJECT': this.env.NIMBUS_PROJECTS,
      'PAGE': this.env.NIMBUS_PAGES,
      'APIKEY': this.env.NIMBUS_KEYS,
      'SESSION': this.env.NIMBUS_SESSIONS,
      'CACHE': this.env.NIMBUS_CACHE,
      'EMAIL': this.env.NIMBUS_EMAILS,
      'LIST': this.env.NIMBUS_LISTS
    };
    
    if (!mapping[class]) {
      throw new Error(`Unknown class: ${class}`);
    }
    
    return mapping[class];
  }
  
  makeKey(class, id) {
    return `${class.toLowerCase()}:${id}`;
  }
}
```

### **Object Storage with Auth**
```
db.auth('user_123').put("PROJECT", "proj_456", {name: "My Project"})
→ KV key: project:proj_456
→ KV value: {"name": "My Project", "_auth": ["user_123"]}
```

### **Optimized Storage Examples**
```javascript
// API Key with embedded data (1 lookup for auth)
apikey:{hash} → {
  user_id: "user_123",
  permissions: ["read", "write"],
  rate_limit: 1000,
  active: true,
  _auth: ["user_123"]
}

// Project with denormalized user data (no join needed)
project:proj_123 → {
  id: "proj_123",
  name: "My Project",
  user_email: "john@example.com",      // Denormalized
  user_name: "John Doe",               // Denormalized
  _auth: ["user_123"]
}
```

### **List Storage**
```
queryListAddItem("apiKeys", "userId:12345", "key789")
→ KV key: apiKeys:userId:12345
→ KV value: ["key123", "key456", "key789"]

// Convenience method for getting entire lists
getList("projects", "user_12345")
→ KV.get("projects:user_12345") → ["proj_abc", "proj_xyz"]
```

### **Key Patterns**
- Objects: `{class}:{id}` (lowercase class name)
- Lists: `{listName}:{pointer}`
- Auth field: `_auth` array in stored objects
- Embedded data: Include frequently accessed related data

## 💾 **D1 Adapter Implementation**

### **Schema**
```sql
-- Object storage with auth
CREATE TABLE objects (
    class TEXT NOT NULL,
    id TEXT NOT NULL,
    data JSON NOT NULL,
    auth_users JSON DEFAULT '[]',  -- Array of user IDs who can access
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (class, id)
);

-- List storage
CREATE TABLE lists (
    list_name TEXT NOT NULL,
    pointer TEXT NOT NULL,
    item_id TEXT NOT NULL,
    position INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (list_name, pointer, item_id)
);

-- Indexes for performance
CREATE INDEX idx_objects_class ON objects(class);
CREATE INDEX idx_objects_auth ON objects(auth_users);  -- For auth queries
CREATE INDEX idx_lists_lookup ON lists(list_name, pointer);
```

### **Object Operations with Auth**
```
db.auth('user_123').put("USER", "12345", {name: "John"})
→ INSERT INTO objects (class, id, data, auth_users) VALUES (?, ?, ?, ?)
→ auth_users: ["user_123"]

db.auth('user_123').get("USER", "12345")
→ SELECT * FROM objects WHERE class = ? AND id = ? AND JSON_CONTAINS(auth_users, '"user_123"')
```

### **List Operations**
```
queryListByPointer("apiKeys", "userId:12345")
→ SELECT item_id FROM lists WHERE list_name = ? AND pointer = ? ORDER BY position
```

## 🎯 **Usage Examples**

### **Import and Initialize**
```javascript
import { Datastore } from './datastore';

// In your Worker handler
export default {
  async fetch(request, env, ctx) {
    // Initialize with env containing bindings
    const DATASTORE = new Datastore(env);
    
    // Create authenticated datastores
    const userStore = DATASTORE.KV.auth('user_12345');
    const adminStore = DATASTORE.KV.auth('admin_1');
    
    // Use the datastore...
  }
};
```

### **Store Customer Data with Auth**
```javascript
// Set auth context once
const db = DATASTORE.KV.auth('user_12345');

// All operations now use this auth
await db.put('USER', 'user_12345', {
    email: 'user@example.com',
    created: new Date().toISOString()
});
// Automatically stores with _auth: ['user_12345']

// Only returns if user_12345 has access
const user = await db.get('USER', 'user_12345');
```

### **Manage API Keys List**
```javascript
// Create authed datastore
const db = DATASTORE.KV.auth('user_12345');

// Add API key to user's list
await db.queryListAddItem('apiKeys', 'userId:12345', 'key_abc789');

// Get all API keys for user (auth-filtered)
const keys = await db.queryListByPointer('apiKeys', 'userId:12345');
// Returns: ['key_abc123', 'key_xyz456', 'key_abc789']

// Remove API key (only if user has access)
await db.queryListRemoveItem('apiKeys', 'userId:12345', 'key_xyz456');

// Or use convenience method for lists
const projectList = await db.getList('projects', '12345');
// Returns: ['proj_abc', 'proj_xyz']
```

### **Working with Composite Keys**
```javascript
// Helper for composite keys
const compositeKey = (...parts) => parts.join(':');

// Store page with project and page IDs
await db.put('PAGE', compositeKey(projectId, pageId), {
  content: extractedContent,
  dimensions: { location: 'London', service: 'watch-repair' },
  batch_id: batchId
});

// Retrieve using same pattern
const page = await db.get('PAGE', `${projectId}:${pageId}`);

// Store batch status
await db.put('BATCH', compositeKey(projectId, batchId), {
  status: 'processing',
  pages: ['page1', 'page2']
});

// Store logs with composite key
await db.put('LOG', compositeKey(projectId, pageId), {
  steps: ['extraction', 'optimization'],
  timestamp: new Date().toISOString()
});
```

### **API Endpoint Example (Optimized)**
```javascript
export async function handleRequest(request, env) {
  // Initialize datastore with env bindings
  const DATASTORE = new Datastore(env);
  
  // Single lookup: API key contains everything needed
  const auth = await validateApiKey(request, env);
  // auth = { user_id, permissions, rate_limit }
  
  // Create authenticated datastore
  const db = DATASTORE.KV.auth(auth.user_id);
  
  // Direct data access (1 more lookup)
  const project = await db.get('PROJECT', request.params.projectId);
  // project includes denormalized customer data
  
  // Total: 2 lookups for complete request
  return new Response(JSON.stringify({ project }));
}

// Optimized API key validation
async function validateApiKey(request, env) {
  const apiKey = request.headers.get('Authorization')?.replace('Bearer ', '');
  const keyHash = await hash(apiKey);
  
  // Single lookup with everything embedded
  const authData = await env.NIMBUS_KEYS.get(`apikey:${keyHash}`, 'json');
  
  if (!authData || !authData.active) {
    throw new Error('Invalid API key');
  }
  
  return authData; // Contains user_id, customer_id, permissions, etc.
}
```

## 🔄 **Adapter Selection Strategy**

### **Use KV When:**
- Key-value lookups (API key validation)
- Large JSON objects (page content)
- High-frequency reads (cache data)
- Simple list operations

### **Use D1 When:**
- Complex queries needed
- Time-series data (logs, analytics)
- Relationships between objects
- Transactions required

## 🚀 **Implementation Phases**

### **Phase 1: KV Adapter**
- Implement core object operations
- Add list management
- Handle errors gracefully

### **Phase 2: D1 Adapter**
- Create schema
- Implement same interface
- Add migration utilities

### **Phase 3: Advanced Features**
- Batch operations
- TTL support
- Query builder for D1
- Backup/restore utilities

## 🔐 **Security Considerations**

1. **Input Validation**
   - Sanitize class and ID values
   - Validate JSON data size
   - Prevent injection attacks

2. **Access Control**
   - Auth context enforced on all operations
   - Objects tagged with `_auth` array
   - Get operations verify auth membership
   - No data returned without valid auth

3. **Data Limits**
   - KV: 25MB per value
   - D1: Row size limits
   - Handle gracefully

4. **Auth Patterns**
   - Auth IDs should be user IDs, not API keys
   - One auth context per request
   - No global auth state

## ⚡ **Performance Guidelines**

### **Minimize Lookups Pattern**
```javascript
// BAD: Multiple lookups
const apiKey = await db.get('APIKEY', keyHash);        // Lookup 1
const user = await db.get('USER', apiKey.user_id);     // Lookup 2  
const customer = await db.get('CUSTOMER', user.customer_id); // Lookup 3

// GOOD: Embed what you need
const apiKey = await db.get('APIKEY', keyHash);
// apiKey contains: { user_id, customer_id, permissions, rate_limit }
// Everything needed in 1 lookup
```

### **Denormalization Strategy**
```javascript
// Store redundant data to avoid joins
await db.put('PROJECT', 'proj_123', {
  id: 'proj_123',
  name: 'My Project',
  customer_id: 'cust_456',
  customer_email: 'john@example.com',  // Denormalized
  customer_name: 'John Doe',           // Denormalized
  // No need to fetch customer separately
});
```

### **KV Adapter**
- Embed related data in single objects
- Use fat keys (store more per key)
- Cache frequently accessed data in memory
- Batch reads when possible

### **D1 Adapter**
- Denormalize for read performance
- Use prepared statements
- Create indexes on auth_users column
- Consider materialized views for complex queries

## 🚨 **Critical: Why Centralization Matters**

### **Without DATASTORE Module**
```javascript
// ❌ BAD: KV access scattered everywhere
// route1.js
const project = await env.NIMBUS_PROJECTS.get(`project:${id}`);

// route2.js  
const user = await env.NIMBUS_USERS.get(`user:${id}`);

// route3.js (oops, wrong key format!)
const page = await env.NIMBUS_PAGES.get(`${projectId}-${pageId}`);

// If KV binding names change, fix 1000s of lines!
```

### **With DATASTORE Module**
```javascript
// ✅ GOOD: All access through one interface
const db = DATASTORE.init(env);

// Consistent everywhere
const project = await db.get('PROJECT', id);
const user = await db.get('USER', id);
const page = await db.get('PAGE', `${projectId}:${pageId}`);

// Change KV → D1? Update ONE file, not 1000s!
```

### **Benefits of Centralization**
1. **Change KV namespace names** → Update in ONE place
2. **Add caching layer** → Update in ONE place  
3. **Switch KV to D1** → Update in ONE place
4. **Add encryption** → Update in ONE place
5. **Change key format** → Update in ONE place
6. **Add metrics/logging** → Update in ONE place

## ✅ **Success Criteria**

- [ ] Consistent interface across adapters
- [ ] Zero code changes when switching adapters
- [ ] Handles all basic CRUD operations
- [ ] Efficient list management
- [ ] Clear error messages
- [ ] Well-documented usage patterns
- [ ] Performance benchmarks documented
- [ ] **ZERO direct env.KV access outside datastore module**
- [ ] **All storage operations go through DATASTORE**
