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
  const { executeAIPrompt, extractLocation } = await import('./lib/shared-utils.js');
  
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

OUTPUT FORMAT:
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
5. Benefit-focused messaging`;

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

async function executeDeepLinksPrompt(profile, directive, contentMap, env, model) {
  // Step 4 implementation
  return { prompt_type: 'deeplinks', error: 'Not implemented yet' };
}

async function executeContentPrompt(profile, directive, contentMap, env, model) {
  // Step 5 implementation
  return { prompt_type: 'content', error: 'Not implemented yet' };
}

async function executeImagesPrompt(profile, directive, contentMap, env, model) {
  // Step 6 implementation
  return { prompt_type: 'images', error: 'Not implemented yet' };
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
