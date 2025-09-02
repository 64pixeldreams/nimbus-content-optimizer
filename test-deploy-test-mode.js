// Test script for deployed worker - Run actual AI optimization
// Tests the nimbus-content-optimizer worker

const testPayload = {
  prompt_type: 'head',
  profile: {
    name: 'Acme Plumbing',
    domain: 'acmeplumbing.co.uk',
    country: 'UK',
    services: ['Emergency Plumbing', 'Bathroom Fitting'],
    geo_scope: ['London', 'Manchester'],
    reviews: {
      count: 'Over 100',
      site: 'Google',
      rating: '4.8',
      url: 'https://google.com/reviews/acme-plumbing'
    },
    guarantee: '100% Satisfaction Guarantee',
    phone: '0800 121 6030',
    hours: '24/7 Emergency Service'
  },
  directive: {
    tone: 'friendly'
  },
  content_map: {
    head: {
      title: 'Plumbing Services London',
      metaDescription: 'Professional plumbing services in London',
      canonical: 'https://acmeplumbing.co.uk/services'
    }
  },
  page_type: 'service',
  page_context: {
    service: 'Emergency Plumbing',
    location: 'London'
  },
  testMode: false // 🚀 DISABLE TEST MODE - Run actual AI optimization
};

async function testDeployedWorker() {
  console.log('🚀 TESTING DEPLOYED WORKER - AI OPTIMIZATION MODE\n');
  console.log('📋 Test Payload:');
  console.log(`   Company: ${testPayload.profile.name}`);
  console.log(`   Country: ${testPayload.profile.country}`);
  console.log(`   Tone: ${testPayload.directive.tone}`);
  console.log(`   Reviews: ${testPayload.profile.reviews.count} on ${testPayload.profile.reviews.site}`);
  console.log(`   Test Mode: ${testPayload.testMode ? 'ENABLED' : 'DISABLED'}\n`);
  
  try {
    console.log('🚀 Sending request to deployed worker...');
    
    const response = await fetch('https://nimbus-content-optimizer.martin-598.workers.dev', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testPayload)
    });
    
    console.log(`📡 Response Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const result = await response.json();
      
      if (result.success) {
        console.log('\n✅ AI OPTIMIZATION SUCCESS!');
        console.log('=' .repeat(50));
        
        if (result.result && result.result.head) {
          console.log('📝 OPTIMIZED HEAD METADATA:');
          console.log(`   Title: "${result.result.head.title}" (${result.result.head.title.length} chars)`);
          console.log(`   Meta: "${result.result.head.metaDescription}" (${result.result.head.metaDescription.length} chars)`);
          console.log(`   Canonical: "${result.result.head.canonical}"`);
          
          if (result.result.confidence) {
            console.log(`   Confidence: ${result.result.confidence}`);
          }
          
          if (result.result.notes && result.result.notes.length > 0) {
            console.log(`   Notes: ${result.result.notes.join(', ')}`);
          }
        }
        
        console.log('\n📊 PERFORMANCE METRICS:');
        console.log(`   Processing Time: ${result.processing_time_ms}ms`);
        console.log(`   Tokens Used: ${result.tokens_used}`);
        console.log(`   Cached: ${result.cached ? 'Yes' : 'No'}`);
        if (result.cache_key) {
          console.log(`   Cache Key: ${result.cache_key.substring(0, 20)}...`);
        }
        
        console.log('\n💡 AI Optimization Complete!');
        
      } else {
        console.log('\n❌ Optimization Failed:');
        console.log(JSON.stringify(result, null, 2));
      }
      
    } else {
      console.log('\n❌ Request Failed:');
      const errorText = await response.text();
      console.log(errorText);
    }
    
  } catch (error) {
    console.log('\n❌ Request Error:', error.message);
  }
}

// Run the test
if (require.main === module) {
  testDeployedWorker().catch(console.error);
}

module.exports = { testDeployedWorker, testPayload };
