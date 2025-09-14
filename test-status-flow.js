/**
 * Test complete status flow: extracted → processing → completed
 */

const fetch = require('node-fetch');

const API_URL = 'https://nimbus-platform.martin-598.workers.dev';

async function testStatusFlow() {
  try {
    console.log('📄 Testing complete page status flow...');
    
    // Login
    const loginResponse = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'nimbus-user-1757447187283@example.com',
        password: 'TestPassword123!'
      })
    });
    
    const loginData = await loginResponse.json();
    console.log('✅ Login successful');
    const sessionToken = loginData.session_token;
    
    // Use an existing page
    const pageId = 'page:wwwrepairsbypostcom_/brands/cartier_watch_repair_495e350d';
    
    const statusFlow = [
      { status: 'processing', step: '1/3' },
      { status: 'completed', step: '2/3' }
    ];
    
    for (const { status, step } of statusFlow) {
      console.log(`\n📄 ${step} Updating to: ${status}`);
      
      const updateResponse = await fetch(`${API_URL}/api/function`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-Session-Token': sessionToken
        },
        body: JSON.stringify({
          action: 'page.update',
          payload: {
            page_id: pageId,
            status: status
          }
        })
      });
      
      const updateResult = await updateResponse.json();
      
      if (updateResult.success) {
        console.log(`✅ ${step} Status updated to: ${status}`);
        
        // Check for analytics logs
        const analyticsLogs = updateResult.logs?.filter(log => 
          log.message?.includes('Analytics') || log.message?.includes('tracked')
        );
        
        if (analyticsLogs?.length > 0) {
          console.log(`📊 ${step} Analytics tracking: ✅`);
        } else {
          console.log(`📊 ${step} Analytics tracking: ❌ (not found in logs)`);
        }
        
      } else {
        console.error(`❌ ${step} Update failed:`, updateResult.error);
      }
      
      // Small delay between updates
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Final check of Analytics Engine
    console.log('\n📊 Final Analytics Engine check...');
    
    const finalResponse = await fetch(`${API_URL}/api/function`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Session-Token': sessionToken
      },
      body: JSON.stringify({
        action: 'analytics.sql',
        payload: {
          sql_query: 'SELECT blob1 as event_type, blob4 as status, SUM(_sample_interval * double1) as count FROM nimbus_events GROUP BY blob1, blob4 ORDER BY count DESC'
        }
      })
    });
    
    const finalResult = await finalResponse.json();
    console.log('📈 Final Analytics result:', finalResult);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testStatusFlow();
