# 📚 NimbusAI Documentation Index

> **Complete documentation hub for the NimbusAI content extraction system**

## 🎯 **Getting Started**

### **[📖 README.md](./README.md)**
**Start here!** Project overview, quick start guide, and key features
- What is NimbusAI?
- Quick start tutorial
- Architecture overview
- Configuration system
- AI pipeline vision

## 🏗️ **Technical Documentation**

### **[🏗️ ARCHITECTURE.md](./ARCHITECTURE.md)**
System design, module structure, and data flow
- Architecture overview
- Module structure
- Data flow diagrams
- Configuration architecture
- Core modules deep dive
- AI pipeline integration

### **[📚 API-REFERENCE.md](./API-REFERENCE.md)**
Complete module documentation and interface reference
- Scan layer API
- Extract layer API
- Data structures
- Usage examples
- Error handling
- Performance considerations

## 🎛️ **Configuration & Usage**

### **[🎛️ CONFIG-GUIDE.md](./CONFIG-GUIDE.md)**
Complete configuration reference and examples
- Configuration files
- Inheritance system
- Selectors configuration
- Extraction rules
- Metadata rules
- Content dimensions setup

### **[🎯 CONTENT-DIMENSIONS.md](./CONTENT-DIMENSIONS.md)**
**NEW!** Structured business data extraction system
- What are content dimensions?
- 4 extraction methods (URL, Content, Static, Metadata)
- Real-world RBP examples
- AI pipeline integration
- Configuration guide
- Error handling
- Best practices
- Real-world examples
- Advanced configuration
- Best practices

### **[🎯 EXAMPLES.md](./EXAMPLES.md)**
Real-world usage scenarios and use cases
- E-commerce product pages
- Service business landing pages
- Blog and content pages
- Real estate listings
- Restaurant and food service
- Educational content
- Healthcare and medical
- Automotive services
- AI pipeline integration examples

## 🔧 **Support & Troubleshooting**

### **[🔧 TROUBLESHOOTING.md](./TROUBLESHOOTING.md)**
Common issues, solutions, and debugging tips
- Quick diagnosis
- Common issues & solutions
- Debugging techniques
- Diagnostic commands
- Performance optimization
- Prevention tips

## 🚀 **Future & Vision**

### **[🚀 ROADMAP.md](./ROADMAP.md)**
AI pipeline orchestration and future development plans
- Current status
- Phase 1: AI Pipeline Integration
- Phase 2: Advanced AI Features
- Phase 3: Enterprise Features
- Phase 4: AI Platform
- Long-term vision
- Technical roadmap
- Business impact
- Success metrics

---

## 📋 **Quick Reference**

### **Essential Commands**
```bash
# Install dependencies
npm install

# Run extraction
gulp nimbus:scan:map --folder ../dist/local --limit 1

# View results
cat .nimbus/maps/your-file.json | jq '.head'
```

### **Key Configuration**
```json
{
  "selectors": {
    "main": "main",
    "above_fold": ".container"
  },
  "extraction_rules": {
    "above_fold": ["h1", "h2", "p"],
    "rest_of_page": ["h3", "li", "a"]
  }
}
```

### **Common Selectors**
- **Simple tags:** `"h1"`, `"p"`, `"a"`
- **With classes:** `"h1.headline"`, `"btn.cta"`
- **Attribute selectors:** `"a[href='/contact.html']"`
- **Partial matches:** `"[class*='btn']"`

---

## 🎯 **Documentation Structure**

```
docs/
├── 📖 README.md              # Project overview & quick start
├── 🏗️ ARCHITECTURE.md        # System design & modules
├── 🎛️ CONFIG-GUIDE.md        # Configuration reference
├── 📚 API-REFERENCE.md       # Module documentation
├── 🎯 EXAMPLES.md            # Usage scenarios
├── 🔧 TROUBLESHOOTING.md     # Common issues & solutions
├── 🚀 ROADMAP.md             # Future vision & plans
└── 📋 INDEX.md               # This file
```

---

## 🚀 **Getting Help**

### **1. Start with README.md**
- Project overview
- Quick start guide
- Key concepts

### **2. Check CONFIG-GUIDE.md**
- Configuration options
- Real-world examples
- Best practices

### **3. Use EXAMPLES.md**
- Copy working configurations
- See real-world scenarios
- Understand use cases

### **4. Troubleshoot with TROUBLESHOOTING.md**
- Common issues
- Debugging techniques
- Performance tips

### **5. Explore ARCHITECTURE.md**
- Understand the system
- Module relationships
- Data flow

---

## 🎯 **Documentation Goals**

**✅ Complete Coverage**
- Every feature documented
- Every configuration option explained
- Every use case covered

**✅ Practical Examples**
- Real-world scenarios
- Working configurations
- Copy-paste solutions

**✅ Easy Navigation**
- Clear structure
- Cross-references
- Quick reference sections

**✅ Up-to-Date**
- Reflects current system
- Includes latest features
- Accurate examples

---

**This documentation represents a comprehensive guide to the NimbusAI system, from basic usage to advanced AI pipeline integration. Start with the README.md and work your way through the documentation based on your needs.**

