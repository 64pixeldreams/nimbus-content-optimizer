# Step 4: Deep Linking Strategy Prompt (Hybrid Approach)

## Objective
Create focused AI prompt for strategic deep linking using discovered URL pools and content analysis.

## Strategic Link Juice Approach
**"Fishing Net" Strategy**: Local/brand pages are great fishing nets for distributing link authority:
- **3000 local pages** → **150 brand pages** = Massive authority boost for brands
- **150 brand pages** → **3000 local pages** = Authority distribution back to locals
- **Content relevance** = AI selects most contextual links from available pools

## Requirements from Technical Spec
- ✅ **Deep linking quota**: ≥3 per page (CRITICAL MISSING IN V1)
- ✅ **Money link**: Primary conversion page
- ✅ **Service link**: Relevant service from available pool
- ✅ **Context link**: Brand or sibling city from available pool
- ✅ **Trust links**: Fill empty Trustpilot/Google hrefs
- ✅ **Strategic authority**: Links that boost overall site SEO

## URL Discovery System (Step 4A)
**Before AI prompt, discover available URLs from project:**

### 4A.1 Configuration-Driven Link Pools
```yaml
# _link-config.yaml (project-specific)
link_pools:
  high_value_folders: 
    - 'dist/brands/'      # 150 brand pages (high authority targets)
    - 'dist/services/'    # Service category pages
  
  local_folders:
    - 'dist/branches/'    # 3000 local pages (authority sources)
    - 'dist/locations/'   # Geographic variations
    
  money_pages:
    - '/start-repair.html'
    - '/contact.html'
    - '/how-it-works.html'
    
  help_pages:
    - 'dist/information/' # FAQ, guides, trust content
    - 'dist/faq/'

link_strategy:
  local_to_brands: 2      # Each local page → 2 brand pages
  local_to_services: 1    # Each local page → 1 service page
  brands_to_local: 3      # Each brand page → 3 local pages
  max_links_per_page: 5   # Don't over-optimize
  
priority_rules:
  content_mentions: 'high'    # Link brands/services mentioned in content
  geographic_proximity: 'medium'  # Link nearby local pages
  authority_value: 'high'     # Prioritize high-value targets
```

### 4A.2 URL Discovery Implementation
```javascript
async function discoverAvailableUrls(linkConfig) {
  const availableUrls = {
    money_pages: linkConfig.money_pages,
    service_pages: await scanFolder(linkConfig.link_pools.service_folders),
    brand_pages: await scanFolder(linkConfig.link_pools.high_value_folders),
    local_pages: await scanFolder(linkConfig.link_pools.local_folders),
    help_pages: await scanFolder(linkConfig.link_pools.help_pages)
  };
  
  return availableUrls;
}
```

## Current V1 Issues (Fixed by URL Discovery)
- ❌ **0/3 deep links**: AI guessing non-existent URLs
- ❌ **Empty trust links**: Not using profile.trust_links  
- ❌ **No strategic linking**: Random instead of authority-focused
- ❌ **No content relevance**: Links not based on page content

## Enhanced Deep Linking Prompt Specification

### System Prompt (AI gets actual available URLs)
```
You are a strategic internal linking specialist focused on SEO authority distribution and user experience.

TASK: Create internal linking strategy using provided URL pools for maximum SEO benefit.

INPUT: Available URL pools, content analysis, and linking strategy rules.

STRATEGIC APPROACH:
- Local pages are "fishing nets" that distribute authority to high-value pages
- Brand pages are "authority targets" that benefit from many local page links
- Service pages are "conversion funnels" that guide users to money pages
- Geographic relevance and content mentions determine link selection

LINKING RULES:
1. ≥3 internal links per page (money + service + context)
2. Use ONLY URLs from provided available_urls pools
3. Prioritize content-relevant links (mentioned brands/services)
4. Fill empty trust links with provided trust_links
5. Respect max_links_per_page limit
6. Upgrade existing anchors before creating new ones

You must respond with valid JSON in this exact format:
{
  "links": [
    {
      "selector": "css_selector",
      "action": "upgrade|create|fill",
      "new_anchor": "anchor_text", 
      "new_href": "url_from_available_pools",
      "link_type": "money|service|brand|local|trust",
      "relevance_reason": "content_mention|geographic|authority"
    }
  ],
  "authority_strategy": {
    "links_added": 4,
    "authority_targets": ["brand_page_1", "service_page_1"],
    "link_juice_flow": "local_to_brand"
  },
  "confidence": 0.92,
  "notes": ["strategic linking decisions"]
}

AUTHORITY OPTIMIZATION:
- Maximize link juice flow to high-value pages
- Ensure geographic and content relevance
- Balance user experience with SEO benefit
- Create natural anchor text that fits content context

Return only valid JSON with strategic linking decisions.
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
