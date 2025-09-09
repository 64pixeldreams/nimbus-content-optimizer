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
  project_id TEXT,
  page_id TEXT,
  entity_type TEXT NOT NULL,        -- 'page', 'project', 'user', 'system'
  action TEXT NOT NULL,             -- 'created', 'updated', 'processed', 'deleted'
  details TEXT,                     -- JSON details about the action
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  request_id TEXT,
  ip_address TEXT,
  user_agent TEXT,
  
  -- Indexes for efficient queries
  INDEX idx_audit_user_id (user_id),
  INDEX idx_audit_project_id (project_id),
  INDEX idx_audit_page_id (page_id),
  INDEX idx_audit_entity_type (entity_type),
  INDEX idx_audit_action (action),
  INDEX idx_audit_timestamp (timestamp),
  INDEX idx_audit_user_timestamp (user_id, timestamp),
  INDEX idx_audit_project_timestamp (project_id, timestamp),
  INDEX idx_audit_page_timestamp (page_id, timestamp)
);
```

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

### **Page Activity Feed**
```javascript
// Get all activity for a specific page
async function getPageAuditFeed(pageId, limit = 50) {
  const query = `
    SELECT log_id, user_id, action, details, timestamp, request_id
    FROM audit_logs 
    WHERE page_id = ? 
    ORDER BY timestamp DESC 
    LIMIT ?
  `;
  return await d1.prepare(query).bind(pageId, limit).all();
}
```

### **Project Activity Feed**
```javascript
// Get all activity for a project (includes all pages)
async function getProjectAuditFeed(projectId, limit = 100) {
  const query = `
    SELECT log_id, user_id, page_id, action, details, timestamp
    FROM audit_logs 
    WHERE project_id = ? 
    ORDER BY timestamp DESC 
    LIMIT ?
  `;
  return await d1.prepare(query).bind(projectId, limit).all();
}
```

### **User Activity Feed**
```javascript
// Get all user activity across all projects/pages
async function getUserAuditFeed(userId, limit = 100) {
  const query = `
    SELECT log_id, project_id, page_id, entity_type, action, details, timestamp
    FROM audit_logs 
    WHERE user_id = ? 
    ORDER BY timestamp DESC 
    LIMIT ?
  `;
  return await d1.prepare(query).bind(userId, limit).all();
}
```

## ⚡ **Audit Logging API**

### **CloudFunction Integration**
```javascript
// Enhanced page operations with audit logging
page.create {
  // ... create page ...
  
  // Auto-audit log
  await auditLog({
    user_id: auth.user_id,
    project_id: payload.project_id,
    page_id: newPage.page_id,
    entity_type: "page",
    action: "created",
    details: {
      url: payload.url,
      content_blocks: payload.content.above_fold_blocks.length + payload.content.rest_of_page_blocks.length,
      extraction_source: "gulp_local"
    }
  });
}

page.process {
  // ... start AI processing ...
  
  // Audit processing start
  await auditLog({
    user_id: auth.user_id,
    project_id: page.project_id,
    page_id: payload.page_id,
    entity_type: "page", 
    action: "processing_started",
    details: {
      optimization_type: payload.optimization_type,
      ai_model: "gpt-4"
    }
  });
  
  // ... AI processing happens ...
  
  // Audit completion
  await auditLog({
    user_id: auth.user_id,
    project_id: page.project_id,
    page_id: payload.page_id,
    entity_type: "page",
    action: "optimization_completed", 
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
// Get audit feed for page
audit.page.feed {
  page_id: "page:abc123",
  limit?: 50
}

// Get audit feed for project  
audit.project.feed {
  project_id: "project:xyz",
  limit?: 100
}

// Get user activity feed
audit.user.feed {
  user_id: "user:abc123",
  limit?: 100
}
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
