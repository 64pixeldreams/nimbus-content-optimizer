// Test script for Head Optimizer Test Mode
// This demonstrates how to use testMode to see generated prompts without AI execution
//
// TEST MODE FUNCTIONALITY:
// - Set testMode: true in your payload
// - Worker will build the prompt and return it without calling OpenAI
// - Perfect for debugging prompt generation and context building
// - Results are logged to Slack with _TEST suffix
// - No AI costs, no cache checking

const testPayloads = [
  // Test 1: Basic UK business with test mode enabled
  {
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
    testMode: true // 🧪 ENABLE TEST MODE - Returns prompt without AI execution
  },

  // Test 2: US business with different tone and test mode enabled
  {
    prompt_type: 'head',
    profile: {
      name: 'Acme Plumbing',
      domain: 'acmeplumbing.com',
      country: 'US',
      services: ['Emergency Plumbing', 'Bathroom Fitting'],
      geo_scope: ['New York', 'Los Angeles'],
      reviews: {
        count: '500+',
        site: 'Yelp',
        rating: '4.9'
      },
      guarantee: 'Lifetime Warranty',
      phone: '1-800-PLUMBER',
      hours: '24/7 Emergency Service'
    },
    directive: {
      tone: 'corporate'
    },
    content_map: {
      head: {
        title: 'Plumbing Services NYC',
        metaDescription: 'Professional plumbing services in New York',
        canonical: 'https://acmeplumbing.com/services'
      }
    },
    page_type: 'service',
    page_context: {
      service: 'Emergency Plumbing',
      location: 'New York'
    },
    testMode: true // 🧪 ENABLE TEST MODE - Returns prompt without AI execution
  }
];

async function testHeadOptimizer() {
  console.log('🧪 HEAD OPTIMIZER TEST MODE DEMONSTRATION\n');
  console.log('🎯 Test Mode Benefits:');
  console.log('✅ See exact prompts generated without AI costs');
  console.log('✅ Compare different tones, countries, review formats');
  console.log('✅ Validate context building and prompt structure');
  console.log('✅ Debug prompt generation issues quickly');
  console.log('✅ Slack integration for team collaboration\n');
  
  for (let i = 0; i < testPayloads.length; i++) {
    const payload = testPayloads[i];
    console.log(`\n📋 TEST ${i + 1}: ${payload.profile.country} Business (${payload.directive.tone} tone)`);
    console.log('=' .repeat(60));
    console.log(`🧪 Test Mode: ${payload.testMode ? 'ENABLED' : 'DISABLED'}`);
    
    try {
      const response = await fetch('https://your-worker-url.workers.dev', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      const result = await response.json();
      
      if (result.success && result.testMode) {
        console.log('✅ Test Mode Response Received:');
        console.log(`📝 System Prompt Length: ${result.prompt.systemPrompt.length} chars`);
        console.log(`👤 User Prompt Length: ${result.prompt.userPrompt.length} chars`);
        console.log(`⏰ Timestamp: ${result.timestamp}`);
        
        // Show key differences
        console.log('\n🔍 Key Differences Detected:');
        if (payload.profile.country === 'UK') {
          console.log('🇬🇧 UK: VAT, postcodes, British spelling');
        } else {
          console.log('🇺🇸 US: tax, ZIP codes, American spelling');
        }
        
        if (payload.directive.tone === 'friendly') {
          console.log('😊 Tone: Warm and approachable');
        } else {
          console.log('🏢 Tone: Professional and corporate');
        }
        
        if (payload.profile.reviews.site === 'Google') {
          console.log('⭐ Reviews: Google (4.8★)');
        } else {
          console.log('⭐ Reviews: Yelp (4.9★)');
        }
        
        console.log('\n💡 Test Mode Success: Prompt generated without AI execution!');
        
      } else {
        console.log('❌ Test Mode Failed:', result);
      }
      
    } catch (error) {
      console.log('❌ Request Failed:', error.message);
    }
    
    console.log('\n' + '=' .repeat(60));
  }
  
  console.log('\n🎯 How to Use Test Mode:');
  console.log('1. Set testMode: true in your payload');
  console.log('2. Worker builds prompt and returns it immediately');
  console.log('3. No OpenAI API call, no costs');
  console.log('4. Perfect for prompt validation and debugging');
  console.log('5. Results logged to Slack for team review');
}

// Run the test
if (require.main === module) {
  testHeadOptimizer().catch(console.error);
}

module.exports = { testHeadOptimizer, testPayloads };
