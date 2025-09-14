/**
 * Test direct Analytics Engine write
 */

const fetch = require('node-fetch');

const API_URL = 'https://nimbus-platform.martin-598.workers.dev';

async function testDirectAnalyticsWrite() {
  try {
    console.log('📊 Testing direct Analytics Engine write...');
    
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
    
    // Test direct Analytics Engine write
    console.log('\n📊 Writing Analytics event directly...');
    
    const writeResponse = await fetch(`${API_URL}/api/function`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Session-Token': sessionToken
      },
      body: JSON.stringify({
        action: 'analytics.test',
        payload: {
          project_id: 'project:mfh4o6amph6zeb'
        }
      })
    });
    
    const writeResult = await writeResponse.json();
    console.log('📊 Direct write result:', writeResult.success ? 'SUCCESS' : 'FAILED');
    
    if (writeResult.success) {
      console.log('✅ Analytics event written!');
      console.log('📊 Write details:', writeResult.data);
    } else {
      console.log('❌ Write failed:', writeResult.error);
    }
    
    // Wait and check if event appears
    console.log('\n⏳ Waiting 5 seconds for event to appear...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Check CF Analytics Engine console
    console.log('\n📊 Check CF Analytics Engine console now!');
    console.log('🔗 Go to: https://dash.cloudflare.com/analytics-engine');
    console.log('📋 Look for nimbus_events dataset');
    console.log('🔍 Should show 2 events now (1 test_event + 1 new event)');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testDirectAnalyticsWrite();
