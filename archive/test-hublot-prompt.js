const fs = require('fs');

// Test script to see what prompt is being sent to AI for Hublot
async function testHublotPrompt() {
  console.log('🔍 TESTING HUBLOT PROMPT CONSTRUCTION\n');

  // Simulate the content blocks that would be sent to AI
  const contentBlocks = [
    {
      id: '1',
      selector: 'main p:nth-of-type(1)',
      type: 'paragraph',
      text: 'Repairs by post offer a wide range of services for your Hublot. We provide expert repair and restoration services covered by a 24-month guarantee. We also provide repair and restoration services for vintage pieces. For example, cases and bracelets can be polished and refurbished to look almost new.'
    },
    {
      id: '2', 
      selector: 'main p:nth-of-type(2)',
      type: 'paragraph',
      text: '*Prices inc. VAT and postage both ways. No hidden fees. Open a repair ticket for a free no-obligation watch assessment, or talk to a watch repair expert 0800 121 6030 ( 9am-5pm GMT Mon-Fri. ). No credit card required.'
    },
    {
      id: '3',
      selector: 'main p:nth-of-type(3)', 
      type: 'paragraph',
      text: 'Example: Hublot Big Bang (361.sx.1270.rx.1104) Quartz service: £389 inc VAT, two-way shipping and 24 months guarantee.'
    }
  ];

  // Simulate the sanitization process
  const sanitizedBlocks = contentBlocks.map((block, index) => ({
    id: block.id || (index + 1).toString(),
    selector: block.selector,
    type: block.type,
    text: (block.text || '')
      .replace(/"/g, '')     // Remove quotes entirely
      .replace(/\n/g, ' ')   // Replace newlines with spaces
      .replace(/\r/g, ' ')   // Replace carriage returns
      .replace(/\t/g, ' ')   // Replace tabs
      .replace(/\s+/g, ' ')  // Normalize whitespace
      .trim()
      .substring(0, 250),    // Hard limit to 250 chars
    word_count: (block.text || '').split(' ').length
  }));

  console.log('📝 ORIGINAL CONTENT BLOCKS:');
  contentBlocks.forEach((block, i) => {
    console.log(`\nBlock ${i + 1} (ID: ${block.id}):`);
    console.log(`Text: ${block.text}`);
    console.log(`Length: ${block.text.length} chars`);
    console.log(`Words: ${block.text.split(' ').length}`);
  });

  console.log('\n🔧 SANITIZED CONTENT BLOCKS:');
  sanitizedBlocks.forEach((block, i) => {
    console.log(`\nBlock ${i + 1} (ID: ${block.id}):`);
    console.log(`Text: ${block.text}`);
    console.log(`Length: ${block.text.length} chars`);
    console.log(`Words: ${block.text.split(' ').length}`);
  });

  // Simulate the prompt construction
  const systemPrompt = `Return a JSON object with this exact structure:
{"blocks":[{"id":"string","optimized_text":"string","optimization_notes":"string"}],"confidence":0.95}

Rules:
1. Start with { and end with }
2. No text before or after the JSON
3. Enhance the language but keep the same topic
4. If original mentions prices, keep those prices
5. Add "1.5K+ reviews" where appropriate`;

  const userPrompt = `${sanitizedBlocks.map(block => 
    `ID ${block.id}: ${block.text}`
  ).join('\n')}`;

  console.log('\n🤖 SYSTEM PROMPT:');
  console.log(systemPrompt);
  
  console.log('\n👤 USER PROMPT:');
  console.log(userPrompt);

  console.log('\n📊 PROMPT STATISTICS:');
  console.log(`System prompt length: ${systemPrompt.length} chars`);
  console.log(`User prompt length: ${userPrompt.length} chars`);
  console.log(`Total prompt length: ${systemPrompt.length + userPrompt.length} chars`);
  console.log(`Content blocks: ${sanitizedBlocks.length}`);
  console.log(`Total content chars: ${sanitizedBlocks.reduce((sum, b) => sum + b.text.length, 0)}`);

  // Check for any special characters that might confuse the AI
  console.log('\n🔍 SPECIAL CHARACTER ANALYSIS:');
  sanitizedBlocks.forEach((block, i) => {
    const specialChars = block.text.match(/[^\w\s.,!?£$%&*()\-+=]/g);
    if (specialChars) {
      console.log(`Block ${i + 1} special chars:`, specialChars);
    }
  });
}

testHublotPrompt().catch(console.error);
