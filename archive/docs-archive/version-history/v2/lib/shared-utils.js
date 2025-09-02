// Shared utilities for V2 multi-prompt system

// Extract location from page route
export function extractLocation(route) {
  const match = route.match(/\/branches\/watch-repairs-(.+)/);
  if (match) {
    return match[1].replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }
  return null;
}

// Execute individual AI prompt
export async function executeAIPrompt(systemPrompt, userPrompt, env, model = 'gpt-4-turbo-preview') {
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
        max_tokens: 1500, // Focused prompts need fewer tokens
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
    console.error(`AI prompt execution failed:`, error);
    
    return {
      success: false,
      error: error.message,
      processing_time_ms: Date.now() - startTime,
      tokens_used: 0
    };
  }
}

// Validate prompt response structure
export function validatePromptResponse(response, requiredKeys) {
  const errors = [];
  
  for (const key of requiredKeys) {
    if (!(key in response)) {
      errors.push(`Missing required key: ${key}`);
    }
  }
  
  if (typeof response.confidence !== 'number' || response.confidence < 0 || response.confidence > 1) {
    errors.push('Confidence must be a number between 0 and 1');
  }
  
  if (!Array.isArray(response.notes)) {
    errors.push('Notes must be an array');
  }
  
  return errors;
}

// Generate fallback response for failed prompts
export function generateFallbackResponse(promptType, error) {
  return {
    success: false,
    prompt_type: promptType,
    error: error,
    fallback: true,
    result: {
      confidence: 0.1,
      notes: [`${promptType} prompt failed: ${error}`, 'Using fallback response']
    }
  };
}

