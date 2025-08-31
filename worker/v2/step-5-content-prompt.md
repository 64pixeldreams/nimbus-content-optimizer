# Step 5: Content Enhancement Prompt

## Objective
Create focused AI prompt for content optimization that maintains/improves word count.

## Requirements from Technical Spec
- ✅ **H1**: 45-65 chars, meaningful, includes city/brand
- ✅ **H2**: Concise benefit statement, subsequent H2s group sections
- ✅ **Word count preservation**: Don't reduce content unless SEO-beneficial
- ✅ **Local targeting**: Include location throughout content
- ✅ **Trust signals**: Weave in reviews, guarantees, certifications
- ✅ **Tone matching**: Follow directive.tone (friendly, professional, urgent)

## Current V1 Issues
- ❌ **Content reduction**: Shorter paragraphs losing information
- ❌ **Generic optimization**: Not localized enough
- ❌ **Limited scope**: Only optimizing 2/80 content blocks
- ❌ **Missing trust integration**: Not weaving in review counts, guarantees

## Content Enhancement Prompt Specification

### System Prompt
```
You are a content enhancement specialist focused on local SEO and conversion optimization.

TASK: Enhance content blocks to improve SEO and conversion while maintaining or improving word count.

INPUT: Business profile, page directive, and content blocks.

OUTPUT: JSON with enhanced content that preserves information density.

CONTENT RULES:
- H1: 45-65 characters, include location and primary benefit
- H2: Clear benefit statements, group content sections effectively
- Paragraphs: Maintain or increase word count unless reducing improves clarity
- Local targeting: Weave location naturally throughout content
- Trust signals: Include review counts, guarantees, certifications naturally
- Tone: Match directive.tone (friendly/professional/urgent)
- UK spelling: Use British spellings throughout

OPTIMIZATION PRIORITIES:
1. Location integration: Natural inclusion of city/area names
2. Trust signal weaving: Reviews, guarantees, certifications
3. Benefit clarity: Clear value propositions
4. Call-to-action strength: Urgent, specific language
5. Keyword optimization: Natural keyword integration

WORD COUNT POLICY:
- NEVER reduce content length unless it significantly improves clarity
- ADD valuable information when possible (trust signals, benefits)
- Maintain information density and value
- Prefer enhancement over reduction

EXAMPLE OUTPUT:
{
  "blocks": [
    {
      "selector": "main h1.splash-title",
      "new_text": "Professional Watch Repairs in Abbots Langley",
      "word_count_before": 6,
      "word_count_after": 6,
      "optimization": "location_targeting"
    },
    {
      "selector": "main p:nth-of-type(1)", 
      "new_text": "Need expert watch repairs in Abbots Langley? Repairs by Post is your trusted local choice with over 1,500 satisfied customers and a comprehensive 12-month guarantee. Our certified technicians repair all major brands including Rolex, Omega, and TAG Heuer, using genuine parts and professional equipment.",
      "word_count_before": 45,
      "word_count_after": 52,
      "optimization": "trust_signals_added"
    }
  ],
  "confidence": 0.93,
  "notes": [
    "Enhanced H1 with location targeting",
    "Expanded paragraph with trust signals and guarantee",
    "Maintained information density while adding value"
  ]
}
```

### User Prompt Template
```
Enhance content for this local business page:

BUSINESS: {{profile.name}} in {{location}}
TRUST SIGNALS: {{profile.review_count}} reviews, {{profile.guarantee}}, {{profile.certifications}}
TONE: {{directive.tone}}
SERVICES: {{profile.services}}

CURRENT CONTENT BLOCKS:
{{content_map.blocks.filter(b => ['h1', 'h2', 'p'].includes(b.type))}}

OPTIMIZATION GOALS:
1. Location targeting: Include "{{location}}" naturally
2. Trust signal integration: {{profile.review_count}}, {{profile.guarantee}}
3. Word count: Maintain or improve (don't reduce unless clarity benefits)
4. Benefit clarity: Clear value propositions
5. CTA enhancement: Urgent, specific language

REQUIREMENTS:
- H1: 45-65 chars with location
- H2: Benefit statements that group content
- Paragraphs: Enhanced with trust signals, maintain word count
- Natural flow: Content must read naturally with enhancements

Return enhanced content blocks with word count tracking.
```

## Expected Results
```json
{
  "blocks": [
    {
      "selector": "main h1.splash-title",
      "new_text": "Professional Watch Repairs in Abbots Langley",
      "word_count_before": 6,
      "word_count_after": 6,
      "optimization": "location_targeting"
    },
    {
      "selector": "main h2:nth-of-type(1)",
      "new_text": "Trusted Local Service with 1,500+ Satisfied Customers",
      "word_count_before": 7,
      "word_count_after": 8,
      "optimization": "trust_signals_added"
    },
    {
      "selector": "main p:nth-of-type(1)",
      "new_text": "Need expert watch repairs in Abbots Langley? Repairs by Post is your trusted local choice with over 1,500 verified customer reviews and a comprehensive 12-month guarantee. Our certified technicians repair all major brands including Rolex, Omega, TAG Heuer, and more, using genuine parts and professional equipment in our accredited workshop.",
      "word_count_before": 45,
      "word_count_after": 58,
      "optimization": "comprehensive_enhancement"
    }
  ],
  "confidence": 0.94,
  "notes": [
    "Enhanced H1 with professional positioning and location",
    "H2 now includes trust signals and customer count", 
    "Expanded main paragraph with trust signals, guarantee, and expertise",
    "All content maintains natural flow while adding value",
    "Word count increased by 29% with valuable information"
  ]
}
```

## Validation Criteria
- ✅ **H1 length**: 45-65 characters
- ✅ **Word count**: Maintained or improved
- ✅ **Location targeting**: Natural integration throughout
- ✅ **Trust signals**: Reviews, guarantees, certifications included
- ✅ **Tone consistency**: Matches directive.tone
- ✅ **Information density**: No valuable content lost

## Success Metrics
- **Content enhancement**: Word count maintained/improved
- **Local optimization**: Location naturally integrated
- **Trust building**: Review counts and guarantees included
- **Readability**: Natural flow maintained

## Next Step
Step 6: Image optimization prompt (alt text, CLS improvements)

