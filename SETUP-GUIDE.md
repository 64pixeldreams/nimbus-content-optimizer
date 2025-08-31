# 🚀 Nimbus Setup Guide - Complete Installation & Configuration

## 🎯 **Quick Start (5 Minutes)**

### **Prerequisites**
- Node.js v20+ (use `nvm install 20 && nvm use 20`)
- Git configured
- Cloudflare account

### **1. Clone & Install**
```bash
git clone <your-repo>
cd nimbus-content-optimizer/gulp
npm install
```

### **2. Configure Business Profile**
Edit `profile.yaml`:
```yaml
name: "Your Business Name"
domain: "yourdomain.com" 
services: ["your-service-1", "your-service-2"]
geo_scope: ["UK"] # or ["US"], ["Global"]
goal: "Maximise quote submissions" # or sales, bookings, etc
money_pages: ["/contact.html", "/quote.html"] # Your conversion pages
```

### **3. Deploy Cloudflare Worker**
```bash
cd worker
wrangler login
wrangler secret put OPENAI_API_KEY
# Paste your OpenAI API key

# Create KV namespace
wrangler kv:namespace create "NIMBUS_CACHE"
# Copy the namespace ID to wrangler.toml

wrangler deploy --env=""
```

### **4. First Optimization Run**
```bash
cd ..
gulp nimbus:scan:map --folder ../your-html-folder --limit 5 --batch first-test
gulp nimbus:plan --batch first-test
gulp nimbus:propose:v2 --batch first-test
gulp nimbus:preview --batch first-test --open
```

---

## 📋 **Complete Configuration Reference**

### **profile.yaml - Business Configuration**
```yaml
# Business Identity
name: "Repairs by Post"                    # Your business name
domain: "repairsbypost.com"               # Your domain
goal: "Maximise quote submissions"        # Business goal

# Services & Market
services: ["watch-repair", "battery-replacement"] # What you offer
geo_scope: ["UK"]                         # Geographic coverage
brands: ["Rolex", "Omega", "TAG Heuer"]   # Brands you work with

# Conversion & Trust
money_pages: ["/start-repair.html", "/contact.html"] # Revenue pages
trust_links:
  trustpilot: "https://uk.trustpilot.com/review/yourdomain.com"
  google: "https://g.page/YourBusiness"
  
# Business Details  
phone: "0800 121 6030"
hours: "9am-5pm GMT Mon-Fri"
guarantee: "12-month guarantee"
review_count: "1.5K+"
```

### **_directive.yaml - Page Family Rules**
```yaml
families:
  local:
    pattern: "branches/*"              # URL pattern matching
    type: "local" 
    tone: "local-shop"                 # Tone profile to use
    cta_priority: "high"
    schema_types: ["LocalBusiness", "BreadcrumbList"]
    
  brand:
    pattern: "brand/*"
    type: "brand"
    tone: "corporate"
    schema_types: ["Service", "BreadcrumbList"]
```

### **_tone-profiles.yaml - Business Personality**
```yaml
startup:
  personality: "Dynamic, innovative, growth-focused"
  language: "We're disrupting, game-changing, next-level"
  cta_style: "Join the revolution, Get started now"
  
corporate:
  personality: "Professional, trustworthy, established"  
  language: "Industry-leading, proven expertise, reliable"
  cta_style: "Contact our team, Schedule consultation"
```

### **_link-config.yaml - URL Strategy**
```yaml
link_pools:
  high_value: ["dist/brands/"]          # High-authority pages
  local: ["dist/local/"]                # Local service pages
  money: ["dist/contact/", "dist/quote/"] # Conversion pages
  
strategic_linking:
  local_to_brands: 2                    # Links from local to brand pages
  max_links_per_page: 5                 # Total strategic links
```

---

## 🔧 **Advanced Features**

### **Data Attributes for Content Control**
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

### **Cache Performance Monitoring**
```bash
# Check cache performance
curl https://your-worker.workers.dev/cache-stats

# Expected response:
{
  "cache_hits": 45,
  "cache_misses": 12, 
  "hit_rate": "78.9%"
}
```

---

## 🎯 **Workflow Commands**

### **Full Optimization Workflow**
```bash
# 1. Scan HTML files
gulp nimbus:scan:map --folder dist --limit 10 --batch my-batch

# 2. Plan optimization strategy  
gulp nimbus:plan --batch my-batch

# 3. Generate AI proposals
gulp nimbus:propose:v2 --batch my-batch

# 4. Preview changes
gulp nimbus:preview --batch my-batch --open

# 5. Approve changes
gulp nimbus:approve --batch my-batch --mode auto

# 6. Apply optimizations
gulp nimbus:apply --batch my-batch --backup
```

### **URL Discovery & Analysis**
```bash
# Discover all available pages for linking
gulp nimbus:discover:urls

# Analyze link opportunities
gulp nimbus:scan:map --folder dist --batch analysis
```

---

## 🚨 **Troubleshooting**

### **Common Issues**
- **Node.js version**: Use v20+ (`nvm use 20`)
- **OpenAI API key**: Check `wrangler secret list`
- **KV binding**: Verify namespace ID in `wrangler.toml`
- **Cache not hitting**: Check debug logs in response payload

### **Performance Optimization**
- **Cache hit rate**: Aim for >80% in development
- **Token usage**: Monitor via debug logs
- **Response times**: <1s for cache hits, <30s for new content

---

## ✅ **Success Checklist**

- [ ] Node.js v20+ installed
- [ ] Cloudflare Worker deployed successfully  
- [ ] OpenAI API key configured
- [ ] KV cache working (test with repeated requests)
- [ ] Profile configured for your business
- [ ] First optimization run completed
- [ ] Preview URLs accessible and showing changes
- [ ] Cache performance >80% hit rate

**Ready for production optimization! 🎉**

