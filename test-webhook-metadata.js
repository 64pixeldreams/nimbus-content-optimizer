/**
 * Test Webhook Metadata
 * Shows the complete webhook log metadata from Option B implementation
 */

const apiUrl = 'https://nimbus-platform.martin-598.workers.dev';

async function testWebhookMetadata() {
  try {
    console.log('📊 Testing webhook metadata logging...');
    
    // Login
    const loginResponse = await fetch(`${apiUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'nimbus-user-1757447187283@example.com',
        password: 'TestPassword123!'
      })
    });
    
    const loginData = await loginResponse.json();
    if (!loginData.success) {
      throw new Error('Login failed: ' + loginData.error);
    }
    
    console.log('✅ Login successful');
    const sessionToken = loginData.session_token;
    
    // Get webhook logs with full details
    const logsResponse = await fetch(`${apiUrl}/api/function`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'X-Session-Token': sessionToken
      },
      body: JSON.stringify({
        action: 'page.logs',
        payload: {
          type: 'user',
          level: 'api.wh',
          limit: 5
        }
      })
    });
    
    const logsData = await logsResponse.json();
    
    if (logsData.success && logsData.data.logs.length > 0) {
      console.log('✅ Webhook logs found!');
      console.log(`📊 Total webhook logs: ${logsData.data.logs.length}`);
      
      // Show the most recent webhook log with full metadata
      const latestLog = logsData.data.logs[0];
      console.log('\n📋 Latest Webhook Log:');
      console.log(`🕐 Time: ${latestLog.timestamp}`);
      console.log(`🎯 Action: ${latestLog.action}`);
      console.log(`📝 Message: ${latestLog.message}`);
      console.log(`📊 Level: ${latestLog.level}`);
      console.log(`👤 User: ${latestLog.user_id}`);
      console.log(`🔗 Entity: ${latestLog.entity_type}:${latestLog.entity_id}`);
      
      if (latestLog.details) {
        console.log('\n📦 Rich Metadata:');
        console.log(JSON.stringify(latestLog.details, null, 2));
      }
      
      console.log('\n🎯 This is exactly what the webhook settings UI will show!');
      
    } else {
      console.log('❌ No webhook logs found');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testWebhookMetadata();
