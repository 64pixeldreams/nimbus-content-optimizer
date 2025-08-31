/**
 * Test script to debug content AI optimization
 * Sends a sample payload to the AI and analyzes the response
 */

const fs = require('fs');
const path = require('path');

// Test content blocks from actual Hublot page
const testBlocks = [
  {
    id: "1",
    type: "p",
    selector: "p",
    text: "Repairs by post offer a wide range of services for your Hublot. We provide expert repair and restoration services covered by a 24-month guarantee. We also provide repair and restoration services for vintage pieces. For example, cases and bracelets can be polished and refurbished to look almost new.",
    word_count: 50
  },
  {
    id: "2", 
    type: "p",
    selector: "p",
    text: "*Prices inc. VAT and postage both ways. No hidden fees. Open a repair ticket for a free no-obligation watch assessment, or talk to a watch repair expert 0800 121 6030 ( 9am-5pm GMT Mon-Fri. ). No credit card required.",
    word_count: 40
  },
  {
    id: "3",
    type: "p", 
    selector: "p",
    text: "Example: Hublot Big Bang (361.sx.1270.rx.1104) Quartz service: £389 inc VAT, two-way shipping and 24 months guarantee.",
    word_count: 18
  }
];

// Simplified prompt test
async function testContentAI() {
  console.log('\n🧪 CONTENT AI TEST SCRIPT\n');
  console.log('📊 Testing with', testBlocks.length, 'content blocks\n');

  // Build system prompt
  const systemPrompt = `You are a content enhancement specialist. Return ONLY valid JSON.

CRITICAL TASK: Enhance the provided content blocks while preserving their original meaning.

RULES:
1. Keep the SAME topic - if it's about pricing, enhance pricing content
2. Return valid JSON with "blocks" array
3. Each block must have: id, optimized_text, optimization_notes
4. Use corporate tone and language

OUTPUT FORMAT:
{
  "blocks": [
    {
      "id": "1",
      "optimized_text": "enhanced version of original",
      "optimization_notes": "what was improved"
    }
  ],
  "confidence": 0.95
}`;

  // Build user prompt
  const userPrompt = `Enhance these 3 content blocks with corporate tone:

Block ID="1": Repairs by post offer a wide range of services for your Hublot. We provide expert repair and restoration services covered by a 24-month guarantee. We also provide repair and restoration services for vintage pieces. For example, cases and bracelets can be polished and refurbished to look almost new.

Block ID="2": *Prices inc. VAT and postage both ways. No hidden fees. Open a repair ticket for a free no-obligation watch assessment, or talk to a watch repair expert 0800 121 6030 ( 9am-5pm GMT Mon-Fri. ). No credit card required.

Block ID="3": Example: Hublot Big Bang (361.sx.1270.rx.1104) Quartz service: £389 inc VAT, two-way shipping and 24 months guarantee.

Return JSON with exactly 3 blocks. Each block MUST keep the same topic as the original.`;

  console.log('📝 SYSTEM PROMPT:\n', systemPrompt);
  console.log('\n📝 USER PROMPT:\n', userPrompt);
  
  // Simulate AI response to test parsing
  const mockResponses = [
    // Test 1: Valid JSON
    `{
      "blocks": [
        {
          "id": "1",
          "optimized_text": "Repairs by Post offers comprehensive services for your Hublot timepiece. Our certified technicians provide expert repair and restoration services, all protected by our industry-leading 24-month guarantee. We specialize in vintage restoration, meticulously polishing and refurbishing cases and bracelets to restore their original brilliance.",
          "optimization_notes": "Enhanced trust signals, professional tone, maintained all original topics"
        },
        {
          "id": "2",
          "optimized_text": "Transparent pricing includes VAT and two-way shipping - no hidden charges. Request your complimentary, no-obligation assessment today, or speak with our watch experts at 0800 121 6030 (Monday-Friday, 9am-5pm GMT). No credit card required for initial consultation.",
          "optimization_notes": "Improved clarity, professional formatting, kept all contact details"
        },
        {
          "id": "3",
          "optimized_text": "Service Example: Hublot Big Bang (361.sx.1270.rx.1104) Quartz movement service - £389 including VAT, secure two-way shipping, and comprehensive 24-month guarantee.",
          "optimization_notes": "Enhanced professionalism while keeping exact pricing and model info"
        }
      ],
      "confidence": 0.95
    }`,
    
    // Test 2: Malformed JSON (common AI error)
    `Here's the enhanced content:
    {
      "blocks": [
        {
          "id": "1",
          "optimized_text": "Content here",
        }
      ]
    }`,
    
    // Test 3: Wrong topic (AI changing content)
    `{
      "blocks": [
        {
          "id": "1",
          "optimized_text": "We offer battery replacement services for all watch brands",
          "optimization_notes": "Changed to battery service"
        },
        {
          "id": "2", 
          "optimized_text": "Our glass replacement service starts from £99",
          "optimization_notes": "Changed to glass service"
        },
        {
          "id": "3",
          "optimized_text": "Vintage watch restoration is our specialty",
          "optimization_notes": "Changed to vintage focus"
        }
      ],
      "confidence": 0.95
    }`
  ];

  console.log('\n🔍 TESTING RESPONSES:\n');

  mockResponses.forEach((response, index) => {
    console.log(`\n--- Test ${index + 1} ---`);
    analyzeResponse(response, testBlocks);
  });
}

function analyzeResponse(aiResponse, originalBlocks) {
  console.log('\n🤖 AI Response (first 200 chars):', aiResponse.substring(0, 200) + '...\n');
  
  // Try to parse JSON
  let parsed;
  try {
    // Remove common AI prefixes
    let cleaned = aiResponse
      .replace(/^```json\s*/i, '')
      .replace(/\s*```$/i, '')
      .replace(/^[^{]*/s, '')
      .trim();
    
    parsed = JSON.parse(cleaned);
    console.log('✅ JSON parsed successfully');
  } catch (e) {
    console.log('❌ JSON parse failed:', e.message);
    
    // Try to repair
    try {
      let repaired = aiResponse
        .replace(/,\s*}/g, '}')
        .replace(/,\s*]/g, ']')
        .replace(/^.*?{/s, '{')
        .replace(/}[^}]*$/s, '}');
      
      parsed = JSON.parse(repaired);
      console.log('✅ JSON repaired and parsed');
    } catch (e2) {
      console.log('❌ JSON repair failed:', e2.message);
      return;
    }
  }
  
  // Analyze content preservation
  if (parsed && parsed.blocks) {
    console.log('\n📊 CONTENT ANALYSIS:');
    
    parsed.blocks.forEach((block, i) => {
      const original = originalBlocks.find(b => b.id === block.id);
      if (!original) {
        console.log(`\n❌ Block ${block.id}: No matching original found`);
        return;
      }
      
      console.log(`\n📝 Block ${block.id}:`);
      
      // Check topic preservation
      const originalKeywords = extractKeywords(original.text);
      const optimizedKeywords = extractKeywords(block.optimized_text);
      
      const preserved = originalKeywords.filter(k => 
        optimizedKeywords.includes(k) || 
        block.optimized_text.toLowerCase().includes(k.toLowerCase())
      );
      
      const preservationRate = (preserved.length / originalKeywords.length * 100).toFixed(1);
      
      console.log(`  Original keywords: ${originalKeywords.join(', ')}`);
      console.log(`  Preserved keywords: ${preserved.join(', ')}`);
      console.log(`  Topic preservation: ${preservationRate}%`);
      
      if (preservationRate < 50) {
        console.log(`  ⚠️ WARNING: Low topic preservation - content may have been replaced!`);
      } else {
        console.log(`  ✅ Good topic preservation`);
      }
      
      // Show first 100 chars of each
      console.log(`  Original: "${original.text.substring(0, 100)}..."`);
      console.log(`  Optimized: "${block.optimized_text.substring(0, 100)}..."`);
    });
  }
}

function extractKeywords(text) {
  // Extract important keywords (nouns, numbers, specific terms)
  const keywords = [];
  
  // Extract prices
  const prices = text.match(/£\d+/g) || [];
  keywords.push(...prices);
  
  // Extract phone numbers
  const phones = text.match(/\d{4}\s*\d{3}\s*\d{4}/g) || [];
  keywords.push(...phones);
  
  // Extract specific terms
  const important = [
    'Hublot', 'repair', 'restoration', 'vintage', 'guarantee', 
    'VAT', 'shipping', 'postage', 'battery', 'Big Bang',
    'assessment', 'expert', '24-month', '24 months', 'services'
  ];
  
  important.forEach(term => {
    if (text.toLowerCase().includes(term.toLowerCase())) {
      keywords.push(term);
    }
  });
  
  return [...new Set(keywords)]; // Remove duplicates
}

// Run the test
testContentAI();
