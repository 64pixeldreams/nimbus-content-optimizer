# 🚀 Nimbus AI - Content Optimization System

**Transform your website content with AI-powered optimization for SEO and conversions.**

## 🎯 What is Nimbus?

Nimbus is a production-ready AI content optimization system that:
- **Analyzes** your HTML pages using advanced DOM scanning
- **Optimizes** content with AI using customizable tone personalities  
- **Preserves** context while enhancing SEO and conversion potential
- **Provides** Before/After previews with perfect content matching
- **Applies** changes safely with backup and rollback capabilities

## ⚡ Quick Start (5 Minutes)

### 1. Install & Setup
```bash
git clone <your-repo>
cd nimbus-content-optimizer/gulp
npm install
```

### 2. Configure Your Business
Edit `profile.yaml`:
```yaml
name: "Your Business Name"
domain: "yourdomain.com"
services: ["your-service-1", "your-service-2"]
goal: "Maximize conversions"
```

### 3. Run Your First Optimization
```bash
# Scan your HTML files
gulp nimbus:scan:map --folder ../your-html-folder --limit 5 --batch first-test

# Generate AI-optimized content
gulp nimbus:full-page --batch first-test --pages your-page-name --tone mom-n-pop

# View results
# Opens: .nimbus/work/first-test/tier-3-preview/index.html
```

## 🌟 Key Features

### **✅ Perfect Content Matching**
- Advanced DOM extraction preserves inline elements and context
- Smart content matching ensures Before/After comparisons show the right content
- No more placeholder text or mismatched content blocks

### **✅ Multiple Optimization Tiers**
- **Tier 1 (Meta-Only)**: Ultra-fast title/description optimization (1-2s)
- **Tier 2 (Above-Fold)**: Hero section optimization (3-5s)
- **Tier 3 (Full Page)**: Complete page optimization (15-30s)

### **✅ Advanced Tone Personalities**
- **Mom-n-Pop**: "family-run business", "give us a ring", "we genuinely care"
- **Clinical**: "precise", "systematic", "measured approach"
- **Startup**: "revolutionary", "game-changing", "innovative"
- **Corporate**: "industry-leading", "proven expertise", "professional"
- **And more...** - fully customizable tone profiles

### **✅ Production-Ready Architecture**
- Cloudflare Workers for scalable AI processing
- KV cache for lightning-fast repeat optimizations (>90% hit rates)
- Bootstrap 5 UI with Google-authentic SERP previews
- Git integration with safe rollback capabilities

## 📋 Core Workflow

```bash
# 1. Scan & Extract Content
gulp nimbus:scan:map --folder dist --batch my-batch

# 2. Optimize with AI (choose tier)
gulp nimbus:meta-only --batch my-batch --tone clinical        # Tier 1: 1-2s
gulp nimbus:above-fold --batch my-batch --tone mom-n-pop      # Tier 2: 3-5s  
gulp nimbus:full-page --batch my-batch --tone startup         # Tier 3: 15-30s

# 3. Review Results
# Opens beautiful Before/After comparison in browser
```

## 🎨 What You Get

### **Professional UI Results**
- **Google-style SERP previews** - See exactly how your pages will appear in search
- **Before/After comparisons** - Real original content vs AI-enhanced versions
- **Perfect content matching** - Each block shows correct original and optimized text
- **Confidence scoring** - AI confidence levels for each optimization
- **Performance metrics** - Cache hit rates, processing times, change counts

### **Content Quality**
- **Context preservation** - AI rewrites existing content, doesn't reinvent it
- **Tone consistency** - Every optimization matches your chosen business personality
- **SEO enhancement** - Improved meta descriptions, headings, and keyword optimization
- **Conversion focus** - Enhanced CTAs and trust signals

## 📁 Project Structure

```
nimbus-content-optimizer/
├── gulp/                          # Main application
│   ├── tasks/                     # Core optimization tasks
│   ├── templates/                 # EJS templates for previews
│   ├── worker/                    # Cloudflare Worker (AI processing)
│   ├── lib/                       # Enhanced DOM extraction & utilities
│   ├── profile.yaml               # Your business configuration
│   ├── _tone-profiles.yaml        # Tone personality definitions
│   └── .nimbus/                   # Generated content maps & results
├── docs/
│   ├── current/                   # Essential documentation
│   └── archive/                   # Historical development docs
└── dist/                          # Your HTML files to optimize
```

## 🚀 Advanced Features

### **Enhanced DOM Extraction**
- Preserves inline links within paragraphs
- Handles complex content structures
- Maintains formatting and context
- Generates stable CSS selectors

### **Smart Content Matching**
- Keyword-based content association
- Position-based fallback matching
- Content similarity algorithms
- Perfect Before/After alignment

### **Cloudflare Integration**
- Serverless AI processing
- Global edge caching
- 90%+ cache hit rates in production
- Sub-second response times for cached content

## 📊 Performance

**Typical Performance Metrics:**
- **Cache Hit Rate**: 90%+ (excellent)
- **Fresh Processing**: 15-30s per page
- **Cached Processing**: <1s per page
- **AI Confidence**: 90%+ (high quality)
- **Content Changes**: 30-50 per page

## 🛠️ Technical Requirements

- **Node.js**: v20+
- **Cloudflare Account**: For AI worker deployment
- **OpenAI API Key**: For content generation
- **Git**: For version control and rollbacks

## 📖 Documentation

- **[Setup Guide](setup-guide.md)** - Complete installation and configuration
- **[User Manual](user-manual.md)** - Step-by-step workflow guide
- **[Configuration Reference](configuration-guide.md)** - All configuration options
- **[API Reference](api-reference.md)** - Technical implementation details

## 🎯 Use Cases

**Perfect for:**
- **Local Service Businesses** - Enhance local SEO and trust signals
- **E-commerce Sites** - Improve product descriptions and CTAs
- **Corporate Websites** - Professional tone and conversion optimization
- **Multi-location Businesses** - Consistent brand voice across locations
- **Content Marketing** - Tone-specific content for different audiences

## 🏆 Success Stories

**Before Nimbus:**
- Generic, templated content
- Inconsistent tone across pages
- Poor meta descriptions
- Weak call-to-actions

**After Nimbus:**
- Personalized, engaging content
- Consistent brand personality
- SEO-optimized meta data
- Conversion-focused CTAs

## 🤝 Support & Community

- **GitHub Issues**: Bug reports and feature requests
- **Documentation**: Comprehensive guides and examples
- **Performance Monitoring**: Built-in cache and optimization metrics

---

**Ready to transform your website content with AI?** 

**Get started in 5 minutes!** 🚀

