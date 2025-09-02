// Head Metadata Optimizer Prompt
// Optimizes page title, meta description, and canonical URL

import { buildContextualPrompt } from '../prompt-context-builder.js';

/**
 * WHAT THIS DOES:
 * - Optimizes meta title, description, canonical URL
 * - Uses contextual intelligence (tone, business, page, localization)
 * - Returns clean JSON with optimized head metadata
 * 
 * INPUT PAYLOAD:
 * {
 *   profile: { name, services, country, review_count, guarantee, ... },
 *   directive: { tone, type, ... },
 *   content_map: { head: { title, metaDescription, canonical }, ... },
 *   page_type: 'brand',
 *   page_context: { brand: 'rolex', location: 'manchester', service: 'watch-repair' }
 * }
 * 
 * OUTPUT:
 * {
 *   head: {
 *     title: "Optimized title (55-60 chars)",
 *     metaDescription: "Optimized description (150-160 chars)",
 *     canonical: "Clean URL"
 *   },
 *   confidence: 0.95,
 *   notes: ["optimization details"]
 * }
 */

const HeadOptimizer = {
  name: 'Head Optimizer',
  
  // AI model configuration
  config: {
    model: 'gpt-4o',
    temperature: 0.3,
    max_tokens: 2000
  },
  
  /**
   * Build head optimization prompt based on payload
   * @param {Object} payload - Profile, directive, content_map, page context
   * @returns {Object} { systemPrompt, userPrompt }
   */
  buildPrompt(payload) {
    const { profile, directive, content_map, page_type, page_context } = payload;
    
    // Build contextual information using context builder
    const contextData = buildContextualPrompt(profile, directive, { 
      pageType: page_type,
      ...page_context 
    });
    
    const systemPrompt = `You are a head metadata and SERP optimization specialist focused on SEO and conversion.

TASK: Optimize page head metadata for maximum SEO impact and CTR.

${contextData.fullContext}

RULES:
- Title: 55–60 chars and ~≤580px; order = service + city + benefit/trust + brand suffix (“ | Acme Plumbing”) if space allows.
- Meta description: 150–160 chars and ~≤920px; include one concise trust signal and a soft CTA with phone.
- Prefer compact separators (|, –), avoid ALL CAPS, emojis; if star is risky, use \u2605.
- Avoid keyword stuffing, duplicate words, or invented claims/URLs.
- Canonical: Use the provided canonical; if missing ignore.
- Length compliance: If out of bounds, regenerate until within limits.
- Return JSON only (no code fences), with valid escaping.

OPTIMIZATION PRIORITIES:
1. Contextual relevance (brand, location, service as appropriate)
2. Trust signal integration (reviews, guarantees)
3. Click-through rate optimization
4. Character count compliance
5. Conversion-focused messaging

You must respond with valid JSON in this exact format:
{
  "head": {
    "title": "string (55-60 chars)",
    "metaDescription": "string (150-160 chars)", 
    "canonical": "string (absolute URL)"
  },
  "confidence": 0.95,
  "notes": ["optimization details"]
}

Return only valid JSON with the optimized metadata.`;

    const userPrompt = `Optimize head metadata for this page:

CURRENT HEAD:
- Title: "${content_map.head.title}" (${content_map.head.title.length} chars)
- Meta: "${content_map.head.metaDescription}" (${content_map.head.metaDescription.length} chars)
- Canonical: "${content_map.head.canonical}"

TARGET IMPROVEMENTS:
- Title: 55-60 chars with contextually relevant keywords and benefits
- Meta: 150-160 chars with trust signals and compelling copy

Return optimized head metadata meeting exact character requirements and contextual relevance.`;

    return {
      systemPrompt,
      userPrompt
    };
  }
};

export default HeadOptimizer;
