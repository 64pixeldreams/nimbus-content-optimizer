// Test script for the deployed Cloudflare Worker
// Usage: node test-worker.js <worker-url>

const https = require('https');

const WORKER_URL = process.argv[2] || 'https://nimbus-content-optimizer.your-subdomain.workers.dev';

const testData = {
  profile: {
    name: "Repairs by Post",
    domain: "repairsbypost.com",
    services: ["watch-repair", "battery-replacement"],
    geo_scope: ["UK"],
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
    path: "dist/local/watch-repairs-abbots-langley.html",
    route: "/branches/watch-repairs-abbots-langley",
    head: {
      title: "Local Watch Shop In Abbots Langley by Repairs by Post",
      metaDescription: "Need watch repairs in Abbots Langley? Repairs by Post is the best choice."
    },
    blocks: [
      {
        selector: "main h1.splash-title",
        text: "Local Watch Shop in Abbots Langley",
        type: "h1"
      },
      {
        selector: "main h2:nth-of-type(1)",
        text: "Professional, Affordable Watch Repairs in Abbots Langley",
        type: "h2"
      },
      {
        selector: "main p:nth-of-type(1)",
        text: "Need watch repairs in Abbots Langley? Repairs by Post is the best choice.",
        type: "p"
      }
    ],
    flags: {
      usedHeuristicMain: false,
      typosFound: [],
      emptyTrustLinks: [],
      missingAltText: []
    }
  }
};

console.log(`🧪 Testing Cloudflare Worker: ${WORKER_URL}`);
console.log('📤 Sending test request...\n');

const postData = JSON.stringify(testData);

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
  console.log(`📊 Status Code: ${res.statusCode}`);
  console.log(`📋 Headers:`, res.headers);
  console.log('');

  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const response = JSON.parse(data);
      console.log('✅ Response received:');
      console.log(JSON.stringify(response, null, 2));
      
      // Validate response structure
      const requiredKeys = ['head', 'blocks', 'links', 'alts', 'schema', 'confidence', 'notes'];
      const missingKeys = requiredKeys.filter(key => !(key in response));
      
      if (missingKeys.length === 0) {
        console.log('\n🎉 SUCCESS: Worker is responding correctly!');
        console.log(`📈 Confidence: ${(response.confidence * 100).toFixed(1)}%`);
        console.log(`📝 Changes proposed: ${response.blocks.length + response.links.length + response.alts.length}`);
        console.log(`🗒️  Notes: ${response.notes.length} optimization notes`);
      } else {
        console.log('\n⚠️  WARNING: Response missing keys:', missingKeys);
      }
    } catch (error) {
      console.log('❌ ERROR: Invalid JSON response');
      console.log('Raw response:', data);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ ERROR: Request failed:', error.message);
  console.log('\n🔍 Troubleshooting:');
  console.log('1. Check the worker URL is correct');
  console.log('2. Verify the worker is deployed and running');
  console.log('3. Ensure OPENAI_API_KEY is set in worker environment');
});

req.write(postData);
req.end();

