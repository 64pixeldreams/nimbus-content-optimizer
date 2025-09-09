# 📊 Data Structures Specification

## 🎯 **Purpose**

Define all KV namespace schemas and data models for consistent storage and retrieval across the platform.

## 🗄️ **KV Namespace Design**

### **Namespace: NIMBUS_USERS**
Stores user accounts.

```typescript
// Key: user:{user_id}
interface UserData {
  user_id: string;              // "user_12345"
  email: string;                // "user@example.com"
  created: string;              // ISO 8601 timestamp
}

// Key: projects:{user_id}
type ProjectsList = string[];   // ["proj_abc123", "proj_xyz789"]

// Key: apikeys:{user_id}
type ApiKeysList = string[];    // ["sha256:key1hash", "sha256:key2hash"]
```

### **Namespace: NIMBUS_PROJECTS**
Stores project configurations and metadata.

```typescript
// Key: project:{project_id}
interface ProjectData {
  project_id: string;           // "proj_abc123"
  user_id: string;              // "user_12345" - Owner
  name: string;                 // "repairsbypost.com"
  created: string;              // ISO 8601 timestamp
  settings: {
    tone: string;               // "premium" | "professional" | "casual"
    max_pages_per_batch: number;// 1000
    default_concurrency: number; // 5
    ai_model: string;           // "gpt-4" | "gpt-3.5-turbo"
    domain: string;             // "repairsbypost.com"
  };
  usage: {
    total_pages: number;        // Running count
    total_batches: number;      // Running count
    last_activity: string;      // ISO 8601 timestamp
  };
}
```

### **Namespace: NIMBUS_KEYS**
Maps API keys to their customer.

```typescript
// Key: apikey:{api_key_hash}
interface KeyData {
  user_id: string;              // "user_12345"
  created: string;              // ISO 8601 timestamp
  last_used: string;            // ISO 8601 timestamp
  active: boolean;              // Key status
  name: string;                 // "Production Key" | "Development Key"
  usage: {
    requests_today: number;     // Daily counter
    requests_total: number;     // Total requests
  };
}
```

### **Namespace: NIMBUS_EMAILS**
Maps emails to their user for quick lookup.

```typescript
// Key: email:{email}
interface EmailData {
  user_id: string;              // "user_12345"
  created: string;              // Account creation timestamp
}
```

### **Namespace: NIMBUS_CACHE**
Caches AI responses and frequently accessed data.

```typescript
// Key: cache:{hash}
interface CacheData {
  data: any;                    // Cached content
  created: string;              // ISO 8601 timestamp
  expires: string;              // ISO 8601 timestamp
  type: string;                 // "ai_response" | "page_data"
}
```

### **Namespace: NIMBUS_SESSIONS**
Stores user session data.

```typescript
// Key: session:{session_id}
interface SessionData {
  user_id: string;              // "user_12345"
  email: string;                // "user@example.com"
  created: string;              // ISO 8601 timestamp
  expires: string;              // ISO 8601 timestamp
  ip: string;                   // Client IP
  user_agent: string;           // Browser info
}
```

### **Namespace: NIMBUS_PAGES**
Stores extracted page content with dimensions.

```typescript
// Key: page:{project_id}:{page_id}
interface PageData {
  page_id: string;              // "page_abc123"
  project_id: string;           // "proj_a1b2c3d4e5f6"
  batch_id: string;             // "batch_20240902_134500"
  source_path: string;          // "dist/local/rolex-repair.html"
  uploaded: string;             // ISO 8601 timestamp
  
  // Extracted content from gulp
  extraction: {
    engine: string;             // "html"
    main_selector: string;      // "main"
    head: {
      title: string;
      metaDescription: string;
      canonical: string;
      favicon: string;
      [key: string]: string;    // Other metadata
    };
    dimensions: {
      location?: string;        // "birmingham"
      brand?: string;           // "rolex"
      service?: string;         // "watch-repair"
      [key: string]: any;       // Custom dimensions
    };
    above_fold_blocks: Block[];
    rest_of_page_blocks: Block[];
    selector_map: Record<string, string>;
  };
  
  // AI optimization results
  optimization?: {
    completed: string;          // ISO 8601 timestamp
    model: string;              // "gpt-4"
    confidence: number;         // 0.95
    changes: number;            // 47
    optimized_blocks: Block[];
  };
}

interface Block {
  id: string;                   // "block-0"
  type: string;                 // "h1" | "p" | "img"
  content: string;              // Text content
  attributes?: Record<string, string>;
  optimized_content?: string;   // AI result
}
```

### **Namespace: NIMBUS_BATCHES**
Tracks batch processing status.

```typescript
// Key: batch:{project_id}:{batch_id}
interface BatchData {
  batch_id: string;             // "batch_20240902_134500"
  project_id: string;           // "proj_a1b2c3d4e5f6"
  created: string;              // ISO 8601 timestamp
  page_count: number;           // 100
  status: 'uploading' | 'queued' | 'processing' | 'completed' | 'failed';
  
  pages: {
    [page_id: string]: {
      status: 'uploaded' | 'queued' | 'processing' | 'done' | 'failed';
      uploaded: string;         // ISO 8601
      started?: string;         // ISO 8601
      completed?: string;       // ISO 8601
      error?: string;           // Error message if failed
    };
  };
  
  summary: {
    completed: number;          // 95
    failed: number;             // 2
    pending: number;            // 3
    average_time_ms: number;    // 2500
  };
}
```

### **Namespace: NIMBUS_QUEUE**
Processing queue for scheduled workers.

```typescript
// Key: queue:{project_id}
interface QueueData {
  items: QueueItem[];
  last_processed: string;       // ISO 8601 timestamp
}

interface QueueItem {
  page_id: string;              // "page_abc123"
  batch_id: string;             // "batch_20240902_134500"
  priority: number;             // 1-10 (10 = highest)
  queued_at: string;            // ISO 8601 timestamp
  attempts: number;             // Retry count
}
```

### **Namespace: NIMBUS_STATUS**
Real-time page processing status.

```typescript
// Key: status:{project_id}:{page_id}
interface StatusData {
  status: 'uploaded' | 'queued' | 'processing' | 'done' | 'failed';
  batch_id: string;             // "batch_20240902_134500"
  updated: string;              // ISO 8601 timestamp
  
  processing?: {
    started: string;            // ISO 8601
    current_step: string;       // "ai_optimization"
    progress: number;           // 0-100
  };
  
  result?: {
    completed: string;          // ISO 8601
    success: boolean;
    changes: number;            // Number of optimizations
    confidence: number;         // AI confidence score
  };
  
  error?: {
    message: string;
    code: string;               // "AI_TIMEOUT" | "INVALID_CONTENT"
    timestamp: string;          // ISO 8601
  };
}
```

### **Namespace: NIMBUS_LOGS**
Comprehensive audit logs for debugging.

```typescript
// Key: logs:{project_id}:{page_id}
interface LogData {
  page_id: string;
  entries: LogEntry[];
}

interface LogEntry {
  timestamp: string;            // ISO 8601
  level: 'info' | 'warn' | 'error';
  step: string;                 // "upload" | "queue" | "process"
  message: string;
  data?: any;                   // Additional context
  duration_ms?: number;         // Step duration
}
```

## 🔑 **Key Patterns**

### **ID Generation**
```javascript
// Project IDs
project_id: `proj_${randomHex(12)}`  // proj_a1b2c3d4e5f6

// Page IDs (deterministic from path)
page_id: `page_${md5(project_id + source_path).slice(0, 12)}`

// Batch IDs (timestamp-based)
batch_id: `batch_${YYYYMMDD}_${HHMMSS}`  // batch_20240902_134500

// API Keys
api_key: `sk_live_${randomHex(32)}`  // sk_live_abcdef...
```

### **KV Key Structure**
Always use format: `namespace:primary_id:secondary_id`
- `project:proj_123`
- `page:proj_123:page_abc`
- `batch:proj_123:batch_20240902`
- `status:proj_123:page_abc`

## 📝 **Usage Examples**

### **Storing Page Data**
```javascript
// After extraction in gulp
const pageData = {
  page_id: generatePageId(projectId, filePath),
  project_id: projectId,
  batch_id: batchId,
  source_path: filePath,
  uploaded: new Date().toISOString(),
  extraction: extractedContent  // From existing extraction system
};

await kvClient.put(
  `page:${projectId}:${pageData.page_id}`,
  JSON.stringify(pageData)
);
```

### **Updating Status**
```javascript
// In Cloudflare Worker
await kvClient.put(
  `status:${projectId}:${pageId}`,
  JSON.stringify({
    status: 'processing',
    batch_id: batchId,
    updated: new Date().toISOString(),
    processing: {
      started: new Date().toISOString(),
      current_step: 'ai_optimization',
      progress: 50
    }
  })
);
```

### **Batch Tracking**
```javascript
// Update batch summary
const batch = await kvClient.get(`batch:${projectId}:${batchId}`, 'json');
batch.pages[pageId].status = 'done';
batch.summary.completed++;
batch.summary.pending--;
await kvClient.put(
  `batch:${projectId}:${batchId}`,
  JSON.stringify(batch)
);
```

## ✅ **Data Integrity Rules**

1. **Always include timestamps** - Use ISO 8601 format
2. **Never delete KV entries** - Mark as inactive/completed instead
3. **Use deterministic IDs** - Same input always generates same ID
4. **Validate before storing** - Check required fields
5. **Handle missing data gracefully** - Use defaults where appropriate
