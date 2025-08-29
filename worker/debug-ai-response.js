// Debug script to test AI worker response with real page data
// This will show us exactly what the AI is returning

const https = require('https');
const fs = require('fs');

const WORKER_URL = 'https://nimbus-content-optimizer.martin-598.workers.dev';

// Load real page data from our content maps
const contentMapPath = '../.nimbus/maps/watch-repairs-abbots-langley.json';
const profilePath = '../profile.yaml';

async function debugAIResponse() {
  console.log('🧪 Testing AI Worker with Real Page Data...');
  
  try {
    // Load real content map
    const contentMap = JSON.parse(fs.readFileSync(contentMapPath, 'utf8'));
    console.log('📄 Loaded content map:', contentMap.route);
    console.log('📊 Content blocks:', contentMap.blocks.length);
    
    // Create test request with real data
    const testRequest = {
      profile: {
        name: "Repairs by Post",
        domain: "repairsbypost.com",
        services: ["watch-repair", "battery-replacement"],
        goal: "Maximise quote submissions and watch repair bookings",
        money_pages: ["/start-repair.html", "/contact.html"],
        trust_links: {
          trustpilot: "https://uk.trustpilot.com/review/repairsbypost.com",
          google: "https://g.page/RepairsByPost"
        },
        phone: "0800 121 6030",
        guarantee: "12-month guarantee",
        review_count: "1.5K+",
        brands: ["Rolex", "Omega", "TAG Heuer"]
      },
      directive: {
        type: "local",
        tone: "friendly",
        cta_priority: "high",
        schema_types: ["LocalBusiness", "BreadcrumbList"],
        trust_signals: ["reviews", "guarantee", "phone"]
      },
      content_map: {
        path: contentMap.path,
        route: contentMap.route,
        head: contentMap.head,
        blocks: contentMap.blocks.slice(0, 10), // Limit to first 10 blocks to avoid token limits
        flags: contentMap.flags
      }
    };
    
    console.log('\n📤 Sending request to AI worker...');
    console.log('📊 Request size:', JSON.stringify(testRequest).length, 'characters');
    
    // Send to worker
    const response = await sendRequest(testRequest);
    
    console.log('\n✅ AI Response Received:');
    console.log('📊 Status:', response.status);
    
    if (response.status === 200) {
      console.log('\n🤖 RAW AI RESPONSE:');
      console.log(JSON.stringify(response.data, null, 2));
      
      // Validate response structure
      console.log('\n🔍 RESPONSE VALIDATION:');
      validateResponse(response.data);
      
    } else {
      console.log('\n❌ ERROR RESPONSE:');
      console.log(JSON.stringify(response.data, null, 2));
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

function validateResponse(response) {
  const requiredKeys = ['head', 'blocks', 'links', 'alts', 'schema', 'confidence', 'notes'];
  
  console.log('📋 Required keys check:');
  requiredKeys.forEach(key => {
    const exists = key in response;
    console.log(`   ${exists ? '✅' : '❌'} ${key}: ${exists ? typeof response[key] : 'missing'}`);
  });
  
  if (response.blocks && Array.isArray(response.blocks)) {
    console.log('\n📝 Blocks validation:');
    response.blocks.forEach((block, i) => {
      const hasSelector = block.selector;
      const hasText = block.new_text;
      console.log(`   Block ${i}: selector=${hasSelector ? '✅' : '❌'} text=${hasText ? '✅' : '❌'}`);
      
      if (!hasSelector || !hasText) {
        console.log(`     ❌ INVALID: ${JSON.stringify(block)}`);
      }
    });
  }
  
  if (response.confidence) {
    console.log(`\n📈 Confidence: ${(response.confidence * 100).toFixed(1)}%`);
  }
  
  if (response.notes && response.notes.length > 0) {
    console.log('\n📝 AI Notes:');
    response.notes.forEach(note => console.log(`   - ${note}`));
  }
}

// Run the test
debugAIResponse();
