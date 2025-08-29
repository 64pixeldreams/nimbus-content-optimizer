# Step 4: Deep Linking Strategy Prompt

## Objective
Create focused AI prompt for deep linking optimization (≥3 links per page requirement).

## Requirements from Technical Spec
- ✅ **Deep linking quota**: ≥3 per page (CRITICAL MISSING IN V1)
- ✅ **Money link**: /start-repair.html (conversion focus)
- ✅ **Service link**: /watch-repairs/<service> (battery, glass, crown, bezel, vintage, movement, strap)
- ✅ **Context link**: Brand or sibling city when relevant
- ✅ **Trust links**: Fill empty Trustpilot/Google hrefs from profile.trust_links
- ✅ **Upgrade existing**: Prefer upgrading anchors before creating new ones

## Current V1 Issues
- ❌ **0/3 deep links**: Completely missing service and context links
- ❌ **Empty trust links**: Trustpilot/Google hrefs not filled
- ❌ **No service targeting**: Missing battery, glass, crown links
- ❌ **No sibling cities**: Missing context links

## Deep Linking Prompt Specification

### System Prompt
```
You are a deep linking specialist focused on internal link optimization and trust signal enhancement.

TASK: Create internal linking strategy that achieves ≥3 links per page for SEO authority distribution.

INPUT: Business profile, page content, and existing links.

OUTPUT: JSON with link modifications and additions.

LINKING STRATEGY:
1. Money link: Ensure strong CTA to conversion page
2. Service link: Link to relevant service pages (/watch-repairs/battery-replacement, etc.)
3. Context link: Brand pages (/brand/rolex-repair) or sibling cities (/branches/nearby-city)
4. Trust links: Fill empty Trustpilot/Google hrefs

ALLOWED DESTINATIONS:
- Money pages: /start-repair.html, /contact.html, /how-it-works.html
- Service pages: /watch-repairs/* (battery, glass, crown, bezel, vintage, movement, strap)
- Brand pages: /brand/* (rolex, omega, tag-heuer, etc.)
- Sibling cities: /branches/* (nearby locations)

RULES:
- Upgrade existing anchors first, create new ones only if needed
- Use natural anchor text that fits the content context
- Fill empty trust links with profile.trust_links URLs
- Ensure links are contextually relevant to the content

EXAMPLE OUTPUT:
{
  "links": [
    {
      "selector": "main a.btn-success",
      "new_anchor": "Get your free estimate (2 mins)",
      "new_href": "/start-repair.html",
      "type": "money"
    },
    {
      "selector": "main p:contains('battery')",
      "wrap_text": "battery replacement",
      "new_anchor": "battery replacement",
      "new_href": "/watch-repairs/watch-battery-replacement",
      "type": "service"
    },
    {
      "selector": "main a:contains('Trustpilot')",
      "new_href": "https://uk.trustpilot.com/review/repairsbypost.com",
      "type": "trust"
    }
  ],
  "confidence": 0.92,
  "notes": ["Added service link for battery replacement", "Filled trust links"]
}
```

### User Prompt Template
```
Create deep linking strategy for this page:

BUSINESS: {{profile.name}} serving {{profile.geo_scope}}
SERVICES: {{profile.services}} (link to /watch-repairs/*)
BRANDS: {{profile.brands}} (link to /brand/*)
TRUST LINKS: {{profile.trust_links}}

PAGE CONTENT ANALYSIS:
Route: {{content_map.route}}
Type: {{directive.type}}
Existing links: {{content_map.blocks.filter(b => b.type === 'a')}}

CURRENT GAPS:
- Empty trust links detected: {{flags.emptyTrustLinks}}
- Service mentions needing links: {{detect_service_mentions}}
- Brand mentions needing links: {{detect_brand_mentions}}

TARGET: ≥3 internal links (1 money + 1 service + 1 context)

REQUIREMENTS:
1. Fill empty trust links (Trustpilot/Google)
2. Add service link for mentioned services
3. Add brand/context link if relevant
4. Ensure natural anchor text integration

Return JSON with link strategy.
```

## Expected Results
```json
{
  "links": [
    {
      "selector": "main a.btn-success",
      "new_anchor": "Get your free estimate (2 mins)", 
      "new_href": "/start-repair.html",
      "type": "money"
    },
    {
      "selector": "main li:contains('battery')",
      "wrap_text": "Watch battery replacement service",
      "new_anchor": "battery replacement service",
      "new_href": "/watch-repairs/watch-battery-replacement", 
      "type": "service"
    },
    {
      "selector": "main p:contains('Rolex')",
      "wrap_text": "Rolex",
      "new_anchor": "Rolex watch repair",
      "new_href": "/brand/rolex-watch-repair",
      "type": "brand"
    },
    {
      "selector": "main a:contains('Trustpilot')[href='']",
      "new_href": "https://uk.trustpilot.com/review/repairsbypost.com",
      "type": "trust"
    }
  ],
  "confidence": 0.88,
  "notes": [
    "Achieved 4/3 required deep links",
    "Filled empty trust links",
    "Added contextual service and brand links"
  ]
}
```

## Validation Criteria
- ✅ **Link count**: ≥3 internal links achieved
- ✅ **Trust links**: Empty hrefs filled from profile
- ✅ **Service links**: At least 1 service page linked
- ✅ **Natural integration**: Anchor text fits content context
- ✅ **Allowed destinations**: All links follow technical spec rules

## Success Metrics
- **Deep link quota**: ≥3 links per page (CRITICAL)
- **Trust link completion**: 100% empty trust links filled
- **Service coverage**: Key services linked appropriately
- **Context relevance**: Brand/city links where applicable

## Next Step
Step 5: Content enhancement prompt (H1, H2, paragraphs with word count preservation)
