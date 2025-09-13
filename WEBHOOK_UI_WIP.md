# 🔗 Webhook System - UI & Management Roadmap

> **Status: CORE SYSTEM COMPLETE** ✅  
> **Next: UI & Management Features** 📋  
> **Estimated: 2-3 days when ready** ⏱️

## 🎯 **Current Status: Production Ready**

### ✅ **What's Working (COMPLETE)**
- **Automatic webhook firing** on any model update (page.updated, project.created, etc.)
- **Level-based audit logging** (`api.wh` segregated from user activity)
- **Response status tracking** (200 OK, 500 errors, timeouts)
- **Rich metadata logging** (response time, payload size, error details)
- **Retry queue system** (exponential backoff for failed webhooks)
- **Circuit breaker** (auto-disable after 10 failures)
- **Framework integration** (zero disruption, works with any model)

### 🔧 **What's Pending (UI & Polish)**
- Webhook settings page UI
- Webhook configuration management
- Webhook log visualization
- Retry queue processing worker

---

## 🏗️ **Architecture Overview**

### **Core Components**
```javascript
// 1. WebhookConfig Model - Stores user webhook configurations
{
  webhook_id: "wh_123",
  user_id: "user:abc",
  name: "Page Completion Hook",
  target_url: "https://client.com/webhook",
  event_types: ["page.completed", "page.updated"],
  status: "active", // active, disabled, failed
  failure_count: 0,
  timeout_ms: 10000,
  max_retries: 3
}

// 2. WebhookTrigger - Fires webhooks automatically
// Integrated into DataModel base class - fires on any model save
// Uses level-based logging for clean separation

// 3. WebhookManager - Handles HTTP delivery with retries
// Returns complete metadata: status, timing, response size

// 4. AuditLogger Integration - Webhook logs in existing system
// Level: 'api.wh' - Segregated from normal user activity
```

### **Event Flow**
```javascript
// Automatic webhook firing on model updates
page.status = 'completed';
await page.save(); 
// → Triggers webhook_delivered log with metadata:
{
  response_status: 200,
  response_time_ms: 245,
  target_url: "https://client.com/webhook",
  payload_size: 458,
  webhook_name: "Page Completion Hook"
}
```

---

## 📋 **UI Implementation Plan**

### **1. Webhook Settings Page** (30 mins)

**File**: `www/app/settings/webhooks.html`

**Features:**
- List user's webhook configurations
- Create/edit/delete webhooks
- Show webhook activity logs (filtered by `level: 'api.wh'`)
- Test webhook delivery

**Code Pattern** (copy from `project.html`):
```html
<!-- Breadcrumb -->
<nav aria-label="breadcrumb">
  <ol class="breadcrumb">
    <li class="breadcrumb-item"><a href="/app/dashboard.html">Dashboard</a></li>
    <li class="breadcrumb-item"><a href="/app/settings.html">Settings</a></li>
    <li class="breadcrumb-item active">Webhooks</li>
  </ol>
</nav>

<!-- Webhook Configs Table -->
<div class="card">
  <div class="card-header">
    <h5 class="card-title">Webhook Configurations</h5>
    <button class="btn btn-primary" onclick="createWebhook()">Add Webhook</button>
  </div>
  <div class="card-body">
    <div id="webhooks-table"></div>
  </div>
</div>

<!-- Webhook Activity Logs -->
<div class="card mt-4">
  <div class="card-header">
    <h5 class="card-title">Webhook Activity</h5>
  </div>
  <div class="card-body">
    <div id="webhook-logs-table"></div>
  </div>
</div>
```

**JavaScript Pattern**:
```javascript
// Load webhook configs
async function loadWebhooks() {
  const result = await cf.apiCall('webhook.config.list', {});
  renderWebhookTable(result.data.webhooks);
}

// Load webhook logs (segregated)
async function loadWebhookLogs() {
  const result = await cf.apiCall('page.logs', {
    type: 'user',
    level: 'api.wh', // Webhook logs only
    limit: 50
  });
  renderWebhookLogsTable(result.data.logs);
}

// Create new webhook
async function createWebhook() {
  const result = await cf.apiCall('webhook.config.create', {
    name: 'My Webhook',
    target_url: 'https://client.com/webhook',
    event_types: ['page.completed'],
    status: 'active'
  });
}
```

### **2. Webhook Config Management API** (20 mins)

**Files Needed**:
- `cf-platform/src/modules/webhooks/functions/list-config.js`
- `cf-platform/src/modules/webhooks/functions/update-config.js` 
- `cf-platform/src/modules/webhooks/functions/delete-config.js`

**Pattern** (copy from notification functions):
```javascript
// webhook.config.list
export async function webhookConfigList(requestContext) {
  const { env, logger, auth } = requestContext;
  
  const query = `
    SELECT * FROM webhook_configs 
    WHERE user_id = ? 
    ORDER BY created_at DESC
  `;
  
  const result = await datastore.D1.execute(query, [auth.user_id]);
  return { success: true, webhooks: result.results };
}

// webhook.config.update
// webhook.config.delete
// (Follow exact same pattern as notification CRUD)
```

### **3. Enhanced Webhook Logs Display** (45 mins)

**Rich Metadata Display**:
```javascript
// Webhook log with complete metadata
function renderWebhookLog(log) {
  const metadata = log.details; // From KV via hybrid query
  
  return `
    <tr class="${log.action === 'webhook_delivered' ? 'table-success' : 'table-danger'}">
      <td>${formatTime(log.timestamp)}</td>
      <td><span class="badge bg-${log.action === 'webhook_delivered' ? 'success' : 'danger'}">${log.action}</span></td>
      <td>${metadata.webhook_name}</td>
      <td><code>${metadata.response_status || 'N/A'}</code></td>
      <td>${metadata.response_time_ms || 0}ms</td>
      <td>
        <button onclick="showWebhookDetails('${log.log_id}')" class="btn btn-sm btn-outline-primary">
          Details
        </button>
      </td>
    </tr>
  `;
}

// Expandable details modal
function showWebhookDetails(logId) {
  // Show complete metadata in modal:
  // - Target URL
  // - Event type
  // - Payload size
  // - Response data
  // - Error message (if failed)
  // - Retry status
}
```

### **4. Webhook Testing Interface** (15 mins)

**Test Webhook Button**:
```javascript
async function testWebhook(webhookId) {
  const result = await cf.apiCall('webhook.test', {
    webhook_id: webhookId,
    test_data: {
      message: 'Test webhook from settings page',
      timestamp: new Date().toISOString()
    }
  });
  
  // Show immediate feedback
  showToast(result.success ? 'Webhook delivered!' : 'Webhook failed!');
  
  // Refresh logs to show test result
  setTimeout(loadWebhookLogs, 1000);
}
```

---

## 🔧 **Technical Implementation**

### **Backend APIs Needed** (Already 80% built):
```javascript
// ✅ COMPLETE
webhook.test              // Working
webhook.config.create     // Working

// 📋 TODO (20 mins each)
webhook.config.list       // Copy notification.list pattern
webhook.config.update     // Copy notification pattern  
webhook.config.delete     // Copy notification pattern
```

### **Frontend Pages** (Copy existing patterns):
```javascript
// ✅ Pattern exists in:
www/app/project.html      // Table display
www/app/activity.html     // Log display  
www/app/notifications.html // Management UI

// 📋 TODO: Copy & modify for webhooks
www/app/settings/webhooks.html // 30 mins
```

### **Webhook Log Metadata** (Current issue):
```javascript
// CURRENT: Basic logs work, metadata empty
// SOLUTION: Hybrid KV+D1 query (15 mins to implement)

async function getWebhookLogsWithMetadata(userId, limit = 50) {
  // 1. Get log list from D1 (fast)
  const logs = await datastore.D1.execute(
    "SELECT * FROM audit_logs WHERE user_id = ? AND level = 'api.wh' ORDER BY created_at DESC LIMIT ?",
    [userId, limit]
  );
  
  // 2. Enrich with metadata from KV (complete data)
  for (const log of logs.results) {
    const fullData = await datastore.get('LOG', log.log_id);
    log.details = fullData.details; // Rich metadata
  }
  
  return logs.results;
}
```

---

## 🎯 **Value Proposition**

### **For NimbusHQ:**
- **Webhook monitoring** - See all external integrations
- **API management** - Control access and usage
- **Activity tracking** - Complete audit trail

### **For AIVERIE:**
- **Report webhooks** - `report.completed` → client systems
- **AI operation logs** - `api.openai` level segregation
- **Email notifications** - Professional templates ready

### **For Future Products:**
- **Drop-in webhook system** - Any model, any event
- **Specialized log views** - `api.payment`, `api.analytics`, etc.
- **Professional monitoring** - Enterprise-grade webhook management

---

## 🚀 **When We Return to This:**

**30-minute sprint:**
1. Copy `project.html` → `settings/webhooks.html`
2. Copy notification CRUD → webhook config CRUD
3. Add webhook log table with metadata display
4. Test webhook creation/management

**Result: Complete webhook management UI** 

**This documentation saves 2+ hours of planning when we return!**

---

**Ready to jump to CLI integration?** 🚀
