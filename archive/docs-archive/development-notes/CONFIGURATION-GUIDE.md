# 🔧 Nimbus Configuration Guide - Advanced Setup & Customization

## 🎯 **Configuration Files Overview**

### **Core Configuration Files**
- **`profile.yaml`** - Business identity, services, contact info
- **`_directive.yaml`** - Page family rules and optimization strategy  
- **`_tone-profiles.yaml`** - Business personality and voice
- **`_link-config.yaml`** - URL strategy and linking rules

---

## 📋 **profile.yaml - Business Configuration**

### **Complete Configuration Example**
```yaml
# Business Identity
name: "Repairs by Post"
domain: "repairsbypost.com"
goal: "Maximise quote submissions and watch repair bookings"

# Services & Market
services:
  - "watch-repair"
  - "battery-replacement"
  - "glass-replacement"
  - "crown-replacement"
  - "movement-repair"

geo_scope: ["UK"]
brands: ["Rolex", "Omega", "Breitling", "TAG Heuer"]

# Conversion Strategy
money_pages:
  - "/start-repair.html"
  - "/contact.html"
  - "/how-it-works.html"

# Trust & Social Proof
trust_links:
  trustpilot: "https://uk.trustpilot.com/review/repairsbypost.com"
  google: "https://g.page/RepairsByPost"

# Business Details
phone: "0800 121 6030"
hours: "9am-5pm GMT Mon-Fri"
guarantee: "12-month guarantee"
shipping: "Free UK shipping, fully tracked and insured"
review_count: "1.5K+"

# Default Images
default_share_image: "https://www.repairsbypost.com/share.jpg"
```

### **Configuration for Different Business Types**

**E-commerce Store:**
```yaml
name: "TechGear Store"
domain: "techgear.com"
goal: "Maximise online sales and cart conversions"
services: ["electronics", "accessories", "repairs"]
money_pages: ["/shop", "/checkout", "/cart", "/buy-now"]
geo_scope: ["UK", "EU"]
```

**Professional Services:**
```yaml
name: "Smith & Associates Law"
domain: "smithlaw.com" 
goal: "Generate consultation bookings and client inquiries"
services: ["legal-consultation", "contract-law", "litigation"]
money_pages: ["/contact", "/consultation", "/book-appointment"]
geo_scope: ["London", "South East"]
```

---

## 📄 **_directive.yaml - Page Family Rules**

### **Page Family Configuration**
```yaml
default:
  type: "local"
  tone: "professional"
  cta_priority: "high"
  
families:
  # Local service pages
  local:
    pattern: "branches/*"
    type: "local" 
    tone: "local-shop"               # Friendly, community-focused
    schema_types: ["LocalBusiness", "BreadcrumbList"]
    local_seo: true
    geo_targeting: true
    
  # Product/brand pages
  brand:
    pattern: "brand/*|products/*"
    type: "brand"
    tone: "corporate"               # Professional, trustworthy
    schema_types: ["Service", "BreadcrumbList"]
    brand_focus: true
    
  # Homepage/landing
  home:
    pattern: "index"
    type: "landing"
    tone: "startup"                 # Dynamic, innovative
    schema_types: ["Organization", "LocalBusiness"]
    conversion_focus: true
```

### **Advanced Page Rules**
```yaml
  # E-commerce product pages
  product:
    pattern: "shop/*|products/*"
    type: "product"
    tone: "modern-tech"
    schema_types: ["Product", "BreadcrumbList"] 
    conversion_focus: true
    price_optimization: true
    
  # Blog/content pages  
  blog:
    pattern: "blog/*|articles/*"
    type: "content"
    tone: "friendly"
    schema_types: ["Article", "BreadcrumbList"]
    educational_focus: true
    interlink_policy: "aggressive"
```

---

## 🎭 **_tone-profiles.yaml - Business Personality**

### **Tone Profile Examples**

**For Different Business Types:**
```yaml
# Tech Startup (Dynamic, Modern)
startup:
  personality: "Dynamic, innovative, growth-focused"
  language: "We're disrupting, game-changing, next-level, cutting-edge"
  cta_style: "Join the revolution, Get started now, Transform your business"
  formality: "casual-dynamic"

# Professional Services (Trustworthy)  
corporate:
  personality: "Professional, trustworthy, established"
  language: "Industry-leading, proven expertise, reliable solutions"
  cta_style: "Contact our team, Schedule consultation, Learn more"
  formality: "formal-professional"

# Local Business (Personal Touch)
local-shop:
  personality: "Friendly, personal, community-focused"
  language: "Your local experts, family business, personal service"
  cta_style: "Pop in today, Give us a call, Visit our shop"
  formality: "casual-friendly"
```

### **Custom Tone Creation**
```yaml
# Create your own tone profile
your-custom-tone:
  personality: "Your business personality description"
  language: "Key phrases and language style you want to use"
  cta_style: "How your CTAs should sound"
  formality: "casual-friendly|formal-professional|casual-dynamic"
```

---

## 🔗 **_link-config.yaml - Strategic Linking**

### **Link Pool Configuration**
```yaml
# Define where high-value pages are located
link_pools:
  high_value: ["dist/brands/"]      # Authority pages
  local: ["dist/local/"]            # Local service pages  
  money: ["dist/contact/", "dist/shop/"] # Conversion pages
  help: ["dist/faq/", "dist/guides/"]    # Support content

# Strategic linking rules
strategic_linking:
  local_to_brands: 2                # Local pages link to 2 brand pages
  brands_to_money: 1                # Brand pages link to 1 money page
  max_links_per_page: 5             # Total strategic links per page
  
# Link upgrade rules
upgrade_rules:
  upgrade_generic_anchors: true     # "Click here" → "Watch Repair Services"
  add_missing_links: true           # Fill gaps in linking strategy
  preserve_external: true           # Keep external links unchanged
```

---

## 🚨 **Common Configuration Scenarios**

### **Multi-Location Business**
```yaml
# profile.yaml
geo_scope: ["UK"]
locations:
  - name: "London Office"
    areas: ["Central London", "Zone 1-3"]
    phone: "020 7123 4567"
  - name: "Manchester Office"  
    areas: ["Greater Manchester", "M1-M99"]
    phone: "0161 123 4567"
```

### **E-commerce Configuration**
```yaml
# profile.yaml  
goal: "Maximise online sales and conversions"
money_pages: ["/shop", "/checkout", "/cart", "/buy-now"]
services: ["product-sales", "customer-support", "shipping"]

# _directive.yaml
families:
  product:
    pattern: "shop/*"
    tone: "modern-tech"
    conversion_focus: true
    schema_types: ["Product", "Offer"]
```

### **Professional Services**
```yaml
# profile.yaml
goal: "Generate consultation bookings and client inquiries"  
money_pages: ["/contact", "/consultation", "/book-appointment"]
services: ["legal-advice", "consultation", "representation"]

# _directive.yaml
families:
  service:
    pattern: "services/*"
    tone: "corporate"
    trust_emphasis: true
    schema_types: ["Service", "ProfessionalService"]
```

---

## 🔍 **Configuration Testing & Validation**

### **Test Your Configuration**
```bash
# Test configuration loading
gulp nimbus:plan --batch config-test

# Check URL discovery
gulp nimbus:discover:urls

# Test tone profiles
gulp nimbus:scan:map --folder dist --limit 1 --batch tone-test
gulp nimbus:plan --batch tone-test
# Check console output for tone application
```

### **Validation Checklist**
- [ ] Profile loads without errors
- [ ] Page families match your URL structure  
- [ ] Tone profiles reflect your business personality
- [ ] Money pages correctly identified
- [ ] Link pools contain your high-value content
- [ ] Trust links point to your review profiles

---

## 🎯 **Advanced Configuration**

### **Data Attributes for Content Control**
```html
<!-- Skip content from optimization -->
<div class="customer-reviews" data-nimbus="ignore">
  Customer testimonials that shouldn't be changed...
</div>

<!-- Prioritize important content -->
<div class="main-cta" data-nimbus="priority">
  Your most important call-to-action...
</div>
```

### **Custom Business Goals**
```yaml
# Different business goals affect optimization strategy
goal: "Maximise quote submissions"        # Service businesses
goal: "Increase online sales"            # E-commerce  
goal: "Generate consultation bookings"   # Professional services
goal: "Build brand awareness"            # Marketing campaigns
goal: "Drive phone inquiries"            # Local businesses
```

---

## 📊 **Configuration Best Practices**

### **DO:**
- ✅ Use specific, descriptive service names
- ✅ Include all your money/conversion pages
- ✅ Choose tone that matches your brand personality
- ✅ Test configuration with small batches first
- ✅ Monitor cache performance and hit rates

### **DON'T:**
- ❌ Use vague service descriptions
- ❌ Forget to include conversion pages in money_pages
- ❌ Mix conflicting tone profiles on same site
- ❌ Skip testing before running large batches
- ❌ Ignore cache performance metrics

---

## 🚀 **Ready for Production**

Once configured, your Nimbus system will deliver:
- **Intelligent content optimization** based on your business type
- **Consistent brand voice** across all pages
- **Strategic linking** for SEO authority distribution  
- **Conversion-focused CTAs** for your money pages
- **Local SEO optimization** for geographic targeting
- **95% faster performance** with KV caching

**Your content optimization system is now fully customized for your business! 🎉**

