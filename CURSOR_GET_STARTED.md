# 🚀 CURSOR GET STARTED GUIDE - NimbusAI Content Optimization System

## 📋 PROJECT OVERVIEW

**NimbusAI** is a revolutionary config-driven content extraction and AI optimization system. It's designed to surgically extract content from websites and optimize it using AI workflows.

### 🏗️ Architecture
```
NimbusAI (Main Project)
├── dist/ (HTML files & extraction configs)
├── dist-optimized/ (AI-optimized output)
├── gulp/ (Submodule - Processing Engine)
│   ├── README.md (Main documentation)
│   ├── docs/ (Comprehensive documentation)
│   ├── tasks/ (Processing logic)
│   └── worker/ (AI components)
└── src/ (Source files)
```

## 🎯 CURRENT STATUS

### ✅ Completed Features
- **Content Dimensions System**: Config-driven extraction of location, brand, service, product, FAQ titles
- **Hierarchical Configuration**: Parent-child config inheritance
- **AI Integration**: Dimensions integrated into AI prompt context
- **Modular Architecture**: Clean, maintainable code structure
- **Documentation**: Comprehensive guides and examples

### 🔄 Pending Tasks
- Update block extraction to include `ai_prompts` array with content extraction options
- Integrate with existing AI workflow engine for serial/parallel execution

## 🚀 HOW TO GET STARTED

### 1. Project Setup
```bash
# Navigate to project
cd C:\Users\marti\Desktop\NimbusAI

# Check git status
git status

# Navigate to processing engine
cd gulp
```

### 2. Running Gulp Tasks

#### Scan Content
```bash
# Scan all content
node gulpfile.js scan

# Scan specific folder
node gulpfile.js scan --folder=brands
node gulpfile.js scan --folder=local
```

#### Extract Content
```bash
# Extract content with dimensions
node gulpfile.js extract

# Extract specific file
node gulpfile.js extract --file=dist/brands/rolex-watch-repair.html
```

#### AI Optimization
```bash
# Run AI optimization
node gulpfile.js optimize

# Optimize specific file
node gulpfile.js optimize --file=dist/brands/rolex-watch-repair.html
```

### 3. Configuration Management

#### Main Config Location
- **Template**: `gulp/tasks/scan/templates/extraction-config.json`
- **Examples**: `gulp/tasks/scan/templates/README.md`

#### Content Dimensions
Configure in `extraction-config.json`:
```json
{
  "content_dimensions": {
    "location": {
      "method": "url_pattern",
      "pattern": "([^/\\\\]+)-watch-repair\\.html$",
      "extract": 1
    },
    "brand": {
      "method": "url_pattern", 
      "pattern": "([^/\\\\]+)-watch-repair\\.html$",
      "extract": 1
    }
  }
}
```

#### Extraction Methods
- `url_pattern`: Extract from URL using regex
- `content_selector`: Extract from HTML using CSS selectors
- `static_value`: Use fixed value
- `metadata`: Extract from page metadata
- `ai_extraction`: Use AI to extract (future feature)

### 4. Git Management

#### Main Project (Content & Config)
```bash
# Check status
git status

# Add changes
git add .

# Commit changes
git commit -m "feat: Description of changes"

# Create rollback point
git tag -a v1.0-rollback -m "Rollback point description"
```

#### Gulp Submodule (Processing Engine)
```bash
# Navigate to submodule
cd gulp

# Check status
git status

# Add and commit
git add .
git commit -m "feat: Description of changes"

# Push to cloud
git push origin main
```

### 5. Deployment

#### Local Development
```bash
# Run full pipeline
node gulpfile.js scan
node gulpfile.js extract
node gulpfile.js optimize
```

#### Cloud Deployment
```bash
# Push gulp submodule to cloud
cd gulp
git push origin main

# Main project (if remote configured)
git push origin master
```

## 📚 KEY DOCUMENTATION

### Essential Files
- `gulp/README.md` - Main project documentation
- `gulp/docs/CONTENT-DIMENSIONS.md` - Content dimensions guide
- `gulp/docs/CONFIG-GUIDE.md` - Configuration guide
- `gulp/docs/EXAMPLES.md` - Usage examples

### Configuration Files
- `gulp/tasks/scan/templates/extraction-config.json` - Template config
- `dist/brands/extraction-config.json` - Brand pages config
- `dist/local/extraction-config.json` - Local pages config

## 🔧 DEVELOPMENT WORKFLOW

### 1. Making Changes
```bash
# Always work in gulp submodule for code changes
cd gulp

# Make your changes
# Test with: node gulpfile.js scan
# Commit: git add . && git commit -m "description"
# Push: git push origin main
```

### 2. Testing
```bash
# Test scanning
node gulpfile.js scan --folder=brands

# Test extraction
node gulpfile.js extract --file=dist/brands/rolex-watch-repair.html

# Check output in dist-optimized/
```

### 3. Configuration Updates
```bash
# Edit configs in dist/ folder
# Test with scan command
# Commit changes to main project
```

## 🚨 ROLLBACK PROCEDURES

### If Something Goes Wrong
```bash
# Rollback main project
git reset --hard v1.0-content-dimensions

# Rollback gulp submodule
cd gulp
git reset --hard v1.0-content-dimensions
```

## 🎯 NEXT STEPS FOR NEW PROMPT

### Immediate Tasks
1. **Update Block Structure**: Add `ai_prompts` array to block extraction
2. **Integrate Workflow Engine**: Connect with AI workflow for serial/parallel execution

### Development Priorities
1. **Content Dimensions**: Already implemented and working
2. **AI Pipeline**: Ready for integration
3. **Configuration**: Fully flexible and documented
4. **Architecture**: Clean and modular

## 🔍 TROUBLESHOOTING

### Common Issues
- **"No content dimensions configured"**: Check extraction-config.json
- **"Invalid JSON"**: Validate config files
- **"Regex pattern failed"**: Check URL patterns for Windows paths
- **Git issues**: Remember main project vs gulp submodule

### Debug Commands
```bash
# Check git status
git status

# Check gulp submodule
cd gulp && git status

# Test specific file
node gulpfile.js extract --file=path/to/file.html
```

## 📞 SUPPORT

- **Documentation**: All in `gulp/docs/`
- **Examples**: `gulp/docs/EXAMPLES.md`
- **Configuration**: `gulp/docs/CONFIG-GUIDE.md`
- **Architecture**: `gulp/docs/ARCHITECTURE.md`

---

**🎉 You're ready to continue development! The system is bulletproof, well-documented, and ready for the next phase of AI pipeline integration.**
