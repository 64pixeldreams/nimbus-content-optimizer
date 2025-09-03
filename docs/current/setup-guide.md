# 🚀 Nimbus Setup Guide

**Complete installation and configuration for production-ready AI content optimization.**

## ⚡ Quick Setup (5 Minutes)

### Prerequisites
- **Node.js v20+** (`nvm install 20 && nvm use 20`)
- **Git** configured
- **Cloudflare account**
- **OpenAI API key**

### 1. Clone & Install
```bash
git clone <your-repo>
cd nimbus-content-optimizer/gulp
npm install
```

### 2. Configure Business Profile
Edit `profile.yaml`:
```yaml
name: "Your Business Name"
domain: "yourdomain.com" 
services: ["your-service-1", "your-service-2"]
geo_scope: ["UK"] # or ["US"], ["Global"]
goal: "Maximize conversions"
money_pages: ["/contact.html", "/quote.html"]
```

### 3. Deploy Cloudflare Worker
```bash
cd worker
wrangler login
wrangler secret put OPENAI_API_KEY
# Paste your OpenAI API key

# Create KV namespace
wrangler kv:namespace create "NIMBUS_CACHE"
# Copy the namespace ID to wrangler.toml

wrangler deploy
```

### 4. Test Installation
```bash
cd ..
gulp nimbus:scan:map --folder ../your-html-folder --limit 2 --batch test
gulp nimbus:full-page --batch test --pages your-page --tone mom-n-pop
# Opens preview in browser - you should see perfect Before/After comparison
```

## 📋 Complete Configuration

### Business Profile (`profile.yaml`)
```yaml
# Business Identity
name: "Your Business Name"
domain: "yourdomain.com"
goal: "Maximize quote submissions"

# Services & Market
services: ["watch-repair", "battery-replacement"]
geo_scope: ["UK"]
brands: ["Rolex", "Omega", "TAG Heuer"]

# Conversion & Trust
money_pages: ["/contact.html", "/quote.html"]
trust_links:
  trustpilot: "https://uk.trustpilot.com/review/yourdomain.com"
  google: "https://g.page/YourBusiness"
  
# Business Details  
phone: "0800 121 6030"
hours: "9am-5pm GMT Mon-Fri"
guarantee: "12-month guarantee"
review_count: "1.5K+"
```

### Tone Profiles (`_tone-profiles.yaml`)
```yaml
mom-n-pop:
  personality: "Warm family business owners, personal relationships"
  language: "family-run, personal touch, genuine care, we're here to help"
  cta_style: "Give us a ring, Pop in anytime, Let's chat"
  formality: "casual-friendly"

clinical:
  personality: "Precise, systematic, professional expertise"
  language: "systematic, measured, precise, technical accuracy"
  cta_style: "Submit request, Schedule consultation"
  formality: "formal-professional"

startup:
  personality: "Dynamic, innovative, growth-focused disruptors"
  language: "revolutionary, game-changing, innovative, next-level"
  cta_style: "Join the revolution, Get started now"
  formality: "casual-energetic"
```

### Cloudflare Worker (`worker/wrangler.toml`)
```toml
name = "nimbus-content-optimizer"
compatibility_date = "2024-08-01"

[env.production]
kv_namespaces = [
  { binding = "NIMBUS_CACHE", id = "your-kv-namespace-id" }
]

[env.development]
kv_namespaces = [
  { binding = "NIMBUS_CACHE", id = "your-dev-kv-namespace-id" }
]
```

## 🔧 Advanced Configuration

### Content Control Attributes
Add to your HTML for fine-grained control:
```html
<!-- Skip customer reviews from optimization -->
<div class="reviews" data-nimbus="ignore">
  Customer testimonials...
</div>

<!-- Prioritize important CTAs -->
<button class="main-cta" data-nimbus="priority">
  Get Free Quote
</button>
```

### Cache Performance Monitoring
```bash
# Check cache performance
curl https://your-worker.workers.dev/cache-stats

# Expected response:
{
  "cache_hits": 450,
  "cache_misses": 50,
  "hit_rate": "90.0%"
}
```

## 🎯 Optimization Tiers

### Tier 1: Meta-Only (1-2 seconds)
```bash
gulp nimbus:meta-only --batch my-batch --tone clinical
```
- Ultra-fast title/description optimization
- Perfect for quick SEO improvements
- Ideal for large-scale optimizations

### Tier 2: Above-Fold (3-5 seconds)
```bash
gulp nimbus:above-fold --batch my-batch --tone mom-n-pop
```
- Hero section optimization (H1, H2, CTA)
- Fast insight before full page optimization
- Great for conversion testing

### Tier 3: Full Page (15-30 seconds)
```bash
gulp nimbus:full-page --batch my-batch --tone startup
```
- Complete page optimization
- All content blocks enhanced
- Comprehensive SEO and conversion improvements

## 📊 Performance Expectations

### Development Environment
- **Cache Hit Rate**: 80-90%
- **Fresh Processing**: 15-30s per page
- **Cached Processing**: <1s per page
- **AI Confidence**: 90%+ for quality content

### Production Environment
- **Cache Hit Rate**: 95%+ (excellent caching)
- **Response Time**: <500ms for cached content
- **Token Efficiency**: Smart caching reduces API costs by 90%
- **Reliability**: 99.9% uptime with Cloudflare Workers

## 🚨 Troubleshooting

### Common Issues

**Node.js Version Error**
```bash
# Solution: Use Node.js v20+
nvm install 20
nvm use 20
npm install
```

**OpenAI API Key Not Found**
```bash
# Check if secret is set
wrangler secret list

# If missing, add it
wrangler secret put OPENAI_API_KEY
```

**KV Namespace Binding Error**
```bash
# Verify namespace ID in wrangler.toml
wrangler kv:namespace list

# Update wrangler.toml with correct ID
```

**Cache Not Working**
- Check debug logs in `.nimbus/work/batch/cache/` files
- Verify KV namespace is properly bound
- Test with: `curl https://your-worker.workers.dev/cache-stats`

**Low AI Confidence Scores**
- Review business profile configuration
- Ensure tone profile matches content type
- Check if content blocks have sufficient text (>20 characters)

### Debug Information
Every optimization includes detailed debug info:
```json
{
  "cached": true,
  "cache_key": "ai-result-abc123...",
  "confidence": 0.94,
  "processing_time_ms": 850,
  "debug_logs": ["Cache hit", "JSON parsed successfully"]
}
```

## ✅ Success Checklist

- [ ] **Node.js v20+** installed and active
- [ ] **Repository cloned** and dependencies installed
- [ ] **Business profile configured** in `profile.yaml`
- [ ] **Cloudflare Worker deployed** successfully
- [ ] **OpenAI API key** configured as secret
- [ ] **KV namespace** created and bound
- [ ] **First optimization** completed successfully
- [ ] **Preview URLs accessible** and showing perfect Before/After
- [ ] **Cache performance** >90% hit rate

## 🎯 Next Steps

1. **Run Test Optimization**: Start with 2-3 pages to verify everything works
2. **Review Results**: Check that Before/After comparisons show real content
3. **Optimize Cache**: Aim for >90% hit rate for best performance
4. **Scale Up**: Process larger batches once system is proven
5. **Monitor Performance**: Track confidence scores and processing times

**Ready for production optimization!** 🚀

## 📖 What's Next?

- **[User Manual](user-manual.md)** - Complete workflow guide
- **[Configuration Reference](configuration-guide.md)** - All options explained
- **[API Reference](api-reference.md)** - Technical implementation details

**Your AI-powered content optimization system is ready!** 🎉
