// AI Content Quality Analyzer Worker
// Dedicated worker for analyzing optimization quality

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  try {
    const payload = await request.json()
    
    console.log('🔍 RECEIVED PAYLOAD:', JSON.stringify(payload, null, 2))
    
    // Validate required fields
    if (!payload.blocks || !Array.isArray(payload.blocks)) {
      return new Response(JSON.stringify({
        error: 'Missing required field: blocks (array)'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Keep it simple - get AI response and return it
    const aiResult = await analyzeAllBlocks(payload)
    
    return new Response(JSON.stringify({
      success: true,
      result: aiResult
    }), {
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

async function analyzeAllBlocks(payload) {
  const {blocks, business_context: businessContext} = payload;
  const systemPrompt = `You are an expert SEO and content quality analyst. Analyze this COMPLETE PAGE holistically - understanding how all blocks work together as a unified page strategy.

ANALYSIS APPROACH:
1. Review ALL blocks as a complete page (not isolated pieces)
2. Assess page-level SEO strategy and brand consistency  
3. Evaluate user journey and conversion flow
4. Check content hierarchy and structure
5. Identify page-wide patterns and issues

PROVIDE:
- Individual block analysis with scores and recommendations
- General page analysis with scores and recommendations.

BUSINESS CONTEXT:
${JSON.stringify(businessContext, null, 2)}

Be specific in all recommendations. Don't say 'add keywords' - list the exact keywords. Don't say 'improve tone' - give the exact wording change. Don't say 'enhance content' - show the specific edit.
Note: All scores are 0-100 as a string.
CRITICAL: Always include the exact optimized_text from the input in your response.

Each block has a tag_type indicating its HTML purpose. Analyze according to tag function and SEO impact:
- META_TITLE: <60 chars, primary keyword, search result impact, high SEO weight
- META_DESC: <160 chars, compelling copy, click-through optimization
- H1: Primary keyword focus, single per page, headline impact
- H2: Secondary keywords, content structure  
- H3: Supporting keywords
- BTN: Action language, conversion focus
- LINK: Anchor text optimization
- CONTENT: Supporting information, readability

Return ONLY valid JSON in this exact format:
{
  "blocks": [
    {
      "id": "block_id",
      "tag_type": "META_TITLE|META_DESC|H1|H2|H3|BTN|LINK|CONTENT",
      "optimized_text": "do not remove or edit the original text",
      "score": "0-100",
      "pass": true or false,
      "notes": "Analysis summary",
      "recommendations": ["Improvements"],
      "seo_analysis": "SEO assessment",
      "tone_analysis": "Tone analysis",
      "content_quality": "Quality assessment",
      "detailed_breakdown": {
        "seo_score": "0-100",
        "content_score": "0-100",
        "tone_score": "0-100",
        "completeness_score": "0-100",
        "impact_score": "0-100"
      }
    }
  ],
  "page_summary": {
    "page_score": "0-100",
    "seo_score": "0-100",
    "tone_score": "0-100", 
    "content_score": "0-100",
    "completeness_score": "0-100",
    "impact_score": "0-100"
  }
}`

  const userPrompt = `ANALYZE ALL THESE CONTENT BLOCKS:

${blocks.map(block => `ID: ${block.id}
CONTENT: "${block.optimized_text}"`).join('\n\n')}


Provide comprehensive quality analysis for each block AND complete the comprehensive page_summary section.`

  const openaiPayload = {
    model: 'gpt-4-turbo-preview',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ],
    temperature: 0.3,
    max_tokens: 4000
  }
  
  console.log('🤖 OPENAI PAYLOAD:', JSON.stringify(openaiPayload, null, 2))

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(openaiPayload)
    })

    const data = await response.json()
    
    if (data.error) {
      throw new Error(`OpenAI API Error: ${data.error.message}`)
    }

    const aiResponse = data.choices[0].message.content
    

   

    // Parse and return the AI response as JSON
    let analysis
    try {
      analysis = JSON.parse(aiResponse)
    } catch (parseError) {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('Failed to parse AI response as JSON')
      }
    }
    
    return analysis

  } catch (error) {
    throw new Error(`Analysis failed: ${error.message}`)
  }
}





// THIS IS NOT BEING USED ANYMORE!
async function analyzeContentQuality(optimizedText, businessContext) {
  const systemPrompt = `You are an expert SEO and content quality analyst. Your job is to analyze content quality and provide detailed, actionable feedback.

ANALYSIS TASK:
Assess the quality of this optimized content for SEO, readability, tone, and overall effectiveness.

SCORING SYSTEM (0-100):
- SEO Effectiveness (30 points): Keyword integration, local SEO, search intent, ranking potential
- Content Quality (25 points): Readability, engagement, professional tone, clarity
- Tone Consistency (20 points): Brand voice, style consistency, emotional appeal
- Content Completeness (15 points): Information completeness, accuracy, usefulness
- Overall Impact (10 points): Will this content actually perform well?

PASS THRESHOLD: 70/100

BUSINESS CONTEXT:
${JSON.stringify(businessContext, null, 2)}

Return ONLY valid JSON in this exact format:
{
  "score": 85,
  "pass": true,
  "notes": "Detailed analysis summary",
  "recommendations": ["Specific actionable improvements"],
  "seo_analysis": "SEO effectiveness assessment",
  "tone_analysis": "Tone and style analysis", 
  "content_quality": "Content quality assessment",
  "detailed_breakdown": {
    "seo_score": 25,
    "content_score": 22,
    "tone_score": 18,
    "completeness_score": 12,
    "impact_score": 8
  }
}`

  const userPrompt = `ANALYZE THIS OPTIMIZED CONTENT:

CONTENT TO ANALYZE:
"${optimizedText}"

Provide a comprehensive quality analysis with scores, notes, and specific recommendations. Focus on real SEO and content quality, not just word counting.`

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3,
        max_tokens: 2000
      })
    })

    const data = await response.json()
    
    if (data.error) {
      throw new Error(`OpenAI API Error: ${data.error.message}`)
    }

    const aiResponse = data.choices[0].message.content
    
    // Parse the AI response
    let analysis
    try {
      analysis = JSON.parse(aiResponse)
    } catch (parseError) {
      // Try to extract JSON from the response
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('Failed to parse AI response as JSON')
      }
    }

    // Validate and normalize the response
    return {
      score: analysis.score || 50,
      pass: analysis.pass || false,
      notes: analysis.notes || "No analysis provided",
      recommendations: analysis.recommendations || ["No recommendations"],
      seo_analysis: analysis.seo_analysis || "No SEO analysis",
      tone_analysis: analysis.tone_analysis || "No tone analysis",
      content_quality: analysis.content_quality || "No quality analysis",
      detailed_breakdown: analysis.detailed_breakdown || {
        seo_score: 15,
        content_score: 12,
        tone_score: 10,
        completeness_score: 8,
        impact_score: 5
      }
    }

  } catch (error) {
    throw new Error(`Analysis failed: ${error.message}`)
  }
}
