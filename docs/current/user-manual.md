# 📖 Nimbus User Manual

**Complete workflow guide for AI-powered content optimization.**

## 🎯 Nimbus Workflow Overview

Nimbus optimizes your website through a streamlined process:
1. **Scan** → Extract content structure
2. **Optimize** → AI enhancement with tone personalities  
3. **Preview** → Before/After comparison
4. **Apply** → Safe deployment with backups

## 🔍 Step 1: Scan & Extract Content

### Purpose
Analyze HTML files and extract content structure for AI optimization.

### Command
```bash
gulp nimbus:scan:map --folder <path> --limit <number> --batch <batch-id>
```

### Examples
```bash
# Scan all HTML files
gulp nimbus:scan:map --folder ../dist --batch full-site

# Scan with limit for testing
gulp nimbus:scan:map --folder ../dist/local --limit 5 --batch test

# Scan specific folder
gulp nimbus:scan:map --folder ../dist/brands --batch brand-pages
```

### What It Does
- **Discovers** HTML files in specified folder
- **Extracts** content blocks (headings, paragraphs, links, images)
- **Generates** stable CSS selectors and unique IDs
- **Preserves** inline elements and context
- **Classifies** links by business intent
- **Detects** issues (missing alt text, empty links)
- **Saves** content maps to `.nimbus/maps/`

### Output
```
📁 Found 25 HTML files to scan
📄 Processing 1/25: watch-repairs-london.html
✅ Generated content map: watch-repairs-london.json
🎉 Content scanning complete! Generated 25 content maps
```

## 🤖 Step 2: AI Optimization (3 Tiers)

### Tier 1: Meta-Only Optimization (1-2 seconds)
**Ultra-fast SEO optimization**

```bash
gulp nimbus:meta-only --batch <batch-id> --tone <tone> [--pages <page-list>]
```

**What it optimizes:**
- Page titles (SEO-optimized, character limits)
- Meta descriptions (compelling, keyword-rich)
- Canonical URLs (if missing)

**Perfect for:**
- Quick SEO improvements
- Large-scale optimizations
- Testing different tones

### Tier 2: Above-Fold Optimization (3-5 seconds)
**Hero section enhancement**

```bash
gulp nimbus:above-fold --batch <batch-id> --tone <tone> [--pages <page-list>]
```

**What it optimizes:**
- Everything from Tier 1, PLUS:
- H1 headlines (conversion-focused)
- H2 subheadlines (supporting copy)
- Primary CTAs (action-oriented)

**Perfect for:**
- Conversion rate testing
- Landing page optimization
- Quick content insights

### Tier 3: Full Page Optimization (15-30 seconds)
**Comprehensive content enhancement**

```bash
gulp nimbus:full-page --batch <batch-id> --tone <tone> [--pages <page-list>]
```

**What it optimizes:**
- Everything from Tier 1 & 2, PLUS:
- All content paragraphs (tone-consistent)
- Link anchor text (SEO-friendly)
- Image alt text (accessibility + SEO)
- Schema markup (structured data)

**Perfect for:**
- Complete page overhauls
- Brand voice consistency
- Maximum SEO impact

### Tone Personalities

**Available Tones:**
```bash
--tone mom-n-pop      # "family-run", "give us a ring", "personal touch"
--tone clinical       # "precise", "systematic", "measured approach"  
--tone startup        # "revolutionary", "game-changing", "innovative"
--tone corporate      # "industry-leading", "proven expertise"
--tone helpful-calm   # "gentle guidance", "supportive care"
--tone classic-retail # "fantastic value", "unbeatable deals"
```

### Examples
```bash
# Quick meta optimization for all pages
gulp nimbus:meta-only --batch my-batch --tone clinical

# Test hero section with mom-n-pop personality
gulp nimbus:above-fold --batch my-batch --tone mom-n-pop --pages home,contact

# Full optimization for specific pages
gulp nimbus:full-page --batch my-batch --tone startup --pages product-page
```

## 👀 Step 3: Preview Results

### Purpose
Review AI optimizations with perfect Before/After comparisons.

### What Happens Automatically
After each optimization, Nimbus automatically:
- Generates HTML preview pages
- Shows Before/After comparisons
- Opens results in your browser
- Displays confidence scores and metrics

### Preview Content
Each preview shows:

**📊 Overview Dashboard**
- Pages optimized count
- Average confidence score
- Total changes made
- Processing time and cache performance

**📄 Individual Page Previews**
- **SERP Preview**: Exactly how your page appears in Google search
- **CTA Preview**: Above-the-fold content showcase
- **Before/After Blocks**: Real original content vs AI-enhanced versions
- **Perfect Matching**: Each block shows correct original and optimized text
- **Confidence Scoring**: AI confidence level for each change
- **Optimization Notes**: Reasoning behind each enhancement

### Preview URLs
```
📊 Overview: .nimbus/work/my-batch/tier-3-preview/index.html
📄 Individual: .nimbus/work/my-batch/tier-3-preview/page-name.html
```

## ✅ Step 4: Apply Changes (Optional)

### Purpose
Apply approved optimizations to your actual HTML files with safety features.

### Commands
```bash
# Apply with backup (recommended)
gulp nimbus:apply --batch <batch-id> --backup

# Test run without changes
gulp nimbus:apply --batch <batch-id> --dry-run

# Apply with Git commit
gulp nimbus:apply --batch <batch-id> --backup --commit
```

### Safety Features
- **Automatic backups** of original files
- **Dry-run mode** for testing
- **File verification** with checksums
- **Git integration** for version control
- **Rollback capability** if needed

## 🎯 Common Workflows

### Development & Testing
```bash
# 1. Quick test with small batch
gulp nimbus:scan:map --folder dist --limit 3 --batch dev-test

# 2. Try different tones
gulp nimbus:above-fold --batch dev-test --tone mom-n-pop --pages home
gulp nimbus:above-fold --batch dev-test --tone clinical --pages home

# 3. Compare results in browser previews
```

### Production Optimization
```bash
# 1. Scan all pages
gulp nimbus:scan:map --folder dist --batch prod-v1

# 2. Full optimization with proven tone
gulp nimbus:full-page --batch prod-v1 --tone mom-n-pop

# 3. Review all previews, then apply
gulp nimbus:apply --batch prod-v1 --backup --commit
```

### A/B Testing
```bash
# Create two batches with different tones
gulp nimbus:full-page --batch test-a --tone mom-n-pop --pages landing-page
gulp nimbus:full-page --batch test-b --tone clinical --pages landing-page

# Compare results in previews
# Apply the winner to production
```

### Large Site Processing
```bash
# Process in manageable batches
gulp nimbus:scan:map --folder dist --limit 25 --batch batch-1
gulp nimbus:scan:map --folder dist --offset 25 --limit 25 --batch batch-2

# Optimize each batch
gulp nimbus:full-page --batch batch-1 --tone corporate
gulp nimbus:full-page --batch batch-2 --tone corporate
```

## 📊 Performance Monitoring

### Cache Performance
```bash
# Check worker performance
curl https://your-worker.workers.dev/cache-stats

# Excellent performance:
{
  "cache_hits": 450,
  "cache_misses": 50, 
  "hit_rate": "90.0%"
}
```

### Optimization Metrics
- **Cache Hit Rate**: >90% (excellent), 80-90% (good), <80% (investigate)
- **Response Times**: <1s (cached), <30s (fresh processing)
- **Confidence Scores**: >90% (excellent), 80-90% (good), <80% (review)
- **Changes Per Page**: 30-50 (comprehensive optimization)

### Debug Information
Every optimization includes:
- `cached: true/false` - Cache performance
- `confidence: 0.94` - AI confidence score
- `processing_time_ms: 850` - Performance timing
- `debug_logs: [...]` - Detailed operation logs

## 🚨 Troubleshooting

### Common Issues

**No Changes Generated**
- Check content maps have sufficient text (>20 characters per block)
- Verify tone profile matches content type
- Ensure business profile is configured correctly

**Low Confidence Scores**
- Review business profile accuracy
- Try different tone personalities
- Check if content is too technical/specialized

**Cache Performance Issues**
```bash
# Check cache stats
curl https://your-worker.workers.dev/cache-stats

# Clear cache if needed (rare)
# Contact Cloudflare support for KV issues
```

**Preview Not Opening**
- Check file paths in console output
- Verify HTML files were generated
- Try opening URLs manually in browser

### Getting Help
1. **Check debug logs** in optimization results
2. **Review console output** for error messages
3. **Test with single page** to isolate issues
4. **Verify configuration** files are correct

## 🎯 Best Practices

### Development
- **Start small**: Test with 2-3 pages first
- **Compare tones**: Try different personalities
- **Check previews**: Always review before applying
- **Use caching**: Repeated runs are nearly instant

### Production
- **Batch processing**: 25-50 pages per batch optimal
- **Monitor performance**: Track cache hit rates
- **Backup always**: Use `--backup` flag
- **Version control**: Use `--commit` for tracking

### Content Quality
- **Review confidence scores**: >90% indicates high quality
- **Check context preservation**: AI should enhance, not replace meaning
- **Verify tone consistency**: All content should match chosen personality
- **Test conversions**: Monitor performance after optimization

## 🚀 Advanced Tips

### Progressive Optimization
```bash
# Start with meta-only for quick wins
gulp nimbus:meta-only --batch quick-wins --tone clinical

# Then enhance high-value pages fully  
gulp nimbus:full-page --batch priority-pages --tone mom-n-pop --pages home,contact,pricing

# Finally, optimize entire site
gulp nimbus:full-page --batch full-site --tone mom-n-pop
```

### Tone Strategy
- **Mom-n-pop**: Local businesses, personal services
- **Clinical**: Healthcare, professional services, technical products
- **Startup**: Tech companies, innovative products, young brands
- **Corporate**: Established businesses, B2B services, formal industries

### Performance Optimization
- **Cache warming**: Run same optimizations twice for instant results
- **Batch sizing**: 25-50 pages for optimal performance
- **Tier selection**: Use appropriate tier for your needs

**Master Nimbus for world-class content optimization!** 🚀
