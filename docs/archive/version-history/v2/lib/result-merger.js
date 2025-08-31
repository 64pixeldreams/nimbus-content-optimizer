// V2 Result Merger - Combines multiple prompt results into V1-compatible format

export function mergeV2Results(promptResults) {
  const merged = {
    head: {},
    blocks: [],
    links: [],
    alts: [],
    schema: {},
    confidence: 0,
    notes: [],
    v2_metadata: {
      prompt_count: promptResults.length,
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
    
    if (promptResult && promptResult.success) {
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
        tokens_used,
        changes_count: countChangesInResult(result)
      });
      
    } else {
      merged.v2_metadata.failed_prompts++;
      const error = promptResult?.error || promiseResult.reason?.message || 'Unknown error';
      merged.notes.push(`[${promptResult?.prompt_type || 'unknown'}] Failed: ${error}`);
      
      merged.v2_metadata.individual_results.push({
        prompt_type: promptResult?.prompt_type || 'unknown',
        success: false,
        error: error,
        processing_time_ms: promptResult?.processing_time_ms || 0
      });
    }
  });

  // Calculate overall confidence (average of successful prompts)
  merged.confidence = successfulPrompts > 0 ? totalConfidence / successfulPrompts : 0;
  merged.v2_metadata.successful_prompts = successfulPrompts;
  
  // Add summary statistics
  merged.v2_metadata.total_changes = merged.blocks.length + merged.links.length + merged.alts.length + 
    Object.keys(merged.head).length + (merged.schema && Object.keys(merged.schema).length > 0 ? 1 : 0);
  
  merged.v2_metadata.total_processing_time = merged.v2_metadata.individual_results
    .reduce((sum, r) => sum + r.processing_time_ms, 0);
    
  merged.v2_metadata.total_tokens = merged.v2_metadata.individual_results
    .reduce((sum, r) => sum + (r.tokens_used || 0), 0);

  return merged;
}

function countChangesInResult(result) {
  let count = 0;
  if (result.head) count += Object.keys(result.head).length;
  if (result.blocks) count += result.blocks.length;
  if (result.links) count += result.links.length;
  if (result.alts) count += result.alts.length;
  if (result.schema) count += 1;
  return count;
}

