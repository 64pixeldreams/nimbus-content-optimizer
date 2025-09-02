// Content Quality Analyzer Prompt
// Analyzes optimization quality with tag-aware intelligence and page-level assessment

/**
 * WHAT THIS DOES:
 * - Analyzes optimized content blocks for quality
 * - Provides tag-specific analysis (META_TITLE, H1, BTN, etc.)
 * - Returns individual block scores + page summary
 * - Gives specific, actionable recommendations
 * 
 * INPUT PAYLOAD:
 * {
 *   blocks: [
 *     { id: "1", tag_type: "META_TITLE", optimized_text: "..." },
 *     { id: "2", tag_type: "H1", optimized_text: "..." }
 *   ],
 *   business_context: {
 *     brand: "Hublot",
 *     target_tone: "mom-n-pop", 
 *     location: "UK",
 *     seo_phrases: ["hublot watch repairs"]
 *   }
 * }
 * 
 * OUTPUT:
 * {
 *   blocks: [
 *     { 
 *       id: "1", 
 *       tag_type: "META_TITLE",
 *       optimized_text: "...",
 *       score: "85",
 *       pass: true,
 *       recommendations: ["Add 'UK' for local targeting"]
 *     }
 *   ],
 *   page_summary: {
 *     page_score: "83",
 *     seo_score: "85",
 *     tone_score: "90"
 *   }
 * }
 */

const ContentAnalyzer = {
  name: 'Content Analyzer',
  
  // AI model configuration
  config: {
    model: 'gpt-4-turbo-preview',
    temperature: 0.3,
    max_tokens: 4000
  },
  
  /**
   * Build analysis prompt based on payload
   * @param {Object} payload - Blocks and context to analyze
   * @returns {Object} { systemPrompt, userPrompt }
   */
  buildPrompt(payload) {
    const { blocks, business_context: businessContext } = payload;
    
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
        "tone_score": "0-100",
        "content_score": "0-100",
        }
    }
  ],
  "page_summary": {
    "page_score": "0-100",
    "seo_score": "0-100",
    "tone_score": "0-100", 
    "content_score": "0-100",
  }
}`;

    const userPrompt = `ANALYZE ALL THESE CONTENT BLOCKS:

${blocks.map(block => `ID: ${block.id}
TAG_TYPE: ${block.tag_type}
CONTENT: "${block.optimized_text}"`).join('\n\n')}

CRITICAL: You MUST include BOTH "blocks" array AND "page_summary" object in your response. Do NOT create "analysis_summary" - use "page_summary" exactly as shown in the format. Fill in the page_summary with actual values (overall_page_score as number, page_seo_strategy as string, etc.).

Provide comprehensive quality analysis for each block AND complete the page_summary section.`;

    return {
      systemPrompt,
      userPrompt
    };
  }
};

export default ContentAnalyzer;
