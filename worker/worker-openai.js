// AI Content Optimizer Worker
// Uses modular prompt executor system

import promptExecutor from './prompt-executor.js';
import headOptimizer from './prompts/head-optimizer.js';
// Add other prompt imports as we modularize them

export default {
  async fetch(request, env, ctx) {
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 })
    }

    try {
      const payload = await request.json()

      // Validate required fields
      if (!payload.profile || !payload.directive || !payload.content_map) {
        return new Response(JSON.stringify({
          error: 'Missing required fields: profile, directive, content_map'
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        })
      }

      // Route to specific prompt handler
      let result;
      switch (payload.prompt_type) {
        case 'head':
          result = await executeHeadPrompt(payload.profile, payload.directive, payload.content_map, env, payload.model, payload);
          break;
        case 'deeplinks':
          // TODO: Implement when we modularize deeplinks
          return new Response(JSON.stringify({ error: 'Deeplinks not yet modularized' }), { status: 501 });
        case 'content':
          // TODO: Implement when we modularize content
          return new Response(JSON.stringify({ error: 'Content not yet modularized' }), { status: 501 });
        case 'images':
          // TODO: Implement when we modularize images
          return new Response(JSON.stringify({ error: 'Images not yet modularized' }), { status: 501 });
        case 'schema':
          // TODO: Implement when we modularize schema
          return new Response(JSON.stringify({ error: 'Schema not yet modularized' }), { status: 501 });
        case 'multi':
          // TODO: Implement when we modularize multi
          return new Response(JSON.stringify({ error: 'Multi not yet modularized' }), { status: 501 });
        default:
          return new Response(JSON.stringify({ error: `Unknown prompt_type: ${payload.prompt_type}` }), { status: 400 });
      }

      // Just return what the executor gives us (includes all cache metadata)
      return new Response(JSON.stringify(result), {
        headers: { 'Content-Type': 'application/json' }
      })

    } catch (error) {
      return new Response(JSON.stringify({
        error: error.message
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }
  }
};

/**
 * HEAD OPTIMIZATION PROMPT EXECUTOR
 * 
 * Executes the head optimization prompt with comprehensive context building.
 * 
 * @param {Object} profile - Business profile information
 *   @param {string} profile.name - Company name (e.g., "Acme Plumbing")
 *   @param {string} profile.domain - Website domain (e.g., "acmeplumbing.co.uk")
 *   @param {Array<string>} [profile.services] - Array of services offered (e.g., ["Emergency Plumbing", "Bathroom Fitting"])
 *   @param {Array<string>} [profile.geo_scope] - Geographic service areas (e.g., ["London", "Manchester"])
 *   @param {Object} [profile.reviews] - Review information (preferred over review_count)
 *     @param {string} profile.reviews.count - Review count (e.g., "Over 100", "127")
 *     @param {string} profile.reviews.site - Review site (e.g., "Google", "Trustpilot")
 *     @param {string} [profile.reviews.rating] - Average rating (e.g., "4.8")
 *     @param {string} [profile.reviews.url] - Review page URL
 *   @param {number} [profile.review_count] - Number of customer reviews (fallback, e.g., 127)
 *   @param {string} [profile.guarantee] - Service guarantee (e.g., "100% Satisfaction Guarantee")
 *   @param {string} [profile.phone] - Contact phone number (e.g., "0800 121 6030")
 *   @param {string} [profile.hours] - Business hours (e.g., "24/7 Emergency Service")
 *   @param {string} [profile.country] - Country code for localization (e.g., "UK", "US", "CA")
 * 
 * @param {Object} directive - Content optimization instructions
 *   @param {string} directive.tone - Tone of voice (e.g., "professional", "friendly", "authoritative")
 * 
 * @param {Object} contentMap - Current content to optimize
 *   @param {Object} contentMap.head - Head metadata content
 *     @param {string} contentMap.head.title - Current meta title
 *     @param {string} contentMap.head.metaDescription - Current meta description
 *     @param {string} contentMap.head.canonical - Current canonical URL
 * 
 * @param {Object} env - Cloudflare Worker environment
 *   @param {string} env.OPENAI_API_KEY - OpenAI API key for AI calls
 *   @param {Object} env.NIMBUS_CACHE - KV store for caching responses
 * 
 * @param {string} [model] - AI model to use (e.g., "gpt-4o", "gpt-4-turbo-preview")
 * 
 * @param {Object} [requestData] - Additional request parameters
 *    @param {string} [requestData.page_type] - Type of page (e.g., "service", "product", "about", "contact")
 *   @param {Object} [requestData.page_context] - Page-specific context
 *     @param {string} [requestData.page_context.brand] - Brand name (e.g., "Acme")
 *     @param {string} [requestData.page_context.location] - Location context (e.g., "London", "Manchester")
 *     @param {string} [requestData.page_context.service] - Service context (e.g., "Emergency Plumbing")
 *     @param {string} [requestData.page_context.product] - Product context (e.g., "Boiler Installation")
 *   @param {boolean} [requestData.ignoreCache] - Force fresh AI response (bypass cache)
 *  @param {boolean} [requestData.testMode] - Enable test mode to see generated prompt without AI execution
 * @returns {Promise<Object>} AI optimization result with cache metadata
 */
async function executeHeadPrompt(profile, directive, contentMap, env, model, requestData = {}) {
  // Build payload for head optimizer
  const payload = {
    profile,
    directive, 
    content_map: contentMap,
    page_type: requestData.page_type,
    page_context: requestData.page_context
  };
  
  // Execute using modular system with cache support and test mode
  return await promptExecutor.execute(headOptimizer, payload, { 
    env, 
    ignoreCache: requestData.ignoreCache,
    testMode: requestData.testMode
  });
}

// Export the function so it can be called by the main worker
export { executeHeadPrompt };










