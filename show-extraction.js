const fs = require('fs');

try {
  const data = JSON.parse(fs.readFileSync('.nimbus/maps/watch-repairs-ballynahinch.json'));
  
  console.log('=== EXTRACTION SUMMARY ===');
  console.log(`Total blocks: ${data.blocks.length}`);
  console.log(`Above-fold blocks: ${data.above_fold_blocks.length}`);
  console.log(`Rest-of-page blocks: ${data.rest_of_page_blocks.length}`);
  
  console.log('\n=== EXTRACTION CONFIG ===');
  console.log(JSON.stringify(data.extraction_config, null, 2));
  
  console.log('\n=== ABOVE-FOLD CONTENT (First 10) ===');
  data.above_fold_blocks.slice(0, 10).forEach((block, i) => {
    const content = block.text || block.anchor || block.alt || 'N/A';
    console.log(`${i + 1}. [${block.type.toUpperCase()}] ${content}`);
  });
  
  console.log('\n=== REST-OF-PAGE CONTENT (First 5) ===');
  data.rest_of_page_blocks.slice(0, 5).forEach((block, i) => {
    const content = block.text || block.anchor || block.alt || 'N/A';
    console.log(`${i + 1}. [${block.type.toUpperCase()}] ${content}`);
  });
  
  console.log('\n=== SAMPLE ABOVE-FOLD JSON ===');
  console.log(JSON.stringify(data.above_fold_blocks.slice(0, 3), null, 2));
  
} catch (error) {
  console.error('Error reading file:', error.message);
}
