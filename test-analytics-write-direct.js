/**
 * Test Analytics Engine Write Direct
 */

const fetch = require('node-fetch');

const API_URL = 'https://nimbus-platform.martin-598.workers.dev';

async function testAnalyticsWriteDirect() {
  try {
    console.log('📊 Testing Analytics Engine write direct...');
    
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
    
    // Call the direct write test function
    console.log('\n📊 Calling analytics.write.test...');
    
    const writeResponse = await fetch(`${API_URL}/api/function`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Session-Token': sessionToken
      },
      body: JSON.stringify({
        action: 'analytics.write.test',
        payload: {}
      })
    });
    
    const writeResult = await writeResponse.json();
    
    console.log('📊 Write test result:', writeResult.success ? 'SUCCESS' : 'FAILED');
    console.log('📋 Full response:', JSON.stringify(writeResult, null, 2));
    
    if (writeResult.success) {
      console.log('✅ Analytics Engine write working!');
      console.log('🔧 Binding details:', {
        exists: writeResult.data.binding_exists,
        canWrite: writeResult.data.has_write_method,
        writeResult: writeResult.data.write_result
      });
      console.log('\n🔍 Check CF Analytics Engine console in 1-2 minutes');
      console.log('📋 Should see a new pages_uploaded event');
    } else {
      console.log('❌ Analytics Engine write failed:', writeResult.error);
    }
    
    // Show all logs for debugging
    if (writeResult.logs?.length > 0) {
      console.log('\n📋 All logs:');
      writeResult.logs.forEach(log => {
        console.log(`   ${log.level}: ${log.message}`);
        if (log.data && Object.keys(log.data).length > 0) {
          console.log(`   Data:`, log.data);
        }
      });
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testAnalyticsWriteDirect();
