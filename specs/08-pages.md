# 📄 Pages Module - Complete Specification

## 🎯 **Overview**
Complete page management system integrating gulp extraction pipeline with CF-Platform for AI-powered content optimization and audit trail management.

## 🏗️ **System Architecture**

### **Complete Workflow Pipeline**
```
┌─────────────────────────────────────────────────────────────┐
│                    NIMBUS PAGES SYSTEM                     │
├─────────────────────────────────────────────────────────────┤
│  📁 LOCAL EXTRACTION (Gulp)                                │
│  HTML Files → gulp nimbus:scan:map → JSON (.nimbus/maps/)  │
├─────────────────────────────────────────────────────────────┤
│  ⬆️ CF UPLOAD (Batch/Individual)                            │
│  JSON Objects → POST /api/function → page.create → Storage │
├─────────────────────────────────────────────────────────────┤
│  🤖 AI PROCESSING (CF Worker)                              │
│  Page Data → AI Optimization → Results → Status Updated    │
├─────────────────────────────────────────────────────────────┤
│  📊 AUDIT LOGGING (D1)                                     │
│  All Actions → D1 Audit Logs → Activity Feeds             │
├─────────────────────────────────────────────────────────────┤
│  📱 FRONTEND RETRIEVAL                                     │
│  GET page.get → Optimized Data → Render HTML → Local Files │
└─────────────────────────────────────────────────────────────┘
```

## 📊 **Page Data Model**

### **Page Entity (CF-Platform)**
```javascript
{
  // Primary identifiers
  page_id: "page:mf8y0hsj194812",        // Auto-generated
  project_id: "project:xyz789",           // Required: Links to project
  user_id: "user:abc123",                 // Required: Links to user
  
  // Page metadata
  url: "/watch-repairs-ashford.html",     // Relative URL from extraction
  title: "Watch Repairs in Ashford",     // From extracted head.title
  status: "extracted|processing|optimized|published|failed",
  
  // Extracted content (from gulp .nimbus/maps/)
  content: {
    // Head metadata
    head: {
      title: "Watch Repairs in Ashford | Free UK Postage",
      metaDescription: "Professional watch repair in Ashford...",
      canonical: "https://example.com/watch-repairs-ashford",
      favicon: "https://example.com/favicon.ico",
      ogImage: "https://example.com/og-image.jpg"
    },
    
    // Above-fold content blocks
    above_fold_blocks: [
      {
        id: "block_001",
        type: "heading",
        tag: "h1",
        text: "Professional Watch Repair in Ashford",
        selector: "h1",
        position: 1
      },
      {
        id: "block_002", 
        type: "paragraph",
        tag: "p",
        text: "Expert watch repair services with 12-month guarantee...",
        selector: "main > p:first-of-type",
        position: 2
      }
    ],
    
    // Rest-of-page content blocks
    rest_of_page_blocks: [
      {
        id: "block_003",
        type: "heading",
        tag: "h2", 
        text: "Our Watch Repair Services",
        selector: "h2:nth-of-type(1)",
        position: 3
      }
      // ... more blocks
    ],
    
    // Content dimensions (business intelligence)
    dimensions: {
      location: { success: true, value: "ashford", method: "url_pattern" },
      brand: { success: true, value: "rolex", method: "content_selector" },
      service: { success: true, value: "watch repair", method: "static_value" },
      product: { success: false, value: null, error: "SELECTOR_NOT_FOUND" }
    },
    
    // Technical metadata
    selector_map: {
      "block_001": "h1",
      "block_002": "main > p:first-of-type"
    },
    extraction_config: {
      main_selector: "main",
      above_fold_selector: ".container",
      extraction_rules: {...}
    }
  },
  
  // AI optimization results
  optimization: {
    status: "pending|processing|completed|failed",
    started_at: "2025-01-01T10:00:00Z",
    completed_at: "2025-01-01T10:05:00Z",
    processing_time_ms: 3500,
    
    // Current optimization results
    ai_results: {
      head: {
        title: "Expert Watch Repairs in Ashford | Free UK Postage & 12-Month Guarantee",
        metaDescription: "Professional watch repair in Ashford with expert craftsmen. Free UK postage, 12-month guarantee. Rolex, Omega, Cartier specialists."
      },
      above_fold_optimized: [
        {
          id: "block_001",
          optimized_text: "Expert Watch Repair Services in Ashford",
          changes: ["Enhanced with 'Expert'", "Improved local SEO"]
        }
      ],
      rest_of_page_optimized: [...],
      changes_summary: "Updated 5 headings, optimized 3 CTAs, enhanced meta tags",
      seo_improvements: ["Added location targeting", "Improved CTA clarity"],
      tone_adjustments: ["More professional tone", "Added trust signals"]
    },
    
    // Optimization history (versioning)
    optimization_history: [
      {
        version: 1,
        timestamp: "2025-01-01T10:00:00Z",
        model_used: "gpt-4",
        processing_time_ms: 3500,
        results: {...},
        success: true
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

### **Core Page Operations**
```javascript
// Upload page from gulp extraction
page.create {
  project_id: "project:xyz789",
  url: "/watch-repairs-ashford.html",
  content: {
    head: {...},
    above_fold_blocks: [...],
    rest_of_page_blocks: [...], 
    dimensions: {...}
  }
}

// Get page with optimization results
page.get {
  page_id: "page:abc123",
  include_optimization?: true,
  include_history?: false
}

// List pages by project
page.list {
  project_id: "project:xyz789",
  status?: "extracted|processing|optimized",
  limit?: 50,
  offset?: 0
}

// Update page content (re-upload from gulp)
page.update {
  page_id: "page:abc123",
  content: {...}  // Updated extraction JSON
}

// Trigger AI optimization
page.process {
  page_id: "page:abc123",
  optimization_type: "full|head|content|images",
  ai_model?: "gpt-4|gpt-3.5-turbo"
}

// Check processing status
page.status {
  page_id: "page:abc123"
}
```

### **Batch Operations**
```javascript
// Batch upload from gulp
page.batch.create {
  project_id: "project:xyz789",
  pages: [
    {
      url: "/page1.html",
      content: {...}  // Full gulp extraction JSON
    },
    {
      url: "/page2.html", 
      content: {...}
    }
  ]
}

// Batch processing
page.batch.process {
  project_id: "project:xyz789",
  page_ids?: ["page:1", "page:2"],  // Optional: specific pages
  optimization_type: "full"
}

// Batch status
page.batch.status {
  project_id: "project:xyz789",
  batch_id?: "batch:abc123"
}
```

## 🔄 **Re-upload & Versioning Strategy**

### **When page.create called with existing URL:**
```javascript
// Check if page exists
const existingPage = await findPageByUrl(project_id, url);

if (existingPage) {
  // Strategy A: Overwrite content (RECOMMENDED)
  await updatePageContent(existingPage.page_id, newContent);
  
  // Preserve optimization history
  existingPage.optimization.optimization_history.push({
    version: existingPage.optimization.optimization_history.length + 1,
    timestamp: new Date().toISOString(),
    event: "content_updated",
    source: "gulp_reextraction"
  });
  
  // Audit log
  await auditLog({
    entity_type: "page",
    action: "content_updated",
    page_id: existingPage.page_id,
    details: {
      previous_blocks: existingPage.content.above_fold_blocks.length + existingPage.content.rest_of_page_blocks.length,
      new_blocks: newContent.above_fold_blocks.length + newContent.rest_of_page_blocks.length,
      extraction_source: "gulp_rerun"
    }
  });
}
```

### **When page.process called again:**
```javascript
// Re-running AI optimization
const newOptimization = await runAIOptimization(pageContent);

// Add to history
page.optimization.optimization_history.push({
  version: page.optimization.optimization_history.length + 1,
  timestamp: new Date().toISOString(),
  model_used: "gpt-4",
  processing_time_ms: processingTime,
  results: newOptimization,
  success: true
});

// Update current results
page.optimization.ai_results = newOptimization;
page.optimization.status = "completed";
page.optimization.completed_at = new Date().toISOString();
```

## 📊 **D1 Audit Logging Integration**

### **Audit Events for Pages**
```javascript
// Page lifecycle events
const auditEvents = {
  // From gulp extraction
  PAGE_CREATED: {
    action: "page_created",
    details: {
      url: "/watch-repairs-ashford.html",
      content_blocks: 47,
      above_fold_blocks: 7,
      dimensions_extracted: ["location", "brand", "service"],
      extraction_source: "gulp_local"
    }
  },
  
  // AI processing
  PROCESSING_STARTED: {
    action: "processing_started",
    details: {
      optimization_type: "full",
      ai_model: "gpt-4",
      estimated_duration_ms: 5000
    }
  },
  
  AI_COMPLETED: {
    action: "ai_optimization_completed",
    details: {
      processing_time_ms: 3500,
      blocks_optimized: 12,
      changes_made: {
        headings_updated: 5,
        ctas_optimized: 3,
        meta_updated: 4
      },
      success: true
    }
  },
  
  OPTIMIZATION_COMPLETED: {
    action: "optimization_completed", 
    details: {
      total_time_ms: 4200,
      final_status: "optimized",
      changes_summary: "Updated 5 headings, optimized 3 CTAs"
    }
  }
};
```

### **Audit Feed CloudFunctions**
```javascript
// Page-specific audit feed
audit.page.feed {
  page_id: "page:abc123",
  limit?: 50
}

// Project-wide audit feed  
audit.project.feed {
  project_id: "project:xyz789",
  limit?: 100,
  entity_types?: ["page", "project"]  // Filter by entity type
}

// User activity feed
audit.user.feed {
  user_id: "user:abc123",
  limit?: 100,
  days?: 7  // Last N days
}
```

## 🎯 **Integration with Existing Gulp System**

### **Gulp Extraction Output Format**
Based on existing system in `archive/docs-archive/version-history/specs/`:

```javascript
// From gulp nimbus:scan:map output (.nimbus/maps/page.json)
{
  "head": {
    "title": "Watch Repairs in Ashford",
    "metaDescription": "Professional watch repair...",
    "canonical": "https://example.com/watch-repairs-ashford",
    "favicon": "https://example.com/favicon.ico"
  },
  "above_fold_blocks": [
    {
      "id": "block_001",
      "type": "heading",
      "tag": "h1",
      "text": "Professional Watch Repair in Ashford",
      "selector": "h1"
    }
  ],
  "rest_of_page_blocks": [...],
  "dimensions": {
    "location": { "success": true, "value": "ashford" },
    "brand": { "success": true, "value": "rolex" },
    "service": { "success": true, "value": "watch repair" }
  },
  "selector_map": {...},
  "extraction_config": {...}
}
```

### **Upload Script Integration**
```javascript
// Gulp task to upload to CF-Platform
gulp.task('nimbus:upload:pages', async () => {
  const mapsDir = '.nimbus/maps/';
  const mapFiles = fs.readdirSync(mapsDir).filter(f => f.endsWith('.json'));
  
  for (const mapFile of mapFiles) {
    const content = JSON.parse(fs.readFileSync(path.join(mapsDir, mapFile)));
    const url = `/${mapFile.replace('.json', '.html')}`;
    
    // Upload to CF-Platform
    await CloudFunction.run('page.create', {
      project_id: process.env.NIMBUS_PROJECT_ID,
      url: url,
      content: content
    });
  }
});
```

## 📊 **D1 Audit Schema (Enhanced)**

```sql
-- Enhanced audit logs table
CREATE TABLE page_audit_logs (
  log_id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  project_id TEXT,
  page_id TEXT,
  entity_type TEXT NOT NULL,        -- 'page', 'project', 'batch'
  action TEXT NOT NULL,             -- 'created', 'processing_started', 'ai_completed', 'optimization_completed'
  details TEXT,                     -- JSON details
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  request_id TEXT,
  ip_address TEXT,
  user_agent TEXT,
  
  -- Performance tracking
  processing_time_ms INTEGER,
  success BOOLEAN,
  error_message TEXT,
  
  -- Indexes for audit feeds
  INDEX idx_page_audit_user_time (user_id, timestamp),
  INDEX idx_page_audit_project_time (project_id, timestamp), 
  INDEX idx_page_audit_page_time (page_id, timestamp),
  INDEX idx_page_audit_action (action),
  INDEX idx_page_audit_status (success, timestamp)
);
```

## 🔍 **Frontend Audit Feed Examples**

### **Page Detail View**
```html
<div class="audit-timeline">
  <h3>Page Activity</h3>
  <div class="timeline-item">
    <span class="badge bg-success">✅</span>
    <strong>Page created</strong> from gulp extraction
    <small class="text-muted">2 hours ago</small>
    <div class="details">47 content blocks extracted</div>
  </div>
  <div class="timeline-item">
    <span class="badge bg-info">🔄</span>
    <strong>AI processing started</strong>
    <small class="text-muted">1 hour ago</small>
    <div class="details">Full optimization with GPT-4</div>
  </div>
  <div class="timeline-item">
    <span class="badge bg-success">✅</span>
    <strong>Optimization completed</strong>
    <small class="text-muted">58 minutes ago</small>
    <div class="details">Updated 5 headings, optimized 3 CTAs</div>
  </div>
</div>
```

### **Project Dashboard Feed**
```html
<div class="project-activity">
  <h3>Recent Activity</h3>
  <div class="activity-item">
    <strong>5 pages uploaded</strong> to Ashford project
    <small class="text-muted">1 hour ago</small>
  </div>
  <div class="activity-item">
    <strong>AI processing completed</strong> on 3 pages
    <small class="text-muted">45 minutes ago</small>
  </div>
  <div class="activity-item">
    <strong>Batch optimization finished</strong>
    <small class="text-muted">30 minutes ago</small>
  </div>
</div>
```

## 🎯 **Key Design Decisions**

### **Page-Project-User Relationship**
- ✅ **Pages belong to projects** (project_id foreign key)
- ✅ **Projects belong to users** (user_id foreign key) 
- ✅ **Pages inherit user context** (for audit and permissions)

### **Content Storage Strategy**
- **Page content in KV** (fast retrieval, full JSON)
- **Page metadata in D1** (queryable, relationships)
- **Audit logs in D1** (activity feeds, timeline queries)

### **Re-upload Behavior**
- **Overwrite content** (simple, no versioning complexity)
- **Preserve optimization history** (never lose AI processing results)
- **Full audit trail** (complete activity tracking)

### **AI Processing Integration**
- **Async processing** (don't block upload)
- **Status tracking** (pending → processing → completed)
- **Error handling** (failed state with error details)
- **History preservation** (multiple optimization runs)

## 🚀 **Implementation Phases**

### **Phase 1: Core Page Module** (Week 1)
1. **Page Model Definition** (using locked DataModel)
2. **Basic CloudFunctions** (create, get, list)
3. **Test with sample JSON** (from gulp extraction)

### **Phase 2: AI Processing Integration** (Week 2)  
1. **page.process CloudFunction** (trigger AI workflow)
2. **Status tracking system** (async processing)
3. **Integration with gulp AI workers**

### **Phase 3: Audit System** (Week 3)
1. **D1 audit logging** (using locked Datastore)
2. **Audit feed CloudFunctions** 
3. **Frontend activity timelines**

### **Phase 4: Batch Operations** (Week 4)
1. **Batch upload** (multiple pages at once)
2. **Batch processing** (AI optimization queues)
3. **Performance optimization**

---

## 📋 **SPECIFICATION COMPLETE**

✅ **Found existing specs** in archive (gulp workflow)
✅ **Created comprehensive page spec** integrating with CF-Platform  
✅ **Designed audit logging system** with D1 integration
✅ **Confirmed LOGS module capabilities** for audit trails

**The specification is complete and ready for implementation on your locked foundation modules!**

**Ready to start building the Pages module?** 🚀
