# Above-Fold Optimizer (Tier 2)

**Priority:** HIGH  
**Complexity:** MEDIUM  
**Impact:** HIGH (Premium Feature)  

## 🎯 **Overview**

Fast (3-5s) optimizer that builds on Tier 1 meta results and adds hero section optimization (H1, H2, primary/secondary CTAs). Perfect for conversion testing and tone validation.

## 🚀 **Key Features**

- **Builds on Tier 1** - Uses cached meta results + adds hero optimization
- **Conversion focused** - Optimizes the critical above-fold area
- **Tone testing** - Perfect for validating brand personality
- **Premium positioning** - Natural upgrade from meta-only
- **Cache intelligent** - Faster when Tier 1 already run

## 🔧 **Technical Specification**

### **Progressive Enhancement:**
```javascript
// Load Tier 1 results if available
const tier1Results = await getCachedResults(`${baseKey}-meta-only`);

// Extract above-fold content for optimization
const aboveFoldContentMap = {
  route: contentMap.route,
  head: tier1Results?.head || contentMap.head, // Use optimized meta if available
  blocks: contentMap.blocks.slice(0, 8), // First 8 blocks (above-fold)
  hero_elements: extractHeroElements(contentMap)
};
```

### **AI Prompt Focus:**
```javascript
const aboveFoldDirective = {
  ...directive,
  optimization_focus: 'hero_section_conversion',
  priority: 'above_fold_engagement',
  instructions: `
    Optimize the hero section for maximum conversion impact:
    - H1: Compelling headline that grabs attention (${directive.tone} tone)
    - H2: Value proposition that supports H1
    - Primary CTA: Action-focused, urgent, specific
    - Secondary CTA: Alternative action for different user intent
    - Apply ${directive.tone} personality strongly throughout
    - Focus on reducing bounce rate and increasing engagement
  `
};
```

### **Output Format:**
```json
{
  "tier": 2,
  "optimization_type": "above_fold",
  "head": {
    // Inherited from Tier 1 or newly optimized
    "title": "Expert Hublot Watch Repair UK | 12-Month Guarantee",
    "metaDescription": "Professional Hublot repair service with free UK collection..."
  },
  "hero_section": {
    "headline": "Your Hublot Deserves Expert Care",
    "subheadline": "Professional Swiss watch repair with 12-month guarantee and free UK collection",
    "primary_cta": {
      "text": "Get Free Quote (2 mins)",
      "href": "/start-repair",
      "style": "primary"
    },
    "secondary_cta": {
      "text": "Call Expert Now",
      "href": "tel:08001216030",
      "style": "secondary"
    },
    "value_props": [
      "1.5K+ Happy Customers",
      "12-Month Guarantee", 
      "Free UK Collection"
    ]
  },
  "blocks": [
    {
      "selector": "h1",
      "new_text": "Your Hublot Deserves Expert Care",
      "optimization_reason": "Emotional connection + brand focus"
    },
    {
      "selector": "h2", 
      "new_text": "Professional Swiss watch repair with 12-month guarantee and free UK collection",
      "optimization_reason": "Value proposition with trust signals"
    }
  ],
  "ctas": [
    {
      "selector": ".cta-primary",
      "new_anchor": "Get Free Quote (2 mins)",
      "new_href": "/start-repair",
      "cta_type": "primary",
      "conversion_strategy": "urgency + time commitment"
    }
  ],
  "confidence": 0.92,
  "optimizations_made": 5,
  "tier_1_cached": true,
  "cache_key": "content-hash-above-fold",
  "execution_time_ms": 3247
}
```

## 🎨 **UI Display**

### **Hero Section Preview:**
```html
<!-- Interactive hero section preview -->
<div class="hero-preview">
  <div class="hero-content">
    <h1 class="hero-headline">Your Hublot Deserves Expert Care</h1>
    <h2 class="hero-subheadline">Professional Swiss watch repair with 12-month guarantee and free UK collection</h2>
    <div class="hero-ctas">
      <a href="#" class="cta primary">Get Free Quote (2 mins)</a>
      <a href="#" class="cta secondary">Call Expert Now</a>
    </div>
    <div class="hero-values">
      <span class="value">1.5K+ Happy Customers</span>
      <span class="value">12-Month Guarantee</span>
      <span class="value">Free UK Collection</span>
    </div>
  </div>
  <div class="hero-meta">premium-new tone • 92% confidence • 3.2s</div>
</div>
```

### **Google SERP + Hero Preview:**
```html
<div class="combined-preview">
  <!-- SERP appearance -->
  <div class="serp-section">
    <h3>🔍 How it appears in search</h3>
    <div class="serp-result">[Standard SERP preview]</div>
  </div>
  
  <!-- Hero section appearance -->
  <div class="hero-section">
    <h3>🎯 Above-fold experience</h3>
    <div class="hero-preview">[Interactive hero preview]</div>
  </div>
</div>
```

## 🚀 **Implementation**

### **1. Create Above-Fold Task:**
```bash
# Standalone (will run Tier 1 + 2)
gulp nimbus:above-fold --batch test --pages page1 --tone premium-new

# Progressive (uses Tier 1 cache)
gulp nimbus:meta --batch test --pages page1
gulp nimbus:above-fold --batch test --pages page1  # Faster due to cache
```

### **2. Progressive Cache Integration:**
```javascript
// Check for Tier 1 results
const tier1Results = await getCachedResults(`${baseKey}-tier-1`);
const startTime = Date.now();

let metaResults;
if (tier1Results && tier1Results.cached) {
  console.log('✅ Using cached Tier 1 results');
  metaResults = tier1Results.head;
} else {
  console.log('🔄 Running Tier 1 optimization first');
  metaResults = await optimizeMeta(contentMap, profile, directive);
}

// Run Tier 2 optimization
const aboveFoldResults = await optimizeAboveFold(contentMap, profile, directive, metaResults);
```

### **3. Smart Content Extraction:**
```javascript
function extractHeroElements(contentMap) {
  const heroElements = {
    headline: null,
    subheadline: null,
    ctas: [],
    value_props: []
  };
  
  // Extract from first 8 blocks (typical above-fold)
  const aboveFoldBlocks = contentMap.blocks.slice(0, 8);
  
  aboveFoldBlocks.forEach(block => {
    if (block.type === 'h1' && !heroElements.headline) {
      heroElements.headline = block.text;
    }
    if (block.type === 'h2' && !heroElements.subheadline) {
      heroElements.subheadline = block.text;
    }
    if (block.type === 'a' && block.href) {
      heroElements.ctas.push({
        text: block.anchor,
        href: block.href,
        position: heroElements.ctas.length + 1
      });
    }
  });
  
  return heroElements;
}
```

## 📊 **Performance Targets**

- **Execution time:** 3-5s (standalone), 1-3s (with Tier 1 cache)
- **Cache utilization:** >80% Tier 1 cache hit rate
- **Confidence score:** >90% for hero optimizations
- **Conversion elements:** Optimize 3-5 above-fold elements
- **Tone consistency:** Strong personality differentiation

## 💰 **Business Model Integration**

### **Premium Tier Features:**
- **50 above-fold optimizations/month**
- Perfect for conversion testing
- Ideal for tone validation before full optimization
- Professional preview interface

### **Value Proposition:**
- "Test your hero section in seconds"
- "Perfect conversion optimization without full commitment"
- "See exactly how visitors experience your page"
- "Validate tone before full optimization"

## 🎯 **Success Criteria**

- [ ] Progressive enhancement from Tier 1 working
- [ ] 40%+ speed improvement when Tier 1 cached
- [ ] Beautiful hero section preview UI
- [ ] Strong tone differentiation visible
- [ ] High conversion element optimization quality
- [ ] Seamless upgrade path to Tier 3

## 🔗 **Integration Points**

- **Tier 1 (Meta):** Uses cached results for faster execution
- **Tier 3 (Full page):** Provides cached hero results
- **Tone testing:** Perfect for rapid tone validation
- **Conversion testing:** A/B test hero sections quickly
