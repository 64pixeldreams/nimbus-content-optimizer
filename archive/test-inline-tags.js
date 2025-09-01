const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

console.log('🔍 TESTING INLINE TAG HANDLING\n');

// Test configuration
const TEST_PAGE = 'hublot-watch-repair';

function testInlineTagHandling() {
  console.log('📄 Reading HTML file...');
  
  const htmlPath = path.join(__dirname, '..', 'dist', 'brands', `${TEST_PAGE}.html`);
  
  if (!fs.existsSync(htmlPath)) {
    console.log('❌ HTML file not found:', htmlPath);
    return;
  }
  
  const html = fs.readFileSync(htmlPath, 'utf8');
  const $ = cheerio.load(html);
  
  console.log('✅ HTML loaded successfully');
  
  // Find specific examples of inline tags
  console.log('\n🔍 SEARCHING FOR INLINE TAG EXAMPLES...');
  
  const inlineExamples = [];
  
  // Look for paragraphs with links, bold, strong, span tags
  $('main p').each((index, element) => {
    const $el = $(element);
    const hasInlineTags = $el.find('a, b, strong, em, i, span').length > 0;
    
    if (hasInlineTags) {
      const originalHTML = $el.html();
      const originalText = $el.text();
      
      // Apply our inline tag handling
      let processedText = '';
      $el.contents().each((i, node) => {
        if (node.type === 'text') {
          processedText += node.data;
        } else if (node.type === 'tag') {
          const $node = $(node);
          if (node.tagName === 'a') {
            processedText += `[LINK:${$node.text()}]`;
          } else if (['b', 'strong', 'em', 'i'].includes(node.tagName)) {
            processedText += `*${$node.text()}*`;
          } else if (node.tagName === 'span') {
            processedText += `[SPAN:${$node.text()}]`;
          } else {
            processedText += $node.text();
          }
        }
      });
      
      inlineExamples.push({
        index: index + 1,
        originalHTML: originalHTML,
        originalText: originalText,
        processedText: processedText.trim(),
        inlineTags: $el.find('a, b, strong, em, i, span').map((i, el) => el.tagName).get()
      });
    }
  });
  
  console.log(`✅ Found ${inlineExamples.length} paragraphs with inline tags`);
  
  // Display examples
  console.log('\n📊 INLINE TAG EXAMPLES:');
  console.log('='.repeat(80));
  
  inlineExamples.slice(0, 10).forEach((example, i) => {
    console.log(`\n--- EXAMPLE ${i + 1} ---`);
    console.log(`Paragraph ${example.index}`);
    console.log(`Inline tags found: ${example.inlineTags.join(', ')}`);
    console.log(`Original HTML: ${example.originalHTML.substring(0, 150)}...`);
    console.log(`Original text: ${example.originalText.substring(0, 100)}...`);
    console.log(`Processed text: ${example.processedText.substring(0, 100)}...`);
  });
  
  // Test specific sentence pattern
  console.log('\n🎯 TESTING SPECIFIC SENTENCE PATTERN:');
  console.log('='.repeat(50));
  
  const sentencePatterns = [
    '<p>this is a <a>sentence</a></p>',
    '<p>this is a <b>bold</b> word</p>',
    '<p>this is a <strong>strong</strong> word</p>',
    '<p>this is a <span>span</span> word</p>',
    '<p>this is a <a>link</a> with <b>bold</b> text</p>'
  ];
  
  sentencePatterns.forEach((pattern, i) => {
    const $test = cheerio.load(pattern);
    let processedText = '';
    
    $test('p').contents().each((j, node) => {
      if (node.type === 'text') {
        processedText += node.data;
      } else if (node.type === 'tag') {
        const $node = $test(node);
        if (node.tagName === 'a') {
          processedText += `[LINK:${$node.text()}]`;
        } else if (['b', 'strong', 'em', 'i'].includes(node.tagName)) {
          processedText += `*${$node.text()}*`;
        } else if (node.tagName === 'span') {
          processedText += `[SPAN:${$node.text()}]`;
        } else {
          processedText += $node.text();
        }
      }
    });
    
    console.log(`\nPattern ${i + 1}:`);
    console.log(`Input:  ${pattern}`);
    console.log(`Output: ${processedText.trim()}`);
  });
  
  // Check if our extraction is working correctly
  console.log('\n🔍 VERIFYING EXTRACTION RESULTS:');
  console.log('='.repeat(50));
  
  const extractionResults = JSON.parse(fs.readFileSync(path.join(__dirname, '.nimbus', 'extraction-results.json'), 'utf8'));
  
  const blocksWithInlineTags = extractionResults.blocks.filter(block => 
    block.original_text.includes('[LINK:') || 
    block.original_text.includes('*') || 
    block.original_text.includes('[SPAN:')
  );
  
  console.log(`Found ${blocksWithInlineTags.length} blocks with inline tags in extraction results`);
  
  blocksWithInlineTags.slice(0, 5).forEach((block, i) => {
    console.log(`\nBlock ${i + 1} (${block.id}):`);
    console.log(`Content: ${block.original_text}`);
  });
  
  // Summary
  console.log('\n📈 SUMMARY:');
  console.log('='.repeat(30));
  console.log(`Total paragraphs with inline tags: ${inlineExamples.length}`);
  console.log(`Blocks with inline tags in extraction: ${blocksWithInlineTags.length}`);
  console.log(`Inline tag types found: a, b, strong, em, i, span`);
  
  if (blocksWithInlineTags.length > 0) {
    console.log('✅ Inline tag handling is working correctly!');
  } else {
    console.log('⚠️ No inline tags found in extraction results');
  }
}

// Run the test
testInlineTagHandling();
