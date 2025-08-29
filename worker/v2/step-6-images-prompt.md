# Step 6: Image Optimization Prompt

## Objective
Create focused AI prompt for image optimization (alt text, CLS improvements).

## Requirements from Technical Spec
- ✅ **Alt text**: Every content image must have descriptive alt (brand/city when relevant)
- ✅ **ImageKit optimization**: tr:w-{width},h-{height},q-75,f-auto
- ✅ **CLS improvements**: Width/height attributes, loading="lazy", decoding="async"
- ✅ **Contextual descriptions**: Image purpose and business context
- ✅ **SEO optimization**: Keywords naturally integrated

## Current V1 Issues
- ❌ **Generic alt text**: "Watch repair service in Abbots Langley" (too basic)
- ❌ **Missing context**: Not describing actual image content
- ❌ **No CLS optimization**: Missing width/height recommendations
- ❌ **Limited coverage**: Only optimizing 3/8+ images

## Image Optimization Prompt Specification

### System Prompt
```
You are an image optimization specialist focused on accessibility, SEO, and Core Web Vitals.

TASK: Optimize image alt text and technical attributes for maximum SEO impact and accessibility.

INPUT: Business profile, page context, and image inventory.

OUTPUT: JSON with optimized alt text and technical recommendations.

ALT TEXT RULES:
- Descriptive and specific to actual image content
- Include location for local businesses when relevant
- Include brand names when showing branded content
- 50-125 characters optimal length
- Natural keyword integration without stuffing
- Accessibility-first approach

TECHNICAL OPTIMIZATION:
- Recommend width/height for CLS prevention
- Suggest loading="lazy" for below-fold images
- Recommend decoding="async" for non-critical images
- ImageKit optimization parameters

CONTEXT AWARENESS:
- Hero images: Emphasize primary business value
- Service images: Describe specific service shown
- Brand images: Include brand names and context
- Review images: Describe social proof context

EXAMPLE OUTPUT:
{
  "alts": [
    {
      "selector": "main img[src*='watch_repair_near_me']",
      "new_alt": "Professional watch repair workshop in Abbots Langley showing certified technicians working on luxury timepieces",
      "current_alt": "",
      "image_context": "hero_service",
      "technical_recommendations": {
        "loading": "eager",
        "decoding": "sync",
        "width": 600,
        "height": 400
      }
    },
    {
      "selector": "main img[src*='rbp_brands_lux']", 
      "new_alt": "Luxury watch brands repaired in Abbots Langley - Rolex, Omega, Breitling, TAG Heuer, and Cartier",
      "current_alt": "",
      "image_context": "brand_showcase",
      "technical_recommendations": {
        "loading": "lazy",
        "decoding": "async"
      }
    }
  ],
  "confidence": 0.96,
  "notes": [
    "Added descriptive alt text with location and service context",
    "Included brand names for SEO value",
    "Recommended CLS improvements for Core Web Vitals"
  ]
}
```

### User Prompt Template
```
Optimize images for this local business page:

BUSINESS: {{profile.name}} in {{location}}
SERVICES: {{profile.services}}
BRANDS: {{profile.brands}}
PAGE TYPE: {{directive.type}}

IMAGE INVENTORY:
{{content_map.blocks.filter(b => b.type === 'img').map(img => ({
  selector: img.selector,
  src: img.src,
  current_alt: img.alt,
  width: img.width,
  height: img.height
}))}}

OPTIMIZATION REQUIREMENTS:
1. Descriptive alt text (50-125 chars) with location when relevant
2. Include brand names for branded content
3. Describe actual image content, not just business name
4. Technical recommendations for CLS and performance
5. Accessibility-first approach

CONTEXT CLUES:
- Hero images: Primary service value proposition
- Brand images: Specific brands shown
- Service images: Specific services depicted
- Review images: Social proof and trust signals

Return optimized image data with technical recommendations.
```

## Expected Results for Abbots Langley Page
```json
{
  "alts": [
    {
      "selector": "main img[src*='watch_repair_near_me.png']",
      "new_alt": "Professional watch repair workshop in Abbots Langley with certified technicians servicing luxury timepieces",
      "technical_recommendations": {
        "loading": "eager",
        "decoding": "sync", 
        "imagekit_params": "tr=w-600,h-400,q-85,f-auto"
      }
    },
    {
      "selector": "main img[src*='rbp_brands_lux.png']",
      "new_alt": "Luxury watch brands serviced in Abbots Langley including Rolex, Omega, Breitling, TAG Heuer and Cartier",
      "technical_recommendations": {
        "loading": "lazy",
        "decoding": "async",
        "imagekit_params": "tr=w-600,h-50,q-75,f-auto"
      }
    },
    {
      "selector": "main img[src*='google_g_icon']",
      "new_alt": "Google Reviews - 1,500+ five-star reviews for watch repair services in Abbots Langley",
      "technical_recommendations": {
        "loading": "lazy", 
        "decoding": "async",
        "imagekit_params": "tr=w-200,h-200,q-75,f-auto"
      }
    }
  ],
  "confidence": 0.97,
  "notes": [
    "Added location-specific, descriptive alt text for all images",
    "Included brand names and service context for SEO value",
    "Recommended Core Web Vitals optimizations",
    "Enhanced accessibility with detailed image descriptions"
  ]
}
```

## Validation Criteria
- ✅ **Alt text quality**: Descriptive, specific, 50-125 characters
- ✅ **Location integration**: Natural inclusion where relevant
- ✅ **Brand inclusion**: Specific brands mentioned when shown
- ✅ **Technical optimization**: CLS and performance recommendations
- ✅ **Accessibility**: Screen reader friendly descriptions

## Success Metrics
- **Coverage**: All content images optimized
- **Quality**: Descriptive, contextual alt text
- **Technical**: CLS and performance improvements
- **SEO value**: Natural keyword integration

## Next Step
Step 7: Schema generation prompt (LocalBusiness, BreadcrumbList, FAQPage)
