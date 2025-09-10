# 📊 Audit Logging System Specification

## 🎯 **Purpose**
Comprehensive audit trail system for pages, projects, and user activities with D1 database integration for queryable activity feeds.

## 🏗️ **Architecture**

### **Integration with Locked Modules**
- **LOGS Module** (🔒 LOCKED v1.0) - Core logging infrastructure
- **DataStore Module** (🔒 LOCKED v1.0) - D1 database integration
- **Auth Module** (🔒 LOCKED v1.0) - User context for audit trails

## 📊 **D1 Audit Schema**

### **Audit Logs Table**
```sql
CREATE TABLE audit_logs (
  log_id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  entity_type TEXT NOT NULL,        -- 'page', 'project', 'user', 'system'
  entity_id TEXT,                   -- Primary entity ID being logged
  action TEXT NOT NULL,             -- 'created', 'updated', 'processed', 'deleted'
  message TEXT NOT NULL,            -- Human-readable log message
  level TEXT DEFAULT 'info',        -- 'info', 'warn', 'error'
  entity_ids TEXT DEFAULT '[]',     -- JSON array of all related entity IDs (flexible indexing)
  details TEXT DEFAULT '{}',        -- JSON details about the action
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Indexes for efficient queries
  INDEX idx_audit_logs_user_id (user_id),
  INDEX idx_audit_logs_entity_id (entity_id)
);
```

### **Flexible Entity Indexing**
The new `entity_ids` field allows scalable relationships:
- **User Log**: `entity_ids = ["user:abc123"]`
- **Project Log**: `entity_ids = ["project:xyz789", "user:abc123"]`
- **Page Log**: `entity_ids = ["page:def456", "project:xyz789", "user:abc123"]`

This design allows querying logs by any related entity ID without hardcoded fields.

## 🎯 **Audit Event Types**

### **Page Events**
```javascript
// Page created from gulp extraction
{
  entity_type: "page",
  action: "created",
  details: {
    url: "/watch-repairs-ashford.html",
    content_blocks: 47,
    above_fold_blocks: 7,
    dimensions_extracted: ["location", "brand", "service"],
    extraction_source: "gulp_local",
    file_size_kb: 125
  }
}

// Page processing started
{
  entity_type: "page", 
  action: "processing_started",
  details: {
    optimization_type: "full",
    ai_model: "gpt-4",
    estimated_duration_ms: 5000,
    content_blocks_to_process: 47
  }
}

// AI optimization completed
{
  entity_type: "page",
  action: "ai_optimization_completed", 
  details: {
    processing_time_ms: 3500,
    blocks_optimized: 12,
    changes_made: {
      headings_updated: 5,
      ctas_optimized: 3,
      meta_updated: 4
    },
    ai_model: "gpt-4",
    success: true
  }
}

// Page optimization completed
{
  entity_type: "page",
  action: "optimization_completed",
  details: {
    total_processing_time_ms: 4200,
    final_status: "optimized",
    changes_summary: "Updated 5 headings, optimized 3 CTAs, enhanced meta tags"
  }
}

// Page re-uploaded (content updated)
{
  entity_type: "page",
  action: "content_updated",
  details: {
    previous_blocks: 47,
    new_blocks: 52,
    content_diff: "Added 5 new content blocks",
    extraction_source: "gulp_local_rerun"
  }
}
```

### **Project Events**
```javascript
{
  entity_type: "project",
  action: "pages_batch_uploaded",
  details: {
    pages_count: 15,
    total_content_blocks: 423,
    upload_time_ms: 2500,
    batch_id: "batch_abc123"
  }
}
```

## 🔍 **Audit Feed Queries**

### **Flexible Entity Query System**
```javascript
// Get all activity for any entity using entity_ids
async function getEntityAuditFeed(entityId, limit = 50) {
  const query = `
    SELECT log_id, user_id, entity_type, entity_id, action, message, details, created_at
    FROM audit_logs 
    WHERE entity_ids LIKE ? 
    ORDER BY created_at DESC 
    LIMIT ?
  `;
  return await d1.prepare(query).bind(`%${entityId}%`, limit).all();
}

// Get all activity for a specific page
async function getPageAuditFeed(pageId, limit = 50) {
  return await getEntityAuditFeed(pageId, limit);
}

// Get all activity for a project (includes all pages)
async function getProjectAuditFeed(projectId, limit = 100) {
  return await getEntityAuditFeed(projectId, limit);
}

// Get all user activity across all projects/pages
async function getUserAuditFeed(userId, limit = 100) {
  const query = `
    SELECT log_id, entity_type, entity_id, action, message, details, created_at
    FROM audit_logs 
    WHERE user_id = ? 
    ORDER BY created_at DESC 
    LIMIT ?
  `;
  return await d1.prepare(query).bind(userId, limit).all();
}
```

## ⚡ **Audit Logging API**

### **CloudFunction Integration**
```javascript
// Enhanced page operations with audit logging (using Model Hooks)
page.create {
  // Page creation automatically triggers afterCreate hook
  // Hook creates audit log with entity_ids = [page_id, project_id, user_id]
  
  // Manual audit logging (if needed)
  await auditLogger.createLog({
    user_id: auth.user_id,
    entity_type: "page",
    entity_id: newPage.page_id,
    action: "created",
    message: `Page created: ${payload.title}`,
    entity_ids: [newPage.page_id, payload.project_id, auth.user_id],
    details: {
      url: payload.url,
      title: payload.title,
      extraction_source: "gulp_local"
    }
  });
}

page.process {
  // Processing start
  await auditLogger.createLog({
    user_id: auth.user_id,
    entity_type: "page",
    entity_id: payload.page_id,
    action: "processing_started",
    message: `AI processing started for ${page.title}`,
    entity_ids: [payload.page_id, page.project_id, auth.user_id],
    details: {
      optimization_type: payload.optimization_type,
      ai_model: "gpt-4"
    }
  });
  
  // ... AI processing happens ...
  
  // Processing completion
  await auditLogger.createLog({
    user_id: auth.user_id,
    entity_type: "page",
    entity_id: payload.page_id,
    action: "optimization_completed",
    message: `AI optimization completed for ${page.title}`,
    entity_ids: [payload.page_id, page.project_id, auth.user_id],
    details: {
      processing_time_ms: processingTime,
      changes_made: changesCount,
      success: true
    }
  });
}
```

### **Audit Feed CloudFunctions**
```javascript
// Get audit feed for any entity (using entity_ids)
page.logs {
  type: "user",           // Get logs for authenticated user
  project_id?: "project:xyz", // Optional: filter by project
  limit?: 50
}

// Examples of actual usage:
// Get all user activity
cf.run('page.logs', { type: 'user', limit: 50 })

// Get project-specific activity  
cf.run('page.logs', { type: 'user', project_id: 'project:xyz', limit: 100 })

// Get page-specific activity (would need custom implementation)
cf.run('page.logs', { type: 'entity', entity_id: 'page:abc123', limit: 50 })
```

## 🎯 **Frontend Integration**

### **Page View Audit Feed**
```javascript
// Display on page detail view
const pageAudit = await CloudFunction.run('audit.page.feed', {
  page_id: currentPage.page_id
});

// Render timeline:
// ✅ Page created from gulp extraction (2 hours ago)
// 🔄 AI processing started (1 hour ago)  
// ✅ Optimization completed (58 minutes ago)
// 📝 Content updated (30 minutes ago)
```

### **Project Dashboard Feed**
```javascript
// Display on project dashboard
const projectAudit = await CloudFunction.run('audit.project.feed', {
  project_id: currentProject.project_id,
  limit: 20
});

// Render activity stream:
// 📄 5 pages uploaded (1 hour ago)
// 🤖 AI processing completed on 3 pages (45 minutes ago)
// ✅ Project optimization batch finished (30 minutes ago)
```

---

## 📋 **SUMMARY**

✅ **Page Specification Created** - Complete integration with gulp extraction
✅ **Audit Logging Designed** - D1-based with user/project/page linking  
✅ **Query System Planned** - Efficient feeds for all audit views
✅ **Integration Strategy** - Works with locked foundation modules

**Your LOGS module can definitely write to D1** through the DataStore abstraction layer, and the audit system will provide complete activity tracking for pages, projects, and users.

**Ready to start building the Pages module?** 🚀
