# Step 2: Profile and Directive System

## Objective
Create a Gulp task that merges business profile configuration with page-specific directives to prepare data for AI optimization proposals.

## Input
- **Content maps**: From Step 1 (`.nimbus/maps/*.json`)
- **Profile config**: `profile.yaml` (business facts, trust links, services)
- **Directive config**: `_directive.yaml` (page family rules, tone, schema types)

## Output
- **Work batches**: `.nimbus/work/<batch_id>/` containing merged data ready for AI processing
- **Planning report**: Summary of pages to be processed with their configurations

## Technical Requirements

### 1. Gulp Task Setup
- **Task name**: `nimbus:plan`
- **CLI options**:
  - `--batch <id>`: Batch ID to process (required)
  - `--pages <list>`: Comma-separated list of specific page IDs (optional)
  - `--dry-run`: Show what would be planned without creating work files

### 2. Profile Loading
Load and validate `profile.yaml`:
```yaml
name: "Repairs by Post"
domain: "repairsbypost.com"
services: ["watch-repair", "battery-replacement", ...]
geo_scope: ["UK"]
goal: "Maximise quote submissions and watch repair bookings"
money_pages: ["/start-repair.html", "/contact.html", "/how-it-works.html"]
trust_links:
  trustpilot: "https://uk.trustpilot.com/review/repairsbypost.com"
  google: "https://g.page/RepairsByPost"
phone: "0800 121 6030"
hours: "9am-5pm GMT Mon-Fri"
guarantee: "12-month guarantee"
shipping: "Free UK shipping, fully tracked and insured up to £10,000 cover"
review_count: "1.5K+"
brands: ["Rolex", "Omega", "Breitling", ...]
```

### 3. Directive System
Create `_directive.yaml` with page family rules:
```yaml
# Default rules for all pages
default:
  type: "local"           # local|brand|service|info
  tone: "professional"    # professional|friendly|urgent
  cta_priority: "high"    # high|medium|low
  schema_types: ["LocalBusiness", "BreadcrumbList"]
  interlink_policy: "aggressive"  # aggressive|moderate|minimal
  trust_signals: ["reviews", "guarantee", "phone"]

# Page family overrides
families:
  local:
    pattern: "branches/*"
    type: "local"
    tone: "friendly"
    schema_types: ["LocalBusiness", "BreadcrumbList"]
    local_seo: true
    
  brand:
    pattern: "brand/*"
    type: "brand"
    tone: "professional"
    schema_types: ["Service", "BreadcrumbList"]
    brand_focus: true
    
  home:
    pattern: "index"
    type: "landing"
    tone: "urgent"
    cta_priority: "high"
    schema_types: ["Organization", "LocalBusiness"]
```

### 4. Page Classification
For each content map:
1. **Match pattern**: Determine which directive family applies
2. **Merge config**: Combine default + family-specific rules
3. **Validate requirements**: Ensure all required fields are present

### 5. Work Batch Creation
Create structured work batch:
```json
{
  "batch_id": "batch-2024-08-29-001",
  "created": "2024-08-29T01:46:07.106Z",
  "profile": { /* full profile config */ },
  "pages": [
    {
      "page_id": "watch-repairs-abbots-langley",
      "content_map": { /* from Step 1 */ },
      "directive": {
        "type": "local",
        "tone": "friendly", 
        "cta_priority": "high",
        "schema_types": ["LocalBusiness", "BreadcrumbList"],
        "interlink_policy": "aggressive",
        "trust_signals": ["reviews", "guarantee", "phone"],
        "local_seo": true
      },
      "status": "ready"
    }
  ],
  "summary": {
    "total_pages": 1,
    "by_type": { "local": 1 },
    "by_tone": { "friendly": 1 }
  }
}
```

### 6. Validation Rules
- **Profile validation**: Required fields present (name, domain, services, goal)
- **Directive validation**: All pages have matching directive rules
- **Content validation**: Content maps exist and are valid
- **Consistency checks**: No conflicting configurations

### 7. Planning Report
Generate summary report:
```
📋 NIMBUS PLANNING REPORT
Batch: batch-2024-08-29-001
Profile: Repairs by Post (repairsbypost.com)

📄 PAGES TO PROCESS (1):
✅ watch-repairs-abbots-langley [local/friendly] → LocalBusiness + BreadcrumbList
   Route: /branches/watch-repairs-abbots-langley
   CTA Priority: high | Trust Signals: reviews, guarantee, phone

📊 SUMMARY:
- Local pages: 1
- Brand pages: 0  
- Tone distribution: friendly(1)
- Schema types: LocalBusiness(1), BreadcrumbList(1)

🎯 OPTIMIZATION GOALS:
- Primary: Maximise quote submissions and watch repair bookings
- Money pages: /start-repair.html, /contact.html, /how-it-works.html
- Trust signals: 1.5K+ reviews, 12-month guarantee
```

## Success Criteria
1. **Profile loading**: Successfully loads and validates `profile.yaml`
2. **Directive system**: Matches pages to correct directive families
3. **Work batch creation**: Creates valid work batch JSON files
4. **Planning report**: Shows clear summary of planned optimizations
5. **Validation**: Catches configuration errors and missing data
6. **Flexibility**: Supports different page types and tones

## Implementation Notes
- Start with simple profile loading and validation
- Implement basic directive matching (pattern-based)
- Create work batch structure
- Add comprehensive validation
- Generate human-readable planning report

## Dependencies
- `yaml` (YAML parsing)
- `fs-extra` (file operations)
- `glob` (pattern matching)

## Next Steps
After Step 2 is complete:
- Step 3: AI proposal generation (send work batch to Cloudflare Worker)
- Step 4: Preview system (show proposed changes)

