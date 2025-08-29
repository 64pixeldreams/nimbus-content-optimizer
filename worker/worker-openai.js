// Nimbus V2: Multi-Prompt AI Worker
// Single Cloudflare Worker that handles 5 focused prompt types

export default {
  async fetch(request, env, ctx) {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
    }

    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    try {
      const requestData = await request.json();
      const { prompt_type, model = 'gpt-4-turbo-preview', profile, directive, content_map } = requestData;

      // Validate required fields
      if (!profile || !directive || !content_map) {
        return new Response(JSON.stringify({ 
          error: 'Missing required fields: profile, directive, content_map' 
        }), { status: 400, headers: { 'Content-Type': 'application/json' } });
      }

      // Validate OpenAI API key
      if (!env.OPENAI_API_KEY) {
        return new Response(JSON.stringify({ 
          error: 'OpenAI API key not configured' 
        }), { status: 500, headers: { 'Content-Type': 'application/json' } });
      }

      console.log(`V2 Processing ${prompt_type} optimization for: ${content_map.route}`);

      let result;

      // Route to specific prompt handler
      switch (prompt_type) {
        case 'head':
          result = await executeHeadPrompt(profile, directive, content_map, env, model);
          break;
        case 'deeplinks':
          result = await executeDeepLinksPrompt(profile, directive, content_map, env, model);
          break;
        case 'content':
          result = await executeContentPrompt(profile, directive, content_map, env, model);
          break;
        case 'images':
          result = await executeImagesPrompt(profile, directive, content_map, env, model);
          break;
        case 'schema':
          result = await executeSchemaPrompt(profile, directive, content_map, env, model);
          break;
        case 'multi':
          // Execute all prompts in parallel
          result = await executeAllPrompts(profile, directive, content_map, env, model);
          break;
        default:
          throw new Error(`Unknown prompt_type: ${prompt_type}`);
      }

      return new Response(JSON.stringify(result), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });

    } catch (error) {
      console.error('V2 Worker error:', error);
      
      return new Response(JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
};

// Step 3: Head Metadata Optimization Prompt Implementation
async function executeHeadPrompt(profile, directive, contentMap, env, model) {
  const location = extractLocation(contentMap.route);
  
  const systemPrompt = `You are a head metadata optimization specialist focused on local SEO and conversion optimization.

TASK: Optimize page head metadata for maximum SEO impact and click-through rates.

REQUIREMENTS:
- Title: 50-60 characters, include location and key benefit
- Meta description: 140-165 characters, include trust signals and benefits  
- For local pages: Use pattern "Service in {{Location}} | Key Benefit & Trust Signal"
- Include review count, guarantee, and unique selling points
- UK spelling, conversion-focused language
- Never exceed character limits

You must respond with valid JSON in this exact format:
{
  "head": {
    "title": "string (50-60 chars)",
    "metaDescription": "string (140-165 chars)", 
    "canonical": "string (absolute URL)"
  },
  "confidence": 0.95,
  "notes": ["optimization details"]
}

OPTIMIZATION PRIORITIES:
1. Location targeting for local SEO
2. Trust signal integration (reviews, guarantees)
3. Click-through rate optimization
4. Character count compliance
5. Benefit-focused messaging

Return only valid JSON with the optimized metadata.`;

  const userPrompt = `Optimize head metadata for this page:

BUSINESS: ${profile.name} (${profile.domain})
LOCATION: ${location || 'General'}
PAGE TYPE: ${directive.type}
TRUST SIGNALS: ${profile.review_count} reviews, ${profile.guarantee}
PHONE: ${profile.phone}

CURRENT HEAD:
- Title: "${contentMap.head.title}" (${contentMap.head.title.length} chars)
- Meta: "${contentMap.head.metaDescription}" (${contentMap.head.metaDescription.length} chars)
- Canonical: "${contentMap.head.canonical}"

TARGET IMPROVEMENTS:
- Title: 50-60 chars with location and benefit
- Meta: 140-165 chars with trust signals
- Pattern: "Watch Repairs in ${location || 'UK'} | Free UK Postage & 12-Month Guarantee"

TRUST ELEMENTS TO INCLUDE:
- ${profile.review_count} reviews
- ${profile.guarantee}
- Free UK shipping/collection
- Professional certification

Return optimized head metadata meeting exact character requirements.`;

  const promptResult = await executeAIPrompt(systemPrompt, userPrompt, env, model);
  
  return {
    prompt_type: 'head',
    success: promptResult.success,
    result: promptResult.result,
    processing_time_ms: promptResult.processing_time_ms,
    tokens_used: promptResult.tokens_used,
    error: promptResult.error
  };
}

// Utility functions for V2
function extractLocation(route) {
  const match = route.match(/\/branches\/watch-repairs-(.+)/);
  if (match) {
    return match[1].replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }
  return null;
}

async function executeAIPrompt(systemPrompt, userPrompt, env, model = 'gpt-4-turbo-preview') {
  const startTime = Date.now();
  
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3,
        max_tokens: 1500,
        response_format: { type: 'json_object' }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`OpenAI API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0]?.message?.content;

    if (!aiResponse) {
      throw new Error('No response from OpenAI');
    }

    const result = JSON.parse(aiResponse);
    
    return {
      success: true,
      result,
      processing_time_ms: Date.now() - startTime,
      tokens_used: data.usage?.total_tokens || 0,
      model_used: model
    };

  } catch (error) {
    return {
      success: false,
      error: error.message,
      processing_time_ms: Date.now() - startTime,
      tokens_used: 0
    };
  }
}

// Step 4: Deep Links Optimization Prompt Implementation
async function executeDeepLinksPrompt(profile, directive, contentMap, env, model) {
  const location = extractLocation(contentMap.route);
  
  // Enhancement 2: Comprehensive URL pools for strategic linking
  const availableUrls = {
    money_pages: ['/start-repair.html', '/contact.html', '/how-it-works.html'],
    brand_pages: [
      '/brand/rolex-watch-repair', '/brand/omega-watch-repair', '/brand/tag-heuer-watch-repair',
      '/brand/breitling-watch-repair', '/brand/movado-watch-repair', '/brand/hugo-boss-watch-repair',
      '/brand/dkny-watch-repair', '/brands/audemars-piguet-watch-repair'
    ],
    local_pages: [
      '/branches/watch-repairs-london', '/branches/watch-repairs-manchester', 
      '/branches/watch-repairs-birmingham', '/branches/watch-repairs-watford',
      '/branches/watch-repairs-st-albans', '/branches/watch-repairs-abbots-langley'
    ],
    service_pages: [
      '/watch-repairs/battery-replacement', '/watch-repairs/glass-replacement',
      '/watch-repairs/crown-replacement', '/watch-repairs/bezel-replacement',
      '/watch-repairs/movement-repair', '/watch-repairs/strap-replacement',
      '/vintage-watch-repairs'
    ],
    help_pages: ['/information/guarantee', '/faq', '/information/how-it-works']
  };
  
  // Analyze content for mentions
  const contentText = contentMap.blocks.map(b => b.text || '').join(' ').toLowerCase();
  const brandMentions = ['rolex', 'omega', 'tag heuer', 'audemars piguet'].filter(brand => 
    contentText.includes(brand.toLowerCase()));
  const serviceMentions = ['battery', 'glass', 'crown', 'bezel'].filter(service => 
    contentText.includes(service));
  
  const systemPrompt = `You are a strategic internal linking specialist focused on SEO authority distribution and user experience.

TASK: Create internal linking strategy using provided available URL pools for maximum SEO benefit.

STRATEGIC APPROACH:
- Local pages are "fishing nets" that distribute authority to high-value pages
- Brand pages are "authority targets" that benefit from many local page links  
- Service pages are "conversion funnels" that guide users to money pages
- Geographic relevance and content mentions determine optimal link selection

LINKING RULES:
1. UPGRADE EXISTING LINKS FIRST: Analyze all existing anchors for improvement opportunities
2. Achieve ≥5 internal links per page (exceed minimum requirement)
3. Use ONLY URLs from provided available_urls pools (never guess URLs)
4. Prioritize content-relevant links (mentioned brands/services in page text)
5. Fill empty trust links with provided trust_links
6. Add strategic authority links: local→brand, service targeting
7. Geographic context: Add sibling city links for local pages

You must respond with valid JSON in this exact format:
{
  "links": [
    {
      "selector": "css_selector_for_existing_element",
      "action": "upgrade|create|fill",
      "new_anchor": "natural_anchor_text", 
      "new_href": "url_from_available_pools_only",
      "link_type": "money|service|brand|local|trust",
      "relevance_reason": "content_mention|geographic|authority_boost"
    }
  ],
  "authority_strategy": {
    "links_added": 4,
    "authority_targets": ["specific_pages_receiving_authority"],
    "link_juice_flow": "local_to_brand"
  },
  "confidence": 0.92,
  "notes": ["strategic linking decisions"]
}

Return only valid JSON with strategic linking decisions using available URLs.`;

  const userPrompt = `Create strategic deep linking for this page:

CURRENT PAGE: ${contentMap.route}
PAGE TYPE: ${directive.type} (${directive.tone} tone)
LOCATION: ${location || 'General'}

AVAILABLE URL POOLS (use ONLY these URLs):
MONEY PAGES: ${JSON.stringify(availableUrls.money_pages)}
BRAND PAGES: ${JSON.stringify(availableUrls.brand_pages)}
LOCAL PAGES: ${JSON.stringify(availableUrls.local_pages)}
SERVICE PAGES: ${JSON.stringify(availableUrls.service_pages)}
HELP PAGES: ${JSON.stringify(availableUrls.help_pages)}

TRUST LINKS TO FILL:
Trustpilot: ${profile.trust_links?.trustpilot || 'none'}
Google: ${profile.trust_links?.google || 'none'}

EXISTING LINKS TO ANALYZE FOR UPGRADES:
${contentMap.blocks.filter(b => b.type === 'a').map(link => 
  `- "${link.anchor}" → ${link.href} [${link.selector}]`
).join('\n')}

CONTENT ANALYSIS:
Brand mentions found: ${JSON.stringify(brandMentions)}
Service mentions found: ${JSON.stringify(serviceMentions)}
Empty trust links detected: ${contentMap.flags?.emptyTrustLinks || []}

STRATEGIC OPPORTUNITIES:
- Upgrade existing brand links: ${brandMentions.length} brands mentioned
- Add service links: ${serviceMentions.length} services mentioned  
- Fill trust gaps: ${(contentMap.flags?.emptyTrustLinks || []).length} empty trust links
- Authority flow: ${directive.type === 'local' ? 'local→brand boost needed' : 'brand→local distribution needed'}
- Geographic context: Add sibling city links for local relevance

STRATEGIC GOALS:
1. UPGRADE existing brand/service links with better anchor text
2. Fill empty trust links (Trustpilot/Google)
3. Add money page link (conversion focus)
4. Add service links for mentioned services (battery, glass, etc.)
5. Add brand authority links (Rolex, Omega, etc.)
6. Add geographic context links (sibling cities)
7. TARGET: ≥5 strategic links (exceed minimum requirement)

Return strategic linking JSON using only available URLs.`;

  const promptResult = await executeAIPrompt(systemPrompt, userPrompt, env, model);
  
  return {
    prompt_type: 'deeplinks',
    success: promptResult.success,
    result: promptResult.result,
    processing_time_ms: promptResult.processing_time_ms,
    tokens_used: promptResult.tokens_used,
    error: promptResult.error
  };
}

// Step 5: Content Enhancement Prompt Implementation
async function executeContentPrompt(profile, directive, contentMap, env, model) {
  const location = extractLocation(contentMap.route);
  
  // Enhancement 1: Process ALL content blocks with intelligent batching
  const allBlocks = contentMap.blocks; // All 80 blocks
  const contentBlocks = [
    ...allBlocks.filter(b => b.type === 'h1' || b.type === 'h2'), // All headings
    ...allBlocks.filter(b => b.type === 'p').slice(0, 15),        // First 15 paragraphs  
    ...allBlocks.filter(b => b.type === 'li').slice(0, 20),       // First 20 list items
    ...allBlocks.filter(b => b.type === 'blockquote')             // All quotes
  ];
  
  // Calculate current word counts
  const blocksWithWordCounts = contentBlocks.map(block => ({
    ...block,
    word_count: (block.text || '').split(' ').length
  }));
  
  const totalWords = blocksWithWordCounts.reduce((sum, block) => sum + block.word_count, 0);
  
  const systemPrompt = `You are a content enhancement specialist focused on local SEO and conversion optimization while preserving information density.

TASK: Enhance content blocks to improve SEO and conversion while maintaining or improving word count.

WORD COUNT POLICY - CRITICAL:
- NEVER reduce content length unless it significantly improves clarity
- ADD valuable information when possible (trust signals, benefits, expertise)
- Maintain information density and value for users
- Prefer enhancement over reduction
- Track word count changes and justify any reductions

TYPO DETECTION AND CORRECTION:
- Fix common typos: "braclet"→"bracelet", "acredited"→"accredited"
- Correct grammar issues and awkward phrasing
- Ensure professional, polished content throughout
- Maintain meaning while improving readability

You must respond with valid JSON in this exact format:
{
  "blocks": [
    {
      "selector": "css_selector",
      "new_text": "enhanced_content_text",
      "word_count_before": 45,
      "word_count_after": 52,
      "optimization_type": "trust_signals_added|location_targeting|clarity_improvement"
    }
  ],
  "content_summary": {
    "total_word_count_before": 150,
    "total_word_count_after": 168,
    "word_count_change": "+18",
    "enhancement_ratio": 1.12
  },
  "confidence": 0.94,
  "notes": ["content enhancement decisions and word count justifications"]
}

OPTIMIZATION PRIORITIES:
1. Location integration: Natural inclusion of ${location || 'area'} throughout
2. Trust signal weaving: Reviews, guarantees, certifications  
3. Word count preservation: Maintain or improve information density
4. Benefit clarity: Clear value propositions with local context
5. CTA enhancement: Urgent, specific language

Return only valid JSON with enhanced content that preserves or improves word count.`;

  const userPrompt = `Enhance content for this local business page while preserving word count:

BUSINESS: ${profile.name} in ${location || 'UK'}
TRUST SIGNALS: ${profile.review_count} reviews, ${profile.guarantee}
TONE: ${directive.tone}
PHONE: ${profile.phone}

CURRENT CONTENT BLOCKS (preserve/improve word count):
${blocksWithWordCounts.map((block, i) => 
  `${i + 1}. [${block.type}] "${block.text}" (${block.word_count} words)`
).join('\n')}

WORD COUNT REQUIREMENTS:
- Current total: ${totalWords} words
- Target: Maintain or improve (never reduce unless clarity significantly benefits)
- Enhancement goal: Add trust signals, local context, expertise

OPTIMIZATION GOALS:
1. Location targeting: Include "${location || 'local area'}" naturally
2. Trust signal integration: ${profile.review_count}, ${profile.guarantee}
3. Word count: Maintain or improve information density
4. Benefit clarity: Clear value propositions with local context
5. Expertise indicators: Professional qualifications, experience

ENHANCEMENT REQUIREMENTS:
- H1: 45-65 chars with location and primary benefit
- H2: Benefit statements with trust signals
- Paragraphs: Enhanced with local context, trust signals, expertise
- Natural flow: Content must read naturally with enhancements
- Information value: Every added word must provide user value

Return enhanced content with word count tracking and justifications.`;

  const promptResult = await executeAIPrompt(systemPrompt, userPrompt, env, model);
  
  return {
    prompt_type: 'content',
    success: promptResult.success,
    result: promptResult.result,
    processing_time_ms: promptResult.processing_time_ms,
    tokens_used: promptResult.tokens_used,
    error: promptResult.error
  };
}

// Step 6: Image Optimization Prompt Implementation
async function executeImagesPrompt(profile, directive, contentMap, env, model) {
  const location = extractLocation(contentMap.route);
  
  // Enhancement 3: Process ALL images on the page (not just first 2)
  const imageBlocks = contentMap.blocks.filter(block => block.type === 'img'); // ALL images
  
  if (imageBlocks.length === 0) {
    return {
      prompt_type: 'images',
      success: true,
      result: {
        alts: [],
        confidence: 1.0,
        notes: ['No images found to optimize']
      }
    };
  }
  
  const systemPrompt = `You are an image optimization specialist focused on accessibility, SEO, and Core Web Vitals performance.

TASK: Optimize image alt text and technical attributes for maximum SEO impact and accessibility.

ALT TEXT RULES:
- Descriptive and specific to actual image content (not just business name)
- Include location for local businesses when relevant
- Include brand names when showing branded content
- 50-125 characters optimal length for SEO value
- Natural keyword integration without stuffing
- Accessibility-first approach for screen readers

You must respond with valid JSON in this exact format:
{
  "alts": [
    {
      "selector": "css_selector",
      "new_alt": "descriptive_alt_text_with_location",
      "current_alt": "existing_alt_or_empty",
      "image_context": "hero|service|brand|trust|general",
      "optimization_reasoning": "location_added|brand_specified|service_context|accessibility_improved"
    }
  ],
  "technical_recommendations": {
    "cls_improvements": ["width/height suggestions"],
    "performance_optimizations": ["loading/decoding recommendations"]
  },
  "confidence": 0.96,
  "notes": ["image optimization decisions and accessibility improvements"]
}

OPTIMIZATION PRIORITIES:
1. Accessibility: Screen reader friendly descriptions
2. Location targeting: Include ${location || 'area'} in relevant images
3. Brand specificity: Name brands shown in images
4. Service context: Describe services depicted
5. SEO value: Natural keyword integration

Return only valid JSON with comprehensive image optimization.`;

  const userPrompt = `Optimize images for this local business page:

BUSINESS: ${profile.name} in ${location || 'UK'}
SERVICES: ${profile.services?.join(', ') || 'watch repair services'}
BRANDS: ${profile.brands?.join(', ') || 'luxury watch brands'}
PAGE TYPE: ${directive.type}
LOCATION: ${location || 'General'}

IMAGE INVENTORY:
${imageBlocks.map((img, i) => 
  `${i + 1}. Selector: ${img.selector}
     Source: ${img.src}
     Current alt: "${img.alt || '(empty)'}"
     Context: ${img.src.includes('brand') ? 'brand_showcase' : 
               img.src.includes('repair') ? 'service_image' :
               img.src.includes('google') ? 'trust_signal' : 'general_business'}`
).join('\n\n')}

OPTIMIZATION REQUIREMENTS:
1. Descriptive alt text (50-125 chars) with location when relevant
2. Include brand names for branded content images
3. Describe actual image content and purpose, not just business name
4. Add location context for local SEO value: "${location || 'area'}"
5. Accessibility-first approach for screen readers

IMAGE CONTEXT ANALYSIS:
- Hero/service images: Include location and primary service value
- Brand showcase images: Name specific brands shown
- Trust/review images: Include location and social proof context
- General business images: Location and service context

Return comprehensive image optimization with location targeting.`;

  const promptResult = await executeAIPrompt(systemPrompt, userPrompt, env, model);
  
  return {
    prompt_type: 'images',
    success: promptResult.success,
    result: promptResult.result,
    processing_time_ms: promptResult.processing_time_ms,
    tokens_used: promptResult.tokens_used,
    error: promptResult.error
  };
}

// Step 7: Schema Generation Prompt Implementation
async function executeSchemaPrompt(profile, directive, contentMap, env, model) {
  const location = extractLocation(contentMap.route);
  
  const systemPrompt = `You are a Schema.org markup specialist focused on local business optimization and search engine visibility.

TASK: Generate comprehensive Schema.org markup for maximum search engine understanding and rich snippet eligibility.

SCHEMA REQUIREMENTS:
- LocalBusiness: Complete with address, contact, reviews, services, area served
- BreadcrumbList: Logical navigation hierarchy for user experience
- Valid structure: Proper @context, @graph, and @id references
- Local optimization: Address and geographic data derived from page context

You must respond with valid JSON in this exact format:
{
  "schema": {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "LocalBusiness",
        "@id": "business_url#business",
        "name": "business_name_with_location",
        "description": "service_description_with_location",
        "url": "canonical_page_url",
        "telephone": "phone_number",
        "address": {
          "@type": "PostalAddress",
          "addressLocality": "city",
          "addressRegion": "region", 
          "addressCountry": "GB"
        },
        "areaServed": [{"@type": "City", "name": "city"}],
        "aggregateRating": {
          "@type": "AggregateRating",
          "ratingValue": "4.8",
          "reviewCount": "review_count"
        },
        "sameAs": ["trust_links"]
      },
      {
        "@type": "BreadcrumbList", 
        "@id": "page_url#breadcrumbs",
        "itemListElement": [
          {"@type": "ListItem", "position": 1, "name": "Home", "item": "home_url"},
          {"@type": "ListItem", "position": 2, "name": "section", "item": "section_url"},
          {"@type": "ListItem", "position": 3, "name": "current_page", "item": "current_url"}
        ]
      }
    ]
  },
  "confidence": 0.94,
  "notes": ["schema generation decisions and local SEO optimizations"]
}

OPTIMIZATION PRIORITIES:
1. Local search visibility: Complete address and geographic data
2. Trust signal integration: Reviews, ratings, trust links
3. Service specificity: Watch repair service details
4. Navigation structure: Clear breadcrumb hierarchy
5. Rich snippet eligibility: Complete business information

Return only valid JSON with comprehensive Schema.org markup.`;

  const userPrompt = `Generate comprehensive Schema.org markup for this local business page:

BUSINESS: ${profile.name}
DOMAIN: ${profile.domain}
LOCATION: ${location || 'UK'}
ROUTE: ${contentMap.route}

BUSINESS DETAILS:
- Phone: ${profile.phone}
- Services: ${profile.services?.join(', ') || 'watch repair services'}
- Review count: ${profile.review_count}
- Trust links: Trustpilot: ${profile.trust_links?.trustpilot}, Google: ${profile.trust_links?.google}
- Geographic scope: ${profile.geo_scope?.join(', ') || 'UK'}
- Guarantee: ${profile.guarantee}

PAGE ANALYSIS:
- Type: ${directive.type}
- Schema types required: ${directive.schema_types?.join(', ') || 'LocalBusiness, BreadcrumbList'}
- Location context: ${location ? `Local service page for ${location}` : 'General service page'}

SCHEMA REQUIREMENTS:
1. LocalBusiness with complete address and contact details for ${location || 'UK'}
2. BreadcrumbList for navigation hierarchy
3. AggregateRating with review count (${profile.review_count}) and trust signals
4. Geographic targeting with area served for ${location || 'UK'}
5. Service details specific to watch repair industry

LOCATION CONTEXT:
- Address locality: ${location || 'UK'}
- Address region: ${location ? 'Derive UK county/region' : 'UK'}
- Area served: ${location || 'UK'} and surrounding areas
- Trust integration: ${profile.review_count} reviews, ${profile.guarantee}

Return comprehensive Schema.org markup optimized for local search visibility.`;

  const promptResult = await executeAIPrompt(systemPrompt, userPrompt, env, model);
  
  return {
    prompt_type: 'schema',
    success: promptResult.success,
    result: promptResult.result,
    processing_time_ms: promptResult.processing_time_ms,
    tokens_used: promptResult.tokens_used,
    error: promptResult.error
  };
}

// Step 8: Integration - Parallel Multi-Prompt Execution
async function executeAllPrompts(profile, directive, contentMap, env, model) {
  const startTime = Date.now();
  console.log('🚀 V2 Multi-prompt parallel execution starting...');
  
  // Execute all 5 focused prompts in parallel
  const promptResults = await Promise.allSettled([
    executeHeadPrompt(profile, directive, contentMap, env, model),
    executeDeepLinksPrompt(profile, directive, contentMap, env, model),
    executeContentPrompt(profile, directive, contentMap, env, model),
    executeImagesPrompt(profile, directive, contentMap, env, model),
    executeSchemaPrompt(profile, directive, contentMap, env, model)
  ]);
  
  console.log('✅ All 5 prompts completed, merging results...');
  
  // Merge results into V1-compatible format
  const merged = {
    head: {},
    blocks: [],
    links: [],
    alts: [],
    schema: {},
    confidence: 0,
    notes: [],
    v2_metadata: {
      execution_type: 'parallel_multi_prompt',
      total_processing_time: Date.now() - startTime,
      prompt_count: 5,
      successful_prompts: 0,
      failed_prompts: 0,
      individual_results: []
    }
  };
  
  let totalConfidence = 0;
  let successfulPrompts = 0;
  
  // Process each prompt result
  promptResults.forEach((promiseResult, index) => {
    const promptResult = promiseResult.status === 'fulfilled' ? promiseResult.value : null;
    
    if (promptResult && promptResult.success && promptResult.result) {
      successfulPrompts++;
      const { result, prompt_type, processing_time_ms, tokens_used } = promptResult;
      
      // Merge based on prompt type
      switch (prompt_type) {
        case 'head':
          if (result.head) merged.head = { ...merged.head, ...result.head };
          break;
        case 'deeplinks':
          if (result.links) merged.links.push(...result.links);
          break;
        case 'content':
          if (result.blocks) merged.blocks.push(...result.blocks);
          break;
        case 'images':
          if (result.alts) merged.alts.push(...result.alts);
          break;
        case 'schema':
          if (result.schema) merged.schema = result.schema;
          break;
      }
      
      // Collect confidence and notes
      if (typeof result.confidence === 'number') {
        totalConfidence += result.confidence;
      }
      
      if (result.notes) {
        merged.notes.push(...result.notes.map(note => `[${prompt_type}] ${note}`));
      }
      
      // Track individual result metadata
      merged.v2_metadata.individual_results.push({
        prompt_type,
        success: true,
        confidence: result.confidence,
        processing_time_ms,
        tokens_used: tokens_used || 0,
        changes_count: countChangesInPromptResult(result)
      });
      
    } else {
      merged.v2_metadata.failed_prompts++;
      const error = promptResult?.error || promiseResult.reason?.message || 'Unknown error';
      merged.notes.push(`[${promptResult?.prompt_type || 'unknown'}] Failed: ${error}`);
      
      merged.v2_metadata.individual_results.push({
        prompt_type: promptResult?.prompt_type || 'unknown',
        success: false,
        error: error
      });
    }
  });
  
  // Calculate overall confidence (average of successful prompts)
  merged.confidence = successfulPrompts > 0 ? totalConfidence / successfulPrompts : 0;
  merged.v2_metadata.successful_prompts = successfulPrompts;
  
  // Add summary statistics
  merged.v2_metadata.total_changes = merged.blocks.length + merged.links.length + merged.alts.length + 
    Object.keys(merged.head).length + (merged.schema && Object.keys(merged.schema).length > 0 ? 1 : 0);
  
  merged.v2_metadata.total_tokens = merged.v2_metadata.individual_results
    .reduce((sum, r) => sum + (r.tokens_used || 0), 0);
  
  console.log(`🎉 V2 Multi-prompt complete: ${successfulPrompts}/5 prompts successful, ${merged.v2_metadata.total_changes} total changes`);
  
  return merged;
}

function countChangesInPromptResult(result) {
  let count = 0;
  if (result.head) count += Object.keys(result.head).length;
  if (result.blocks) count += result.blocks.length;
  if (result.links) count += result.links.length;
  if (result.alts) count += result.alts.length;
  if (result.schema) count += 1;
  return count;
}
