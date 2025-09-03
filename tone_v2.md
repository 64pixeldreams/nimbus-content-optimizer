Thought for 1m 35s

Awesome—let’s make this dead-simple to drop in with minimal churn, fewer tones, and strong metadata you can inject into any prompt.

I’ve done three things:

Consolidated tones to 8 canonical ones (clean aliases keep your old keys working).

Kept your original fields (personality, language, cta_style, formality) for backward compatibility, but added precise, machine-usable metadata.

Added small helper functions so you can:

resolve a tone by name or by outcome (goal/audience/etc.),

get the metadata object,

generate a prompt block you can inject into any system prompt.

1) Tone map + metadata (full JSON)

Drop this in as TONE_PROFILES and TONE_ALIASES. The aliases mean you don’t have to refactor existing calls.

{
  "TONE_PROFILES": {
    "modern-tech": {
      "personality": "Efficient, transparent, user-focused",
      "language": "Simple, straightforward, hassle-free, transparent pricing, fast integration, reliable, secure",
      "cta_style": "Try it now, See how it works, Get instant quote",
      "formality": "casual-modern",
      "voice_pillars": ["minimal", "direct", "credible"],
      "perspective": "we",
      "reading_level": 9,
      "cadence": "short",
      "syntax_rules": ["active voice", "no exclamations", "prefer concrete nouns", "numbers over adjectives"],
      "lexicon": {
        "do": ["fast integration", "reliable", "uptime", "API", "security", "compliance", "scales with you"],
        "avoid": ["revolutionary", "game-changing", "insane", "magic"]
      },
      "banned_words": ["revolutionary", "disruptive", "insane", "super easy"],
      "cta_verbs": ["Start", "Explore", "View", "Contact", "Get"],
      "hedging": "none",
      "emoji": "never",
      "formatting": { "headings": "concise", "bullets": "preferred", "caps": "sentence-case" },
      "examples": {
        "hero": "Payments and tools that just work.",
        "button": "Explore docs",
        "error": "We couldn’t load your data. Try again."
      }
    },
    "startup": {
      "personality": "Punchy, modern, clever",
      "language": "Crisp, strong verbs, minimal fluff, ship faster, automate, in minutes",
      "cta_style": "Get started, Try it free, Join us",
      "formality": "casual-dynamic",
      "voice_pillars": ["energetic", "clear", "confident"],
      "perspective": "we",
      "reading_level": 8,
      "cadence": "short",
      "syntax_rules": ["short sentences", "one idea per sentence", "no clichés"],
      "lexicon": {
        "do": ["launch", "ship", "automate", "results", "minutes not months"],
        "avoid": ["game-changing", "next-level", "supercharge", "disrupt"]
      },
      "banned_words": ["game-changing", "next-level", "supercharge", "disrupt"],
      "cta_verbs": ["Get", "Try", "Join", "See"],
      "hedging": "none",
      "emoji": "never",
      "formatting": { "headings": "concise", "bullets": "allowed", "caps": "title-case" },
      "examples": {
        "hero": "Ship faster. Sleep better.",
        "button": "Try it free",
        "error": "Something went wrong. Please retry."
      }
    },
    "corporate": {
      "personality": "Professional, trustworthy, established",
      "language": "Industry-leading expertise, proven outcomes, governance, risk-managed, enterprise-ready",
      "cta_style": "Contact our team, Schedule consultation, Discover our services",
      "formality": "formal-professional",
      "voice_pillars": ["authoritative", "measured", "reassuring"],
      "perspective": "we",
      "reading_level": 11,
      "cadence": "mixed",
      "syntax_rules": ["measured claims", "avoid hype", "support with specifics"],
      "lexicon": {
        "do": ["governance", "SLAs", "compliance", "roadmap", "stakeholders", "integrations"],
        "avoid": ["best ever", "unbeatable", "hypergrowth"]
      },
      "banned_words": ["unbeatable", "best ever"],
      "cta_verbs": ["Schedule", "Contact", "Review", "Explore"],
      "hedging": "light",
      "emoji": "never",
      "formatting": { "headings": "descriptive", "bullets": "preferred", "caps": "title-case" },
      "examples": {
        "hero": "Reliable solutions for complex organizations.",
        "button": "Schedule consultation",
        "error": "We’re reviewing this request. Please try again shortly."
      }
    },
    "premium": {
      "personality": "Luxury, exclusive, sophisticated",
      "language": "Bespoke service, refined quality, meticulous care, exceptional standards",
      "cta_style": "Experience excellence, Discover more, Arrange consultation",
      "formality": "formal-luxury",
      "voice_pillars": ["refined", "assured", "understated"],
      "perspective": "we",
      "reading_level": 10,
      "cadence": "long",
      "syntax_rules": ["elevated diction", "understate value", "no slang"],
      "lexicon": {
        "do": ["bespoke", "crafted", "meticulous", "heritage", "provenance"],
        "avoid": ["cheap", "deal", "bargain"]
      },
      "banned_words": ["cheap", "bargain"],
      "cta_verbs": ["Discover", "Arrange", "Enquire", "Experience"],
      "hedging": "light",
      "emoji": "never",
      "formatting": { "headings": "concise", "bullets": "allowed", "caps": "title-case" },
      "examples": {
        "hero": "Bespoke care for pieces that matter.",
        "button": "Arrange consultation",
        "error": "We’re unable to process that request. Please contact concierge."
      }
    },
    "local": {
      "personality": "Friendly, personal, community-focused",
      "language": "Family-run, personal touch, we genuinely care, trusted by neighbors",
      "cta_style": "Pop in today, Give us a call, Visit our shop",
      "formality": "casual-friendly",
      "voice_pillars": ["warm", "neighborly", "helpful"],
      "perspective": "we",
      "reading_level": 6,
      "cadence": "mixed",
      "syntax_rules": ["use contractions", "friendly openings", "no jargon"],
      "lexicon": {
        "do": ["we’re local", "happy to help", "been here for years", "name you can trust"],
        "avoid": ["industry-leading", "synergy"]
      },
      "banned_words": ["synergy", "industry-leading"],
      "cta_verbs": ["Pop in", "Call", "Swing by", "Book"],
      "hedging": "moderate",
      "emoji": "sparing",
      "formatting": { "headings": "descriptive", "bullets": "allowed", "caps": "sentence-case" },
      "examples": {
        "hero": "Your neighborhood shop, here to help.",
        "button": "Give us a call",
        "error": "Oops—mind trying that again?"
      }
    },
    "classic-retail": {
      "personality": "Energetic, value-driven, persuasive",
      "language": "Great value, trusted reviews, popular choice, fast delivery/turnaround",
      "cta_style": "Shop now, Save today, Don’t miss out",
      "formality": "casual-energetic",
      "voice_pillars": ["useful", "complete", "value"],
      "perspective": "you",
      "reading_level": 8,
      "cadence": "mixed",
      "syntax_rules": ["specifics over superlatives", "show pros/cons", "avoid hype"],
      "lexicon": {
        "do": ["ratings", "return policy", "total cost", "in stock", "best-sellers"],
        "avoid": ["guaranteed lowest", "unbeatable"]
      },
      "banned_words": ["guaranteed lowest", "unbeatable"],
      "cta_verbs": ["See", "Add", "Compare", "Check"],
      "hedging": "light",
      "emoji": "never",
      "formatting": { "headings": "descriptive", "bullets": "preferred", "caps": "sentence-case" },
      "examples": {
        "hero": "Find what you need—without the guesswork.",
        "button": "See details",
        "error": "This item isn’t available. See similar options."
      }
    },
    "clinical": {
      "personality": "Precise, no-fluff, technical",
      "language": "Methodical, evidence-led, systematic approach, measured results",
      "cta_style": "Request analysis, Schedule assessment, Get precise results",
      "formality": "formal-technical",
      "voice_pillars": ["precise", "objective", "thorough"],
      "perspective": "neutral",
      "reading_level": 11,
      "cadence": "mixed",
      "syntax_rules": ["define terms", "quantify where possible", "avoid ambiguity"],
      "lexicon": {
        "do": ["methodology", "protocol", "baseline", "variance", "confidence"],
        "avoid": ["magic", "guesswork"]
      },
      "banned_words": ["magic"],
      "cta_verbs": ["Request", "Schedule", "Get"],
      "hedging": "moderate",
      "emoji": "never",
      "formatting": { "headings": "descriptive", "bullets": "preferred", "caps": "sentence-case" },
      "examples": {
        "hero": "Results you can reproduce.",
        "button": "Request analysis",
        "error": "Input invalid. Review parameters and resubmit."
      }
    },
    "govtech": {
      "personality": "Professional, neutral, policy-aligned",
      "language": "Compliant, standards-based, authorized procedures, accessibility-first",
      "cta_style": "Submit request, Access services, Contact department",
      "formality": "formal-neutral",
      "voice_pillars": ["neutral", "clear", "inclusive"],
      "perspective": "neutral",
      "reading_level": 9,
      "cadence": "mixed",
      "syntax_rules": ["plain language", "include eligibility/steps", "avoid jargon"],
      "lexicon": {
        "do": ["eligibility", "requirements", "evidence", "processing time", "support"],
        "avoid": ["marketing", "salesy"]
      },
      "banned_words": ["salesy"],
      "cta_verbs": ["Submit", "Access", "Check", "Contact"],
      "hedging": "light",
      "emoji": "never",
      "formatting": { "headings": "descriptive", "bullets": "preferred", "caps": "sentence-case" },
      "examples": {
        "hero": "Access services and information in one place.",
        "button": "Submit request",
        "error": "We couldn’t process that. Review your details and try again."
      }
    }
  },
  "TONE_ALIASES": {
    "friendly": "modern-tech",
    "modern-tech": "modern-tech",
    "stripe-like": "modern-tech",
    "startup-old": "startup",
    "startup-new": "startup",
    "startup-modern": "startup",
    "corporate": "corporate",
    "premium-brand": "premium",
    "premium-new": "premium",
    "local-shop": "local",
    "local-expert": "local",
    "mom-n-pop": "local",
    "classic-retail": "classic-retail",
    "amazon-like": "classic-retail",
    "clinical": "clinical",
    "govtech": "govtech"
  }
}

2) Resolve by tone or by outcome (returns metadata)

Paste these helpers. They keep changes minimal and let you slot tone data into any prompt.

// --- Paste your JSON above this line ---
export const TONE_PROFILES = /* the object above */.TONE_PROFILES;
export const TONE_ALIASES  = /* the object above */.TONE_ALIASES;

// Base “forbidden everywhere” if you want (keeps your earlier rule intact)
export const BASE_FORBIDDEN = ["Expert", "Professional", "Quality"];

export function resolveToneName(input) {
  if (!input) return "modern-tech";
  if (typeof input === "string") {
    const key = input.trim();
    return TONE_ALIASES[key] || (TONE_PROFILES[key] ? key : "modern-tech");
  }
  // Outcome-based resolution
  // input: { goal, audience, brand_tier, regulated, ticket }
  const { goal, audience, brand_tier, regulated, ticket } = (input || {});
  // Simple router with sensible defaults
  if (regulated) return "clinical";
  if (goal === "docs" || goal === "pricing" || goal === "developer") return "modern-tech";
  if (goal === "support" || goal === "onboarding") return "local";
  if (goal === "landing" && audience === "enterprise") return "corporate";
  if (goal === "landing" && (brand_tier === "luxury" || ticket === "high")) return "premium";
  if (goal === "landing" && audience === "SMB") return "startup";
  if (goal === "catalog" || goal === "shop") return "classic-retail";
  if (goal === "public-sector") return "govtech";
  return "modern-tech";
}

export function getToneProfile(toneOrOutcome) {
  const name = resolveToneName(toneOrOutcome);
  return { name, ...TONE_PROFILES[name] };
}

3) Generic prompt injection (no copywriting—just constraints)

Use this to inject tone constraints into any system prompt (like your head metadata optimizer or your content quality analyzer).

export function tonePromptBlock(toneProfile, extraForbidden = []) {
  const banned = Array.from(new Set([...(toneProfile.banned_words || []), ...BASE_FORBIDDEN, ...extraForbidden]));
  const doWords = (toneProfile.lexicon?.do || []).join(", ");
  const avoidWords = (toneProfile.lexicon?.avoid || []).join(", ");
  const rules = (toneProfile.syntax_rules || []).join("; ");

  return `TONE RULES (${(toneProfile && toneProfile.personality) || "n/a"}):
- Perspective: ${toneProfile.perspective}; Reading level ≈ ${toneProfile.reading_level}; Cadence: ${toneProfile.cadence}
- Voice pillars: ${toneProfile.voice_pillars?.join(", ") || "n/a"}
- Use at least 3 of: ${doWords || "n/a"}
- Avoid: ${avoidWords || "n/a"}
- BANNED WORDS (hard no): ${banned.join(", ") || "n/a"}
- Syntax: ${rules || "n/a"}
- Formatting: headings=${toneProfile.formatting?.headings}, bullets=${toneProfile.formatting?.bullets}, caps=${toneProfile.formatting?.caps}
- CTA verbs preferred: ${(toneProfile.cta_verbs || []).join(", ") || "n/a"}
- Emoji: ${toneProfile.emoji}; Hedging: ${toneProfile.hedging}`;
}

Minimal integration with your executeHeadPrompt

Only 3 new lines: resolve tone → build tone block → inject.

async function executeHeadPrompt(profile, directive, contentMap, env, model) {
  const location = extractLocation(contentMap.route);
  const brand = extractBrand(contentMap.route);

  // NEW: resolve tone by name or outcome
  const tone = getToneProfile(directive.tone || {
    goal: "landing",
    audience: profile.segment || "SMB",
    brand_tier: profile.tier,
    regulated: false,
    ticket: profile.ticket
  });

  // NEW: build a tone block we can drop into system prompt
  const toneBlock = tonePromptBlock(tone, /* extraForbidden */ []);

  const systemPrompt = `You are a head metadata optimization specialist focused on local SEO and conversion optimization.

TASK: Optimize page head metadata for maximum SEO impact and click-through rates.

${toneBlock}

BUSINESS CONTEXT:
- Business: ${profile.name}
- Services: ${profile.services.join(", ")}
- Geographic scope: ${profile.geo_scope.join(", ")}
- Review count: ${profile.review_count}
- Guarantee: ${profile.guarantee}

PAGE CONTEXT:
- Page type: ${directive.type}
- Location: ${location || "N/A"}
- Brand: ${brand || "N/A"}

REQUIREMENTS:
- Title: MUST USE 55-60 characters (never shorter than 55), include ${brand ? "brand name" : "location"} + specific services + benefits + trust signals
- Meta description: TARGET 150-160 characters (maximize SERP space), include trust signals and benefits
- For local pages: Use pattern "${profile.services[0]} in {{Location}} | Benefits + ${profile.guarantee} + Reviews"
- For brand pages: Use pattern "{{Brand}} Watch Repair | Benefits + ${profile.guarantee} + Reviews + Expertise"
- MAXIMIZE character usage with: ${profile.review_count} reviews, ${profile.guarantee}, specific benefits, expertise claims
- Include specific service benefits: "Battery, Glass, Crown Repair" vs generic "Service"
- UK spelling, conversion-focused language
- NEVER exceed limits but USE FULL CHARACTER ALLOWANCE

MANDATORY TONE-SPECIFIC LANGUAGE (${tone.name.toUpperCase()}):
${tone.language ? `USE THESE WORDS: ${tone.language}` : ""}
FORBIDDEN WORDS: ${BASE_FORBIDDEN.join(", ")} (overused—use tone-specific alternatives)

TONE-SPECIFIC TITLE EXAMPLES (55-60 characters):
- Local: "Family-Run Fossil Watch Care | Personal Touch, ${profile.review_count} Reviews"
- Startup: "Faster Fossil Watch Repairs | Done in Days, ${profile.guarantee}"
- Clinical: "Precise Fossil Watch Methodology | ${profile.guarantee}"
- Classic-retail: "Great Fossil Watch Value | Fast Turnaround & ${profile.guarantee}"

You must respond with valid JSON in this exact format:
{
  "head": {
    "title": "string (50-60 chars)",
    "metaDescription": "string (140-165 chars)",
    "canonical": "string (absolute URL)"
  },
  "confidence": 0.95,
  "notes": ["optimization details"]
}

OPTIMIZATION PRIORITIES:
1. Location targeting for local SEO
2. Trust signal integration (reviews, guarantees)
3. Click-through rate optimization
4. Character count compliance
5. Benefit-focused messaging

Return only valid JSON with the optimized metadata.`;

  const userPrompt = `Optimize head metadata for this page:

BUSINESS: ${profile.name} (${profile.domain})
LOCATION: ${location || "General"}
PAGE TYPE: ${directive.type}
TRUST SIGNALS: ${profile.review_count} reviews, ${profile.guarantee}
PHONE: ${profile.phone}

CURRENT HEAD:
- Title: "${contentMap.head.title}" (${contentMap.head.title.length} chars)
- Meta: "${contentMap.head.metaDescription}" (${contentMap.head.metaDescription.length} chars)
- Canonical: "${contentMap.head.canonical}"

TARGET IMPROVEMENTS:
- Title: 50-60 chars with location and benefit
- Meta: 140-165 chars with trust signals
- Pattern: "Watch Repairs in ${location || "UK"} | Free UK Postage & 12-Month Guarantee"

TRUST ELEMENTS TO INCLUDE:
- ${profile.review_count} reviews
- ${profile.guarantee}
- Free UK shipping/collection
- Professional certification

Return optimized head metadata meeting exact character requirements.`;

  const promptResult = await executeAIPrompt(systemPrompt, userPrompt, env, model);
  return {
    prompt_type: "head",
    success: promptResult.success,
    result: promptResult.result,
    processing_time_ms: promptResult.processing_time_ms,
    tokens_used: promptResult.tokens_used,
    error: promptResult.error
  };
}

Reuse in your analyzeContentQuality prompt

You can enrich the analysis with the same tone metadata (so the model judges tone compliance against explicit rules):

async function analyzeContentQuality(optimizedText, businessContext, toneOrOutcome) {
  const tone = getToneProfile(toneOrOutcome);
  const toneBlock = tonePromptBlock(tone);

  const systemPrompt = `You are an expert SEO and content quality analyst. Your job is to analyze content quality and provide detailed, actionable feedback.

${toneBlock}

ANALYSIS TASK:
Assess the quality of this optimized content for SEO, readability, tone, and overall effectiveness.

SCORING SYSTEM (0-100):
- SEO Effectiveness (30 points): Keyword integration, local SEO, search intent, ranking potential
- Content Quality (25 points): Readability, engagement, clarity
- Tone Consistency (20 points): Brand voice, style consistency, adherence to TONE RULES
- Content Completeness (15 points): Information completeness, accuracy, usefulness
- Overall Impact (10 points): Will this content perform well?

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
}`;

  const userPrompt = `ANALYZE THIS OPTIMIZED CONTENT:

CONTENT TO ANALYZE:
"${optimizedText}"

Provide a comprehensive quality analysis with scores, notes, and specific recommendations focused on the TONE RULES above.`;

  return executeAIPrompt(systemPrompt, userPrompt, businessContext.env, businessContext.model);
}

Why this works (and keeps changes tiny)

Backwards compatible: your existing toneProfile.language lines still work.

Fewer tones, clearer intent: 8 canonical voices with alias mapping for everything you already named.

Consistent constraints: reading level, cadence, lexicon do/avoid, banned words, syntax rules—easy for a model to obey.

Composable: one helper returns the profile, another emits a prompt block for any task (titles, body, emails, etc.).

If you want, paste a real directive + profile and I’ll run a dry example of the assembled prompts (no copy generation) so you can see the final strings you’ll ship into executeAIPrompt.