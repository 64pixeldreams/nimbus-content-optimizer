# 📖 Nimbus User Manual - Complete Workflow Guide

## 🎯 **Nimbus Workflow Overview**

Nimbus optimizes your website content through a 6-step workflow:
1. **Scan** → 2. **Plan** → 3. **Propose** → 4. **Preview** → 5. **Approve** → 6. **Apply**

---

## 🔍 **Step 1: Scan & Map Content**

### **Purpose**
Analyze HTML files and extract content structure for optimization.

### **Command**
```bash
gulp nimbus:scan:map --folder <path> --limit <number> --batch <batch-id>
```

### **Examples**
```bash
# Scan all HTML files in dist folder
gulp nimbus:scan:map --folder ../dist --batch full-site

# Scan just local pages with limit
gulp nimbus:scan:map --folder ../dist/local --limit 10 --batch local-test

# Scan specific folder
gulp nimbus:scan:map --folder ../dist/brands --batch brand-pages
```

### **What It Does**
- Discovers HTML files in specified folder
- Extracts content blocks (headings, paragraphs, links, images)
- Generates stable CSS selectors for each element
- Creates unique IDs for all content elements
- Classifies links by business intent (CTA vs regular)
- Detects issues (typos, missing alt text, empty trust links)
- Saves content maps to `.nimbus/maps/`

### **Output**
```
📁 Found 25 HTML files to scan
📄 Processing 1/25: watch-repairs-london.html
✅ Generated content map: watch-repairs-london.json
🎉 Content scanning complete! Generated 25 content maps
```

---

## 📋 **Step 2: Plan Optimization Strategy**

### **Purpose**
Merge business profile with page directives and create optimization work batch.

### **Command**
```bash
gulp nimbus:plan --batch <batch-id>
```

### **What It Does**
- Loads `profile.yaml` (business configuration)
- Merges with `_directive.yaml` (page family rules)
- Categorizes pages by type (local, brand, service, etc.)
- Applies tone profiles and optimization strategy
- Creates work batch with optimization goals
- Saves batch configuration to `.nimbus/work/<batch-id>/`

### **Output**
```
📊 Loaded profile: Repairs by Post (repairsbypost.com)
📝 Loaded directive configuration with 5 page families
📄 Loaded 25 content maps

📋 NIMBUS PLANNING REPORT
✅ watch-repairs-london [local/local-shop] → LocalBusiness + BreadcrumbList
✅ rolex-repair [brand/corporate] → Service + BreadcrumbList
💾 Work batch saved: .nimbus/work/my-batch/batch.json
```

---

## 🤖 **Step 3: Generate AI Proposals**

### **Purpose**
Use AI to generate content optimization proposals for each page.

### **Commands**
```bash
# V2 Multi-prompt (recommended)
gulp nimbus:propose:v2 --batch <batch-id> [--pages <page-list>]

# V1 Single-prompt (legacy)
gulp nimbus:propose --batch <batch-id> [--dry-run]
```

### **Examples**
```bash
# Optimize all pages in batch
gulp nimbus:propose:v2 --batch my-batch

# Optimize specific pages only
gulp nimbus:propose:v2 --batch my-batch --pages watch-repairs-london,rolex-repair

# Test with single page
gulp nimbus:propose:v2 --batch my-batch --pages home
```

### **What It Does**
- Loads work batch and content maps
- Sends requests to Cloudflare Worker (with KV caching)
- Executes 5 specialized AI prompts in parallel:
  - **Head**: Title, meta description optimization
  - **Deep Links**: Strategic internal linking
  - **Content**: Headings, paragraphs, copy enhancement
  - **Images**: Alt text and technical optimization  
  - **Schema**: JSON-LD structured data
- Merges results into comprehensive proposals
- Saves proposals to `.nimbus/work/<batch-id>/proposals/`

### **Output**
```
📄 V2 MULTI-PROMPT PROCESSING (25):
⏳ 1/25: watch-repairs-london [local/local-shop]
   ✅ 42 changes (confidence: 0.94)
   🔧 V2: 5/5 prompts, 1.2s, cached ⚡

📊 V2 MULTI-PROMPT SUMMARY:
- Total changes proposed: 1,250
- Average confidence: 0.93
- Cache hit rate: 85%
- Processing time: 45s (vs 15min without cache)
```

---

## 👀 **Step 4: Preview Changes**

### **Purpose**
Generate HTML previews showing before/after comparisons for review.

### **Command**
```bash
gulp nimbus:preview --batch <batch-id> [--open]
```

### **What It Does**
- Loads proposals and original content maps
- Generates HTML diff previews for each page
- Shows before/after comparison for:
  - Head metadata (title, description)
  - Content changes (headings, paragraphs)
  - Link optimizations (anchor text, URLs)
  - Image improvements (alt text, technical)
  - Schema markup additions
- Creates batch summary dashboard
- Optionally opens previews in browser

### **Output**
```
🔍 GENERATING PREVIEWS (25):
✅ Generated preview: watch-repairs-london.html (42 changes)
✅ Generated preview: rolex-repair.html (38 changes)

🌐 PREVIEW URLS:
📊 Batch Summary: file:///path/to/.nimbus/work/my-batch/previews/index.html
📄 watch-repairs-london: file:///path/to/.nimbus/work/my-batch/previews/watch-repairs-london.html
```

### **Preview Content**
Each preview shows:
- **Confidence score** and page metadata
- **Head changes**: Title and meta description before/after
- **Content changes**: Real original text vs optimized text
- **Link changes**: Original anchor text vs enhanced text
- **Image changes**: Current alt text vs optimized alt text
- **Schema markup**: New structured data being added
- **AI notes**: Optimization reasoning and strategy

---

## ✅ **Step 5: Approve Changes**

### **Purpose**
Review and approve/reject proposed changes before application.

### **Commands**
```bash
# Interactive approval (review each page)
gulp nimbus:approve --batch <batch-id> --mode interactive

# Auto-approve all changes
gulp nimbus:approve --batch <batch-id> --mode auto

# Reject all changes  
gulp nimbus:approve --batch <batch-id> --mode reject
```

### **Interactive Mode**
```
🔍 Review proposal for: watch-repairs-london
📊 42 changes proposed (confidence: 94%)
👀 Preview: file:///path/to/preview.html

✅ Approve this page? (y/n/s/q): 
  y = approve, n = reject, s = skip, q = quit
```

### **What It Does**
- Loads all proposals in batch
- Presents each page for review (interactive mode)
- Creates approval records with decisions
- Updates batch manifest with approval status
- Prepares approved changes for application

---

## 🔧 **Step 6: Apply Optimizations**

### **Purpose**
Apply approved changes to actual HTML files with backup and safety checks.

### **Commands**
```bash
# Apply with backup (recommended)
gulp nimbus:apply --batch <batch-id> --backup

# Dry run (test without applying)
gulp nimbus:apply --batch <batch-id> --dry-run

# Apply with Git commit
gulp nimbus:apply --batch <batch-id> --backup --commit
```

### **What It Does**
- Loads approved proposals only
- Verifies file checksums for safety
- Creates backups of original files
- Applies changes to HTML files:
  - Updates head metadata (title, description, canonical)
  - Replaces content blocks (headings, paragraphs)
  - Updates link anchor text and URLs
  - Adds/updates image alt text
  - Injects JSON-LD schema markup
- Optionally creates Git commit
- Reports applied changes with file URLs

### **Output**
```
🔧 APPLYING OPTIMIZATIONS (25):
✅ Applied 42 changes: watch-repairs-london.html
✅ Applied 38 changes: rolex-repair.html
💾 Created backups in: .nimbus/backups/2025-08-29/

🌐 OPTIMIZED FILES:
📄 file:///path/to/dist/local/watch-repairs-london.html
📄 file:///path/to/dist/brand/rolex-repair.html

📊 APPLY SUMMARY:
- Pages optimized: 25/25
- Total changes applied: 1,250
- Backup location: .nimbus/backups/2025-08-29/
- Git commit: abc123def (if --commit used)
```

---

## 🔧 **Advanced Workflows**

### **Incremental Optimization**
```bash
# Optimize just new pages
gulp nimbus:scan:map --folder dist/new-pages --batch incremental
gulp nimbus:plan --batch incremental  
gulp nimbus:propose:v2 --batch incremental
gulp nimbus:preview --batch incremental --open
gulp nimbus:approve --batch incremental --mode auto
gulp nimbus:apply --batch incremental --backup --commit
```

### **A/B Testing Workflow**
```bash
# Test different tone profiles
gulp nimbus:plan --batch startup-tone    # Uses startup tone
gulp nimbus:plan --batch corporate-tone  # Uses corporate tone
gulp nimbus:propose:v2 --batch startup-tone --pages home
gulp nimbus:propose:v2 --batch corporate-tone --pages home
# Compare results in previews
```

### **Large Site Optimization**
```bash
# Process in batches for large sites
gulp nimbus:scan:map --folder dist --limit 50 --batch batch-1
gulp nimbus:scan:map --folder dist --offset 50 --limit 50 --batch batch-2
# Process each batch separately
```

---

## 📊 **Performance Monitoring**

### **Cache Performance**
```bash
# Check cache stats
curl https://your-worker.workers.dev/cache-stats

# Expected high-performance results:
{
  "cache_hits": 450,
  "cache_misses": 50,
  "hit_rate": "90.0%"    # Excellent
}
```

### **Optimization Metrics**
- **Cache hit rate**: >80% (excellent), 60-80% (good), <60% (needs investigation)
- **Response times**: <1s (cached), <30s (new content)
- **Confidence scores**: >90% (excellent), 80-90% (good), <80% (review needed)
- **Change counts**: 30-50 per page (comprehensive optimization)

---

## 🚨 **Troubleshooting**

### **Common Issues**
```bash
# Worker not responding
curl https://your-worker.workers.dev/cache-stats

# Cache not working  
# Check debug logs in proposal JSON files

# Low confidence scores
# Review tone profile and business configuration

# No changes proposed
# Check content maps have sufficient content blocks
```

### **Debug Information**
Every proposal includes:
- `cached: true/false` - Cache status
- `cache_key: "abc123..."` - Cache key for debugging
- `debug_logs: [...]` - Detailed operation logs
- `confidence: 0.94` - AI confidence in changes
- `v2_metadata` - Performance and token usage stats

---

## 🎯 **Workflow Best Practices**

### **Development Workflow**
1. **Start small**: Test with 1-5 pages first
2. **Check previews**: Always review before applying
3. **Use caching**: Repeated runs are nearly instant
4. **Monitor performance**: Check cache hit rates
5. **Backup always**: Use `--backup` flag

### **Production Workflow**
1. **Batch processing**: Process 25-50 pages per batch
2. **Auto-approval**: Use for trusted, repeated optimizations
3. **Git integration**: Use `--commit` for version control
4. **Performance monitoring**: Track cache and confidence metrics
5. **Incremental updates**: Regular small optimizations vs large overhauls

**Master the Nimbus workflow for world-class content optimization! 🚀**
