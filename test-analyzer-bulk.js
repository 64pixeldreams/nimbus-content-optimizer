const fs = require('fs');
const path = require('path');



async function testBulkAnalyzer() {
  console.log('🧪 TESTING ANALYZER - TIER 1 HEAD/SERP WITH PAGE ANALYSIS\n');

  // Load the NEW tier 1 cached results
  const cachePath = path.join(__dirname, '.nimbus', 'work', 'brand-demo', 'cache', 'hublot-watch-repair-tier-1.json');

  if (!fs.existsSync(cachePath)) {
    console.log('❌ Tier 1 cached results not found. Run tier 1 optimization first.');
    return;
  }

  const aiResults = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
  const headData = aiResults.result.result.head;

  console.log(`📄 Loaded TIER 1 HEAD data:`, headData);



          // Prepare payload with EXACT HEAD data as blocks
        const payload = {
          ignoreCache: true, // Force fresh call to see new cache key
          blocks: [
      {
        id: "title",
        tag_type: "META_TITLE",
        optimized_text: headData.title || ''
      },
      {
        id: "metaDescription",
        tag_type: "META_DESC", 
        optimized_text: headData.metaDescription || ''
      },
      {
        id: "canonical",
        tag_type: "LINK",
        optimized_text: headData.canonical || ''
      }
    ],
    business_context: {
      business_type: 'watch_repair',
      brand: 'Hublot',
      location: 'UK',
      target_tone: 'mom-n-pop',
      seo_phrases: ['hublot watch repairs', 'luxury watch repair UK'],
      industry: 'luxury watch repair'
    },
    page_summary: {
      page_score: "",
      seo_score: "",
      tone_score: "", 
      content_score: "",
      completeness_score: "",
      impact_score: ""
    }
  };

  console.log('📤 Sending HEAD/SERP data to analyzer worker...');
  console.log(`📊 Total blocks: ${payload.blocks.length}`);
  console.log('📦 FULL PAYLOAD:', JSON.stringify(payload, null, 2));

  try {
    const response = await fetch('https://nimbus-content-analyzer.martin-598.workers.dev', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    console.log(`\n📥 Response Status: ${response.status}`);

    const responseText = await response.text();
    
    console.log('\n📄 FULL JSON RESPONSE:');
    console.log('='.repeat(80));
    console.log(responseText);
    console.log('='.repeat(80));



  } catch (error) {
    console.log('\n❌ Error:', error.message);
  }
}

testBulkAnalyzer();
