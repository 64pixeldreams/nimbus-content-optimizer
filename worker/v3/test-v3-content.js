// Test V3 Content Enhancement with Geographic Intelligence

const https = require('https');
const fs = require('fs');

const WORKER_URL = 'https://nimbus-content-optimizer.martin-598.workers.dev';

async function testV3Content() {
  console.log('🧪 Testing V3 Content Enhancement with Geographic Intelligence...');
  
  // Load real content map to see ALL blocks
  const contentMap = JSON.parse(fs.readFileSync('../.nimbus/maps/watch-repairs-ballynahinch.json', 'utf8'));
  
  console.log(`📊 Total blocks available: ${contentMap.blocks.length}`);
  console.log(`📊 Block types: ${[...new Set(contentMap.blocks.map(b => b.type))].join(', ')}`);
  
  // Show sample content for context
  console.log('\n📄 SAMPLE CONTENT (first 5 blocks):');
  contentMap.blocks.slice(0, 5).forEach((block, i) => {
    console.log(`${i + 1}. [${block.type}] "${(block.text || block.anchor || 'no text').substring(0, 80)}..."`);
  });
  
  const testRequest = {
    prompt_type: 'content',
    model: 'gpt-4-turbo-preview',
    profile: {
      name: "Repairs by Post",
      domain: "repairsbypost.com",
      review_count: "1.5K+",
      guarantee: "12-month guarantee",
      phone: "0800 121 6030"
    },
    directive: {
      type: "local",
      tone: "friendly"
    },
    content_map: contentMap
  };
  
  console.log('\n📤 Testing V3 CONTENT enhancement with geographic intelligence...');
  
  try {
    const response = await sendRequest(testRequest);
    
    if (response.status === 200 && response.data.result) {
      const result = response.data.result;
      
      console.log('\n✅ V3 CONTENT ENHANCEMENT RESULTS:');
      console.log(`📝 Blocks enhanced: ${result.blocks?.length || 0}`);
      console.log(`📈 Confidence: ${(result.confidence * 100).toFixed(1)}%`);
      
      if (result.content_summary) {
        const summary = result.content_summary;
        console.log(`\n📊 WORD COUNT ANALYSIS:`);
        console.log(`   Before: ${summary.total_word_count_before} words`);
        console.log(`   After: ${summary.total_word_count_after} words`);
        console.log(`   Change: ${summary.word_count_change} words`);
      }
      
      console.log('\n🗺️ GEOGRAPHIC INTELLIGENCE TEST:');
      const sampleBlocks = (result.blocks || []).slice(0, 3);
      sampleBlocks.forEach((block, i) => {
        const hasCounty = block.new_text.toLowerCase().includes('county') || 
                         block.new_text.toLowerCase().includes('down') ||
                         block.new_text.toLowerCase().includes('northern ireland');
        const hasNearbyAreas = block.new_text.toLowerCase().includes('carryduff') ||
                              block.new_text.toLowerCase().includes('lisburn') ||
                              block.new_text.toLowerCase().includes('belfast');
        const hasPostcode = block.new_text.includes('BT24') || block.new_text.includes('BT27');
        
        console.log(`\n   Block ${i + 1}: "${block.new_text.substring(0, 100)}..."`);
        console.log(`   County context: ${hasCounty ? '✅' : '❌'}`);
        console.log(`   Nearby areas: ${hasNearbyAreas ? '✅' : '❌'}`);
        console.log(`   Postcode targeting: ${hasPostcode ? '✅' : '❌'}`);
      });
      
      if (result.notes) {
        console.log('\n📝 V3 AI Notes:');
        result.notes.forEach(note => console.log(`   - ${note}`));
      }
    } else {
      console.log('❌ Error response:', response.data);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

function sendRequest(data) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);
    
    const url = new URL(WORKER_URL);
    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    
    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => responseData += chunk);
      res.on('end', () => {
        try {
          const data = JSON.parse(responseData);
          resolve({ status: res.statusCode, data });
        } catch (error) {
          resolve({ status: res.statusCode, data: responseData });
        }
      });
    });
    
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

testV3Content();
