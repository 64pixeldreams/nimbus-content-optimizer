// Test script for Hublot watch repair optimization
// Tests the optimizer worker with Hublot data to compare performance

const hublotPayload = {
  prompt_type: 'head',
  profile: {
    name: 'Repairs by Post',
    domain: 'repairsbypost.co.uk',
    country: 'UK',
    services: ['Hublot Watch Repairs', 'Luxury Watch Servicing'],
    geo_scope: ['UK', 'Europe'],
    reviews: {
      count: '500+',
      site: 'Trustpilot',
      rating: '4.9',
      url: 'https://trustpilot.com/reviews/repairsbypost'
    },
    guarantee: '2 Year Warranty',
    phone: '020 7946 0958',
    hours: 'Mon-Fri 9am-6pm'
  },
  directive: {
    tone: 'luxury'
  },
  content_map: {
    head: {
      title: "Hublot Watch Repairs UK - Luxury Watch Servicing | Repairs by Post",
      metaDescription: "Expert Hublot watch repairs and luxury watch servicing across the UK. 500+ 4.9★ reviews, 2-year warranty. Send your watch for professional repair.",
      canonical: "https://repairsbypost.co.uk/hublot-watch-repairs"
    },
    h1: "Hublot Watch Repairs UK",
    h2: "Luxury Watch Servicing & Restoration",
    btn: "Get Quote Now",
    link: "View Our Services",
    content: "Professional Hublot watch repairs and luxury watch servicing across the UK. Our certified watchmakers specialize in Hublot timepieces with 500+ 4.9★ reviews and a 2-year warranty. Send your watch for expert repair and restoration."
  },
  page_type: 'service',
  page_context: {
    service: 'Hublot Watch Repairs',
    location: 'UK'
  }
};

async function testHublotOptimizer() {
  console.log('⌚ TESTING HUBLOT WATCH REPAIR OPTIMIZATION\n');
  console.log('📋 Current Hublot Content:');
  console.log(`   Title: "${hublotPayload.content_map.head.title}"`);
  console.log(`   Meta: "${hublotPayload.content_map.head.metaDescription}"`);
  console.log(`   H1: "${hublotPayload.content_map.h1}"`);
  console.log(`   H2: "${hublotPayload.content_map.h2}"`);
  console.log(`   Content: "${hublotPayload.content_map.content.substring(0, 100)}..."\n`);
  
  try {
    console.log('🚀 Sending to optimizer worker...');
    
    const response = await fetch('https://nimbus-content-optimizer.martin-598.workers.dev', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(hublotPayload)
    });
    
    console.log(`📡 Response Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const result = await response.json();
      
      if (result.success) {
        console.log('\n✅ OPTIMIZER SUCCESS!');
        console.log('=' .repeat(50));
        
        if (result.result && result.result.head) {
          console.log('🎯 OPTIMIZED HEAD METADATA:');
          console.log(`   Title: "${result.result.head.title}"`);
          console.log(`   Meta Description: "${result.result.head.metaDescription}"`);
          console.log(`   Canonical: "${result.result.head.canonical}"`);
        }
        
        if (result.result && result.result.confidence) {
          console.log(`\n🎯 Confidence: ${result.result.confidence}`);
        }
        
        if (result.result && result.result.notes) {
          console.log('\n💡 Optimization Notes:');
          result.result.notes.forEach((note, index) => {
            console.log(`   ${index + 1}. ${note}`);
          });
        }
        
        console.log('\n📊 PERFORMANCE METRICS:');
        console.log(`   Processing Time: ${result.processing_time_ms}ms`);
        console.log(`   Tokens Used: ${result.tokens_used}`);
        console.log(`   Cached: ${result.cached ? 'Yes' : 'No'}`);
        if (result.cache_key) {
          console.log(`   Cache Key: ${result.cache_key.substring(0, 20)}...`);
        }
        
        console.log('\n💡 Optimization Complete!');
        
        // Now let's analyze the optimized content
        console.log('\n🔍 ANALYZING OPTIMIZED CONTENT...');
        await analyzeOptimizedContent(result.result);
        
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

async function analyzeOptimizedContent(optimizedResult) {
  if (!optimizedResult || !optimizedResult.head) {
    console.log('❌ No optimized content to analyze');
    return;
  }
  
  const analyzerPayload = {
    prompt_type: 'analyze',
    blocks: [
      {
        id: "1",
        tag_type: "META_TITLE",
        optimized_text: optimizedResult.head.title
      },
      {
        id: "2", 
        tag_type: "META_DESC",
        optimized_text: optimizedResult.head.metaDescription
      },
      {
        id: "3",
        tag_type: "H1",
        optimized_text: hublotPayload.content_map.h1
      },
      {
        id: "4",
        tag_type: "H2", 
        optimized_text: hublotPayload.content_map.h2
      },
      {
        id: "5",
        tag_type: "BTN",
        optimized_text: hublotPayload.content_map.btn
      },
      {
        id: "6",
        tag_type: "LINK",
        optimized_text: hublotPayload.content_map.link
      },
      {
        id: "7",
        tag_type: "CONTENT",
        optimized_text: hublotPayload.content_map.content
      }
    ],
    business_context: {
      brand: "Repairs by Post",
      target_tone: "luxury",
      location: "UK, Europe",
      seo_phrases: ["hublot watch repairs", "luxury watch servicing", "hublot watch service uk"],
      services: ["Hublot Watch Repairs", "Luxury Watch Servicing", "Watch Restoration"],
      reviews: "4.9★ (500+ Trustpilot reviews)",
      guarantee: "2 Year Warranty",
      phone: "020 7946 0958",
      hours: "Mon-Fri 9am-6pm"
    }
  };
  
  try {
    console.log('🚀 Sending optimized content to analyzer...');
    
    const response = await fetch('https://nimbus-content-analyzer.martin-598.workers.dev', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(analyzerPayload)
    });
    
    if (response.ok) {
      const result = await response.json();
      
      if (result.success) {
        console.log('\n✅ ANALYZER SUCCESS FOR HUBLOT!');
        console.log('=' .repeat(50));
        
        if (result.result && result.result.page_summary) {
          console.log('📊 PAGE SUMMARY SCORES:');
          console.log(`   Page Score: ${result.result.page_summary.page_score}/100`);
          console.log(`   SEO Score: ${result.result.page_summary.seo_score}/100`);
          console.log(`   Tone Score: ${result.result.page_summary.tone_score}/100`);
          console.log(`   Content Score: ${result.result.page_summary.content_score}/100`);
        }
        
        console.log('\n📊 COMPARISON WITH EMERGENCY PLUMBING:');
        console.log('   Emergency Plumbing: 92/100 (Page Score)');
        console.log(`   Hublot Watch Repairs: ${result.result.page_summary.page_score}/100 (Page Score)`);
        
        if (parseInt(result.result.page_summary.page_score) > 92) {
          console.log('   🏆 HUBLOT OUTPERFORMS EMERGENCY PLUMBING!');
        } else if (parseInt(result.result.page_summary.page_score) === 92) {
          console.log('   🎯 HUBLOT MATCHES EMERGENCY PLUMBING!');
        } else {
          console.log('   📈 Emergency Plumbing still leads');
        }
        
      } else {
        console.log('\n❌ Analysis Failed:');
        console.log(JSON.stringify(result, null, 2));
      }
    } else {
      console.log('\n❌ Analyzer Request Failed');
    }
    
  } catch (error) {
    console.log('\n❌ Analyzer Error:', error.message);
  }
}

// Run the test
if (require.main === module) {
  testHublotOptimizer().catch(console.error);
}

module.exports = { testHublotOptimizer, hublotPayload };
