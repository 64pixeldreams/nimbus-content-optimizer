/**
 * Test Webhook Logs
 * Check if webhook deliveries are appearing in the audit logs
 */

const apiUrl = 'https://nimbus-platform.martin-598.workers.dev';

async function testWebhookLogs() {
  try {
    console.log('📋 Checking webhook logs in audit system...');
    
    // First login to get session
    console.log('1. Logging in...');
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
    
    // Get recent logs to see webhook entries
    console.log('2. Fetching recent logs...');
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
          level: 'api.wh', // Filter for webhook logs only
          limit: 20
        }
      })
    });
    
    const logsData = await logsResponse.json();
    
    if (logsData.success) {
      console.log('✅ Logs retrieved successfully!');
      console.log(`📊 Total logs: ${logsData.data.logs.length}`);
      
      // Filter for webhook-related logs
      const webhookLogs = logsData.data.logs.filter(log => 
        log.action.includes('webhook') || 
        log.message.toLowerCase().includes('webhook')
      );
      
      console.log(`🔗 Webhook logs found: ${webhookLogs.length}`);
      
      if (webhookLogs.length > 0) {
        console.log('\n📋 Recent Webhook Activity:');
        webhookLogs.forEach(log => {
          console.log(`${log.timestamp} | ${log.action} | ${log.message}`);
          if (log.details?.webhook_name) {
            console.log(`   🎯 Webhook: ${log.details.webhook_name}`);
            console.log(`   📡 URL: ${log.details.target_url}`);
            console.log(`   📦 Event: ${log.details.event_type}`);
          }
        });
      } else {
        console.log('📝 No webhook logs found yet - audit logging may still be processing');
      }
      
      // Show all recent logs for context
      console.log('\n📋 All Recent Activity:');
      logsData.data.logs.slice(0, 5).forEach(log => {
        console.log(`${log.timestamp} | ${log.action} | ${log.message}`);
      });
      
    } else {
      console.error('❌ Failed to retrieve logs:', logsData.error);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testWebhookLogs();
