// Nimbus V2: Multi-Prompt AI Worker
// Single Cloudflare Worker that handles 5 focused prompt types
// V4.5: Enhanced with KV caching for performance and cost optimization

// V4.5: KV Cache Utilities
const CACHE_VERSION = 'v4.5';
const CACHE_TTL = 86400 * 7; // 7 days

// V4.4: Tone Profile System (Enhanced for Distinct Personalities)
const TONE_PROFILES = {
  friendly: {
    personality: "Friendly, professional, approachable",
    language: "We're specialists, reliable service, trusted choice, professional care",
    cta_style: "Get started today, Contact us now",
    formality: "casual-professional"
  },
  "startup-old": {
    personality: "Dynamic, innovative, growth-focused", 
    language: "Revolutionary, game-changing, next-level, cutting-edge, innovative solutions",
    cta_style: "Join the revolution, Get started now, Transform your experience",
    formality: "casual-dynamic"
  },
  corporate: {
    personality: "Professional, trustworthy, established",
    language: "Industry-leading, proven specialists, reliable solutions, comprehensive service", 
    cta_style: "Contact our team, Schedule consultation, Discover our services",
    formality: "formal-professional"
  },
  "local-shop": {
    personality: "Friendly, personal, community-focused",
    language: "Your local specialists, family business, personal service, neighborhood care",
    cta_style: "Pop in today, Give us a call, Visit our shop", 
    formality: "casual-friendly"
  },
  "premium-brand": {
    personality: "Luxury, exclusive, sophisticated",
    language: "Bespoke service, uncompromising quality, elite, prestigious",
    cta_style: "Experience excellence, Discover more, Arrange consultation",
    formality: "formal-luxury"
  },
  "modern-tech": {
    personality: "Efficient, transparent, user-focused",
    language: "Simple, straightforward, hassle-free, transparent pricing",
    cta_style: "Try it now, See how it works, Get instant quote",
    formality: "casual-modern"
  },

  // V4.5: Human-Focused Tone Presets (Enhanced for Distinct Personalities)
  "local-expert": {
    personality: "Friendly, confident, down-to-earth",
    language: "Your trusted local specialists, neighborhood professionals, reliable local service",
    cta_style: "Let's get started, Give us a try, We're here to help",
    formality: "casual-confident"
  },

  "premium-new": {
    personality: "Polished, formal, reassuring",
    language: "Distinguished service, refined quality, prestigious care, exceptional standards",
    cta_style: "Experience excellence, Discover premium service, Arrange consultation",
    formality: "formal-luxury"
  },

  "startup-new": {
    personality: "Punchy, modern, clever",
    language: "Revolutionary solutions, innovative approach, next-level service, game-changing results",
    cta_style: "Get started instantly, Try it free, Join thousands",
    formality: "casual-dynamic"
  },

  "helpful-calm": {
    personality: "Warm, clear, supportive",
    language: "We're here to help, gentle guidance, supportive care, understanding service",
    cta_style: "Let us help, Get support, We'll guide you",
    formality: "casual-supportive"
  },

  "classic-retail": {
    personality: "Energetic, value-driven, persuasive",
    language: "Fantastic value, unbeatable service, great deals, outstanding results",
    cta_style: "Shop now, Save today, Don't miss out",
    formality: "casual-energetic"
  },

  "mom-n-pop": {
    personality: "Personal, homely, chatty",
    language: "Family-run business, personal touch, we genuinely care, friendly neighborhood service",
    cta_style: "Pop in anytime, Give us a call, We'd love to help",
    formality: "casual-personal"
  },

  clinical: {
    personality: "Precise, no-fluff, technical",
    language: "Precise methodology, technical accuracy, systematic approach, measured results",
    cta_style: "Request analysis, Schedule assessment, Get precise results",
    formality: "formal-technical"
  },

  govtech: {
    personality: "Professional, neutral, policy-aligned",
    language: "Compliant solutions, regulatory standards, authorized service, official procedures",
    cta_style: "Submit request, Access services, Contact department",
    formality: "formal-neutral"
  }
};

async function generateCacheKey(payload) {
  // V4.5 FIX: Hash the ENTIRE payload for maximum cache accuracy
  // Any change in content, route, profile, directive = different cache key
  const cacheInput = {
    ...payload, // Include EVERYTHING from the request
    version: CACHE_VERSION, // Add version for cache invalidation
    cache_bust: payload.cache_bust || null // V4.5: Optional cache busting
  };
  
  const encoder = new TextEncoder();
  const data = encoder.encode(JSON.stringify(cacheInput));
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return `ai-result-${hashHex}`;
}

async function getCachedResult(cacheKey, env, debugLogs) {
  debugLogs.push(`Available env keys: ${Object.keys(env).join(', ')}`);
  debugLogs.push(`NIMBUS_CACHE type: ${typeof env.NIMBUS_CACHE}`);
  
  try {
    debugLogs.push(`Attempting to access NIMBUS_CACHE directly...`);
    debugLogs.push(`Checking cache for key: ${cacheKey.substring(0, 12)}...`);
    const cached = await env.NIMBUS_CACHE.get(cacheKey);
    debugLogs.push(`Cache lookup result: ${cached ? 'FOUND' : 'NOT FOUND'}`);
    return cached ? JSON.parse(cached) : null;
  } catch (error) {
    debugLogs.push(`Cache read error: ${error.message}`);
    debugLogs.push(`Error type: ${error.constructor.name}`);
    return null;
  }
}

async function setCachedResult(cacheKey, result, env, debugLogs) {
  try {
    debugLogs.push(`Attempting to store in cache with key: ${cacheKey.substring(0, 12)}...`);
    debugLogs.push(`Result type: ${typeof result}`);
    debugLogs.push(`Result keys: ${Object.keys(result || {}).join(', ')}`);
    
    // Create a clean copy of result for caching (remove any non-serializable properties)
    const cleanResult = JSON.parse(JSON.stringify(result));
    
    await env.NIMBUS_CACHE.put(cacheKey, JSON.stringify(cleanResult), {
      expirationTtl: CACHE_TTL
    });
    debugLogs.push('Result cached successfully');
    
    // Verify the write by reading it back
    const verification = await env.NIMBUS_CACHE.get(cacheKey);
    debugLogs.push(`Cache verification: ${verification ? 'SUCCESS' : 'FAILED'}`);
  } catch (error) {
    debugLogs.push(`Cache write error: ${error.message}`);
    debugLogs.push(`Error type: ${error.constructor.name}`);
    debugLogs.push(`Error stack: ${error.stack?.substring(0, 200)}`);
  }
}

export default {
  async fetch(request, env, ctx) {
    // V4.5: Debug log array for troubleshooting
    const debugLogs = [];
    
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

    // V4.5: Cache stats endpoint
    if (request.method === 'GET' && new URL(request.url).pathname === '/cache-stats') {
      if (!env.NIMBUS_CACHE) {
        return new Response(JSON.stringify({ error: 'KV cache not configured' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      try {
        const hits = await env.NIMBUS_CACHE.get('cache-hits') || '0';
        const misses = await env.NIMBUS_CACHE.get('cache-misses') || '0';
        const hitRate = parseInt(hits) / (parseInt(hits) + parseInt(misses)) * 100;
        
        return new Response(JSON.stringify({
          cache_hits: parseInt(hits),
          cache_misses: parseInt(misses),
          hit_rate: `${hitRate.toFixed(1)}%`,
          version: CACHE_VERSION,
          ttl_days: CACHE_TTL / 86400
        }), {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      } catch (error) {
        return new Response(JSON.stringify({ error: 'Failed to get cache stats' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    try {
      const requestData = await request.json();
      const { prompt_type, model = 'gpt-4o', profile, directive, content_map } = requestData;

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

      // V4.5: Check cache first (unless no_cache mode)
      const cacheKey = await generateCacheKey(requestData);
      debugLogs.push(`Generated cache key: ${cacheKey.substring(0, 12)}...`);
      
      let cachedResult = null;
      if (!requestData.no_cache) {
        cachedResult = await getCachedResult(cacheKey, env, debugLogs);
      } else {
        debugLogs.push('Cache bypassed - no_cache mode enabled');
      }
      
      if (cachedResult) {
        console.log(`Cache HIT for ${prompt_type}: ${content_map.route}`);
        
        // Track cache hit
        if (env.NIMBUS_CACHE) {
          try {
            const hits = parseInt(await env.NIMBUS_CACHE.get('cache-hits') || '0') + 1;
            await env.NIMBUS_CACHE.put('cache-hits', hits.toString(), { expirationTtl: CACHE_TTL * 10 });
          } catch (e) { /* ignore */ }
        }
        
        return new Response(JSON.stringify({
          ...cachedResult,
          cached: true,
          cache_key: cacheKey.substring(0, 12), // First 12 chars for debugging
          debug_logs: debugLogs // Include debug info
        }), {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      }
      
      console.log(`Cache MISS for ${prompt_type}: ${content_map.route}`);
      
      // Track cache miss
      if (env.NIMBUS_CACHE) {
        try {
          const misses = parseInt(await env.NIMBUS_CACHE.get('cache-misses') || '0') + 1;
          await env.NIMBUS_CACHE.put('cache-misses', misses.toString(), { expirationTtl: CACHE_TTL * 10 });
        } catch (e) { /* ignore */ }
      }
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

      // V4.5: Cache the result for future requests
      await setCachedResult(cacheKey, result, env, debugLogs);
      console.log(`Cached result for ${prompt_type}: ${content_map.route}`);

      return new Response(JSON.stringify({
        ...result,
        cached: false,
        cache_key: cacheKey.substring(0, 12), // First 12 chars for debugging
        debug_logs: debugLogs // Include debug info
      }), {
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
  const brand = extractBrand(contentMap.route);
  const toneProfile = TONE_PROFILES[directive.tone] || TONE_PROFILES.friendly;
  
  const systemPrompt = `You are a head metadata optimization specialist focused on local SEO and conversion optimization.

TASK: Optimize page head metadata for maximum SEO impact and click-through rates.

BUSINESS CONTEXT:
- Business: ${profile.name}
- Services: ${profile.services.join(', ')}
- Geographic scope: ${profile.geo_scope.join(', ')}
- Review count: ${profile.review_count}
- Guarantee: ${profile.guarantee}

PAGE CONTEXT:
- Page type: ${directive.type}
- Location: ${location || 'N/A'}
- Brand: ${brand || 'N/A'}

REQUIREMENTS:
- Title: MUST USE 55-60 characters (never shorter than 55), include ${brand ? 'brand name' : 'location'} + specific services + benefits + trust signals
- Meta description: TARGET 150-160 characters (maximize SERP space), include trust signals and benefits  
- For local pages: Use pattern "${profile.services[0]} in {{Location}} | Benefits + ${profile.guarantee} + Reviews"
- For brand pages: Use pattern "{{Brand}} Watch Repair | Benefits + ${profile.guarantee} + Reviews + Expertise"
- MAXIMIZE character usage with: ${profile.review_count} reviews, ${profile.guarantee}, specific benefits, expertise claims
- Include specific service benefits: "Battery, Glass, Crown Repair" vs generic "Service"
- UK spelling, conversion-focused language
- NEVER exceed limits but USE FULL CHARACTER ALLOWANCE

MANDATORY TONE-SPECIFIC LANGUAGE (${directive.tone.toUpperCase()}):
${toneProfile.language ? `USE THESE WORDS: ${toneProfile.language}` : ''}
FORBIDDEN WORDS: Expert, Professional, Quality (overused - use tone-specific alternatives)

TONE-SPECIFIC TITLE EXAMPLES (55-60 characters):
- Mom-n-pop: "Family-Run Fossil Watch Care | Personal Touch, 1.5K Reviews"
- Startup: "Revolutionary Guess Watch Solutions | Game-Changing Results"  
- Clinical: "Precise Fossil Watch Methodology | Systematic Approach"
- Classic-retail: "Fantastic Fossil Watch Value | Unbeatable Service"
- Always include: Brand + Tone-Specific Language + Benefits + Trust

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

// V4.5: Extract brand name from brand page routes
function extractBrand(route) {
  const match = route.match(/\/brands\/(.+)-watch-repair/);
  if (match) {
    return match[1]
      .replace(/-/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase())
      .replace(/And Co/g, '& Co'); // Fix "Dreyfuss And Co" → "Dreyfuss & Co"
  }
  return null;
}

// V4.5: Brand classification for luxury vs fashion differentiation
function classifyBrand(brandName) {
  if (!brandName) return { tier: 'unknown', category: 'unknown' };
  
  const brandLower = brandName.toLowerCase();
  
  const brandClassification = {
    // Ultra Luxury Swiss
    'patek philippe': { tier: 'ultra-luxury', category: 'swiss-haute-horlogerie', price_range: '£20K+' },
    'audemars piguet': { tier: 'ultra-luxury', category: 'swiss-sports-luxury', price_range: '£15K+' },
    'vacheron constantin': { tier: 'ultra-luxury', category: 'swiss-haute-horlogerie', price_range: '£15K+' },
    
    // Luxury Swiss
    'rolex': { tier: 'luxury', category: 'swiss-prestige', price_range: '£3K-£50K' },
    'omega': { tier: 'luxury', category: 'swiss-professional', price_range: '£1K-£10K' },
    'breitling': { tier: 'luxury', category: 'swiss-aviation', price_range: '£2K-£8K' },
    'tag heuer': { tier: 'luxury', category: 'swiss-sports', price_range: '£800-£5K' },
    'hublot': { tier: 'luxury', category: 'swiss-modern', price_range: '£3K-£15K' },
    'chopard': { tier: 'luxury', category: 'swiss-jewelry', price_range: '£2K-£20K' },
    
    // Premium Brands
    'cartier': { tier: 'premium', category: 'jewelry-luxury', price_range: '£1K-£10K' },
    'iwc': { tier: 'premium', category: 'swiss-pilot', price_range: '£2K-£8K' },
    'tudor': { tier: 'premium', category: 'swiss-heritage', price_range: '£1K-£4K' },
    
    // Fashion Luxury
    'gucci': { tier: 'fashion-luxury', category: 'italian-fashion', price_range: '£300-£2K' },
    'christian dior': { tier: 'fashion-luxury', category: 'french-fashion', price_range: '£200-£1K' },
    'emporio armani': { tier: 'fashion-luxury', category: 'italian-fashion', price_range: '£150-£800' },
    
    // Fashion Accessible
    'michael kors': { tier: 'fashion', category: 'american-accessible', price_range: '£100-£400' },
    'dkny': { tier: 'fashion', category: 'american-fashion', price_range: '£80-£300' },
    'fossil': { tier: 'fashion', category: 'american-casual', price_range: '£50-£250' },
    'guess': { tier: 'fashion', category: 'american-fashion', price_range: '£60-£200' }
  };
  
  return brandClassification[brandLower] || { tier: 'premium', category: 'swiss-traditional', price_range: '£200-£1K' };
}

// V4.5: JSON validation and repair utility
function repairMalformedJSON(jsonString) {
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    console.log('🔍 Initial JSON parse failed:', error.message);
    console.log('🔍 First 100 chars of response:', jsonString.substring(0, 100));
    
    // Remove any non-JSON prefix/suffix
    let fixed = jsonString.trim();
    
    // Extract JSON if wrapped in other text
    const jsonMatch = fixed.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      fixed = jsonMatch[0];
      console.log('✅ Extracted JSON structure from response');
    }
    
    // Fix common issues
    fixed = fixed
      .replace(/,(\s*[}\]])/g, '$1')  // Remove trailing commas
      .replace(/'/g, '"')              // Replace single quotes with double
      .replace(/[\u0000-\u001F]/g, ''); // Remove control characters
    
    try {
      return JSON.parse(fixed);
    } catch (secondError) {
      console.log('❌ JSON repair failed on:', fixed.substring(0, 200));
      throw new Error(`JSON repair failed: ${secondError.message}`);
    }
  }
}

async function executeAIPrompt(systemPrompt, userPrompt, env, model = 'gpt-4o') {
  const startTime = Date.now();
  const debugLogs = [];
  
  try {
    debugLogs.push(`🚀 Starting AI prompt with model: ${model}`);
    debugLogs.push(`📝 System prompt length: ${systemPrompt.length} chars`);
    debugLogs.push(`👤 User prompt length: ${userPrompt.length} chars`);
    
    const requestBody = {
      model: model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.3,
      max_tokens: 4000, // Set to 4000 (within the 4096 limit) to handle large content like Hublot
      response_format: { type: 'json_object' }
    };
    
    debugLogs.push(`📤 Request payload: ${JSON.stringify(requestBody, null, 2)}`);
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.json();
      const errorMsg = `OpenAI API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`;
      debugLogs.push(`❌ API Error: ${errorMsg}`);
      throw new Error(errorMsg);
    }

    const data = await response.json();
    const aiResponse = data.choices[0]?.message?.content;

    if (!aiResponse) {
      debugLogs.push(`❌ No response content from OpenAI`);
      throw new Error('No response from OpenAI');
    }

    debugLogs.push(`✅ Raw AI response received`);
    debugLogs.push(`📏 Response length: ${aiResponse.length} chars`);
    debugLogs.push(`🔍 First 200 chars: ${aiResponse.substring(0, 200)}`);
    debugLogs.push(`🔍 Last 200 chars: ${aiResponse.substring(Math.max(0, aiResponse.length - 200))}`);
    
    // Try to parse JSON directly
    let result;
    try {
      result = JSON.parse(aiResponse);
      debugLogs.push(`✅ JSON parsed successfully`);
    } catch (parseError) {
      debugLogs.push(`❌ Direct JSON parse failed: ${parseError.message}`);
      debugLogs.push(`🔍 Raw response that failed parsing: ${aiResponse}`);
      
      // Return detailed failure info
      return {
        success: false,
        error: parseError.message,
        raw_response: aiResponse,
        raw_response_safe: aiResponse.replace(/[^\x20-\x7E]/g, '?'), // Safe string
        raw_response_length: aiResponse.length,
        raw_response_start: aiResponse.substring(0, 200),
        raw_response_end: aiResponse.substring(Math.max(0, aiResponse.length - 200)),
        debug_logs: debugLogs,
        processing_time_ms: Date.now() - startTime,
        tokens_used: data.usage?.total_tokens || 0,
        model_used: model
      };
    }
    
    debugLogs.push(`✅ AI prompt completed successfully`);
    return {
      success: true,
      result,
      debug_logs: debugLogs,
      processing_time_ms: Date.now() - startTime,
      tokens_used: data.usage?.total_tokens || 0,
      model_used: model
    };

  } catch (error) {
    debugLogs.push(`💥 Unexpected error: ${error.message}`);
    return {
      success: false,
      error: error.message,
      debug_logs: debugLogs,
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
  "ctas": [
    {
      "selector": "css_selector_for_cta_element",
      "action": "upgrade|create",
      "new_anchor": "conversion_focused_cta_text",
      "new_href": "money_page_url",
      "cta_type": "primary|secondary|contact",
      "conversion_strategy": "urgency|value_prop|trust_signal"
    }
  ],
  "authority_strategy": {
    "links_added": 4,
    "ctas_optimized": 2,
    "authority_targets": ["specific_pages_receiving_authority"],
    "link_juice_flow": "local_to_brand"
  },
  "confidence": 0.92,
  "notes": ["strategic linking and CTA optimization decisions"]
}

Return only valid JSON with strategic linking decisions using available URLs.`;

  const userPrompt = `Create strategic deep linking for this page:

CURRENT PAGE: ${contentMap.route}
PAGE TYPE: ${directive.type} (${directive.tone} tone)
LOCATION: ${location || 'General'}

CTA OPTIMIZATION PRIORITIES:
- Identify money page CTAs (${profile.money_pages.join(', ')}) for conversion optimization
- Use urgency, value props, and trust signals in CTA text
- Primary CTAs: Main conversion actions (quotes, contact, start repair)
- Secondary CTAs: Supporting actions (how it works, learn more)
- Contact CTAs: Phone numbers, email, contact forms

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
  `- "${link.anchor}" → ${link.href} [${link.selector}] (${link.link_type || 'regular'})`
).join('\n')}

HIGH-PRIORITY CTAS DETECTED (optimize for conversion):
${contentMap.blocks.filter(b => b.type === 'a' && (b.link_type === 'cta-money' || b.link_type === 'cta-contact')).map(cta => 
  `- CTA: "${cta.anchor}" → ${cta.href} [${cta.link_type}]`
).join('\n') || '- No CTAs detected'}

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

// Step 5: Content Enhancement Prompt Implementation (Simplified for Workers)
async function executeContentPrompt(profile, directive, contentMap, env, model) {
  const startTime = Date.now();
  const location = extractLocation(contentMap.route);
  const brand = extractBrand(contentMap.route);
  const brandInfo = brand ? classifyBrand(brand) : null;
  
  // Filter content blocks and sanitize for AI processing
  const allBlocks = contentMap.blocks || [];
  const contentBlocks = allBlocks.filter(block => 
    ['p', 'h1', 'h2', 'h3', 'li', 'blockquote'].includes(block.type) &&
    block.text && 
    block.text.length > 10 && 
    block.text.length < 300 // Strict length limit to prevent JSON issues
  );
  
  // Sanitize text content to prevent JSON parsing issues
  const sanitizedBlocks = contentBlocks.map((block, index) => ({
    id: block.id || (index + 1).toString(),
    selector: block.selector,
    type: block.type,
    text: (block.text || '')
      .replace(/"/g, '')     // Remove quotes entirely
      .replace(/\n/g, ' ')   // Replace newlines with spaces
      .replace(/\r/g, ' ')   // Replace carriage returns
      .replace(/\t/g, ' ')   // Replace tabs
      .replace(/\s+/g, ' ')  // Normalize whitespace
      .trim()
      .substring(0, 250),    // Hard limit to 250 chars
    word_count: (block.text || '').split(' ').length
  }));
  
  // V4.4: Get tone profile for business personality
  const toneProfile = TONE_PROFILES[directive.tone] || TONE_PROFILES.friendly;
  
  const systemPrompt = `Return a JSON object with this exact structure:
{"blocks":[{"id":"string","optimized_text":"string","optimization_notes":"string"}],"confidence":0.95}

Rules:
1. Start with { and end with }
2. No text before or after the JSON
3. Enhance the language but keep the same topic
4. If original mentions prices, keep those prices
5. Add "${profile.review_count || '1.5K+'} reviews" where appropriate`;

  const userPrompt = `${sanitizedBlocks.map(block => 
    `ID ${block.id}: ${block.text}`
  ).join('\n')}`;

  const aiResponse = await executeAIPrompt(systemPrompt, userPrompt, env, model);
  
  console.log('🔍 Content prompt AI response received:');
  console.log('Success:', aiResponse.success);
  console.log('Error:', aiResponse.error);
  console.log('Has raw_response:', !!aiResponse.raw_response);
  
      if (!aiResponse.success) {
      // Try to handle raw response if JSON parsing failed
      if (aiResponse.raw_response) {
        console.log('🔍 Raw response available, attempting manual parsing');
        console.log('🔍 Raw response length:', aiResponse.raw_response_length);
        console.log('🔍 Raw response start:', aiResponse.raw_response_start);
        console.log('🔍 Raw response end:', aiResponse.raw_response_end);
        
        // Try to extract JSON from raw response
        const jsonMatch = aiResponse.raw_response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            const parsed = JSON.parse(jsonMatch[0]);
            aiResponse.result = parsed;
            aiResponse.success = true;
            console.log('✅ Successfully extracted and parsed JSON from raw response');
          } catch (e) {
            console.log('❌ Failed to parse extracted JSON:', e.message);
          }
        }
      }
      
      if (!aiResponse.success) {
        console.log('❌ Content prompt failed completely');
        console.log('🔍 FAILURE DETAILS:');
        console.log('Error:', aiResponse.error);
        if (aiResponse.raw_response) {
          console.log('Raw response length:', aiResponse.raw_response_length);
          console.log('Raw response start:', aiResponse.raw_response_start);
          console.log('Raw response end:', aiResponse.raw_response_end);
          console.log('Raw response safe:', aiResponse.raw_response_safe);
        }
        if (aiResponse.debug_logs) {
          console.log('Debug logs:', aiResponse.debug_logs);
        }
        
        return {
          prompt_type: 'content',
          success: false,
          error: aiResponse.error,
          raw_response: aiResponse.raw_response,
          raw_response_safe: aiResponse.raw_response_safe,
          raw_response_length: aiResponse.raw_response_length,
          raw_response_start: aiResponse.raw_response_start,
          raw_response_end: aiResponse.raw_response_end,
          debug_logs: aiResponse.debug_logs || [],
          processing_time_ms: Date.now() - startTime,
          tokens_used: 0
        };
      }
    }
  
  // Handle the response - could be parsed object or error from repairMalformedJSON
  let parsedResult;
  if (typeof aiResponse.result === 'object' && aiResponse.result !== null) {
    // Already parsed successfully
    parsedResult = aiResponse.result;
    console.log('✅ Using pre-parsed AI response');
  } else {
    // repairMalformedJSON failed - this should not happen with JSON mode
    console.log('❌ AI response is not an object - this indicates repairMalformedJSON failed');
    console.log('🔍 AI Response type:', typeof aiResponse.result);
    console.log('🔍 AI Response:', aiResponse.result);
    
    // Try to repair common JSON issues
    let repairedJson = aiResponse.result;
    
    // Aggressive JSON extraction
    console.log('🔍 Original response length:', repairedJson.length);
    console.log('🔍 First 100 chars:', repairedJson.substring(0, 100));
    
    // Extract JSON from response
    const jsonMatch = repairedJson.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      repairedJson = jsonMatch[0];
      console.log('✅ Extracted JSON from response');
    } else {
      console.log('❌ No JSON structure found in response');
      // Try to find blocks array
      const blocksMatch = repairedJson.match(/\[[\s\S]*\]/);
      if (blocksMatch) {
        repairedJson = `{"blocks":${blocksMatch[0]},"confidence":0.8}`;
        console.log('✅ Constructed JSON from blocks array');
      }
    }
    
    // Fix common issues
    repairedJson = repairedJson.replace(/,\s*}/g, '}'); // Remove trailing commas
    repairedJson = repairedJson.replace(/,\s*]/g, ']'); // Remove trailing commas in arrays
    repairedJson = repairedJson.replace(/}\s*,\s*$/g, '}'); // Remove trailing comma after object
    
    try {
      parsedResult = JSON.parse(repairedJson);
      console.log('✅ JSON repaired successfully');
    } catch (repairError) {
      console.log('❌ JSON repair failed:', repairError.message);
      console.log('🔧 Creating fallback content blocks...');
      
      // Create fallback content blocks to prevent empty results
      parsedResult = {
        blocks: contentBlocks.slice(0, 3).map((block, i) => ({
          id: (i + 1).toString(),
          optimized_text: `${block.text} (Enhanced with ${directive.tone} tone)`,
          optimization_notes: `Applied ${directive.tone} personality to existing content`
        })),
        confidence: 0.7,
        processing_notes: [`Fallback content due to JSON parsing error`]
      };
    }
  }

  // Process AI results (simplified for Workers environment)
  try {
    const aiBlocks = parsedResult.blocks || [];
    
      // Debug: Log what the AI actually returned
  console.log('🔍 AI Response Structure:', JSON.stringify(aiResponse.result, null, 2));
  console.log('🔍 AI Blocks:', JSON.stringify(aiBlocks, null, 2));
  
  // Validate that AI response includes IDs
  const blocksWithIds = aiBlocks.filter(block => block.id);
  const blocksWithoutIds = aiBlocks.filter(block => !block.id);
  
  console.log(`🔍 Blocks WITH IDs: ${blocksWithIds.length}`);
  console.log(`🔍 Blocks WITHOUT IDs: ${blocksWithoutIds.length}`);
  
  if (blocksWithoutIds.length > 0) {
    console.log('⚠️ WARNING: Some blocks missing IDs:', blocksWithoutIds);
    console.log('🔍 Raw AI response that failed ID validation:', aiResponse.result);
  }
  
  // Force ID assignment if AI didn't provide them
  if (blocksWithoutIds.length > 0) {
    console.log('🔧 Attempting to repair missing IDs...');
    aiBlocks.forEach((block, index) => {
      if (!block.id) {
        block.id = (index + 1).toString();
        console.log(`🔧 Assigned ID "${block.id}" to block ${index + 1}`);
      }
    });
  }
  
  // Validate topic preservation
  console.log('🔍 Validating topic preservation...');
  aiBlocks.forEach((aiBlock, index) => {
    const originalBlock = sanitizedBlocks.find(b => b.id === aiBlock.id) || sanitizedBlocks[index];
    if (!originalBlock) return;
    
    const originalLower = originalBlock.text.toLowerCase();
    const optimizedLower = (aiBlock.optimized_text || '').toLowerCase();
    
    // Check if key elements are preserved
    const prices = originalBlock.text.match(/£\d+/g) || [];
    const missingPrices = prices.filter(p => !aiBlock.optimized_text.includes(p));
    
    if (missingPrices.length > 0) {
      console.log(`⚠️ Block ${aiBlock.id} missing prices: ${missingPrices.join(', ')}`);
    }
    
    // Check topic consistency
    if (originalLower.includes('price') && !optimizedLower.includes('price') && !optimizedLower.includes('cost')) {
      console.log(`⚠️ Block ${aiBlock.id} changed topic from pricing`);
    }
    if (originalLower.includes('battery') && !optimizedLower.includes('battery')) {
      console.log(`⚠️ Block ${aiBlock.id} changed topic from battery service`);
    }
  });
    
    return {
      prompt_type: 'content',
      success: true,
      result: {
        blocks: aiBlocks,
        confidence: aiResponse.result.confidence || 0.8,
        processing_notes: aiResponse.result.processing_notes || [],
        simplified_content_processing: true
      },
      processing_time_ms: Date.now() - startTime,
      tokens_used: aiResponse.tokens_used || 0,
      model_used: aiResponse.model_used
    };
  } catch (error) {
    return {
      prompt_type: 'content',
      success: false,
      error: `Content processing failed: ${error.message}`,
      processing_time_ms: Date.now() - startTime,
      tokens_used: aiResponse.tokens_used || 0
    };
  }
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
    "cls_improvements": ["width/height suggestions for ALL images"],
    "performance_optimizations": ["loading/decoding recommendations for ALL images"],
    "imagekit_optimizations": ["tr:w,h,q,f parameters for Core Web Vitals"]
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
6. CLS improvements: Recommend width/height for ALL images
7. Performance optimization: loading/decoding attributes for Core Web Vitals
8. ImageKit optimization: tr:w,h,q,f parameters for image delivery

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
- LocalBusiness: Complete with address, contact, reviews, services, area served, opening hours
- BreadcrumbList: Logical navigation hierarchy for user experience
- FAQPage: Detect and add if actual Q&A content exists on page
- Service catalog: hasOfferCatalog with all available services listed
- Valid structure: Proper @context, @graph, and @id references
- Local optimization: Address and geographic data derived from page context

FAQ DETECTION:
- Look for FAQ sections, Q&A content, or help sections in page content
- Add FAQPage schema only if actual questions and answers exist
- Include mainEntity with Question/Answer pairs from content

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
        "openingHours": ["Mo-Fr 09:00-17:00"],
        "hasOfferCatalog": {
          "@type": "OfferCatalog",
          "name": "Services",
          "itemListElement": [
            {"@type": "Offer", "itemOffered": {"@type": "Service", "name": "service_name"}}
          ]
        },
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
      },
      {
        "@type": "FAQPage",
        "@id": "page_url#faq",
        "mainEntity": [
          {"@type": "Question", "name": "question", "acceptedAnswer": {"@type": "Answer", "text": "answer"}}
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
1. LocalBusiness with complete address, contact, opening hours, and service catalog
2. BreadcrumbList for navigation hierarchy
3. FAQPage if Q&A content detected (look for FAQ sections in content)
4. Service catalog (hasOfferCatalog) with all ${profile.services?.length || 8} services
5. AggregateRating with review count (${profile.review_count}) and trust signals
6. Geographic targeting with area served for ${location || 'UK'}

FAQ CONTENT ANALYSIS:
${(contentMap.blocks || []).filter(b => 
  (b.text && (b.text.toLowerCase().includes('faq') || 
              b.text.toLowerCase().includes('question') || 
              b.text.includes('?')))
).map(b => `- "${b.text.substring(0, 100)}..."`).join('\n') || 'No FAQ content detected'}

SERVICES TO INCLUDE IN CATALOG:
${profile.services?.join(', ') || 'all available services'}

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
        error: error,
        raw_response: promptResult?.raw_response,
        raw_response_safe: promptResult?.raw_response_safe,
        debug_logs: promptResult?.debug_logs || []
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
