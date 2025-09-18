# 🚀 NimbusAI Content Extraction System

> **Revolutionary config-driven content extraction and AI pipeline orchestration platform**

[![Status](https://img.shields.io/badge/status-production--ready-green.svg)](https://github.com/your-repo)
[![Architecture](https://img.shields.io/badge/architecture-modular-blue.svg)](./ARCHITECTURE.md)
[![Config](https://img.shields.io/badge/config-driven-orange.svg)](./CONFIG-GUIDE.md)

## 🎯 **What is NimbusAI?**

NimbusAI is a **breakthrough content extraction system** that transforms how websites are analyzed and optimized. Built with **surgical precision** and **AI pipeline orchestration** in mind, it provides:

- **🎛️ Config-Driven Extraction** - Define exactly what content to extract
- **⚡ Surgical Precision** - Target specific elements with CSS selectors
- **🔗 Hierarchical Configuration** - Parent/child config inheritance
- **📋 Metadata Intelligence** - Extract favicon, Open Graph, Twitter cards
- **🎯 Content Dimensions** - Extract location, brand, service data automatically
- **🚀 AI Pipeline Ready** - Foundation for content optimization workflows

## ⚡ **Quick Start**

### 1. **Install Dependencies**
```bash
cd gulp
npm install
```

### 2. **Configure Your Site**
Edit `dist/extraction-config.json`:
```json
{
  "selectors": {
    "main": "main",
    "above_fold": ".container"
  },
  "extraction_rules": {
    "above_fold": ["h1", "h2", "p", "a[href='/start-repair.html']"],
    "rest_of_page": ["h3", "li", "a", "img"]
  }
}
```

### 3. **Run Extraction**
```bash
gulp nimbus:scan:map --folder ../dist/local --limit 1
```

### 4. **View Results**
Check `.nimbus/maps/` for extracted JSON files with:
- ✅ **Content blocks** (above-fold + rest-of-page)
- ✅ **Metadata** (title, description, favicon, social tags)
- ✅ **Surgical extraction** (only what you configured)

## 🏗️ **Architecture Overview**

```
📁 gulp/tasks/
├── 🔍 scan/           # File discovery & config management
│   ├── index.js       # Main orchestrator
│   ├── modules/       # Config manager, file discovery
│   └── templates/     # Config templates
└── ⚙️ extract/        # Content extraction engine
    ├── index.js       # Extraction orchestrator
    └── modules/       # All extraction modules
```

**Key Components:**
- **Config Manager** - Hierarchical configuration with inheritance
- **DOM Isolator** - Clean content separation (above-fold vs rest)
- **Block Extractor** - Surgical element extraction
- **Metadata Extractor** - Head section intelligence
- **Content Classifier** - Smart content categorization

## 🎛️ **Configuration System**

### **Hierarchical Inheritance**
```json
// Parent config (dist/extraction-config.json)
{
  "inherit": false,
  "selectors": { "main": "main", "above_fold": ".container" }
}

// Child config (dist/local/extraction-config.json)
{
  "inherit": true,  // Inherits parent + merges with local rules
  "extraction_rules": {
    "above_fold": ["h1", "p", "a[href='/contact.html']"]
  }
}
```

### **Surgical Extraction**
```json
{
  "extraction_rules": {
    "above_fold": [
      "h1.headline",           // Specific class
      "div.hero > p",          // Child selector
      "a[href*='contact']",    // Attribute selector
      "[class*='cta']"         // Partial class match
    ]
  }
}
```

## 🚀 **AI Pipeline Vision**

This system is designed as the **foundation for AI content optimization**:

```json
{
  "name": "above_fold",
  "prompt_steps": ["analyze", "optimize", "enhance"],
  "selector": "main .hero",
  "extract": ["h1", "p", "a.btn-primary"],
  "ai_pipeline": {
    "analyzer": "content-analyzer",
    "optimizer": "seo-optimizer", 
    "enhancer": "conversion-booster"
  }
}
```

**Future Capabilities:**
- 🎯 **Product Analysis** - Extract product specs, identify brands
- 📝 **Content Generation** - Ghost page creation from metadata
- 🔄 **Pipeline Orchestration** - Chain AI prompts with data injection
- 📊 **Performance Analytics** - Track optimization results

## 📊 **Real-World Results**

**Extraction Performance:**
- ✅ **7 above-fold blocks** extracted with surgical precision
- ✅ **57 rest-of-page blocks** with full content intelligence
- ✅ **Complete metadata** including favicon URL
- ✅ **Zero hardcoded assumptions** - 100% config-driven

**Example Output:**
```json
{
  "head": {
    "title": "Expert Watch Repair In Ballynahinch",
    "metaDescription": "For fast and reliable watch repair...",
    "canonical": "https://www.repairsbypost.com/...",
    "favicon": "/favicon.ico"
  },
  "above_fold_blocks": [
    {
      "type": "h1",
      "text": "Expert Watch Repair In Ballynahinch",
      "selector": "isolated-container h1.splash-title"
    }
  ]
}
```

## 🛠️ **Advanced Usage**

### **Custom Extraction Rules**
```json
{
  "extraction_rules": {
    "above_fold": [
      "h1.product-title",
      "p.price",
      "button.add-to-cart",
      "img.product-image"
    ],
    "rest_of_page": [
      "h3.features",
      "div.reviews",
      "li.specifications"
    ]
  }
}
```

### **Metadata Configuration**
```json
{
  "metadata_rules": {
    "title": "title",
    "meta_description": "meta[name='description']",
    "canonical": "link[rel='canonical']",
    "favicon": "link[rel='icon'], link[rel='shortcut icon']",
    "og_title": "meta[property='og:title']",
    "twitter_title": "meta[name='twitter:title']"
  }
}
```

## 📚 **Documentation**

- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - System design and modules
- **[CONFIG-GUIDE.md](./CONFIG-GUIDE.md)** - Complete configuration reference
- **[API-REFERENCE.md](./API-REFERENCE.md)** - Module documentation
- **[EXAMPLES.md](./EXAMPLES.md)** - Real-world usage scenarios
- **[TROUBLESHOOTING.md](./TROUBLESHOOTING.md)** - Common issues and solutions

## 🎯 **Why NimbusAI?**

**Traditional Content Extraction:**
- ❌ Hardcoded selectors
- ❌ Inflexible rules
- ❌ No metadata intelligence
- ❌ Limited to basic extraction

**NimbusAI:**
- ✅ **100% Config-Driven** - Define exactly what you want
- ✅ **Surgical Precision** - Target specific elements
- ✅ **AI Pipeline Ready** - Built for optimization workflows
- ✅ **Metadata Intelligence** - Complete head section analysis
- ✅ **Hierarchical Configs** - Scale across multiple sites

## 🚀 **Getting Started**

1. **Read the [CONFIG-GUIDE.md](./CONFIG-GUIDE.md)** for detailed configuration
2. **Check [EXAMPLES.md](./EXAMPLES.md)** for real-world scenarios
3. **Run a test extraction** on your content
4. **Customize your config** for your specific needs
5. **Build your AI pipeline** on this foundation

---

**Built with ❤️ for the future of content optimization**

*This system represents a breakthrough in config-driven content extraction and AI pipeline orchestration. The foundation is now in place for revolutionary content optimization workflows.*

