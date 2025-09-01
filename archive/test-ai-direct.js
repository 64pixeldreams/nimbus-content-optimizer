/**
 * Direct test of AI response to debug JSON issues
 */

require('dotenv').config();

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
  console.error('❌ Missing OPENAI_API_KEY in .env file');
  process.exit(1);
}

async function testDirectAI() {
  console.log('🧪 DIRECT AI TEST\n');

  const systemPrompt = `You are a content optimization specialist. Your task is to enhance existing content while preserving its original meaning and topic.

TONE: CORPORATE - Professional and authoritative
Use language style: industry-leading, comprehensive, professional excellence

You must respond with valid JSON in this exact format:
{
  "blocks": [
    {
      "id": "string",
      "optimized_text": "string",
      "optimization_notes": "string"
    }
  ],
  "confidence": 0.95
}

CRITICAL RULES:
1. PRESERVE ORIGINAL TOPIC - If the text is about "battery replacement", your enhanced version MUST be about battery replacement
2. ENHANCE, DON'T REPLACE - Improve the language, add trust signals, apply tone, but keep the same subject matter
3. RETURN ONLY JSON - No explanations, no markdown, just the JSON object

Return only valid JSON with enhanced content blocks.`;

  const userPrompt = `Enhance these content blocks for Repairs by Post:

[ID: 1] Repairs by post offer a wide range of services for your Hublot. We provide expert repair and restoration services covered by a 24-month guarantee. We also provide repair and restoration services for vintage pieces. For example, cases and bracelets can be polished and refurbished to look almost new.

[ID: 2] *Prices inc. VAT and postage both ways. No hidden fees. Open a repair ticket for a free no-obligation watch assessment, or talk to a watch repair expert 0800 121 6030 ( 9am-5pm GMT Mon-Fri. ). No credit card required.

[ID: 3] Example: Hublot Big Bang (361.sx.1270.rx.1104) Quartz service: £389 inc VAT, two-way shipping and 24 months guarantee.

Apply corporate tone while keeping the exact same topic for each block. Return JSON.`;

  try {
    console.log('📤 Sending to OpenAI API...\n');
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3,
        max_tokens: 2000
      })
    });

    const data = await response.json();
    
    if (data.error) {
      console.error('❌ API Error:', data.error);
      return;
    }

    const aiResponse = data.choices[0].message.content;
    console.log('🤖 RAW AI RESPONSE:');
    console.log('---START---');
    console.log(aiResponse);
    console.log('---END---\n');

    // Try to parse
    try {
      const parsed = JSON.parse(aiResponse);
      console.log('✅ Valid JSON returned!');
      console.log('📊 Parsed structure:', JSON.stringify(parsed, null, 2));
    } catch (e) {
      console.log('❌ JSON Parse Error:', e.message);
      
      // Show what's wrong
      const firstChar = aiResponse.charAt(0);
      console.log(`First character: "${firstChar}" (expecting "{")`);
      
      if (aiResponse.includes('```')) {
        console.log('⚠️ Response contains markdown code blocks');
      }
      
      if (!aiResponse.startsWith('{')) {
        const jsonStart = aiResponse.indexOf('{');
        if (jsonStart > 0) {
          console.log(`⚠️ JSON starts at position ${jsonStart}, preceded by: "${aiResponse.substring(0, jsonStart)}"`);
        }
      }
    }

  } catch (error) {
    console.error('❌ Request failed:', error.message);
  }
}

// Run the test
testDirectAI();
