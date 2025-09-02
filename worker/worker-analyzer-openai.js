// AI Content Quality Analyzer Worker  
// Uses modular prompt executor system

import promptExecutor from './prompt-executor.js';
import contentAnalyzer from './prompts/content-analyzer.js';

export default {
  async fetch(request, env, ctx) {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  try {
    const payload = await request.json()
    
    // Validate required fields
    if (!payload.blocks || !Array.isArray(payload.blocks)) {
      return new Response(JSON.stringify({
        error: 'Missing required field: blocks (array)'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Execute analysis using modular system with cache support
    const result = await promptExecutor.execute(contentAnalyzer, payload, { 
      env, // Pass env for KV cache access
      ignoreCache: payload.ignoreCache 
    });
    
    // Just return what the executor gives us
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
