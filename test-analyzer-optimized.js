// Test script to analyze the optimized head metadata
// Tests the analyzer worker with the AI-optimized content

const optimizedContent = {
  prompt_type: 'analyze',
  blocks: [
    {
      id: "1",
      tag_type: "META_TITLE",
      optimized_text: "Emergency Plumbing London – 24/7 Service & 4.8★ Reviews | Acme Plumbing"
    },
    {
      id: "2", 
      tag_type: "META_DESC",
      optimized_text: "Need urgent plumbing in London? Our 4.8★ rated experts offer 24/7 service with a 100% satisfaction guarantee. Call 0800 121 6030 now!"
    },
    {
      id: "3",
      tag_type: "H1",
      optimized_text: "Emergency Plumbing Services London"
    },
    {
      id: "4",
      tag_type: "H2", 
      optimized_text: "24/7 Emergency Response, Bathroom Fitting, Boiler Repair"
    },
    {
      id: "5",
      tag_type: "BTN",
      optimized_text: "Call Now: 0800 121 6030"
    },
    {
      id: "6",
      tag_type: "LINK",
      optimized_text: "View Our Services"
    },
    {
      id: "7",
      tag_type: "CONTENT",
      optimized_text: "Professional emergency plumbing services in London with 24/7 availability. Our 4.8★ rated experts provide emergency response, bathroom fitting, and boiler repair with a 100% satisfaction guarantee. Call 0800 121 6030 for immediate assistance."
    }
  ],
  business_context: {
    brand: "Acme Plumbing",
    target_tone: "friendly",
    location: "London, UK",
    seo_phrases: ["emergency plumbing london", "24/7 plumbing service", "acme plumbing reviews"],
    services: ["Emergency Plumbing", "Bathroom Fitting", "Boiler Repair"],
    reviews: "4.8★ (100+ Google reviews)",
    guarantee: "100% Satisfaction Guarantee",
    phone: "0800 121 6030",
    hours: "24/7 Emergency Service"
  }
};

async function testAnalyzer() {
  console.log('🔍 TESTING ANALYZER WITH OPTIMIZED CONTENT\n');
  console.log('📋 Optimized Content to Analyze:');
  console.log(`   Title: "${optimizedContent.blocks[0].optimized_text}"`);
  console.log(`   Meta: "${optimizedContent.blocks[1].optimized_text}"`);
  console.log(`   H1: "${optimizedContent.blocks[2].optimized_text}"`);
  console.log(`   H2: "${optimizedContent.blocks[3].optimized_text}"`);
  console.log(`   Content: "${optimizedContent.blocks[6].optimized_text.substring(0, 100)}..."\n`);
  
  try {
    console.log('🚀 Sending to analyzer worker...');
    
    const response = await fetch('https://nimbus-content-analyzer.martin-598.workers.dev', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(optimizedContent)
    });
    
    console.log(`📡 Response Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const result = await response.json();
      
      if (result.success) {
        console.log('\n✅ ANALYZER SUCCESS!');
        console.log('=' .repeat(50));
        
        if (result.result && result.result.page_summary) {
          console.log('📊 PAGE SUMMARY SCORES:');
          console.log(`   Page Score: ${result.result.page_summary.page_score}/100`);
          console.log(`   SEO Score: ${result.result.page_summary.seo_score}/100`);
          console.log(`   Tone Score: ${result.result.page_summary.tone_score}/100`);
          console.log(`   Content Score: ${result.result.page_summary.content_score}/100`);
        }
        
        if (result.result && result.result.detailed_breakdown) {
          console.log('\n🔍 DETAILED BREAKDOWN:');
          console.log(`   SEO Score: ${result.result.detailed_breakdown.seo_score}/100`);
          console.log(`   Tone Score: ${result.result.detailed_breakdown.tone_score}/100`);
          console.log(`   Content Score: ${result.result.detailed_breakdown.content_score}/100`);
        }
        
        if (result.result && result.result.recommendations) {
          console.log('\n💡 KEY RECOMMENDATIONS:');
          result.result.recommendations.forEach((rec, index) => {
            console.log(`   ${index + 1}. ${rec}`);
          });
        }
        
        console.log('\n📊 PERFORMANCE METRICS:');
        console.log(`   Processing Time: ${result.processing_time_ms}ms`);
        console.log(`   Tokens Used: ${result.tokens_used}`);
        console.log(`   Cached: ${result.cached ? 'Yes' : 'No'}`);
        if (result.cache_key) {
          console.log(`   Cache Key: ${result.cache_key.substring(0, 20)}...`);
        }
        
        console.log('\n💡 Analysis Complete!');
        
      } else {
        console.log('\n❌ Analysis Failed:');
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
  testAnalyzer().catch(console.error);
}

module.exports = { testAnalyzer, optimizedContent };
