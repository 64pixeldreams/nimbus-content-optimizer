# 🚀 CURSOR GUIDE - NimbusAI Project

> **Quick reference for Cursor to understand and work with NimbusAI**

## 📋 **PROJECT OVERVIEW**

**NimbusAI** is a revolutionary AI-powered content extraction and optimization platform that transforms how businesses optimize their online content. It's built with **surgical precision** and **AI pipeline orchestration** in mind.

### 🏗️ **Architecture**
```
NimbusAI/
├── gulp/                    # 🎯 MAIN PROCESSING ENGINE
│   ├── gulpfile.js         # Main task runner
│   ├── tasks/              # Processing modules
│   ├── worker/             # AI optimization workers
│   └── docs/               # Comprehensive documentation
├── cf-platform/            # ☁️ CLOUDFLARE BACKEND
│   ├── src/modules/        # Core modules (datamodel, auth, etc.)
│   ├── tests/              # Test suite
│   └── wrangler.toml       # Cloudflare deployment config
├── docs/                   # 📚 PROJECT DOCUMENTATION
├── specs/                  # 📋 TECHNICAL SPECIFICATIONS
└── dist/                   # 📁 EXTRACTED CONTENT
```

## 🎯 **CORE COMPONENTS**

### **1. Gulp Processing Engine** (`gulp/`)
- **Purpose**: Extract content from HTML files using config-driven selectors
- **Main file**: `gulpfile.js`
- **Key tasks**: `scan`, `extract`, `optimize`, `preview`
- **Configuration**: `profile.yaml`, `_directive.yaml`, `_tone-profiles.yaml`

### **2. Cloudflare Platform** (`cf-platform/`)
- **Purpose**: Backend API and data storage
- **Modules**: datamodel, datastore, auth, logs, messaging, project management
- **Database**: D1 (SQL) + KV (key-value) hybrid storage
- **Deployment**: `wrangler deploy`

### **3. AI Optimization** (`gulp/worker/`)
- **Purpose**: AI-powered content optimization
- **Workers**: `worker-openai.js`, `worker-analyzer-openai.js`
- **Integration**: OpenAI API for content analysis and optimization

## 🚀 **QUICK START COMMANDS**

### **Content Processing**
```bash
# Navigate to processing engine
cd gulp

# Scan content
node gulpfile.js scan --folder ../dist/local --limit 5

# Extract content with dimensions
node gulpfile.js extract

# Run AI optimization
node gulpfile.js optimize

# Preview results
node gulpfile.js preview
```

### **Backend Testing**
```bash
# Navigate to CF-Platform
cd cf-platform

# Test datastore
node tests/test-datastore.js

# Test logs
node tests/test-logs.js

# Deploy to Cloudflare
wrangler deploy
```

### **Project Verification**
```bash
# Run complete verification test
node test-project-creation.js
```

## 📁 **KEY FILES TO KNOW**

### **Configuration Files**
- `gulp/profile.yaml` - Business profile and settings
- `gulp/_directive.yaml` - Page optimization rules
- `gulp/_tone-profiles.yaml` - AI tone definitions
- `cf-platform/wrangler.toml` - Cloudflare deployment config

### **Main Processing Files**
- `gulp/gulpfile.js` - Main task runner
- `gulp/tasks/scan/index.js` - Content scanning
- `gulp/tasks/extract/index.js` - Content extraction
- `gulp/worker/worker-openai.js` - AI optimization

### **Backend Modules**
- `cf-platform/src/modules/datamodel/` - ORM framework
- `cf-platform/src/modules/datastore/` - Storage adapters
- `cf-platform/src/modules/auth/` - Authentication
- `cf-platform/src/modules/project/` - Project management

## 🧪 **TESTING**

### **Unit Tests**
```bash
cd cf-platform
node tests/test-datastore.js    # Storage framework
node tests/test-logs.js         # Logging system
```

### **Integration Tests**
```bash
cd cf-platform
powershell tests/api/test-health.ps1
powershell tests/e2e/run-all-tests.ps1
```

### **Project Verification**
```bash
node test-project-creation.js   # Complete system test
```

## 📚 **DOCUMENTATION**

### **Main Documentation**
- `README.md` - Project overview
- `CURSOR_GET_STARTED.md` - Detailed setup guide
- `docs/ARCHITECTURE.md` - System architecture
- `docs/CONFIG-GUIDE.md` - Configuration guide

### **Technical Specs**
- `specs/08-pages.md` - Pages module specification
- `specs/00-overview.md` - System overview
- `cf-platform/README.md` - Backend documentation

## 🔧 **DEVELOPMENT WORKFLOW**

### **1. Content Processing**
1. Add HTML files to `dist/` directory
2. Run `gulp scan` to discover content
3. Run `gulp extract` to extract with dimensions
4. Run `gulp optimize` for AI optimization
5. Run `gulp preview` to see results

### **2. Backend Development**
1. Modify modules in `cf-platform/src/modules/`
2. Run tests to verify changes
3. Deploy with `wrangler deploy`
4. Test with API calls

### **3. Configuration Changes**
1. Edit `gulp/profile.yaml` for business settings
2. Edit `gulp/_directive.yaml` for optimization rules
3. Edit `gulp/_tone-profiles.yaml` for AI tones
4. Test with `gulp scan` and `gulp extract`

## 🎯 **CURRENT STATUS**

### ✅ **Working Components**
- Content extraction and scanning
- AI optimization workflows
- Cloudflare backend with all modules
- Test infrastructure
- Documentation system

### 🔄 **Next Steps**
- Pages module implementation
- CF workflows for optimization
- Frontend dashboard
- Production deployment

## 🚨 **IMPORTANT NOTES**

1. **Always work in `gulp/` directory** for content processing
2. **Test changes** with `node test-project-creation.js`
3. **Deploy backend** with `wrangler deploy` from `cf-platform/`
4. **Check documentation** in `docs/` and `gulp/docs/`
5. **Use git branches** for new features

---

**This project is production-ready and well-documented. All major components are working and tested!** 🎉

