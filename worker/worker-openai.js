// Nimbus AI Content Optimization Worker with OpenAI Integration
// Production-ready Cloudflare Worker with real AI API calls

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

    // Only allow POST requests
    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    try {
      // Parse request body
      const requestData = await request.json();
      const { profile, directive, content_map } = requestData;

      // Validate required fields
      if (!profile || !directive || !content_map) {
        return new Response(JSON.stringify({ 
          error: 'Missing required fields: profile, directive, content_map' 
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Validate OpenAI API key
      if (!env.OPENAI_API_KEY) {
        return new Response(JSON.stringify({ 
          error: 'OpenAI API key not configured' 
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      console.log(`Processing optimization for: ${content_map.route}`);

      // Generate AI proposal using OpenAI
      const proposal = await generateOptimizationProposal(profile, directive, content_map, env);

      // Return successful response
      return new Response(JSON.stringify(proposal), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });

    } catch (error) {
      console.error('Worker error:', error);
      
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

async function generateOptimizationProposal(profile, directive, contentMap, env) {
  const startTime = Date.now();
  
  try {
    // Build the AI prompt
    const systemPrompt = buildSystemPrompt();
    const userPrompt = buildUserPrompt(profile, directive, contentMap);
    
    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4-turbo-preview', // or 'gpt-3.5-turbo' for faster/cheaper
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3, // Lower temperature for more consistent output
        max_tokens: 4000,
        response_format: { type: 'json_object' } // Ensure JSON response
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

    // Parse and validate AI response
    let proposal;
    try {
      proposal = JSON.parse(aiResponse);
    } catch (parseError) {
      console.error('Failed to parse AI response:', aiResponse);
      throw new Error('Invalid JSON response from AI');
    }

    // Validate response structure
    validateProposalStructure(proposal);

    // Add processing metadata
    proposal.processing_time_ms = Date.now() - startTime;
    proposal.model_used = 'gpt-4-turbo-preview';
    proposal.timestamp = new Date().toISOString();

    return proposal;

  } catch (error) {
    console.error('AI generation error:', error);
    
    // Fallback to mock response if AI fails
    console.log('Falling back to mock response due to AI error');
    return generateFallbackProposal(profile, directive, contentMap, error.message);
  }
}

function buildSystemPrompt() {
  return `You are Nimbus, a conversion-focused SEO copy editor.

INPUTS:
- profile: facts about the business (domain, money_pages, trust links)
- directive: page family rules (type=local|brand, tone, interlink policy, schema types)
- content_map: the page's ordered blocks with stable CSS selectors, plus head meta

OUTPUT:
Return a single JSON object with the exact keys:
{
  "head": {...},             // optional replacements for title, metaDescription
  "blocks": [...],           // text replacements with selector and new_text
  "links": [...],            // href/anchor replacements with selector, new_anchor, new_href
  "alts": [...],             // image alt replacements with selector and new_alt
  "schema": {...},           // one JSON-LD graph object
  "confidence": <0..1>,      // confidence score between 0 and 1
  "notes": [...]             // short bullet points of what you changed or skipped
}

HARD RULES (DO NOT BREAK):
- Modify ONLY nodes identified by provided selectors. Do NOT add/remove/reorder DOM elements.
- UK spelling. No prices, guarantees, review counts beyond those in profile.
- Links limited to: profile.money_pages, /watch-repairs/*, /brand/*, /branches/*
- Preserve existing href destinations unless explicitly improving them.
- Generate schema.org markup appropriate to directive.schema_types.
- Be conversion-focused: emphasize trust signals, local targeting, clear CTAs.

OPTIMIZATION PRIORITIES:
1. Local SEO (if type=local): Include location in title/H1, add LocalBusiness schema
2. Trust signals: Incorporate guarantee, review count, certifications from profile
3. CTA optimization: Make calls-to-action urgent and specific
4. Image accessibility: Add descriptive alt text for SEO and accessibility
5. Schema markup: Add structured data for better search visibility

Respond with valid JSON only.`;
}

function buildUserPrompt(profile, directive, contentMap) {
  return JSON.stringify({
    profile: {
      name: profile.name,
      domain: profile.domain,
      services: profile.services,
      geo_scope: profile.geo_scope,
      goal: profile.goal,
      money_pages: profile.money_pages,
      trust_links: profile.trust_links,
      phone: profile.phone,
      guarantee: profile.guarantee,
      review_count: profile.review_count,
      brands: profile.brands
    },
    directive: {
      type: directive.type,
      tone: directive.tone,
      cta_priority: directive.cta_priority,
      schema_types: directive.schema_types,
      trust_signals: directive.trust_signals
    },
    content_map: {
      path: contentMap.path,
      route: contentMap.route,
      head: contentMap.head,
      blocks: contentMap.blocks.filter(block => 
        block.type === 'h1' || 
        block.type === 'h2' || 
        (block.type === 'p' && block.i < 5) ||
        (block.type === 'a' && block.href && block.href.includes('start-repair'))
      ).slice(0, 8), // Only send key content: headings, first few paragraphs, CTAs
      flags: contentMap.flags
    }
  }, null, 2);
}

function validateProposalStructure(proposal) {
  const requiredKeys = ['head', 'blocks', 'links', 'alts', 'schema', 'confidence', 'notes'];
  
  for (const key of requiredKeys) {
    if (!(key in proposal)) {
      throw new Error(`Missing required key in proposal: ${key}`);
    }
  }

  // Validate confidence is a number between 0 and 1
  if (typeof proposal.confidence !== 'number' || proposal.confidence < 0 || proposal.confidence > 1) {
    throw new Error('Confidence must be a number between 0 and 1');
  }

  // Validate arrays
  if (!Array.isArray(proposal.blocks)) throw new Error('blocks must be an array');
  if (!Array.isArray(proposal.links)) throw new Error('links must be an array');
  if (!Array.isArray(proposal.alts)) throw new Error('alts must be an array');
  if (!Array.isArray(proposal.notes)) throw new Error('notes must be an array');

  // Validate block structure
  proposal.blocks.forEach((block, i) => {
    if (!block.selector || !block.new_text) {
      throw new Error(`Block ${i} missing selector or new_text`);
    }
  });

  // Validate link structure
  proposal.links.forEach((link, i) => {
    if (!link.selector) {
      throw new Error(`Link ${i} missing selector`);
    }
  });

  // Validate alt structure
  proposal.alts.forEach((alt, i) => {
    if (!alt.selector || !alt.new_alt) {
      throw new Error(`Alt ${i} missing selector or new_alt`);
    }
  });
}

function generateFallbackProposal(profile, directive, contentMap, errorMessage) {
  const location = extractLocation(contentMap.route);
  
  return {
    head: {
      title: directive.type === 'local' && location ? 
        `Professional Watch Repairs in ${location} | ${profile.guarantee}` :
        `${profile.name} - Professional Watch Repair Service`,
      metaDescription: `Expert watch repair service${location ? ` in ${location}` : ''}. ${profile.guarantee}, ${profile.review_count} reviews.`
    },
    blocks: [
      {
        selector: 'main h1',
        new_text: directive.type === 'local' && location ? 
          `Professional Watch Repairs in ${location}` :
          'Professional Watch Repair Service'
      }
    ],
    links: [
      {
        selector: 'main a[href*="start-repair"]',
        new_anchor: 'GET FREE QUOTE (2 MINS)',
        new_href: '/start-repair.html'
      }
    ],
    alts: [
      {
        selector: 'main img:first-of-type',
        new_alt: `Professional watch repair service${location ? ` in ${location}` : ''} - certified technicians`
      }
    ],
    schema: generateBasicSchema(profile, directive, location, contentMap.route),
    confidence: 0.6, // Lower confidence for fallback
    notes: [
      `Fallback proposal generated due to AI error: ${errorMessage}`,
      'Basic optimizations applied for SEO and conversion',
      location ? `Added location targeting for ${location}` : 'General service optimization',
      'Schema markup added for search visibility'
    ]
  };
}

function generateBasicSchema(profile, directive, location, route) {
  const schema = {
    '@context': 'https://schema.org',
    '@graph': []
  };

  if (directive.schema_types?.includes('LocalBusiness') && location) {
    schema['@graph'].push({
      '@type': 'LocalBusiness',
      '@id': `https://${profile.domain}${route}#business`,
      'name': `${profile.name} - ${location}`,
      'description': `Professional watch repair service in ${location}`,
      'telephone': profile.phone,
      'address': {
        '@type': 'PostalAddress',
        'addressLocality': location,
        'addressCountry': 'GB'
      }
    });
  }

  if (directive.schema_types?.includes('Service')) {
    schema['@graph'].push({
      '@type': 'Service',
      '@id': `https://${profile.domain}${route}#service`,
      'name': 'Watch Repair Service',
      'provider': {
        '@type': 'Organization',
        'name': profile.name
      }
    });
  }

  return schema;
}

function extractLocation(route) {
  const match = route.match(/\/branches\/watch-repairs-(.+)/);
  if (match) {
    return match[1].replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }
  return null;
}
