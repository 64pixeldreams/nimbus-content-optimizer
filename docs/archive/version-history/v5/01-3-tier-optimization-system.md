# 3-Tier Optimization System

**Priority:** HIGH  
**Complexity:** MEDIUM  
**Impact:** REVOLUTIONARY  

## 🎯 **Overview**

Build a progressive 3-tier optimization system where each tier builds on the previous one, with intelligent caching making subsequent tiers progressively faster.

## 🚀 **Technical Specification**

### **Tier Architecture:**
```javascript
// Tier 1: Meta-Only
const metaResult = await optimizeMeta(contentMap, profile, directive);

// Tier 2: Above-Fold (builds on Tier 1)
const aboveFoldResult = await optimizeAboveFold(contentMap, profile, directive, metaResult);

// Tier 3: Full Page (builds on Tier 1 + 2)
const fullPageResult = await optimizeFullPage(contentMap, profile, directive, metaResult, aboveFoldResult);
```

### **Cache Key Strategy:**
```javascript
// Same base payload ensures cache compatibility across tiers
const baseCacheKey = generateCacheKey({
  content_map: contentMap,
  profile: profile,
  directive: directive
});

const tierCacheKey = `${baseCacheKey}-tier-${tierLevel}`;
```

### **Progressive Result Structure:**
```json
{
  "tier_1": {
    "head": {
      "title": "AI optimized title",
      "metaDescription": "AI optimized description"
    },
    "confidence": 0.95,
    "cached": true
  },
  "tier_2": {
    "blocks": [
      {"selector": "h1", "new_text": "Hero headline"},
      {"selector": "h2", "new_text": "Hero subheadline"}
    ],
    "ctas": [
      {"selector": ".cta-1", "new_anchor": "Primary CTA"}
    ],
    "confidence": 0.92,
    "cached": false
  },
  "tier_3": {
    "blocks": [...], // All remaining content blocks
    "links": [...],
    "alts": [...],
    "schema": {...},
    "confidence": 0.88,
    "cached": false
  }
}
```

## 🔧 **Implementation Tasks**

### **1. Create Tier-Specific Tasks:**
- `gulp nimbus:meta` - Tier 1 only
- `gulp nimbus:above-fold` - Tier 1 + 2
- `gulp nimbus:full-page` - Tier 1 + 2 + 3

### **2. Progressive Cache System:**
- Check for existing tier results
- Merge cached results with new optimizations
- Invalidate cache intelligently when content changes

### **3. Unified Result Format:**
- Consistent response structure across tiers
- Progressive enhancement of results
- Backward compatibility with existing systems

### **4. Performance Optimization:**
- Minimize AI calls through intelligent caching
- Progressive loading of optimization results
- Cache warming strategies

## 📊 **Expected Performance**

| Scenario | Tier 1 | Tier 2 | Tier 3 |
|----------|--------|--------|--------|
| Cold cache | 2s | 5s | 30s |
| Warm cache | 2s | 3s | 12s |
| Hot cache | 0.1s | 0.2s | 0.5s |

## 🎯 **Success Criteria**

- [ ] All three tiers work independently
- [ ] Progressive caching reduces subsequent tier execution time by 40%+
- [ ] Results are mergeable and consistent across tiers
- [ ] UI shows progressive enhancement clearly
- [ ] Cache invalidation works correctly when content changes

## 🚀 **Business Impact**

- **Perfect freemium ladder** - natural upgrade path
- **Faster iteration** - quick tests before full commitment  
- **Cost optimization** - avoid unnecessary AI calls
- **Better user experience** - immediate value at each tier

## 🔗 **Dependencies**

- Existing AI worker infrastructure
- Cache system (KV or similar)
- Preview system for result display
- Task runner system (Gulp)

