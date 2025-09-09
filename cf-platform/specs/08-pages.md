# 📄 Pages Module Specification

## 🎯 **Purpose**
Complete page management system that integrates gulp extraction with CF-Platform for AI-powered content optimization.

## 🏗️ **Architecture Overview**

### **Workflow Pipeline**
```
1. LOCAL EXTRACTION (Gulp)
   HTML Files → gulp nimbus:scan:map → JSON Objects (.nimbus/maps/)

2. CF UPLOAD (Batch/Individual) 
   JSON Objects → POST /api/function → page.create → CF Platform Storage

3. AI PROCESSING (CF Worker)
   Page Data → AI Optimization → Results Stored → Status Updated

4. FRONTEND RETRIEVAL
   GET page.get → Optimized Data → Render HTML → Updated Local Files
```

## 📊 **Data Model**

### **Page Entity**
```javascript
{
  // Primary identifiers
  page_id: "page:mf8y0hsj194812",
  project_id: "project:xyz789",           // Required: Links to project
  user_id: "user:abc123",                 // Required: Links to user (for audit)
  
  // Page metadata
  url: "/watch-repairs-ashford.html",
  title: "Watch Repairs in Ashford",
  status: "extracted|processing|optimized|published|failed",
  
  // Extracted content (from gulp)
  content: {
    head: {
      title: "Watch Repairs in Ashford",
      metaDescription: "Professional watch repair...",
      canonical: "https://example.com/watch-repairs-ashford",
      favicon: "https://example.com/favicon.ico"
    },
    above_fold_blocks: [
      {
        id: "block_001",
        type: "heading",
        tag: "h1", 
        text: "Professional Watch Repair in Ashford",
        selector: "h1"
      }
    ],
    rest_of_page_blocks: [...],
    dimensions: {
      location: { success: true, value: "ashford" },
      brand: { success: true, value: "rolex" },
      service: { success: true, value: "watch repair" }
    },
    selector_map: {...},
    extraction_config: {...}
  },
  
  // AI optimization results
  optimization: {
    status: "pending|processing|completed|failed",
    started_at: "2025-01-01T10:00:00Z",
    completed_at: "2025-01-01T10:05:00Z",
    ai_results: {
      head: {...},
      above_fold_optimized: [...],
      rest_of_page_optimized: [...],
      changes_summary: "Updated 5 headings, optimized 3 CTAs"
    },
    optimization_history: [
      {
        version: 1,
        timestamp: "2025-01-01T10:00:00Z",
        results: {...},
        model_used: "gpt-4",
        processing_time_ms: 3500
      }
    ]
  },
  
  // Timestamps
  created_at: "2025-01-01T09:00:00Z",
  updated_at: "2025-01-01T10:05:00Z",
  extracted_at: "2025-01-01T09:00:00Z",
  processed_at: "2025-01-01T10:05:00Z"
}
```

## ⚡ **CloudFunction API**

### **Page Operations**
```javascript
// Create/Upload page from gulp extraction
page.create {
  project_id: "project:xyz",
  url: "/page-url.html",
  content: {...}  // Full extraction JSON
}

// Get page with optimization results
page.get {
  page_id: "page:abc123"
}

// List pages by project
page.list {
  project_id: "project:xyz",
  status?: "extracted|processing|optimized",
  limit?: 50,
  offset?: 0
}

// Update page content (re-upload)
page.update {
  page_id: "page:abc123", 
  content: {...}  // Updated extraction JSON
}

// Trigger AI optimization workflow
page.process {
  page_id: "page:abc123",
  optimization_type: "full|head|content|images"
}

// Check processing status
page.status {
  page_id: "page:abc123"
}

// Batch operations
page.batch.create {
  project_id: "project:xyz",
  pages: [
    { url: "/page1.html", content: {...} },
    { url: "/page2.html", content: {...} }
  ]
}
```

## 📊 **Audit Logging System**

### **D1 Audit Log Schema**
```sql
CREATE TABLE page_audit_logs (
  log_id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  project_id TEXT,
  page_id TEXT,
  action TEXT NOT NULL,              -- 'page_created', 'processing_started', 'ai_completed', 'optimization_completed'
  details TEXT,                      -- JSON details about the action
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  request_id TEXT,
  
  -- Indexes for efficient queries
  INDEX idx_page_audit_user_id (user_id),
  INDEX idx_page_audit_project_id (project_id), 
  INDEX idx_page_audit_page_id (page_id),
  INDEX idx_page_audit_timestamp (timestamp)
);
```

### **Audit Events**
```javascript
// Page lifecycle events
{
  action: "page_created",
  details: {
    page_id: "page:abc123",
    url: "/watch-repairs-ashford.html",
    content_blocks: 47,
    extraction_source: "gulp_local"
  }
}

{
  action: "processing_started", 
  details: {
    page_id: "page:abc123",
    optimization_type: "full",
    model: "gpt-4",
    estimated_duration: "3-5 minutes"
  }
}

{
  action: "ai_optimizer_completed",
  details: {
    page_id: "page:abc123", 
    processing_time_ms: 3500,
    changes_made: 12,
    model: "gpt-4",
    success: true
  }
}

{
  action: "page_optimization_completed",
  details: {
    page_id: "page:abc123",
    total_time_ms: 4200,
    status: "optimized",
    changes_summary: "Updated 5 headings, optimized 3 CTAs"
  }
}
```

## 🔄 **Page Versioning & Re-upload Strategy**

### **Re-upload Behavior**
```javascript
// When page.create is called with existing URL:
if (existingPage) {
  // Option A: Overwrite (Simple)
  await page.update(page_id, newContent);
  
  // Option B: Version tracking (Recommended)
  await page.createVersion(page_id, newContent);
  
  // Audit log
  await auditLog('page_updated', {
    page_id,
    version: newVersion,
    changes: "Content re-extracted from gulp"
  });
}
```

### **Optimization Re-run Strategy**
```javascript
// When page.process is called again:
const newOptimization = await runAIOptimization(pageContent);

// Add to history, update current
page.optimization.optimization_history.push({
  version: page.optimization.optimization_history.length + 1,
  timestamp: new Date().toISOString(),
  results: newOptimization,
  model_used: "gpt-4"
});

page.optimization.ai_results = newOptimization;
page.optimization.status = "completed";
```

## 🎯 **Integration Points**

### **With Locked Foundation Modules**
- **DataModel** - Page entity storage and validation ✅
- **Auth** - User authentication for page operations ✅  
- **Datastore** - KV storage for page content, D1 for metadata ✅
- **Logs** - Audit trail for all page operations ✅

### **With Gulp Extraction System**
- **Input**: JSON from `.nimbus/maps/` directory
- **Upload**: Batch upload via `page.batch.create`
- **Processing**: AI optimization via CF Workers
- **Output**: Optimized JSON for HTML rendering

## 🔍 **Audit Feed Queries**

### **Page-Level Audit Feed**
```sql
SELECT * FROM page_audit_logs 
WHERE page_id = ? 
ORDER BY timestamp DESC 
LIMIT 50;
```

### **Project-Level Audit Feed**
```sql
SELECT * FROM page_audit_logs 
WHERE project_id = ? 
ORDER BY timestamp DESC 
LIMIT 100;
```

### **User Activity Feed**
```sql
SELECT * FROM page_audit_logs 
WHERE user_id = ? 
ORDER BY timestamp DESC 
LIMIT 100;
```

## 🚀 **Implementation Plan**

### **Phase 1: Core Page Module**
1. Create Page Model definition
2. Implement basic CloudFunctions (create, get, list)
3. Add audit logging integration
4. Test with sample gulp extraction JSON

### **Phase 2: AI Processing Integration**
1. Connect to existing gulp AI workers
2. Implement page.process workflow
3. Add status tracking and progress updates
4. Test end-to-end optimization

### **Phase 3: Batch Operations**
1. Implement page.batch.create for bulk uploads
2. Add batch processing status tracking
3. Optimize for large page sets
4. Add error handling and retry logic

## 🎯 **Key Design Decisions**

### **Page-Project-User Relationship**
- ✅ **Pages linked to projects** (project_id)
- ✅ **Pages linked to users** (user_id for audit)
- ✅ **Users own projects own pages** (hierarchical ownership)

### **Content Storage Strategy**
- **Full content in KV** (for fast retrieval)
- **Metadata in D1** (for queries and relationships)
- **Audit logs in D1** (for activity feeds)

### **Re-upload Strategy**
- **Overwrite content** (simple, no versioning complexity)
- **Preserve optimization history** (in optimization_history array)
- **Audit all changes** (complete trail)

---

**This specification integrates perfectly with your locked foundation modules and existing gulp extraction system.** 

Ready to implement? 🚀
