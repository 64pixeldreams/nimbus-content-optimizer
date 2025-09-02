// Universal Prompt Executor
// Handles AI API calls, response processing, caching, and Slack logging for any prompt

import { generateCacheKey, getCachedResult, setCachedResult } from './cache/index.js';
import slackLogger from './logger/slack.js';
/**
 * WHAT THIS DOES:
 * - Takes any prompt and payload
 * - Calls OpenAI API
 * - Handles JSON parsing and errors
 * - Logs results to Slack
 * - Returns clean response
 * 
 * HOW TO USE:
 * const executor = require('./prompt-executor');
 * const result = await executor.execute(promptModule, payload);
 * 
 * PAYLOAD STRUCTURE:
 * {
 *   blocks: [...],           // Content blocks to process
 *   business_context: {...}, // Business and context info
 *   page_type: 'brand',      // Page type for context
 *   page_context: {...}      // Brand, location, service context
 * }
 */

class PromptExecutor {
  
  /**
   * Execute a prompt with payload
   * @param {Object} promptModule - Prompt module with buildPrompt() function
   * @param {Object} payload - Data to process
   * @param {Object} options - Execution options (model, temperature, env, ignoreCache, etc.)
   * @returns {Object} AI response with success/error handling
   */
  async execute(promptModule, payload, options = {}) {
    const { env, ignoreCache = false, testMode = false } = options;
    const startTime = Date.now();
    let cacheKey;

    try {
      // Build the prompt first
      const { systemPrompt, userPrompt } = promptModule.buildPrompt(payload);
      
      // If test mode, return the prompt without executing
      if (testMode) {
        const testResult = {
          success: true,
          testMode: true,
          prompt: { systemPrompt, userPrompt },
          payload,
          timestamp: new Date().toISOString()
        };
        
        // Slack the test result
        await slackLogger.log(`${promptModule.name}_TEST`, testResult);
        
        return testResult;
      }

      // Only check cache logic if NOT in test mode
      if (env?.NIMBUS_CACHE) {
        cacheKey = await generateCacheKey(payload);
        if (!ignoreCache) {
          const cached = await getCachedResult(cacheKey, env);
          if (cached) {
            const json = {
              success: true,
              result: cached,
              processing_time_ms: 0,
              tokens_used: 0,
              cached: true,
              cache_timestamp: cached.cached_at,
              cache_key: cacheKey
            };
            await slackLogger.log(promptModule.name, json);
            return json;
          }
        }
      }
      
      // Prepare OpenAI request
      const openaiPayload = {
        model: options.model || promptModule.config?.model || 'gpt-4-turbo-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: options.temperature || promptModule.config?.temperature || 0.3,
        max_tokens: options.max_tokens || promptModule.config?.max_tokens || 4000
      };
      
      // Call OpenAI API
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(openaiPayload)
      });

      const data = await response.json();
      
      if (data.error) {
        throw new Error(`OpenAI API Error: ${data.error.message}`);
      }

      const aiResponse = data.choices[0].message.content;
      
      // Parse JSON response with error handling
      let result;
      try {
        result = JSON.parse(aiResponse);
      } catch (parseError) {
        // Try to extract JSON from response
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          result = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('Failed to parse AI response as JSON');
        }
      }
      
      // Store in cache (even if ignoreCache was true)
      if (env?.NIMBUS_CACHE && cacheKey) {
        await setCachedResult(cacheKey, result, env);
      }
      
      
      
      
      const json= {
        success: true,
        result: result,
        processing_time_ms: Date.now() - startTime,
        tokens_used: data.usage?.total_tokens || 0,
        cached: false,
        cache_stored: env?.NIMBUS_CACHE && cacheKey ? true : false,
        cache_key: cacheKey
      };
      await slackLogger.log(promptModule.name, json);
      return json;

    } catch (error) {
      // Log error to Slack
      
      await slackLogger.log(promptModule.name, payload, { error: error.message });
      
      return {
        success: false,
        error: error.message,
        result: null
      };
    }
  }
  

}

// Export singleton instance
export default new PromptExecutor();
