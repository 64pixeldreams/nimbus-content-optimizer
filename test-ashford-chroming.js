// Test script for Ashford Chroming Manchester page
// Tests the optimizer worker with real Manchester chrome plating business data

const ashfordChromingPayload = {
  prompt_type: 'head',
  profile: {
    name: 'Ashford Chroming',
    domain: 'ashfordchroming.com',
    country: 'UK',
    services: ['Chrome Plating', 'Rechroming', 'Chrome Removal', 'Gold Plating', 'Nickel Plating', 'Metal Polishing'],
    geo_scope: ['Manchester', 'UK', 'Europe'],
    reviews: {
      count: '150+',
      site: 'Customer Reviews',
      rating: '4.0',
      url: 'https://ashfordchroming.com/reviews'
    },
    guarantee: 'ISO Certified (ISO 9001, ISO 45001 & 14001)',
    phone: '+44 020 8692 1271',
    hours: 'Mon-Fri Business Hours',
    experience: 'Over 20 years serving Manchester',
    specializations: ['Classic Cars', 'Motorcycles', 'Boats', 'Household Fixtures', 'Musical Instruments'],
    workshop: 'State-of-the-art workshop',
    certifications: 'ISO 9001, ISO 45001, ISO 14001',
    collection: 'Local collection available',
    shipping: 'UK shipping available'
  },
  directive: {
    tone: 'professional-expert'
  },
  content_map: {
    head: {
      title: "Top-Rated Chrome Plating Services in Manchester | Ashford Chroming",
      metaDescription: "Expert chrome plating services in Manchester for over 20 years. Classic cars, motorcycles, boats & household fixtures. ISO certified, 150+ customer reviews. Get free estimate.",
      canonical: "https://www.ashfordchroming.com/area/chrome-plating/manchester"
    },
    h1: "Top-Rated Chrome Plating Services in Manchester",
    h2: "CLASSIC CARS | MOTORCYCLES | BOATS | HOUSEHOLD FIXTURES",
    btn: "Get a Free Estimate in Manchester",
    link: "FREE ESTIMATE REQUEST",
    content: "At Ashford Chroming, we've been serving the Manchester area for over 20 years, providing top-quality Chrome plating and rechroming services to car enthusiasts, motorcycle clubs, and homeowners. Whether you're in the heart of Manchester or the surrounding areas, our premium chrome plating services are just a phone call away. Now under new management, we are ISO Certified and equipped with a state-of-the-art workshop to handle all your chrome plating needs."
  },
  page_type: 'service',
  page_context: {
    service: 'Chrome Plating Services',
    location: 'Manchester',
    industry: 'Metal Finishing',
    target_audience: 'Car enthusiasts, motorcycle clubs, homeowners, collectors'
  }
};

async function testAshfordChroming() {
  console.log('🔧 TESTING ASHFORD CHROMING MANCHESTER OPTIMIZATION\n');
  console.log('📋 Current Page Content:');
  console.log(`   Title: "${ashfordChromingPayload.content_map.head.title}"`);
  console.log(`   Meta: "${ashfordChromingPayload.content_map.head.metaDescription}"`);
  console.log(`   H1: "${ashfordChromingPayload.content_map.h1}"`);
  console.log(`   H2: "${ashfordChromingPayload.content_map.h2}"`);
  console.log(`   Content: "${ashfordChromingPayload.content_map.content.substring(0, 100)}..."\n`);
  
  console.log('🏢 BUSINESS PROFILE:');
  console.log(`   Company: ${ashfordChromingPayload.profile.name}`);
  console.log(`   Location: ${ashfordChromingPayload.profile.geo_scope.join(', ')}`);
  console.log(`   Experience: ${ashfordChromingPayload.profile.experience}`);
  console.log(`   Reviews: ${ashfordChromingPayload.profile.reviews.count} (${ashfordChromingPayload.profile.reviews.rating}★)`);
  console.log(`   Certifications: ${ashfordChromingPayload.profile.certifications}\n`);
  
  try {
    console.log('🚀 Sending to optimizer worker...');
    
    const response = await fetch('https://nimbus-content-optimizer.martin-598.workers.dev', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(ashfordChromingPayload)
    });
    
    console.log(`📡 Response Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const result = await response.json();
      
      if (result.success) {
        console.log('\n✅ OPTIMIZER SUCCESS!');
        console.log('=' .repeat(50));
        
        if (result.result && result.result.head) {
          console.log('🎯 OPTIMIZED HEAD METADATA:');
          console.log(`   Title: "${result.result.head.title}" (${result.result.head.title.length} chars)`);
          console.log(`   Meta Description: "${result.result.head.metaDescription}" (${result.result.head.metaDescription.length} chars)`);
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
        optimized_text: ashfordChromingPayload.content_map.h1
      },
      {
        id: "4",
        tag_type: "H2", 
        optimized_text: ashfordChromingPayload.content_map.h2
      },
      {
        id: "5",
        tag_type: "BTN",
        optimized_text: ashfordChromingPayload.content_map.btn
      },
      {
        id: "6",
        tag_type: "LINK",
        optimized_text: ashfordChromingPayload.content_map.link
      },
      {
        id: "7",
        tag_type: "CONTENT",
        optimized_text: ashfordChromingPayload.content_map.content
      }
    ],
    business_context: {
      brand: "Ashford Chroming",
      target_tone: "professional-expert",
      location: "Manchester, UK",
      seo_phrases: ["chrome plating manchester", "chrome plating services manchester", "rechroming manchester"],
      services: ["Chrome Plating", "Rechroming", "Metal Finishing", "Classic Car Restoration"],
      reviews: "4.0★ (150+ customer reviews)",
      guarantee: "ISO Certified (ISO 9001, ISO 45001 & 14001)",
      phone: "+44 020 8692 1271",
      experience: "Over 20 years serving Manchester",
      specializations: ["Classic Cars", "Motorcycles", "Boats", "Household Fixtures"]
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
        console.log('\n✅ ANALYZER SUCCESS FOR ASHFORD CHROMING!');
        console.log('=' .repeat(50));
        
        if (result.result && result.result.page_summary) {
          console.log('📊 PAGE SUMMARY SCORES:');
          console.log(`   Page Score: ${result.result.page_summary.page_score}/100`);
          console.log(`   SEO Score: ${result.result.page_summary.seo_score}/100`);
          console.log(`   Tone Score: ${result.result.page_summary.tone_score}/100`);
          console.log(`   Content Score: ${result.result.page_summary.content_score}/100`);
        }
        
        console.log('\n📊 COMPARISON WITH PREVIOUS TESTS:');
        console.log('   Emergency Plumbing: 92/100 (Page Score)');
        console.log('   Hublot Watch Repairs: 91/100 (Page Score)');
        console.log(`   Ashford Chroming: ${result.result.page_summary.page_score}/100 (Page Score)`);
        
        if (parseInt(result.result.page_summary.page_score) >= 90) {
          console.log('   🏆 ASHFORD CHROMING ACHIEVES EXCELLENCE!');
        } else if (parseInt(result.result.page_summary.page_score) >= 85) {
          console.log('   ⭐ ASHFORD CHROMING ACHIEVES HIGH QUALITY!');
        } else {
          console.log('   📈 Room for improvement');
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
  testAshfordChroming().catch(console.error);
}

module.exports = { testAshfordChroming, ashfordChromingPayload };
