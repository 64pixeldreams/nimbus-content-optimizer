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
  
  // For now, use a simplified available URLs structure
  // In production, this would come from the URL discovery system
  const availableUrls = {
    money_pages: ['/start-repair.html', '/contact.html', '/how-it-works.html'],
    brand_pages: ['/brands/audemars-piguet-watch-repair'],
    local_pages: ['/branches/watch-repairs-abbots-langley'],
    service_pages: ['/watch-repairs/battery-replacement', '/watch-repairs/glass-replacement'],
    help_pages: ['/information/guarantee', '/faq']
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
1. Achieve ≥3 internal links per page (money + service/brand + context)
2. Use ONLY URLs from provided available_urls pools (never guess URLs)
3. Prioritize content-relevant links (mentioned brands/services in page text)
4. Fill empty trust links with provided trust_links
5. Respect max_links_per_page limit (5 max)
6. Upgrade existing anchors before creating new inline links

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

CONTENT ANALYSIS:
Brand mentions found: ${JSON.stringify(brandMentions)}
Service mentions found: ${JSON.stringify(serviceMentions)}
Empty trust links detected: ${contentMap.flags?.emptyTrustLinks || []}

CURRENT GAPS:
- Need ≥3 internal links for SEO benefit
- Empty trust links need filling
- Authority flow: ${directive.type === 'local' ? 'local→brand boost needed' : 'brand→local distribution needed'}

STRATEGIC GOALS:
1. Fill empty trust links (Trustpilot/Google)
2. Add money page link (conversion focus)
3. Add brand/service link (authority distribution)
4. Ensure natural anchor text integration

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
  
  // Get key content blocks (H1, H2, first few paragraphs)
  const contentBlocks = contentMap.blocks.filter(block => 
    block.type === 'h1' || 
    block.type === 'h2' || 
    (block.type === 'p' && block.i < 5)
  ).slice(0, 6);
  
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
  
  // Get image blocks from content map
  const imageBlocks = contentMap.blocks.filter(block => block.type === 'img').slice(0, 8);
  
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

async function executeSchemaPrompt(profile, directive, contentMap, env, model) {
  // Step 7 implementation
  return { prompt_type: 'schema', error: 'Not implemented yet' };
}

async function executeAllPrompts(profile, directive, contentMap, env, model) {
  // Step 8 implementation - parallel execution
  const startTime = Date.now();
  
  const promptResults = await Promise.allSettled([
    executeHeadPrompt(profile, directive, contentMap, env, model),
    executeDeepLinksPrompt(profile, directive, contentMap, env, model),
    executeContentPrompt(profile, directive, contentMap, env, model),
    executeImagesPrompt(profile, directive, contentMap, env, model),
    executeSchemaPrompt(profile, directive, contentMap, env, model)
  ]);
  
  // Merge results (Step 8 implementation)
  return {
    prompt_type: 'multi',
    results: promptResults,
    processing_time_ms: Date.now() - startTime,
    message: 'Multi-prompt execution ready for Step 8 implementation'
  };
}
