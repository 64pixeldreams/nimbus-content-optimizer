# 🏗️ NimbusAI Architecture

> **System design, module structure, and data flow documentation**

## 🎯 **Architecture Overview**

NimbusAI is built on a **modular, config-driven architecture** that separates concerns and enables surgical precision in content extraction. The system is designed for **scalability**, **maintainability**, and **AI pipeline integration**.

```
┌─────────────────────────────────────────────────────────────┐
│                    NIMBUS AI SYSTEM                        │
├─────────────────────────────────────────────────────────────┤
│  📁 CONFIG LAYER                                           │
│  ├── Hierarchical Configs (Parent/Child)                  │
│  ├── Extraction Rules (Surgical Selectors)                │
│  └── Metadata Rules (Head Intelligence)                   │
├─────────────────────────────────────────────────────────────┤
│  🔍 SCAN LAYER (File Discovery & Config Management)        │
│  ├── File Discovery                                        │
│  ├── Config Resolution & Inheritance                       │
│  └── Validation & Error Handling                           │
├─────────────────────────────────────────────────────────────┤
│  ⚙️ EXTRACT LAYER (Content Extraction Engine)              │
│  ├── DOM Isolation (Above-fold vs Rest)                   │
│  ├── Block Extraction (Surgical Precision)                │
│  ├── Metadata Extraction (Head Intelligence)              │
│  └── Content Classification (Smart Categorization)        │
├─────────────────────────────────────────────────────────────┤
│  📊 OUTPUT LAYER (Structured Data)                        │
│  ├── Content Maps (JSON)                                  │
│  ├── Metadata Objects                                     │
│  └── AI Pipeline Ready Data                               │
└─────────────────────────────────────────────────────────────┘
```

## 📁 **Module Structure**

### **🔍 Scan Layer (`gulp/tasks/scan/`)**

**Purpose:** File discovery, configuration management, and orchestration

```
scan/
├── index.js                    # Main orchestrator
├── modules/
│   ├── config-manager.js       # Config resolution & inheritance
│   ├── file-discovery.js       # HTML file discovery
│   └── utils.js               # Shared utilities
└── templates/
    └── extraction-config.json  # Config template
```

**Key Responsibilities:**
- **File Discovery** - Find HTML files in target directories
- **Config Resolution** - Handle hierarchical inheritance
- **Validation** - Ensure config integrity
- **Orchestration** - Coordinate with extract layer

### **⚙️ Extract Layer (`gulp/tasks/extract/`)**

**Purpose:** Content extraction, DOM manipulation, and data structuring

```
extract/
├── index.js                    # Extraction orchestrator
└── modules/
    ├── dom-isolator.js         # DOM separation & isolation
    ├── block-extractor.js      # Surgical element extraction
    ├── content-classifier.js   # Content categorization
    ├── content-finder.js       # Container detection
    └── metadata-extractor.js   # Head section intelligence
```

**Key Responsibilities:**
- **DOM Isolation** - Separate above-fold from rest-of-page
- **Block Extraction** - Extract specific elements with surgical precision
- **Metadata Extraction** - Parse head section for SEO/social data
- **Content Classification** - Categorize content types and priorities

## 🔄 **Data Flow**

### **1. Configuration Resolution**
```
User Config → Config Manager → Validated Config → Extract Layer
     ↓              ↓              ↓              ↓
Local Config → Inheritance → Validation → Extraction Rules
```

### **2. Content Extraction Pipeline**
```
HTML File → DOM Loading → Container Detection → DOM Isolation
     ↓           ↓              ↓              ↓
Cheerio → Main Content → Above-fold Split → Surgical Extraction
     ↓           ↓              ↓              ↓
Metadata → Block Classification → JSON Output → AI Pipeline
```

### **3. Output Structure**
```json
{
  "head": {
    "title": "...",
    "metaDescription": "...",
    "canonical": "...",
    "favicon": "..."
  },
  "above_fold_blocks": [...],
  "rest_of_page_blocks": [...],
  "selector_map": {...},
  "extraction_config": {...}
}
```

## 🎛️ **Configuration Architecture**

### **Hierarchical Inheritance System**

```
Root Config (dist/extraction-config.json)
├── inherit: false
├── selectors: { main: "main", above_fold: ".container" }
├── extraction_rules: { above_fold: [...], rest_of_page: [...] }
└── metadata_rules: { title: "title", favicon: "..." }

Child Config (dist/local/extraction-config.json)
├── inherit: true  ← Inherits from parent
├── selectors: {}  ← Empty = use parent
├── extraction_rules: { above_fold: ["h1", "p"] }  ← Override specific rules
└── metadata_rules: {}  ← Empty = use parent
```

### **Config Resolution Algorithm**
1. **Load Local Config** - Read from current directory
2. **Check Inheritance** - If `inherit: true`, load parent config
3. **Merge Configs** - Parent config + local overrides
4. **Validate** - Ensure all required fields exist
5. **Return Final Config** - Pass to extraction layer

## ⚙️ **Core Modules Deep Dive**

### **🔍 Config Manager (`config-manager.js`)**

**Responsibilities:**
- **Config Discovery** - Find config files in directory tree
- **Inheritance Resolution** - Handle parent/child relationships
- **Validation** - Ensure config integrity
- **Error Handling** - User-friendly error messages

**Key Functions:**
```javascript
async resolveConfig(folderPath, visited = new Set())
async createConfig(folderPath, templatePath)
function validateConfig(config)
```

### **🎯 DOM Isolator (`dom-isolator.js`)**

**Responsibilities:**
- **Container Detection** - Find main content area
- **Above-fold Isolation** - Extract first container instance
- **DOM Separation** - Create isolated Cheerio instances
- **Content Removal** - Remove above-fold from rest-of-page

**Key Functions:**
```javascript
function isolateMainContent($, mainSelector)
function isolateAboveFold($, aboveFoldSelector)
function removeAboveFoldFromRest(restOfPage, aboveFold)
```

### **⚡ Block Extractor (`block-extractor.js`)**

**Responsibilities:**
- **Surgical Extraction** - Extract specific elements by selector
- **Content Enhancement** - Add metadata and classification
- **Inline Element Processing** - Handle nested elements
- **Block Classification** - Categorize content types

**Key Functions:**
```javascript
function extractBlocks($, selectors, options = {})
function enhanceBlock(block, $, options)
function processInlineElements(block, $)
```

### **📋 Metadata Extractor (`metadata-extractor.js`)**

**Responsibilities:**
- **Head Section Parsing** - Extract from `<head>` section
- **Config-Driven Rules** - Use metadata_rules from config
- **Special Handling** - Title (text), favicon (href), meta tags (content)
- **Backward Compatibility** - Map to legacy field names

**Key Functions:**
```javascript
function extractHeadMetadata($, metadataRules = {})
```

## 🚀 **AI Pipeline Integration**

### **Data Structure for AI**
```json
{
  "content_zones": {
    "above_fold": {
      "blocks": [...],
      "prompt_context": "hero_section",
      "optimization_priority": "high"
    },
    "rest_of_page": {
      "blocks": [...],
      "prompt_context": "content_section",
      "optimization_priority": "medium"
    }
  },
  "metadata": {
    "seo_data": {...},
    "social_data": {...},
    "technical_data": {...}
  }
}
```

### **Pipeline Orchestration Ready**
- **Zone-Specific Prompts** - Different AI prompts for different content areas
- **Metadata Injection** - Pass SEO/social data to AI
- **Content Classification** - Route content to appropriate AI models
- **Result Integration** - Merge AI results back into content structure

## 🔧 **Technical Implementation**

### **Dependencies**
- **Cheerio** - Server-side jQuery for DOM manipulation
- **Node.js** - Runtime environment
- **Gulp** - Task orchestration

### **Performance Considerations**
- **DOM Isolation** - Reduces processing overhead
- **Surgical Extraction** - Only extract what's needed
- **Config Caching** - Avoid repeated config resolution
- **Memory Management** - Clean up large DOM objects

### **Error Handling Strategy**
- **Config Validation** - Catch malformed JSON early
- **Graceful Degradation** - Fall back to defaults when possible
- **User-Friendly Messages** - Clear error descriptions
- **Logging** - Comprehensive operation logging

## 🎯 **Design Principles**

### **1. Config-Driven Everything**
- **No Hardcoded Assumptions** - Everything configurable
- **Surgical Precision** - Extract exactly what's needed
- **Flexible Rules** - Support any CSS selector pattern

### **2. Modular Architecture**
- **Separation of Concerns** - Each module has single responsibility
- **Loose Coupling** - Modules communicate through well-defined interfaces
- **High Cohesion** - Related functionality grouped together

### **3. AI Pipeline Ready**
- **Structured Output** - Clean data for AI processing
- **Zone Awareness** - Different content areas for different AI prompts
- **Metadata Intelligence** - Rich context for AI decisions

### **4. Scalability**
- **Hierarchical Configs** - Scale across multiple sites
- **Performance Optimized** - Handle large file sets
- **Extensible Design** - Easy to add new extraction types

## 🚀 **Future Architecture**

### **Planned Enhancements**
- **Plugin System** - Custom extraction modules
- **Real-time Processing** - Live content analysis
- **AI Model Integration** - Direct AI pipeline connection
- **Performance Analytics** - Track extraction efficiency

### **Scalability Roadmap**
- **Distributed Processing** - Handle multiple sites simultaneously
- **Caching Layer** - Redis-based config and result caching
- **API Interface** - RESTful API for external integration
- **Cloud Deployment** - Serverless function deployment

---

**This architecture represents a breakthrough in config-driven content extraction, designed from the ground up for AI pipeline orchestration and scalable content optimization workflows.**

