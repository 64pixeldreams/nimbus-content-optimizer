# 🚀 CLI → CF Integration Plan

> **Goal: Complete project sync between Gulp CLI and CF Worker**  
> **Status: Ready to implement** ✅  
> **Architecture: Project-first approach with live URL generation**

## 🔍 **Current State Analysis**

### ✅ **Gulp Extraction System (COMPLETE)**
- **Location**: `gulp/.nimbus/maps/*.json`
- **Sample files**: 50+ extracted pages ready
- **Data structure**: Complete page extraction with metadata
- **Size**: ~4800 lines per page (rich content)

### ✅ **CF Backend (READY)**
- **API endpoint**: `page.create` CloudFunction exists
- **Data model**: PageModel ready for content storage
- **Authentication**: Session-based auth working
- **Storage**: KV + D1 hybrid ready

---

## 📦 **Extracted Data Structure**

### **Sample: `hublot-watch-repair.json`**
```json
{
  "path": "..\\dist\\brands\\hublot-watch-repair.html",
  "route": "/brands/hublot-watch-repair",
  "engine": "html",
  "main_selector": "main",
  "head": {
    "title": "Hublot Watch Repair from £149 | Big Bang, Classic Fusion...",
    "metaDescription": "Expert Hublot watch repairs from £149...",
    "canonical": "https://www.repairsbypost.com/brand/hublot-watch-repair",
    "ogTitle": "...",
    "ogDescription": "...",
    "favicon": "/favicon.ico"
  },
  "blocks": [
    {
      "i": 0,
      "id": "1", 
      "type": "h1",
      "tag_type": "H1",
      "text": "Hublot watch repair and servicing",
      "selector": "isolated-container h1.splash-title:nth-of-type(1)",
      "nimbus_priority": "normal",
      "extraction_method": "enhanced_container",
      "enhanced": true
    },
    // ... 200+ content blocks
  ],
  "above_fold_blocks": [...], // Hero section content
  "rest_of_page_blocks": [...], // Main content
  "content_dimensions": {
    "location": "ballynahinch",
    "brand": "hublot", 
    "service": "watch_repair",
    "product": "watches"
  },
  "extraction_config": { /* Config used */ },
  "extraction_stats": {
    "total_blocks": 200,
    "above_fold_count": 15,
    "rest_of_page_count": 185
  }
}
```

---

## 🎯 **Integration Architecture**

### **Project-First Workflow:**
```
1. Gulp creates project in CF → CF returns project JSON
2. Gulp stores project config locally → .nimbus/project.json
3. Gulp uploads pages to CF project → Uses stored project config
4. CF generates live URLs from project domain → Automatic URL handling
```

---

## 🏗️ **Complete Implementation Plan**

### **Step 1: Project Sync** (5 mins)
```bash
# Create project in CF and sync locally
gulp sync-project --name="Watch Repair Site" --domain="www.repairsbypost.com"
```

**Implementation:**
```javascript
// gulp/tasks/sync-project.js
async function syncProject(name, domain) {
  // 1. Create project in CF
  const result = await cf.apiCall('project.create', {
    name: name,
    domain: domain,
    base_url: `https://${domain}`,
    status: 'active'
  });
  
  // 2. Store project config locally
  const projectConfig = {
    project_id: result.data.project_id,
    name: name,
    domain: domain,
    base_url: result.data.base_url,
    created_at: result.data.created_at,
    cf_synced: true
  };
  
  // 3. Save to local config
  fs.writeFileSync('.nimbus/project.json', JSON.stringify(projectConfig, null, 2));
  console.log(`✅ Project synced: ${result.data.project_id}`);
}
```

### **Step 2: Page Upload** (5 mins)
```bash
# Upload pages to synced CF project
gulp send-pages --batch  # Uses .nimbus/project.json config
```
**Implementation:**
```javascript
// gulp/tasks/send-pages.js
async function sendPagesToCF(options = {}) {
  // 1. Load local project config
  const projectConfig = JSON.parse(fs.readFileSync('.nimbus/project.json'));
  
  if (!projectConfig.cf_synced) {
    throw new Error('Project not synced with CF. Run: gulp sync-project first');
  }
  
  // 2. Get list of extracted files
  const extractedFiles = fs.readdirSync('.nimbus/maps/').filter(f => f.endsWith('.json'));
  
  console.log(`📦 Found ${extractedFiles.length} extracted pages`);
  console.log(`🎯 Target project: ${projectConfig.name} (${projectConfig.project_id})`);
  
  // 3. Upload each page
  for (const file of extractedFiles) {
    const extracted = JSON.parse(fs.readFileSync(`.nimbus/maps/${file}`));
    
    const pageData = {
      project_id: projectConfig.project_id,
      url: extracted.route, // /brands/hublot-watch-repair
      local_path: extracted.path, // ../dist/brands/hublot-watch-repair.html
      title: extracted.head.title,
      status: 'extracted',
      
      // CF will auto-generate:
      // - page_id: deterministic from domain + URL
      // - live_url: project.base_url + page.url
      
      content: extracted, // Complete extraction data
      metadata: {
        source: 'gulp_extraction',
        extracted_at: new Date().toISOString(),
        file_name: file
      }
    };
    
    // Send to CF
    const result = await cf.apiCall('page.create', pageData);
    console.log(`✅ ${file} → ${result.data.page_id}`);
    console.log(`🔗 Live URL: ${result.data.live_url}`);
  }
}
```

---

## 🏗️ **Project-First Architecture**

### **1. Local Project Configuration:**
```json
// .nimbus/project.json (created by gulp sync-project)
{
  "project_id": "project:mfe7m15h9ac9j9",
  "name": "Watch Repair Site",
  "domain": "www.repairsbypost.com", 
  "base_url": "https://www.repairsbypost.com",
  "created_at": "2025-09-12T16:00:00Z",
  "cf_synced": true,
  "session_token": "abc123...", // For API calls
  "stats": {
    "total_pages": 0,
    "uploaded_pages": 0,
    "last_sync": null
  }
}
```

### **2. CF Project Model** (Already exists):
```javascript
// cf-platform/src/models/project.js
{
  project_id: "project:mfe7m15h9ac9j9",
  user_id: "user:mfcyoh72bo3qkf",
  name: "Watch Repair Site",
  domain: "www.repairsbypost.com",
  base_url: "https://www.repairsbypost.com", // ← For live URL generation
  status: "active",
  stats: {
    total_pages: 0,
    processing_pages: 0,
    completed_pages: 0
  }
}
```

### **3. Page ID Generation** (Deterministic):
```javascript
// Both Gulp and CF can generate the same ID
function generatePageId(domain, url) {
  const cleanDomain = domain.replace(/[^a-z0-9]/gi, '');
  const cleanUrl = url.replace(/[^a-z0-9\/]/gi, '_');
  const hash = sha256(domain + url).substring(0, 8);
  return `page:${cleanDomain}_${cleanUrl}_${hash}`;
}

// Example:
// domain: "www.repairsbypost.com"
// url: "/brands/hublot-watch-repair" 
// → page_id: "page:repairsbypost_brands_hublot_repair_a1b2c3d4"
```

### **4. Live URL Generation** (Automatic):
```javascript
// CF PageModel beforeCreate hook
beforeCreate: async function(data, context) {
  // 1. Generate deterministic page ID
  if (!data.page_id && data.project_id && data.url) {
    const project = await getProject(data.project_id);
    data.page_id = generatePageId(project.domain, data.url);
  }
  
  // 2. Generate live URL from project
  if (!data.live_url && data.project_id && data.url) {
    const project = await getProject(data.project_id);
    data.live_url = `${project.base_url}${data.url}`;
  }
  
  return data;
}

// Result:
// live_url: "https://www.repairsbypost.com/brands/hublot-watch-repair"
```

---

## 🚀 **Complete Workflow**

### **Initial Setup** (One-time, 5 mins):
```bash
# 1. Sync project with CF
cd gulp
gulp sync-project --name="Watch Repair Site" --domain="www.repairsbypost.com"
# → Creates .nimbus/project.json with CF project details

# 2. Upload all extracted pages  
gulp send-pages --batch
# → Uploads 50+ pages to CF project
# → Each page gets live URL automatically
```

### **Daily Workflow** (Ongoing):
```bash
# 1. Extract new content
gulp extract --file=../dist/brands/new-watch-repair.html

# 2. Send to CF (uses existing project config)
gulp send-pages --file=new-watch-repair.json
# → Auto-generates: page:repairsbypost_brands_new_watch_repair_xyz123
# → Auto-generates: https://www.repairsbypost.com/brands/new-watch-repair

# 3. Check status in CF dashboard
# → Page appears in project with live URL ready
```

### **Update Workflow** (Sync-friendly):
```bash
# Re-extract and update existing page
gulp extract --file=../dist/brands/hublot-watch-repair.html
gulp send-pages --file=hublot-watch-repair.json --update
# → Same page_id, updates content, preserves live_url
```

---

## 🏗️ **CF Worker Enhancements**

### **PageModel Updates Needed** (Already compatible!):
```javascript
// Current PageModel fields (ALREADY SUPPORT THIS):
{
  page_id: 'string',
  project_id: 'string', 
  url: 'string',
  title: 'string',
  status: 'string', // 'extracted', 'processing', 'completed'
  
  // Large content fields (KV only) - PERFECT FOR EXTRACTION DATA
  content: 'object',     // ← Store complete extraction JSON here
  metadata: 'object',    // ← Store extraction metadata
  optimization_data: 'object'  // ← Ready for AI results
}
```

### **No Changes Needed!** ✅
The current PageModel is **perfectly designed** for this integration.

---

## 🚀 **Implementation Workflow**

### **Phase 1: Basic Integration** (10 mins)
1. **Create gulp task** - `tasks/send-to-cf.js` (5 mins)
2. **Test with one page** - Send `hublot-watch-repair.json` (2 mins)
3. **Verify in CF** - Check page appears in project (3 mins)

### **Phase 2: Batch Upload** (15 mins)
```javascript
// Send all extracted pages
gulp send-to-cf --batch --project=watch-repair-demo
// Uploads all 50+ pages from .nimbus/maps/
```

### **Phase 3: Enhanced Page View** (30 mins)
```javascript
// www/app/page.html enhancements
// Show extracted content structure:
// - Above-fold blocks (15 items)
// - Rest-of-page blocks (185 items)  
// - Content dimensions (location, brand, service)
// - Extraction stats
```

---

## 🎯 **Expected Results**

### **After Step 1 (Project Sync):**
- ✅ **CF project created** - `project:mfe7m15h9ac9j9`
- ✅ **Local config stored** - `.nimbus/project.json`
- ✅ **Domain configured** - `www.repairsbypost.com`
- ✅ **Base URL set** - `https://www.repairsbypost.com`

### **After Step 2 (Page Upload):**
- ✅ **50+ pages in CF** - All extracted content stored with deterministic IDs
- ✅ **Live URLs generated** - `https://www.repairsbypost.com/brands/hublot-watch-repair`
- ✅ **Rich page data** - Complete blocks, metadata, dimensions
- ✅ **Webhook integration** - `page.created` webhooks firing automatically
- ✅ **Project stats updated** - Total pages, processing status

### **Complete Data Flow:**
```
Local HTML → Gulp Extract → JSON → CF Project → Page Storage → Live URLs → Ready for AI
```

### **Page Structure in CF:**
```javascript
// Each page stored with complete data
{
  page_id: "page:repairsbypost_brands_hublot_repair_a1b2c3d4",
  project_id: "project:mfe7m15h9ac9j9", 
  url: "/brands/hublot-watch-repair",
  live_url: "https://www.repairsbypost.com/brands/hublot-watch-repair",
  local_path: "../dist/brands/hublot-watch-repair.html",
  title: "Hublot Watch Repair from £149 | Big Bang, Classic Fusion...",
  status: "extracted",
  
  content: {
    head: { title, metaDescription, canonical, ogTitle, ... },
    blocks: [ /* 200+ content blocks */ ],
    above_fold_blocks: [ /* 15 hero blocks */ ],
    rest_of_page_blocks: [ /* 185 content blocks */ ],
    content_dimensions: { location: "ballynahinch", brand: "hublot", service: "watch_repair" },
    extraction_stats: { total_blocks: 200, above_fold_count: 15 }
  },
  
  metadata: {
    source: "gulp_extraction",
    extracted_at: "2025-09-12T16:00:00Z",
    file_name: "hublot-watch-repair.json"
  }
}
```

### **AI Pipeline Ready:**
```javascript
// Content structured for AI optimization
const page = await getPage('page:repairsbypost_brands_hublot_repair_a1b2c3d4');

// Ready for AI workflows:
// 1. Analyze above-fold content → Hero optimization
// 2. Analyze rest-of-page → Content enhancement
// 3. Use content dimensions → Context-aware prompts
// 4. Generate optimizations → Store in optimization_data field
```

---

## 🚀 **Value Proposition**

### **Immediate Benefits:**
- **✅ Project-domain sync** - CF knows live URLs for every page
- **✅ Deterministic IDs** - Predictable page IDs, no storage needed
- **✅ 50+ test pages** - Rich content ready for AI processing
- **✅ Live URL generation** - Automatic production URL mapping
- **✅ Webhook integration** - `page.created` events fire automatically
- **✅ Update-friendly** - Re-upload updates existing pages cleanly

### **AI Roadmap Unlocked:**
- **Content analysis** - 200+ blocks per page ready for AI
- **Context-aware prompts** - Content dimensions guide AI optimization
- **Above-fold optimization** - Hero section enhancement
- **Bulk AI processing** - Process all 50+ pages with AI workflows
- **Live URL tracking** - AI results can reference production URLs

### **Multi-Product Foundation:**
- **NimbusHQ** - Page processing and optimization
- **AIVERIE** - Report generation with live URLs  
- **Future Products** - Content extraction → CF → AI pattern proven

---

## 📋 **Implementation Checklist**

### **CF Backend** (Already Ready ✅):
- [x] ProjectModel with domain/base_url fields
- [x] PageModel with content/metadata fields  
- [x] page.create CloudFunction
- [x] Deterministic ID generation
- [x] Live URL auto-generation
- [x] Webhook integration

### **Gulp Frontend** (TODO - 10 mins):
- [ ] sync-project task (5 mins)
- [ ] send-pages task (5 mins)
- [ ] .nimbus/project.json config handling
- [ ] Batch upload functionality

### **Testing** (TODO - 5 mins):
- [ ] Create test project in CF
- [ ] Upload single page (hublot-watch-repair.json)
- [ ] Verify live URL generation
- [ ] Confirm webhook firing

---

## 🎯 **Success Criteria**

**After 15 minutes:**
- ✅ **Project synced** - CF project linked to local gulp
- ✅ **50+ pages uploaded** - All extraction data in CF
- ✅ **Live URLs working** - https://repairsbypost.com/brands/hublot-watch-repair
- ✅ **Webhooks firing** - page.created events for each upload
- ✅ **AI pipeline ready** - Structured content ready for optimization

**This unlocks the entire AI processing roadmap with production-ready URL handling!** 🚀

---

**Ready to implement when you are!** The architecture is solid and will scale across all future products.
