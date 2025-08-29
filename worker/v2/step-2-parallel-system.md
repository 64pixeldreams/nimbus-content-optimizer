# Step 2: Parallel Prompt Execution System

## Objective
Build the core system that executes multiple focused AI prompts in parallel.

## Requirements
- ✅ Execute 5 prompts simultaneously for speed
- ✅ Handle individual prompt failures gracefully  
- ✅ Merge results into V1-compatible format
- ✅ Track performance and costs per prompt
- ✅ Maintain backward compatibility

## Implementation Tasks

### 2.1 Prompt Executor Framework
Create shared logic for executing individual AI prompts:
```javascript
// lib/prompt-executor.js
export async function executePrompt(promptType, systemPrompt, userPrompt, env) {
  const startTime = Date.now();
  
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4-turbo-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3,
        max_tokens: 1500, // Focused prompts need fewer tokens
        response_format: { type: 'json_object' }
      })
    });
    
    const data = await response.json();
    const result = JSON.parse(data.choices[0].message.content);
    
    return {
      type: promptType,
      success: true,
      result,
      processing_time_ms: Date.now() - startTime,
      tokens_used: data.usage?.total_tokens || 0
    };
    
  } catch (error) {
    return {
      type: promptType,
      success: false,
      error: error.message,
      processing_time_ms: Date.now() - startTime
    };
  }
}
```

### 2.2 Result Merger System
Combine multiple prompt results into single V1-compatible response:
```javascript
// lib/result-merger.js
export function mergePromptResults(results) {
  const merged = {
    head: {},
    blocks: [],
    links: [],
    alts: [],
    schema: {},
    confidence: 0,
    notes: []
  };
  
  // Merge each prompt result
  results.forEach(result => {
    if (result.success) {
      // Merge based on prompt type
      switch (result.type) {
        case 'head':
          merged.head = { ...merged.head, ...result.result };
          break;
        case 'links':
          merged.links.push(...(result.result.links || []));
          break;
        case 'content':
          merged.blocks.push(...(result.result.blocks || []));
          break;
        case 'images':
          merged.alts.push(...(result.result.alts || []));
          break;
        case 'schema':
          merged.schema = result.result.schema || {};
          break;
      }
      
      // Collect notes
      if (result.result.notes) {
        merged.notes.push(...result.result.notes);
      }
    } else {
      merged.notes.push(`${result.type} prompt failed: ${result.error}`);
    }
  });
  
  // Calculate overall confidence (average of successful prompts)
  const successful = results.filter(r => r.success);
  merged.confidence = successful.length > 0 ? 
    successful.reduce((sum, r) => sum + (r.result.confidence || 0), 0) / successful.length : 0;
  
  return merged;
}
```

### 2.3 V2 Multi-Prompt Worker
Main worker that orchestrates all prompts:
```javascript
// worker-v2-multi.js
import { executePrompt } from './lib/prompt-executor.js';
import { mergePromptResults } from './lib/result-merger.js';

export default {
  async fetch(request, env, ctx) {
    // ... CORS and validation (same as V1)
    
    const { profile, directive, content_map } = await request.json();
    
    // Execute all 5 prompts in parallel
    const promptPromises = [
      executeHeadPrompt(profile, directive, content_map, env),
      executeDeepLinkPrompt(profile, directive, content_map, env),
      executeContentPrompt(profile, directive, content_map, env), 
      executeImagePrompt(profile, directive, content_map, env),
      executeSchemaPrompt(profile, directive, content_map, env)
    ];
    
    const results = await Promise.all(promptPromises);
    
    // Merge results into V1-compatible format
    const mergedResult = mergePromptResults(results);
    
    // Add V2 metadata
    mergedResult.v2_metadata = {
      prompt_count: 5,
      successful_prompts: results.filter(r => r.success).length,
      total_processing_time: results.reduce((sum, r) => sum + r.processing_time_ms, 0),
      total_tokens: results.reduce((sum, r) => sum + (r.tokens_used || 0), 0)
    };
    
    return new Response(JSON.stringify(mergedResult), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
};
```

## Success Criteria
- ✅ Parallel prompt execution framework working
- ✅ Result merging produces V1-compatible output
- ✅ Individual prompt failure doesn't break system
- ✅ Performance tracking per prompt
- ✅ V1 system unaffected

## Next Step
Step 3: Head metadata optimization prompt (focused on titles, descriptions, canonical)
