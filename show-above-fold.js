const fs = require('fs');
const data = JSON.parse(fs.readFileSync('.nimbus/maps/watch-repairs-ballynahinch.json'));

console.log(`ABOVE-FOLD BLOCKS (${data.above_fold_blocks.length}):`);
data.above_fold_blocks.forEach((block, i) => {
  const content = block.text || block.anchor || block.alt || 'N/A';
  const truncated = content.length > 60 ? content.substring(0, 60) + '...' : content;
  console.log(`${i+1}. [${block.type.toUpperCase()}] ${truncated}`);
});

console.log(`\nREST-OF-PAGE BLOCKS: ${data.rest_of_page_blocks.length}`);

console.log('\nEXTRACTION CONFIG:');
console.log(JSON.stringify(data.extraction_config, null, 2));
