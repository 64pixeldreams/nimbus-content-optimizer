# Step 3: AI Proposal Generation

## Objective
Create a Gulp task that sends work batches to a Cloudflare Worker for AI-powered content optimization proposals.

## Input
- **Work batches**: From Step 2 (`.nimbus/work/<batch_id>/batch.json`)
- **AI Worker**: Cloudflare Worker with Nimbus AI system

## Output
- **Proposal files**: `.nimbus/work/<batch_id>/proposals/<page_id>.json` for each page
- **Batch summary**: Updated batch.json with proposal status and summary

## Technical Requirements

### 1. Gulp Task Setup
- **Task name**: `nimbus:propose`
- **CLI options**:
  - `--batch <id>`: Batch ID to process (required)
  - `--pages <list>`: Comma-separated list of specific page IDs (optional)
  - `--worker-url <url>`: Custom Cloudflare Worker URL (optional)
  - `--dry-run`: Show what would be sent without making API calls

### 2. Cloudflare Worker Implementation
Create `worker/worker.js` with:
```javascript
export default {
  async fetch(request, env, ctx) {
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }
    
    const { profile, directive, content_map } = await request.json();
    
    // Send to AI (OpenAI/Anthropic)
    const aiResponse = await generateProposal(profile, directive, content_map);
    
    return new Response(JSON.stringify(aiResponse), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
```

### 3. AI System Integration
- Load AI system prompt from `worker/ai-system-prompt.md`
- Format request with profile, directive, and content_map
- Send structured request to AI service
- Parse and validate AI response JSON
- Handle API errors and retries

### 4. Request Format
Send to Cloudflare Worker:
```json
{
  "profile": {
    "name": "Repairs by Post",
    "domain": "repairsbypost.com",
    "goal": "Maximise quote submissions and watch repair bookings",
    "services": [...],
    "trust_links": {...},
    "phone": "0800 121 6030",
    "brands": [...]
  },
  "directive": {
    "type": "local",
    "tone": "friendly",
    "cta_priority": "high",
    "schema_types": ["LocalBusiness", "BreadcrumbList"],
    "trust_signals": ["reviews", "guarantee", "phone"]
  },
  "content_map": {
    "path": "dist/local/watch-repairs-abbots-langley.html",
    "route": "/branches/watch-repairs-abbots-langley",
    "head": {...},
    "blocks": [...],
    "flags": {...}
  }
}
```

### 5. Expected AI Response
```json
{
  "head": {
    "title": "Professional Watch Repairs in Abbots Langley | Free Collection & 12-Month Guarantee",
    "metaDescription": "Expert watch repair service in Abbots Langley. Rolex, Omega, TAG Heuer specialists. Free UK collection, 12-month guarantee, 1,500+ reviews. Quote in 2 mins."
  },
  "blocks": [
    {
      "selector": "main h1.splash-title",
      "new_text": "Professional Watch Repairs in Abbots Langley"
    },
    {
      "selector": "main p:nth-of-type(1)",
      "new_text": "Need expert watch repairs in Abbots Langley? Repairs by Post is your trusted local choice..."
    }
  ],
  "links": [
    {
      "selector": "main a.btn:nth-of-type(1)",
      "new_anchor": "GET FREE QUOTE (2 MINS)",
      "new_href": "/start-repair.html"
    }
  ],
  "alts": [
    {
      "selector": "main img:nth-of-type(1)",
      "new_alt": "Professional watch repair service in Abbots Langley - Rolex, Omega, TAG Heuer specialists"
    }
  ],
  "schema": {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "LocalBusiness",
        "name": "Repairs by Post - Abbots Langley",
        "description": "Professional watch repair service...",
        "telephone": "0800 121 6030",
        "address": {
          "@type": "PostalAddress",
          "addressLocality": "Abbots Langley",
          "addressCountry": "GB"
        }
      }
    ]
  },
  "confidence": 0.85,
  "notes": [
    "Enhanced title with location and key benefits",
    "Improved meta description with trust signals",
    "Added location-specific H1 with professional tone",
    "Strengthened CTA with urgency and time estimate",
    "Added comprehensive LocalBusiness schema"
  ]
}
```

### 6. Proposal Storage
For each page, save proposal as:
```json
{
  "page_id": "watch-repairs-abbots-langley",
  "created": "2024-08-29T02:15:30.123Z",
  "status": "completed",
  "request": {
    "profile": {...},
    "directive": {...},
    "content_map": {...}
  },
  "response": {
    "head": {...},
    "blocks": [...],
    "links": [...],
    "alts": [...],
    "schema": {...},
    "confidence": 0.85,
    "notes": [...]
  },
  "processing_time_ms": 2340
}
```

### 7. Batch Status Update
Update batch.json with proposal summary:
```json
{
  "batch_id": "test-batch-001",
  "status": "proposals_complete",
  "pages": [...],
  "proposal_summary": {
    "total_pages": 3,
    "completed": 3,
    "failed": 0,
    "average_confidence": 0.82,
    "total_changes": 47,
    "by_type": {
      "head": 6,
      "blocks": 28,
      "links": 8,
      "alts": 5
    }
  }
}
```

### 8. Error Handling
- **Network errors**: Retry with exponential backoff
- **AI API errors**: Log detailed error, continue with other pages
- **Invalid responses**: Validate JSON structure, flag issues
- **Rate limiting**: Respect API limits, queue requests
- **Timeout handling**: Set reasonable timeouts, fail gracefully

### 9. Progress Reporting
```
🤖 NIMBUS AI PROPOSAL GENERATION
Batch: test-batch-001
Worker: https://nimbus-ai.your-account.workers.dev

📄 PROCESSING PAGES (3):
✅ home [landing/urgent] → 16 changes (confidence: 0.88)
✅ watch-repairs-abbots-langley [local/friendly] → 12 changes (confidence: 0.85)
✅ audemars-piguet-watch-repair [brand/professional] → 19 changes (confidence: 0.79)

📊 PROPOSAL SUMMARY:
- Total changes proposed: 47
- Average confidence: 0.84
- Head changes: 6 | Block changes: 28 | Link changes: 8 | Alt changes: 5
- Processing time: 8.2s

🎉 AI proposals complete! Ready for Step 4 (preview)
```

## Success Criteria
1. **Worker deployment**: Cloudflare Worker successfully processes requests
2. **AI integration**: Generates valid optimization proposals
3. **Proposal storage**: Saves structured proposals for each page
4. **Batch tracking**: Updates batch status with proposal summary
5. **Error resilience**: Handles API failures gracefully
6. **Progress reporting**: Shows clear progress and results

## Implementation Notes
- Start with mock AI responses for testing
- Implement actual AI integration once structure is working
- Use environment variables for API keys
- Add comprehensive error handling and logging
- Test with different page types and content

## Dependencies
- `node-fetch` or `undici` (HTTP requests)
- Cloudflare Worker runtime
- AI service API (OpenAI/Anthropic)

## Next Steps
After Step 3 is complete:
- Step 4: Preview system (show proposed changes)
- Step 5: Approval workflow (review and approve changes)


