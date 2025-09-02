// Above-the-Fold Optimizer Prompt
// Optimizes the most critical content: hero section with H1, subheadings, content, and CTAs

import { buildContextualPrompt } from '../../prompt-context-builder.js';

/**
 * WHAT THIS DOES:
 * - Optimizes above-the-fold hero/jumbotron sections
 * - Handles H1, subheadings, intro content, CTAs, and trust signals
 * - Focuses on immediate impact and conversion
 * - Ensures cohesive messaging across all elements
 * 
 * INPUT PAYLOAD:
 * {
 *   profile: { ... },
 *   directive: { ... },
 *   above_fold: {
 *     h1: "Current H1 text",
 *     subheading: "Current subheading/H2",
 *     content: "Intro paragraph content",
 *     cta_primary: "Primary CTA button text",
 *     cta_secondary: "Secondary CTA button text (optional)",
 *     trust_signal: "Trust signal text (e.g., ratings, reviews)"
 *   },
 *   page_type: "service",
 *   page_context: { ... }
 * }
 * 
 * OUTPUT:
 * {
 *   above_fold: {
 *     h1: "Optimized H1",
 *     subheading: "Optimized subheading",
 *     content: "Optimized intro content",
 *     cta_primary: "Optimized primary CTA",
 *     cta_secondary: "Optimized secondary CTA",
 *     trust_signal: "Optimized trust signal"
 *   },
 *   confidence: 0.95,
 *   notes: ["optimization details"]
 * }
 */

const AboveFoldOptimizer = {
  name: 'Above-Fold Optimizer',
  
  // AI model configuration
  config: {
    model: 'gpt-4-turbo-preview',
    temperature: 0.3,
    max_tokens: 2000
  },
  
  /**
   * Build optimization prompt based on payload
   * @param {Object} payload - Above-fold content and context
   * @returns {Object} { systemPrompt, userPrompt }
   */
  buildPrompt(payload) {
    const { profile, directive, above_fold, page_type, page_context } = payload;
    
    // Build contextual information
    const contextData = buildContextualPrompt(profile, directive, page_type, page_context);
    
    const systemPrompt = `You are an above-the-fold conversion optimization specialist focused on immediate impact and engagement.

TASK: Optimize hero section content for maximum conversion and SEO impact.

${contextData.fullContext}

OPTIMIZATION RULES:

H1 (Primary Heading):
- 40-60 characters optimal, max 70
- Include primary keyword + location if local
- Clear value proposition
- No keyword stuffing
- Compelling and benefit-focused

SUBHEADING (H2/H5):
- 60-80 characters optimal, max 100
- Support and expand H1 message
- Include secondary keywords naturally
- List key services/benefits if appropriate
- Use separators (|, –, •) for readability

CONTENT (Intro Paragraph):
- 150-200 words optimal
- Hook within first 15 words
- Include primary keywords naturally (2-3% density)
- Clear benefits and differentiators
- Include trust signals (years, reviews, certifications)
- End with soft CTA or transition

CTA PRIMARY (Main Button):
- 15-25 characters optimal
- Action-oriented (Get, Start, Book, Call)
- Include urgency or benefit
- Location-specific if relevant
- No generic "Submit" or "Click Here"

CTA SECONDARY (Optional):
- Complementary to primary CTA
- Lower commitment action (Learn More, View Prices)
- 15-30 characters

TRUST SIGNAL:
- Include ratings, review count, certifications
- Keep concise (50-80 characters)
- Use ★ symbol (\u2605) for stars
- Specific numbers preferred over vague claims

COHESION REQUIREMENTS:
- All elements must work together
- Consistent tone across all text
- Clear value proposition flow
- No contradictory messaging
- Progressive disclosure (H1 → Content → CTA)

CHARACTER LIMITS:
- H1: 70 chars max
- Subheading: 100 chars max
- Content: 200 words max
- CTA Primary: 30 chars max
- CTA Secondary: 35 chars max
- Trust Signal: 80 chars max

Return ONLY valid JSON with optimized above-fold content.`;

    const userPrompt = `Optimize this above-the-fold content:

H1: "${above_fold.h1 || ''}"
Subheading: "${above_fold.subheading || ''}"
Content: "${above_fold.content || ''}"
Primary CTA: "${above_fold.cta_primary || ''}"
Secondary CTA: "${above_fold.cta_secondary || ''}"
Trust Signal: "${above_fold.trust_signal || ''}"

Create compelling, conversion-focused content that immediately engages visitors and drives action.`;

    return { systemPrompt, userPrompt };
  }
};

export default AboveFoldOptimizer;

