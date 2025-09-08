# DataModel Specification

## Overview

The DataModel provides a unified interface for storing data across KV (for full objects) and D1 (for queryable metadata). It handles dual writes, provides a clean API, and supports hooks for event-driven workflows.

## Module Structure

```
modules/
├── datamodel/
│   ├── index.js           # Main exports
│   ├── core/
│   │   └── datamodel.js   # Core DataModel class
│   ├── utils/
│   │   ├── uuid.js        # UUID generation
│   │   ├── validator.js   # Field validation
│   │   └── sync.js        # KV/D1 sync logic
│   └── hooks/
│       └── manager.js     # Hook execution management
```

## Core Principles

1. **KV stores full objects** - All data lives in KV
2. **D1 stores metadata** - Only fields needed for queries/lists
3. **Automatic sync** - Single save() updates both stores
4. **Simple API** - get(), save(), update(), delete(), list()
5. **Hooks** - Lifecycle events for webhooks, notifications, etc.
6. **Auth-aware** - All operations respect auth context
7. **Logged** - Uses LOGS module for debugging and audit
8. **Modular** - Follows implementation guide with small focused files

## Basic Usage

```javascript
// Import dependencies
import { DataModel } from '../datamodel/index.js';
import { Datastore } from '../datastore/index.js';
import { LOGS } from '../logs/index.js';

// Initialize with auth context
const datastore = new Datastore(env, LOGS);
const authDatastore = datastore.auth(userId);

// Create model instance with auth
const page = new DataModel('PAGE', authDatastore, LOGS);

// Set data (ID auto-generated with uuid)
page.set({
  title: 'My Page',
  url: 'https://example.com',
  content: '<html>...</html>',
  status: 'pending',
  project_id: 'proj_123',
  user_id: userId
});

// Save (writes to both KV and D1)
await page.save();

// Get by ID (respects auth)
const existingPage = await DataModel.get('PAGE', authDatastore, 'page_123', LOGS);

// Update
existingPage.set('status', 'completed');
await existingPage.save();

// Query from D1 (auth filtered)
const pages = await DataModel.query('PAGE', authDatastore, LOGS)
  .where('project_id', 'proj_123')
  .where('status', 'completed')
  .list();
```

## Model Definition

```javascript
// models/page.js
export const PageModel = {
  name: 'PAGE',
  
  // Options (all optional)
  options: {
    timestamps: true,      // Include created_at, updated_at (default: true)
    softDelete: true,      // Include deleted_at (default: true)
    userTracking: true,    // Include user_id (default: true)
    auth: true            // Include _auth array (default: true)
  },
  
  // Define custom fields (built-in fields added automatically)
  fields: {
    // Model-specific fields only
    page_id: { type: 'string', primary: true },
    project_id: { type: 'string', required: true },
    url: { type: 'string', required: true, validation: 'url' },
    title: { type: 'string' },
    status: { type: 'string', default: 'pending', validation: ['pending', 'processing', 'completed', 'failed'] },
    
    // Large content fields (KV only)
    content: { type: 'text' },
    extracted_data: { type: 'json' },
    optimized_content: { type: 'text' },
    metadata: { type: 'json' },
    
    // Custom timestamp
    last_processed: { type: 'timestamp' }
  },
  
  // KV configuration
  kv: {
    namespace: 'PAGES',           // Maps to env.NIMBUS_PAGES
    keyPattern: 'page:{id}'       // How keys are formatted
  },
  
  // D1 configuration - only sync subset of fields
  d1: {
    table: 'page_meta',
    syncFields: [                 // Only these fields go to D1
      'page_id',
      'project_id', 
      'user_id',
      'url',
      'title',
      'status',
      'created_at',
      'updated_at',
      'last_processed'
    ]
  },
  
  // Hooks
  hooks: {
    afterCreate: async (instance, env) => {
      // Example: Queue for processing
      console.log('Page created:', instance.get('page_id'));
    },
    
    afterUpdate: async (instance, changes, env) => {
      // Example: Fire webhook on status change
      if (changes.status === 'completed') {
        // Fire webhook
        console.log('Page completed:', instance.get('page_id'));
      }
    }
  }
};
```

## Built-in Fields

Every model automatically includes these fields unless disabled in options:

```javascript
// Always included (cannot be disabled)
{
  [primary_key]: { type: 'string', primary: true }  // e.g., page_id, project_id
}

// If options.userTracking = true (default)
{
  user_id: { type: 'string', required: true }       // Who owns/created this
}

// If options.timestamps = true (default)  
{
  created_at: { type: 'timestamp', auto: true },    // Set on create
  updated_at: { type: 'timestamp', auto: true }     // Updated on save
}

// If options.softDelete = true (default)
{
  deleted_at: { type: 'timestamp', default: null }  // Set on delete
}

// If options.auth = true (default)
{
  _auth: { type: 'array' }                          // Access control array
}
```

To disable built-in fields:
```javascript
export const PublicModel = {
  name: 'PUBLIC_DATA',
  options: {
    userTracking: false,  // No user_id field
    auth: false          // No _auth array
  },
  fields: {
    // Your custom fields
  }
};
```

## Dependencies

```javascript
import { Datastore } from '../datastore/index.js';
import { LOGS } from '../logs/index.js';
import { generateUUID } from './utils/uuid.js';
```

## Core API

### Constructor
```javascript
const model = new DataModel(modelName, datastore, logger);
// modelName: 'PAGE', 'PROJECT', etc.
// datastore: Authenticated Datastore instance
// logger: LOGS instance or sub-logger
```

### Instance Methods
```javascript
// Set single field
model.set('field', value);

// Set multiple fields
model.set({ field1: value1, field2: value2 });

// Get field value
const value = model.get('field');

// Get all data
const data = model.getData();

// Save (create or update)
await model.save();

// Delete (soft delete - marks as deleted)
await model.delete();

// Load existing record
await model.load(id);

// Restore soft-deleted record
await model.restore();

// Check if new record
const isNew = model.isNew();
```

### Static Methods
```javascript
// Get single record (with auth check)
const record = await DataModel.get('MODEL_NAME', datastore, id, logger);

// Query builder with pagination
const query = DataModel.query('MODEL_NAME', datastore, logger);
const results = await query
  .where('field', 'value')
  .where('status', 'active')
  .orderBy('created_at', 'desc')
  .limit(20)
  .offset(40)  // For page 3 with 20 per page
  .list();

// Returns:
{
  data: [...],        // Array of results
  pagination: {
    total: 156,       // Total matching records
    limit: 20,        // Results per page
    offset: 40,       // Current offset
    page: 3,          // Current page (1-based)
    pages: 8,         // Total pages
    hasNext: true,    // More results available
    hasPrev: true     // Previous page exists
  }
}

// Delete by ID (soft delete - sets deleted_at timestamp)
await DataModel.delete('MODEL_NAME', datastore, id, logger);

// Create new instance with data
const model = await DataModel.create('MODEL_NAME', datastore, data, logger);
```

## Implementation Details

### Storage Strategy
1. Generate ID if new record (using UUID v4)
2. Add auth context (_auth array)
3. Prepare KV data (all fields)
4. Prepare D1 data (only syncFields)
5. Save to KV first (using datastore)
6. Save to D1 second (using datastore.D1)
7. Fire appropriate hooks
8. Log operations with timer

### Query Building
- Uses D1 for all queries
- Returns metadata from D1
- Optionally hydrate from KV using `withData()`
- Supports pagination with limit/offset
- Includes total count for UI pagination
- Chainable query methods:
  - `.where(field, value)` - Add WHERE clause
  - `.whereIn(field, [...values])` - WHERE IN clause
  - `.orderBy(field, 'asc'|'desc')` - Sort results
  - `.limit(n)` - Limit results (default: 20)
  - `.offset(n)` - Skip n results
  - `.page(n)` - Helper for offset (page * limit)
  - `.withData()` - Hydrate full objects from KV

Example pagination helper:
```javascript
// Get page 2 with 25 items per page
const results = await DataModel.query('PAGE', datastore, logger)
  .where('project_id', projectId)
  .orderBy('created_at', 'desc')
  .limit(25)
  .page(2)  // Automatically sets offset to 25
  .list();
```

### Hook Execution
- `beforeCreate` - Can modify data before save
- `afterCreate` - For side effects (webhooks, queues)
- `beforeUpdate` - Can reject updates
- `afterUpdate` - For notifications, logging
- `beforeDelete` - Can prevent deletion
- `afterDelete` - For cleanup

### Error Handling
- KV failures prevent D1 writes
- Hook errors are logged but don't fail operations
- Query errors return empty results with error flag

## UUID Generation

```javascript
// utils/uuid.js
export function generateUUID() {
  // Use crypto.randomUUID() in Cloudflare Workers
  return crypto.randomUUID();
}
```

## Auth Integration

All operations automatically include auth context:
- KV entries include `_auth` array with user_id
- D1 queries filter by user_id
- Unauthorized access returns null/empty

## Logging

Every operation is logged with timing:
```javascript
const timer = logger.timer('datamodel.save');
// ... operation
timer.end({ modelName, id });
```

## Soft Deletes

Data is NEVER physically deleted. Instead:
- `delete()` sets `deleted_at` timestamp
- Deleted records remain in both KV and D1
- Queries automatically exclude deleted records (unless specified)
- Can be restored by setting `deleted_at` to null

```javascript
// Delete a record (soft delete)
await model.delete();
// Sets: deleted_at = new Date().toISOString()

// Query excludes deleted by default
const active = await DataModel.query('PAGE', datastore)
  .where('project_id', projectId)
  .list(); // WHERE deleted_at IS NULL added automatically

// Include deleted records
const all = await DataModel.query('PAGE', datastore)
  .where('project_id', projectId)
  .includeDeleted()
  .list();

// Only deleted records
const deleted = await DataModel.query('PAGE', datastore)
  .where('project_id', projectId)
  .onlyDeleted()
  .list();

// Restore a record
await model.restore(); // Sets deleted_at = null
```

## Error Handling

- Validation errors prevent save
- KV failures prevent D1 writes (consistency)
- Hook errors logged but don't fail operation
- All errors logged with context

## Example: Webhook on Status Change

```javascript
// In model definition
hooks: {
  afterUpdate: async (instance, changes, env) => {
    if (changes.status === 'completed') {
      const webhook = new Webhook(env);
      await webhook.send('page.completed', {
        page_id: instance.get('page_id'),
        project_id: instance.get('project_id'),
        url: instance.get('url')
      });
    }
  }
}
```

## Database Initialization & Migration System

### Overview

The DataModel framework includes a comprehensive database initialization and migration system that ensures all tables exist and match current model definitions. This system runs on-demand via CloudFunction to avoid performance impact on regular requests.

### Architecture

```javascript
// CloudFunction endpoint for database initialization
cloudFunction.define('system.initialize', async (requestContext) => {
  const { env, logger } = requestContext;
  const datastore = new Datastore(env, logger);
  
  return await DataModel.initialize(datastore, logger);
}, {
  auth: false, // Can be secured with admin API key if needed
  validation: {}
});
```

### Migration Features

1. **Table Creation** - Creates missing tables based on model definitions
2. **Schema Updates** - Adds new columns to existing tables (safe operations only)
3. **Data Seeding** - Populates initial data (admin users, default settings)
4. **Version Tracking** - Logs all migrations for audit trail
5. **Idempotent** - Safe to run multiple times

### Model Definition Enhancements

Models can now include seed data for initial population:

```javascript
export const UserModel = {
  name: 'USER',
  // ... existing fields ...
  
  seeds: [
    {
      condition: 'if_empty', // 'always', 'if_empty', 'if_missing'
      data: {
        email: '${ADMIN_EMAIL}', // Replaced from env vars
        password_hash: '${ADMIN_PASSWORD_HASH}',
        is_admin: true,
        status: 'active',
        profile: { name: 'System Administrator' }
      }
    }
  ]
}
```

### Seed Conditions

- `always` - Run seed on every initialization
- `if_empty` - Only run if table is completely empty
- `if_missing` - Only run if specific record doesn't exist

### Migration Operations (Safe Only)

**Supported Operations:**
- ✅ Create missing tables
- ✅ Add new columns to existing tables
- ✅ Create indexes
- ✅ Seed initial data

**Not Supported (Data Safety):**
- ❌ Delete columns (risk of data loss)
- ❌ Change column types (risk of data corruption)
- ❌ Rename columns (requires manual migration)

### Usage Workflow

1. **Deploy Code:**
   ```bash
   wrangler deploy
   ```

2. **Initialize Database:**
   ```bash
   # Via CloudFunction
   curl -X POST https://your-worker.workers.dev/api/function \
     -H "Content-Type: application/json" \
     -d '{"action": "system.initialize"}'
   ```

3. **Response Example:**
   ```json
   {
     "success": true,
     "data": {
       "tablesCreated": ["users", "projects"],
       "columnsAdded": [
         {"table": "users", "column": "last_login"},
         {"table": "projects", "column": "description"}
       ],
       "seedsRun": [
         {"model": "USER", "records": 1},
         {"model": "PROJECT", "records": 0}
       ],
       "duration": 1250
     }
   }
   ```

### Environment Variables

Required environment variables for seeding:

```toml
# wrangler.toml
[vars]
ADMIN_EMAIL = "admin@yoursite.com"
ADMIN_PASSWORD = "secure-admin-password"
```

### Implementation Files

```
modules/datamodel/
├── utils/
│   ├── table-manager.js    # Database initialization logic
│   ├── schema-migrator.js  # Schema comparison and updates
│   └── data-seeder.js      # Initial data population
```

### Performance Impact

- **Zero impact** on regular requests (no initialization in main handler)
- **Manual trigger** via CloudFunction endpoint
- **One-time operation** after deployment
- **Can be automated** in CI/CD pipeline

## Benefits

1. **Clean API** - Simple, intuitive methods
2. **DRY** - No duplicate storage logic
3. **Consistent** - All models work the same way
4. **Extensible** - Easy to add new models
5. **Event-driven** - Built-in hook system
6. **Performance** - KV for speed, D1 for queries
7. **Database Management** - Automatic schema migration and seeding
