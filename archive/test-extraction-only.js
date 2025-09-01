const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

console.log('🔍 TASK 1.1: Testing Content Extraction from Hublot Page\n');

// Test configuration
const TEST_PAGE = 'hublot-watch-repair';

function testContentExtraction() {
  console.log('📄 Reading HTML file...');
  
  const htmlPath = path.join(__dirname, '..', 'dist', 'brands', `${TEST_PAGE}.html`);
  
  if (!fs.existsSync(htmlPath)) {
    console.log('❌ HTML file not found:', htmlPath);
    return;
  }
  
  const html = fs.readFileSync(htmlPath, 'utf8');
  const $ = cheerio.load(html);
  
  console.log('✅ HTML loaded successfully');
  
  const extractedBlocks = [];
  
  console.log('\n🔍 Extracting content blocks...');
  
  // Extract H1, H2, H3, P tags with inline handling
  $('main h1, main h2, main h3, main p').each((index, element) => {
    const $el = $(element);
    const tagName = element.tagName.toLowerCase();
    
    // Get clean text while preserving inline structure
    let cleanText = '';
    $el.contents().each((i, node) => {
      if (node.type === 'text') {
        cleanText += node.data;
      } else if (node.type === 'tag') {
        const $node = $(node);
        if (node.tagName === 'a') {
          cleanText += `[LINK:${$node.text()}]`;
        } else if (['b', 'strong', 'em', 'i'].includes(node.tagName)) {
          cleanText += `*${$node.text()}*`;
        } else {
          cleanText += $node.text();
        }
      }
    });
    
    if (cleanText.trim().length > 10) {
      extractedBlocks.push({
        id: `${tagName}-${index + 1}`,
        type: tagName,
        original_text: cleanText.trim(),
        selector: $el.attr('class') || tagName,
        length: cleanText.trim().length
      });
    }
  });
  
  console.log(`✅ Extracted ${extractedBlocks.length} content blocks`);
  
  // Display results
  console.log('\n📊 EXTRACTION RESULTS:');
  console.log('='.repeat(80));
  
  extractedBlocks.forEach(block => {
    console.log(`\n${block.id} (${block.type}) - ${block.length} chars`);
    console.log(`Selector: ${block.selector}`);
    console.log(`Content: ${block.original_text.substring(0, 120)}${block.original_text.length > 120 ? '...' : ''}`);
  });
  
  // Summary statistics
  const typeCounts = {};
  extractedBlocks.forEach(block => {
    typeCounts[block.type] = (typeCounts[block.type] || 0) + 1;
  });
  
  console.log('\n📈 SUMMARY:');
  console.log('='.repeat(40));
  Object.entries(typeCounts).forEach(([type, count]) => {
    console.log(`${type.toUpperCase()}: ${count} blocks`);
  });
  
  console.log(`Total blocks: ${extractedBlocks.length}`);
  console.log(`Average length: ${Math.round(extractedBlocks.reduce((sum, b) => sum + b.length, 0) / extractedBlocks.length)} chars`);
  
  // Check for inline tag handling
  console.log('\n🔍 INLINE TAG HANDLING CHECK:');
  console.log('='.repeat(40));
  
  const inlineExamples = extractedBlocks.filter(block => 
    block.original_text.includes('[LINK:') || block.original_text.includes('*')
  );
  
  if (inlineExamples.length > 0) {
    console.log('✅ Found blocks with inline tags:');
    inlineExamples.slice(0, 3).forEach(block => {
      console.log(`  ${block.id}: ${block.original_text.substring(0, 100)}...`);
    });
  } else {
    console.log('⚠️ No inline tags found in extracted content');
  }
  
  // Save results for next phase
  const results = {
    timestamp: new Date().toISOString(),
    test_page: TEST_PAGE,
    blocks_extracted: extractedBlocks.length,
    blocks: extractedBlocks,
    summary: {
      type_counts: typeCounts,
      average_length: Math.round(extractedBlocks.reduce((sum, b) => sum + b.length, 0) / extractedBlocks.length),
      inline_blocks: inlineExamples.length
    }
  };
  
  fs.writeFileSync(
    path.join(__dirname, '.nimbus', 'extraction-results.json'),
    JSON.stringify(results, null, 2)
  );
  
  console.log('\n💾 Results saved to .nimbus/extraction-results.json');
  console.log('\n✅ TASK 1.1 COMPLETE - Ready for Task 1.2');
  
  return extractedBlocks;
}

// Run the test
testContentExtraction();
