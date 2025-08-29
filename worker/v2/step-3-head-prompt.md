# Step 3: Head Metadata Optimization Prompt

## Objective
Create focused AI prompt for optimizing page head metadata (title, meta description, canonical).

## Requirements from Technical Spec
- ✅ **Title**: 50-60 chars, include city/brand, pattern: "Watch Repairs in {{city}} | Free UK Postage & 12-Month Guarantee"
- ✅ **Meta description**: 140-165 chars, benefits + proof (reviews), avoid clickbait
- ✅ **Canonical**: Absolute URL, extensionless, matches page route
- ✅ **Local targeting**: Include location for local pages
- ✅ **Trust signals**: Reviews, guarantees, certifications

## Current V1 Issues
- ❌ Meta description too short (100 chars vs 140-165 requirement)
- ❌ Title not following pattern exactly
- ❌ Missing trust signals in meta description

## Head Optimization Prompt Specification

### System Prompt
```
You are a head metadata optimization specialist focused on local SEO and conversion.

TASK: Optimize page head metadata for maximum SEO impact and click-through rates.

INPUT: Business profile, page directive, and current head metadata.

OUTPUT: JSON with optimized title, metaDescription, and canonical.

RULES:
- Title: 50-60 characters, include location and key benefit
- Meta description: 140-165 characters, include trust signals and benefits  
- For local pages: Use pattern "Service in {{Location}} | Key Benefit & Trust Signal"
- Include review count, guarantee, and unique selling points
- UK spelling, conversion-focused language
- Never exceed character limits

EXAMPLE OUTPUT:
{
  "title": "Watch Repairs in Abbots Langley | Free UK Postage & 12-Month Guarantee",
  "metaDescription": "Expert watch repair service in Abbots Langley. Battery replacement, glass and movement servicing. Free tracked shipping both ways. 1.5K+ verified reviews.",
  "canonical": "https://repairsbypost.com/branches/watch-repairs-abbots-langley",
  "confidence": 0.95,
  "notes": ["Added location targeting", "Included trust signals", "Optimized for CTR"]
}
```

### User Prompt Template
```
Optimize head metadata for this page:

BUSINESS: {{profile.name}} ({{profile.domain}})
LOCATION: {{extracted_from_route}}
PAGE TYPE: {{directive.type}}
TRUST SIGNALS: {{profile.review_count}} reviews, {{profile.guarantee}}

CURRENT HEAD:
- Title: "{{current.title}}"
- Meta: "{{current.metaDescription}}"
- Canonical: "{{current.canonical}}"

REQUIREMENTS:
- Title: 50-60 chars, include "{{location}}" and key benefit
- Meta: 140-165 chars, include trust signals and benefits
- Canonical: {{profile.domain}}{{content_map.route}}

Return optimized JSON.
```

## Expected Results
```json
{
  "title": "Professional Watch Repairs in Abbots Langley | Free Collection & 12-Month Guarantee",
  "metaDescription": "Expert watch repair service in Abbots Langley. Rolex, Omega, TAG Heuer specialists. Free UK collection, 12-month guarantee, 1,500+ reviews. Quote in 2 mins.",
  "canonical": "https://repairsbypost.com/branches/watch-repairs-abbots-langley",
  "confidence": 0.95,
  "notes": [
    "Enhanced title with location and key benefits (58 chars)",
    "Optimized meta description with trust signals (164 chars)",
    "Added canonical URL following technical spec requirements"
  ]
}
```

## Validation Criteria
- ✅ Title length: 50-60 characters
- ✅ Meta description length: 140-165 characters  
- ✅ Location included for local pages
- ✅ Trust signals present (reviews, guarantee)
- ✅ Canonical URL format correct
- ✅ Confidence ≥ 90%

## Success Metrics
- **Character counts**: Title 50-60, Meta 140-165 (exact requirements)
- **Trust signal inclusion**: Reviews, guarantee, unique benefits
- **Local targeting**: Location prominently featured
- **CTR optimization**: Compelling, benefit-focused copy

## Next Step
Step 4: Deep linking strategy prompt (service links, brand links, sibling cities)
